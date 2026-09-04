import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { colors, font, getScreenPadding, layout, radius, spacing } from '../constants/theme';
import { ALL_CATEGORIES, useProductsStore } from '../store/productsStore';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setCategory = useProductsStore((state) => state.setCategory);
  const cartCount = useProductsStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );

  const openMenu = () => {
    setCategory(ALL_CATEGORIES);
    router.push('/products');
  };

  const horizontalPadding = getScreenPadding(width);
  const pageWidth = Math.min(width, layout.contentMaxWidth);
  const contentWidth = pageWidth - horizontalPadding * 2;
  const isDesktop = width >= layout.desktopBreakpoint;
  const isCompact = width < 360;
  const posterWidth = isDesktop
    ? Math.min(500, contentWidth * 0.55)
    : contentWidth;
  const posterHeight = posterWidth * (1448 / 1086);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.page}>
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

        <View style={[styles.hero, isDesktop && styles.heroDesktop, isCompact && styles.heroCompact]}>
          <View style={styles.heroContent}>
            <View style={styles.campusBadge}>
              <Ionicons name="location-outline" size={14} color={colors.primary} />
              <Text style={styles.campusText}>Campus Principal</Text>
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

          <View style={[styles.heroIcon, isDesktop && styles.heroIconDesktop, isCompact && styles.heroIconCompact]}>
            <Image
              source={require('../../assets/images/logo-mas-cafe.png')}
              style={[styles.heroLogo, isDesktop && styles.heroLogoDesktop, isCompact && styles.heroLogoCompact]}
              resizeMode="contain"
              accessibilityLabel="Logo de Más Café"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Promociones destacadas</Text>

        <View style={[styles.promotions, isDesktop && styles.promotionsDesktop]}>
          <Pressable
            style={({ pressed }) => [
              styles.promoPosterCard,
              { width: posterWidth, height: posterHeight },
              pressed && styles.pressed,
            ]}
            onPress={openMenu}
            accessibilityRole="button"
            accessibilityLabel="Ver promociones de Más Café"
          >
            <Image
              source={require('../../assets/images/promociones-semanales.jpeg')}
              style={{ width: posterWidth, height: posterHeight }}
              resizeMode="contain"
            />
          </Pressable>

          <View style={[styles.promoDetails, isDesktop && styles.promoDetailsDesktop]}>
            <View style={styles.promoDetailCard}>
              <View style={styles.promoDayBadge}>
                <Text style={styles.promoDay}>MARTES</Text>
              </View>
              <View style={styles.promoDetailContent}>
                <Text style={styles.promoDetailTitle}>Segundo cappuccino por $45</Text>
                <Text style={styles.promoDetailText}>Compra un cappuccino y aprovecha el precio especial.</Text>
              </View>
            </View>

            <View style={styles.promoDetailCard}>
              <View style={[styles.promoDayBadge, styles.promoDayBadgeGreen]}>
                <Text style={styles.promoDay}>JUEVES</Text>
              </View>
              <View style={styles.promoDetailContent}>
                <Text style={styles.promoDetailTitle}>Brownie + matcha por $90</Text>
                <Text style={styles.promoDetailText}>Disfruta el combo válido durante los jueves.</Text>
              </View>
            </View>
          </View>
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
    width: '100%',
    alignItems: 'center',
    paddingBottom: 36,
  },
  page: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
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
  heroDesktop: {
    minHeight: 270,
    padding: spacing.xl,
  },
  heroCompact: {
    minHeight: 205,
    padding: spacing.md,
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
  heroIconDesktop: {
    right: 30,
    bottom: -35,
    width: 220,
    height: 220,
  },
  heroIconCompact: {
    right: -28,
    width: 115,
    height: 115,
  },
  heroLogo: {
    width: 108,
    height: 108,
  },
  heroLogoDesktop: {
    width: 176,
    height: 176,
  },
  heroLogoCompact: {
    width: 90,
    height: 90,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  promoPosterCard: {
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  promotions: {
    width: '100%',
  },
  promotionsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  promoDetails: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  promoDetailsDesktop: {
    flex: 1,
    marginTop: 0,
  },
  promoDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  promoDayBadge: {
    minWidth: 62,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: '#E9580C',
  },
  promoDayBadgeGreen: {
    backgroundColor: '#688B3A',
  },
  promoDay: {
    fontSize: font.tiny,
    fontWeight: '800',
    color: colors.onPrimary,
  },
  promoDetailContent: {
    flex: 1,
  },
  promoDetailTitle: {
    fontSize: font.small,
    fontWeight: '800',
    color: colors.text,
  },
  promoDetailText: {
    marginTop: 2,
    fontSize: font.tiny,
    lineHeight: 15,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.75,
  },
});
