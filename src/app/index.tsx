import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { colors, font, radius, spacing } from '../constants/theme';
import { ALL_CATEGORIES, useProductsStore } from '../store/productsStore';

export default function HomeScreen() {
  const router = useRouter();
  const setCategory = useProductsStore((state) => state.setCategory);
  const cartCount = useProductsStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );

  const openMenu = () => {
    setCategory(ALL_CATEGORIES);
    router.push('/products');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Más Café</Text>
            <Text style={styles.greeting}>¿Qué se te antoja hoy?</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.cartShortcut, pressed && styles.pressed]}
            onPress={() => router.push('/cart')}
            accessibilityRole="button"
            accessibilityLabel="Abrir carrito"
          >
            <Ionicons name="cart-outline" size={23} color={colors.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.campusBadge}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={styles.campusText}>Campus Central</Text>
            </View>

            <Text style={styles.heroTitle}>Pide antes de llegar</Text>
            <Text style={styles.heroText}>
              Personaliza tu pedido, evita la fila y recógelo en la cafetería.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
              onPress={openMenu}
              accessibilityRole="button"
            >
              <Text style={styles.heroButtonText}>Ver menú</Text>
              <Ionicons name="arrow-forward" size={17} color={colors.onPrimary} />
            </Pressable>
          </View>

          <View style={styles.heroIcon}>
            <Image
              source={require('../../assets/images/logo-mas-cafe.png')}
              style={styles.heroLogo}
              resizeMode="contain"
              accessibilityLabel="Logo de Más Café"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Promociones destacadas</Text>

        <View style={styles.promoCard}>
          <View style={styles.promoCircleTop} />
          <View style={styles.promoCircleBottom} />

          <View style={styles.promoBadge}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={styles.promoBadgeText}>PRÓXIMAMENTE</Text>
          </View>

          <View style={styles.promoIcon}>
            <Ionicons name="pricetag-outline" size={30} color={colors.onPrimary} />
          </View>

          <Text style={styles.promoTitle}>Algo rico está por llegar</Text>
          <Text style={styles.promoText}>
            Aquí encontrarás los combos y descuentos disponibles de Más Café.
          </Text>

          <View style={styles.promoFooter}>
            <Ionicons name="notifications-outline" size={17} color="#F7E8D5" />
            <Text style={styles.promoFooterText}>
              Las promociones aparecerán cuando estén disponibles.
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  greeting: {
    marginTop: 2,
    fontSize: font.small,
    color: colors.muted,
  },
  cartShortcut: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -3,
    minWidth: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  hero: {
    minHeight: 220,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: '#EFE1CF',
  },
  heroContent: {
    flex: 1,
    zIndex: 1,
  },
  campusBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
  },
  campusText: {
    fontSize: font.tiny,
    fontWeight: '700',
    color: colors.primary,
  },
  heroTitle: {
    marginTop: spacing.md,
    fontSize: 25,
    fontWeight: '800',
    color: colors.primary,
  },
  heroText: {
    maxWidth: 245,
    marginTop: spacing.xs,
    fontSize: font.small,
    lineHeight: 19,
    color: '#69584D',
  },
  heroButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  heroButtonText: {
    fontSize: font.small,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  heroIcon: {
    position: 'absolute',
    right: -15,
    bottom: -18,
    width: 135,
    height: 135,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  heroLogo: {
    width: 108,
    height: 108,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  promoCard: {
    minHeight: 250,
    overflow: 'hidden',
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  promoCircleTop: {
    position: 'absolute',
    top: -65,
    right: -45,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  promoCircleBottom: {
    position: 'absolute',
    bottom: -80,
    left: -55,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  promoBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F7E8D5',
  },
  promoBadgeText: {
    fontSize: font.tiny,
    fontWeight: '800',
    color: colors.primary,
  },
  promoIcon: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.xl,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  promoTitle: {
    maxWidth: 260,
    marginTop: spacing.xl,
    fontSize: 24,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  promoText: {
    maxWidth: 295,
    marginTop: spacing.sm,
    fontSize: font.small,
    lineHeight: 20,
    color: '#F7E8D5',
  },
  promoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  promoFooterText: {
    flex: 1,
    fontSize: font.tiny,
    lineHeight: 17,
    color: '#F7E8D5',
  },
  pressed: {
    opacity: 0.75,
  },
});
