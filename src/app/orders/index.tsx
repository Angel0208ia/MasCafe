import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../../components/BottomNav';
import { colors, font, radius, spacing } from '../../constants/theme';
import { ORDER_COOLDOWN_MS, useProductsStore } from '../../store/productsStore';
import type { Order } from '../../types/product';

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

function OrderCard({ order }: { order: Order }) {
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderNumber}>{order.number}</Text>
          <Text style={styles.orderDate}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Recibido</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {order.items.map((item) => (
        <View key={item.cartItemId} style={styles.productRow}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.quantity} × {item.name}</Text>
            {item.selections.length > 0 && (
              <Text style={styles.productDetails} numberOfLines={2}>
                {item.selections
                  .flatMap((selection) => selection.options.map((option) => option.name))
                  .join(', ')}
              </Text>
            )}
          </View>
          <Text style={styles.productPrice}>
            ${(item.unitPrice * item.quantity).toFixed(2)}
          </Text>
        </View>
      ))}

      <View style={styles.orderFooter}>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
        </Text>
        <Text style={styles.total}>Total: ${order.total.toFixed(2)}</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const router = useRouter();
  const orders = useProductsStore((state) => state.orders);
  const [now, setNow] = useState(Date.now());
  const latestOrder = orders[0];
  const remainingMs = latestOrder
    ? Math.max(0, latestOrder.createdAt + ORDER_COOLDOWN_MS - now)
    : 0;

  useEffect(() => {
    if (!latestOrder || remainingMs === 0) return;

    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [latestOrder?.id, remainingMs === 0]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.content}
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
                  <Text style={styles.cooldownText}>Se permite un pedido cada 30 minutos.</Text>
                </View>
              </View>
            )}

            {orders.length > 0 && <Text style={styles.sectionTitle}>Historial</Text>}
          </View>
        }
        renderItem={({ item }) => <OrderCard order={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={58} color={colors.chipBorder} />
            <Text style={styles.emptyTitle}>Aún no tienes pedidos</Text>
            <Text style={styles.emptyText}>Cuando generes uno aparecerá en esta pantalla.</Text>
            <Pressable style={styles.menuButton} onPress={() => router.replace('/products')}>
              <Text style={styles.menuButtonText}>Ver el menú</Text>
            </Pressable>
          </View>
        }
      />

      <BottomNav active="pedidos" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
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
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderNumber: { fontSize: font.body, fontWeight: '800', color: colors.text },
  orderDate: { marginTop: 3, fontSize: font.tiny, color: colors.muted },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#E8F3E8',
  },
  statusText: { fontSize: font.tiny, fontWeight: '700', color: colors.success },
  divider: { height: 1, marginVertical: spacing.md, backgroundColor: colors.border },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  productInfo: { flex: 1, marginRight: spacing.md },
  productName: { fontSize: font.small, fontWeight: '700', color: colors.text },
  productDetails: { marginTop: 2, fontSize: font.tiny, lineHeight: 15, color: colors.muted },
  productPrice: { fontSize: font.small, fontWeight: '700', color: colors.primary },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemCount: { fontSize: font.small, color: colors.muted },
  total: { fontSize: font.body, fontWeight: '800', color: colors.primary },
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
