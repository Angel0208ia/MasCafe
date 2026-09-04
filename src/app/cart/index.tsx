import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppDialog, { type AppDialogAction } from '../../components/AppDialog';
import BottomNav from '../../components/BottomNav';
import { colors, font, getScreenPadding, layout, radius, spacing } from '../../constants/theme';
import {
  MAX_ITEMS_PER_ORDER,
  ORDER_COOLDOWN_MS,
  useProductsStore,
} from '../../store/productsStore';
import type { CartItem } from '../../types/product';

type DialogState = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actions?: AppDialogAction[];
};

function formatRemainingTime(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function CartProduct({
  item,
  onLimit,
}: {
  item: CartItem;
  onLimit: (message: string) => void;
}) {
  const increaseQuantity = useProductsStore((state) => state.increaseQuantity);
  const decreaseQuantity = useProductsStore((state) => state.decreaseQuantity);
  const removeFromCart = useProductsStore((state) => state.removeFromCart);

  const details = item.selections
    .map((selection) => `${selection.groupName}: ${selection.options.map((option) => option.name).join(', ')}`)
    .join('\n');

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{item.name}</Text>
          <Pressable onPress={() => removeFromCart(item.cartItemId)} hitSlop={8}>
            <Ionicons name="close" size={22} color={colors.muted} />
          </Pressable>
        </View>

        {details.length > 0 && <Text style={styles.details}>{details}</Text>}
        {item.notes.length > 0 && <Text style={styles.notes}>Nota: {item.notes}</Text>}

        <View style={styles.cardFooter}>
          <View style={styles.quantityControl}>
            <Pressable
              style={styles.quantityButton}
              onPress={() => decreaseQuantity(item.cartItemId)}
            >
              <Ionicons name="remove" size={17} color={colors.primary} />
            </Pressable>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Pressable
              style={styles.quantityButton}
              onPress={() => {
                const result = increaseQuantity(item.cartItemId);
                if (!result.success) {
                  onLimit(result.message ?? 'El carrito alcanzó el límite permitido.');
                }
              }}
            >
              <Ionicons name="add" size={17} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.itemTotal}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cart = useProductsStore((state) => state.cart);
  const latestOrderAt = useProductsStore((state) => state.orders[0]?.createdAt ?? null);
  const clearCart = useProductsStore((state) => state.clearCart);
  const placeOrder = useProductsStore((state) => state.placeOrder);
  const [now, setNow] = useState(Date.now());
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const cartQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const remainingMs = latestOrderAt
    ? Math.max(0, latestOrderAt + ORDER_COOLDOWN_MS - now)
    : 0;
  const horizontalPadding = getScreenPadding(width);

  useEffect(() => {
    if (!latestOrderAt) return;

    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [latestOrderAt]);

  const submitOrder = () => {
    const result = placeOrder();

    if (!result.success) {
      const message = result.reason === 'cooldown'
        ? `Podrás generar otro pedido en ${formatRemainingTime(result.remainingMs)}.`
        : 'Tu carrito está vacío.';
      setDialog({
        title: 'No se pudo generar el pedido',
        message,
        icon: 'time-outline',
      });
      return;
    }

    setDialog({
      title: 'Pedido generado',
      message: `Tu pedido ${result.order.number} fue recibido.`,
      icon: 'checkmark-circle-outline',
      actions: [
        { label: 'Ver pedido', onPress: () => router.replace('/orders') },
      ],
    });
  };

  const confirmClearCart = () => {
    setDialog({
      title: 'Vaciar carrito',
      message: '¿Quieres eliminar todos los productos del carrito?',
      icon: 'trash-outline',
      actions: [
        { label: 'Cancelar', variant: 'secondary' },
        { label: 'Vaciar', variant: 'danger', onPress: clearCart },
      ],
    });
  };

  const showCartLimit = (message: string) => {
    setDialog({
      title: 'Límite de artículos',
      message,
      icon: 'bag-handle-outline',
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        style={styles.list}
        data={cart}
        keyExtractor={(item) => item.cartItemId}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Tu carrito</Text>
              <Text style={styles.subtitle}>Revisa tu pedido antes de continuar</Text>
            </View>
            {cart.length > 0 && (
              <Pressable
                onPress={confirmClearCart}
                accessibilityRole="button"
                accessibilityLabel="Vaciar todo el carrito"
              >
                <Text style={styles.clearText}>Vaciar</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={({ item }) => <CartProduct item={item} onLimit={showCartLimit} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cart-outline" size={58} color={colors.chipBorder} />
            <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
            <Text style={styles.emptyText}>Elige algo del menú y personalízalo a tu gusto.</Text>
            <Pressable style={styles.menuButton} onPress={() => router.replace('/products')}>
              <Text style={styles.menuButtonText}>Ver el menú</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          cart.length > 0 ? (
            <View style={styles.summary}>
              <View style={styles.limitRow}>
                <Ionicons name="bag-handle-outline" size={17} color={colors.muted} />
                <Text style={styles.limitText}>
                  {cartQuantity}/{MAX_ITEMS_PER_ORDER} artículos permitidos
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.total}>${total.toFixed(2)}</Text>
              </View>
              <Pressable
                style={[styles.orderButton, remainingMs > 0 && styles.orderButtonDisabled]}
                onPress={submitOrder}
                disabled={remainingMs > 0}
              >
                <Text style={styles.orderButtonText}>
                  {remainingMs > 0
                    ? `Nuevo pedido en ${formatRemainingTime(remainingMs)}`
                    : 'Generar pedido'}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />
      <BottomNav active="carrito" />
      <AppDialog
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        icon={dialog?.icon}
        actions={dialog?.actions}
        onClose={() => setDialog(null)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  headerText: { flex: 1, marginRight: spacing.md },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: spacing.xs, fontSize: font.small, color: colors.muted },
  clearText: { fontSize: font.small, fontWeight: '700', color: colors.danger },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  image: { width: 70, height: 70, borderRadius: radius.sm, backgroundColor: colors.thumb },
  info: { flex: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  name: { flex: 1, marginRight: spacing.sm, fontSize: font.body, fontWeight: '700', color: colors.text },
  details: { marginTop: spacing.xs, fontSize: font.tiny, lineHeight: 16, color: colors.muted },
  notes: { marginTop: spacing.xs, fontSize: font.tiny, fontStyle: 'italic', color: colors.muted },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  quantityButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
  },
  quantity: { minWidth: 16, textAlign: 'center', fontSize: font.small, fontWeight: '700', color: colors.text },
  itemTotal: { fontSize: font.body, fontWeight: '800', color: colors.primary },
  summary: { marginTop: spacing.md, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  limitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  limitText: { fontSize: font.small, color: colors.muted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  total: { fontSize: 22, fontWeight: '800', color: colors.primary },
  orderButton: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  orderButtonText: { fontSize: font.body, fontWeight: '700', color: colors.onPrimary },
  orderButtonDisabled: { opacity: 0.45 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl },
  emptyTitle: { marginTop: spacing.lg, fontSize: font.heading, fontWeight: '700', color: colors.text },
  emptyText: { marginTop: spacing.sm, textAlign: 'center', fontSize: font.small, color: colors.muted },
  menuButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  menuButtonText: { color: colors.onPrimary, fontWeight: '700' },
});
