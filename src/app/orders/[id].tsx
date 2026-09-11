import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ORDER_TIMELINE,
  getOrderProgressIndex,
  getOrderStatusLabel,
  getOrderStatusMessage,
  type OrderTimelineStep,
} from '@/constants/orderStatus';
import { getCartPricing } from '@/constants/promotions';
import { colors, font, getScreenPadding, layout, radius, spacing } from '@/constants/theme';
import { useProductsStore } from '@/store/productsStore';
import type { OrderStatus } from '@/types/product';

const REFRESH_INTERVAL_MS = 15_000;

function formatOrderDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTimeline(status: OrderStatus): readonly OrderTimelineStep[] {
  if (status !== 'cancelled') return ORDER_TIMELINE;
  return [
    ORDER_TIMELINE[0],
    {
      status: 'received',
      title: 'Pedido cancelado',
      description: 'Este pedido fue cancelado y ya no continuará su preparación.',
    },
  ];
}

function statusColor(status: OrderStatus): string {
  if (status === 'cancelled') return colors.danger;
  if (status === 'ready' || status === 'delivered') return colors.success;
  return colors.primary;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const orders = useProductsStore((state) => state.orders);
  const loadTrackedOrders = useProductsStore((state) => state.loadTrackedOrders);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const order = orders.find((item) => item.id === id);
  const horizontalPadding = getScreenPadding(width);

  useFocusEffect(useCallback(() => {
    let mounted = true;

    const updateOrders = async () => {
      await loadTrackedOrders();
      if (mounted) setLoading(false);
    };

    void updateOrders();
    const interval = setInterval(() => void loadTrackedOrders(), REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadTrackedOrders]));

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrackedOrders();
    setRefreshing(false);
  }, [loadTrackedOrders]);

  if (!order && loading) {
    return (
      <SafeAreaView style={styles.centered} edges={['left', 'right', 'bottom']}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Actualizando tu pedido…</Text>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered} edges={['left', 'right', 'bottom']}>
        <Ionicons name="receipt-outline" size={52} color={colors.chipBorder} />
        <Text style={styles.notFoundTitle}>No encontramos este pedido</Text>
        <Text style={styles.notFoundText}>Regresa al historial e inténtalo nuevamente.</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver a mis pedidos</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const itemSubtotal = order.items.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  );
  const confirmedDiscount = Math.max(0, itemSubtotal - order.total);
  const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
  const expectedPromotions = getCartPricing(order.items, new Date(order.createdAt));
  const timeline = getTimeline(order.status);
  const activeStep = order.status === 'cancelled' ? 1 : getOrderProgressIndex(order.status);
  const accent = statusColor(order.status);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        )}
      >
        <View style={[styles.statusHero, order.status === 'cancelled' && styles.statusHeroCancelled]}>
          <View style={[styles.heroIcon, { backgroundColor: accent }]}>
            <Ionicons
              name={order.status === 'cancelled' ? 'close' : order.status === 'ready' ? 'bag-check-outline' : 'cafe-outline'}
              size={29}
              color={colors.onPrimary}
            />
          </View>
          <Text style={styles.heroEyebrow}>PEDIDO {order.number}</Text>
          <Text style={styles.heroTitle}>{getOrderStatusMessage(order.status)}</Text>
          <Text style={styles.heroDate}>{formatOrderDate(order.createdAt)}</Text>
          <View style={[styles.heroBadge, { borderColor: accent }]}>
            <View style={[styles.heroBadgeDot, { backgroundColor: accent }]} />
            <Text style={[styles.heroBadgeText, { color: accent }]}>
              {getOrderStatusLabel(order.status)}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>Seguimiento del pedido</Text>
              <Text style={styles.sectionSubtitle}>El estado se actualiza automáticamente.</Text>
            </View>
          </View>

          <View style={styles.timeline}>
            {timeline.map((step, index) => {
              const completed = index < activeStep;
              const active = index === activeStep;
              const cancelledStep = order.status === 'cancelled' && index === 1;
              const stepAccent = cancelledStep ? colors.danger : colors.primary;
              const eventStatus = cancelledStep ? 'cancelled' : step.status;
              const statusEvent = order.statusEvents.find((event) => event.status === eventStatus);

              return (
                <View key={`${step.title}-${index}`} style={styles.timelineRow}>
                  <View style={styles.timelineRail}>
                    <View
                      style={[
                        styles.timelineDot,
                        (completed || active) && { borderColor: stepAccent, backgroundColor: stepAccent },
                      ]}
                    >
                      {(completed || active) && (
                        <Ionicons
                          name={cancelledStep ? 'close' : completed || order.status === 'delivered' ? 'checkmark' : 'ellipse'}
                          size={cancelledStep ? 16 : 13}
                          color={colors.onPrimary}
                        />
                      )}
                    </View>
                    {index < timeline.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          index < activeStep && { backgroundColor: stepAccent },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineTitle, active && { color: stepAccent }]}>
                      {step.title}
                    </Text>
                    <Text style={styles.timelineDescription}>{step.description}</Text>
                    <Text style={[styles.timelineMeta, active && { color: stepAccent }]}>
                      {statusEvent
                        ? formatOrderDate(statusEvent.createdAt)
                        : index === 0
                          ? formatOrderDate(order.createdAt)
                        : active
                          ? 'Estado actual'
                          : completed
                            ? 'Completado'
                            : 'Pendiente'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.sectionHeadingText}>
              <Text style={styles.sectionTitle}>Detalle del pedido</Text>
              <Text style={styles.sectionSubtitle}>
                {itemCount} {itemCount === 1 ? 'artículo' : 'artículos'}
              </Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            {order.items.map((item, index) => {
              const options = item.selections
                .flatMap((selection) => selection.options.map((option) => option.name))
                .join(', ');

              return (
                <View key={`${item.cartItemId}-${index}`} style={styles.itemRow}>
                  <View style={styles.quantityBadge}>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {options.length > 0 && <Text style={styles.itemOptions}>{options}</Text>}
                    {item.notes.trim().length > 0 && (
                      <View style={styles.noteRow}>
                        <Ionicons name="document-text-outline" size={13} color={colors.muted} />
                        <Text style={styles.itemNote}>{item.notes}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.itemPrice}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.totals}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>${itemSubtotal.toFixed(2)}</Text>
            </View>
            {confirmedDiscount > 0 && (
              <View style={styles.totalRow}>
                <View style={styles.discountLabel}>
                  <Ionicons name="pricetag" size={14} color={colors.success} />
                  <Text style={styles.discountText}>
                    {expectedPromotions.appliedPromotions[0]?.title ?? 'Promoción aplicada'}
                  </Text>
                </View>
                <Text style={styles.discountValue}>-${confirmedDiscount.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotal}>${order.total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.pickupCard}>
          <Ionicons name="storefront-outline" size={22} color={colors.primary} />
          <View style={styles.pickupInfo}>
            <Text style={styles.pickupTitle}>Recoge en Más Café</Text>
            <Text style={styles.pickupText}>Muestra el código {order.number} al recibir tu pedido.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  loadingText: { fontSize: font.small, color: colors.muted },
  notFoundTitle: { fontSize: font.heading, fontWeight: '800', color: colors.text },
  notFoundText: { fontSize: font.small, textAlign: 'center', color: colors.muted },
  backButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  backButtonText: { fontSize: font.small, fontWeight: '800', color: colors.onPrimary },
  content: {
    width: '100%',
    maxWidth: layout.narrowMaxWidth,
    alignSelf: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 40,
  },
  statusHero: {
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#E6D7C7',
    borderRadius: radius.lg,
    backgroundColor: '#F3E9DC',
  },
  statusHeroCancelled: { borderColor: '#F0CFCA', backgroundColor: '#FBEDEA' },
  heroIcon: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderRadius: radius.pill,
  },
  heroEyebrow: { fontSize: font.tiny, fontWeight: '800', letterSpacing: 1, color: colors.muted },
  heroTitle: {
    marginTop: spacing.sm,
    fontSize: font.title,
    fontWeight: '900',
    textAlign: 'center',
    color: colors.text,
  },
  heroDate: { marginTop: spacing.sm, fontSize: font.small, textAlign: 'center', color: colors.muted },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderWidth: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  heroBadgeDot: { width: 7, height: 7, borderRadius: radius.pill },
  heroBadgeText: { fontSize: font.small, fontWeight: '800' },
  sectionCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.thumb,
  },
  sectionHeadingText: { flex: 1 },
  sectionTitle: { fontSize: font.heading, fontWeight: '800', color: colors.text },
  sectionSubtitle: { marginTop: 2, fontSize: font.tiny, color: colors.muted },
  timeline: { marginTop: spacing.xl },
  timelineRow: { minHeight: 94, flexDirection: 'row' },
  timelineRail: { width: 34, alignItems: 'center' },
  timelineDot: {
    zIndex: 1,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.chipBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border },
  timelineContent: { flex: 1, paddingLeft: spacing.md, paddingBottom: spacing.lg },
  timelineTitle: { fontSize: font.body, fontWeight: '800', color: colors.muted },
  timelineDescription: { marginTop: 3, fontSize: font.small, lineHeight: 18, color: colors.muted },
  timelineMeta: { marginTop: spacing.sm, fontSize: font.tiny, fontWeight: '700', color: colors.muted },
  itemsList: { marginTop: spacing.lg },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quantityBadge: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.thumb,
  },
  quantityText: { fontSize: font.small, fontWeight: '800', color: colors.primary },
  itemInfo: { flex: 1, marginHorizontal: spacing.md },
  itemName: { fontSize: font.body, fontWeight: '700', color: colors.text },
  itemOptions: { marginTop: 3, fontSize: font.tiny, lineHeight: 16, color: colors.muted },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: spacing.sm },
  itemNote: { flex: 1, fontSize: font.tiny, fontStyle: 'italic', lineHeight: 16, color: colors.muted },
  itemPrice: { fontSize: font.small, fontWeight: '800', color: colors.primary },
  totals: { gap: spacing.sm, paddingTop: spacing.lg },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  totalLabel: { fontSize: font.small, color: colors.muted },
  totalValue: { fontSize: font.small, fontWeight: '700', color: colors.text },
  discountLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  discountText: { flex: 1, fontSize: font.tiny, fontWeight: '700', color: colors.success },
  discountValue: { fontSize: font.small, fontWeight: '800', color: colors.success },
  grandTotalRow: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  grandTotalLabel: { fontSize: font.body, fontWeight: '800', color: colors.text },
  grandTotal: { fontSize: 22, fontWeight: '900', color: colors.primary },
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.thumb,
  },
  pickupInfo: { flex: 1 },
  pickupTitle: { fontSize: font.body, fontWeight: '800', color: colors.primary },
  pickupText: { marginTop: 3, fontSize: font.small, lineHeight: 18, color: colors.muted },
});
