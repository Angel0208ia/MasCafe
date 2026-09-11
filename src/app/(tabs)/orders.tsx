import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrderStatusLabel } from '@/constants/orderStatus';
import { colors, font, getScreenPadding, layout, radius, spacing } from '@/constants/theme';
import { ORDER_COOLDOWN_MS, useProductsStore } from '@/store/productsStore';
import type { Order } from '@/types/product';

function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatOrderDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusTone(status: Order['status']): { background: string; foreground: string } {
  const tones: Record<Order['status'], { background: string; foreground: string }> = {
    received: { background: colors.thumb, foreground: colors.primary },
    preparing: { background: '#FBE9DE', foreground: '#A94F23' },
    ready: { background: '#E8F3E8', foreground: colors.success },
    delivered: { background: '#F0ECE8', foreground: '#6F625A' },
    cancelled: { background: '#FBE9E7', foreground: colors.danger },
  };
  return tones[status];
}

function OrderCard({ order, onPress }: { order: Order; onPress: (id: string) => void }) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const productSummary = order.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ');
  const tone = getStatusTone(order.status);

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]}
      onPress={() => onPress(order.id)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir pedido ${order.number}, ${getOrderStatusLabel(order.status)}`}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderNumber}>{order.number}</Text>
          <Text style={styles.orderDate}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: tone.background }]}>
          <View style={[styles.statusDot, { backgroundColor: tone.foreground }]} />
          <Text style={[styles.statusText, { color: tone.foreground }]}>
            {getOrderStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.productSummary} numberOfLines={2}>{productSummary}</Text>

      <View style={styles.orderFooter}>
        <View>
          <Text style={styles.itemCount}>
            {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
          </Text>
          <Text style={styles.total}>${order.total.toFixed(2)}</Text>
        </View>
        <View style={styles.openOrder}>
          <Text style={styles.openOrderText}>Ver seguimiento</Text>
          <Ionicons name="chevron-forward" size={17} color={colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function openOrderDetail(router: ReturnType<typeof useRouter>, orderId: string) {
  router.push({
    pathname: '/orders/[id]',
    params: { id: orderId },
  });
}

export default function OrdersScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const orders = useProductsStore((state) => state.orders);
  const loadTrackedOrders = useProductsStore((state) => state.loadTrackedOrders);
  const [now, setNow] = useState(Date.now());
  const latestOrder = orders[0];
  const remainingMs = latestOrder
    ? Math.max(0, latestOrder.createdAt + ORDER_COOLDOWN_MS - now)
    : 0;
  const horizontalPadding = getScreenPadding(width);

  useFocusEffect(useCallback(() => {
    void loadTrackedOrders();
  }, [loadTrackedOrders]));

  const latestOrderAt = latestOrder?.createdAt;
  useFocusEffect(useCallback(() => {
    setNow(Date.now());
    if (!latestOrderAt || Date.now() >= latestOrderAt + ORDER_COOLDOWN_MS) return;

    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= latestOrderAt + ORDER_COOLDOWN_MS) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [latestOrderAt]));

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        style={styles.list}
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Mis pedidos</Text>
            <Text style={styles.subtitle}>Consulta los pedidos realizados en esta sesión</Text>

            {latestOrder && (
              <View style={styles.cooldownCard}>
                <View style={styles.cooldownIcon}>
                  <Ionicons
                    name={remainingMs > 0 ? 'timer-outline' : 'checkmark-circle-outline'}
                    size={25}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.cooldownContent}>
                  <Text style={styles.cooldownTitle}>
                    {remainingMs > 0
                      ? `Nuevo pedido en ${formatRemainingTime(remainingMs)}`
                      : 'Ya puedes realizar otro pedido'}
                  </Text>
                  <Text style={styles.cooldownText}>
                    Por el momento solo se permite un pedido cada 30 minutos.
                  </Text>
                </View>
              </View>
            )}

            {orders.length > 0 && <Text style={styles.sectionTitle}>Historial</Text>}
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={(id) => openOrderDetail(router, id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={58} color={colors.chipBorder} />
            <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
            <Text style={styles.emptyText}>Cuando generes uno aparecerá en esta pantalla.</Text>
            <Pressable style={styles.menuButton} onPress={() => router.navigate('/products')}>
              <Text style={styles.menuButtonText}>Ver el menú</Text>
            </Pressable>
          </View>
        }
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { width: '100%' },
  content: {
    width: '100%',
    maxWidth: layout.narrowMaxWidth,
    alignSelf: 'center',
    paddingBottom: spacing.xl,
  },
  title: { marginTop: spacing.md, fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, fontSize: font.small, color: colors.muted },
  cooldownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.thumb,
  },
  cooldownIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  cooldownContent: { flex: 1 },
  cooldownTitle: { fontSize: font.body, fontWeight: '800', color: colors.primary },
  cooldownText: { marginTop: 3, fontSize: font.tiny, color: colors.muted },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  orderCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  orderCardPressed: { opacity: 0.78 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderIdentity: { flex: 1, marginRight: spacing.sm },
  orderNumber: { fontSize: font.body, fontWeight: '800', color: colors.text },
  orderDate: { marginTop: 3, fontSize: font.tiny, color: colors.muted },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#E8F3E8',
  },
  statusDot: { width: 7, height: 7, borderRadius: radius.pill },
  statusText: { fontSize: font.tiny, fontWeight: '700' },
  divider: { height: 1, marginVertical: spacing.md, backgroundColor: colors.border },
  productSummary: { minHeight: 36, fontSize: font.small, lineHeight: 18, color: colors.muted },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  itemCount: { fontSize: font.small, color: colors.muted },
  total: { marginTop: 2, fontSize: font.body, fontWeight: '800', color: colors.primary },
  openOrder: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openOrderText: { fontSize: font.small, fontWeight: '800', color: colors.primary },
  empty: { alignItems: 'center', marginTop: 90, paddingHorizontal: spacing.xl },
  emptyTitle: { marginTop: spacing.lg, fontSize: font.heading, fontWeight: '700', color: colors.text },
  emptyText: { marginTop: spacing.sm, textAlign: 'center', fontSize: font.small, color: colors.muted },
  menuButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  menuButtonText: { fontWeight: '700', color: colors.onPrimary },
});
