import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import { useProductsStore } from '../store/productsStore';

type BottomNavProps = {
  active: 'inicio' | 'menu' | 'carrito' | 'pedidos';
};

export default function BottomNav({ active }: BottomNavProps) {
  const router = useRouter();
  const cartCount = useProductsStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );

  return (
    <View style={styles.container}>
      <Link href="/" asChild>
        <Pressable
          style={StyleSheet.flatten([
            styles.item,
            active === 'inicio' ? styles.activeItem : undefined,
          ])}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
        >
          <Ionicons
            name={active === 'inicio' ? 'home' : 'home-outline'}
            size={21}
            color={active === 'inicio' ? colors.primary : colors.muted}
          />
          <Text style={[styles.label, active === 'inicio' && styles.activeLabel]}>Inicio</Text>
        </Pressable>
      </Link>

      <Pressable
        style={[styles.item, active === 'menu' && styles.activeItem]}
        onPress={() => router.replace('/products')}
      >
        <Ionicons
          name={active === 'menu' ? 'cafe' : 'cafe-outline'}
          size={23}
          color={active === 'menu' ? colors.primary : colors.muted}
        />
        <Text style={[styles.label, active === 'menu' && styles.activeLabel]}>Menú</Text>
      </Pressable>

      <Pressable
        style={[styles.item, active === 'carrito' && styles.activeItem]}
        onPress={() => router.replace('/cart')}
      >
        <View>
          <Ionicons
            name={active === 'carrito' ? 'cart' : 'cart-outline'}
            size={23}
            color={active === 'carrito' ? colors.primary : colors.muted}
          />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.label, active === 'carrito' && styles.activeLabel]}>Carrito</Text>
      </Pressable>

      <Pressable style={[styles.item, active === 'pedidos' && styles.activeItem]}>
        <Ionicons
          name={active === 'pedidos' ? 'time' : 'time-outline'}
          size={21}
          color={active === 'pedidos' ? colors.primary : colors.muted}
        />
        <Text style={[styles.label, active === 'pedidos' && styles.activeLabel]}>Pedidos</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    width: 70,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.md,
  },
  activeItem: {
    backgroundColor: colors.thumb,
  },
  label: {
    fontSize: font.tiny,
    fontWeight: '600',
    color: colors.muted,
  },
  activeLabel: {
    color: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -7,
    right: -12,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  badgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: '800',
  },
});
