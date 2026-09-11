import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppDialog from '@/components/AppDialog';
import { PROMOTIONS, isPromotionActive } from '@/constants/promotions';
import { colors, font, getScreenPadding, layout, radius, spacing } from '@/constants/theme';
import { ALL_CATEGORIES, useProductsStore } from '@/store/productsStore';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setCategory = useProductsStore((state) => state.setCategory);
  const products = useProductsStore((state) => state.products);
  const addPromotionToCart = useProductsStore((state) => state.addPromotionToCart);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);
  const [today, setToday] = useState(() => new Date());
  const cartCount = useProductsStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );

  const openMenu = () => {
    setCategory(ALL_CATEGORIES);
    router.navigate('/products');
  };

  const horizontalPadding = getScreenPadding(width);
  const isDesktop = width >= layout.desktopBreakpoint;
  const isCompact = width < 360;

  useFocusEffect(useCallback(() => {
    setToday(new Date());
  }, []));

  const addPromotion = (promotionId: string) => {
    const result = addPromotionToCart(promotionId);
    if (!result.success) {
      setDialog({
        title: 'Promoción no disponible',
        message: result.message ?? 'No fue posible agregar esta promoción.',
      });
      return;
    }

    router.navigate('/cart');
  };

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
            <Text style={styles.greeting}>¡Más sabor para tu día!</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.cartShortcut, pressed && styles.pressed]}
            onPress={() => router.navigate('/cart')}
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

            <Text style={styles.heroTitle}>¿Qué se te antoja hoy?</Text>
            <Text style={styles.heroText}>
            Evita la fila y recógelo en la cafetería.
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
              source={require('@/assets/images/logo-mas-cafe.png')}
              style={[styles.heroLogo, isDesktop && styles.heroLogoDesktop, isCompact && styles.heroLogoCompact]}
              resizeMode="contain"
              accessibilityLabel="Logo de Más Café"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Promociones destacadas</Text>

        <View style={[styles.promotions, isDesktop && styles.promotionsDesktop]}>
          {PROMOTIONS.map((promotion) => {
            const active = isPromotionActive(promotion, today);
            const featuredProducts = promotion.requirements.flatMap((requirement) =>
              Array.from({ length: requirement.quantity }, (_, index) => ({
                key: `${requirement.productId}-${index}`,
                product: products.find((item) => item.id === requirement.productId),
              }))
            );

            return (
              <Pressable
                key={promotion.id}
                style={({ pressed }) => [
                  styles.promotionCard,
                  isDesktop && styles.promotionCardDesktop,
                  !active && styles.promotionCardInactive,
                  pressed && styles.pressed,
                ]}
                onPress={() => addPromotion(promotion.id)}
                accessibilityRole="button"
                accessibilityLabel={`${promotion.title}. Válida los ${promotion.dayLabel.toLowerCase()}.`}
              >
                <View
                  style={[styles.promotionAccent, { backgroundColor: promotion.accentColor }]}
                />
                <View style={styles.promotionHeader}>
                  <View style={[styles.promoDayBadge, { backgroundColor: promotion.softColor }]}>
                    <Ionicons name="calendar-outline" size={13} color={promotion.accentColor} />
                    <Text style={[styles.promoDay, { color: promotion.accentColor }]}>
                      {promotion.dayLabel}
                    </Text>
                  </View>
                  <View style={[styles.availabilityBadge, active && styles.availabilityBadgeActive]}>
                    <Text style={[styles.availabilityText, active && styles.availabilityTextActive]}>
                      {active ? 'Disponible hoy' : `Solo ${promotion.dayLabel.toLowerCase()}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.promotionProducts}>
                  {featuredProducts.map(({ key, product }, index) => (
                    <View key={key} style={styles.promotionProduct}>
                      {index > 0 && (
                        <View style={styles.promotionPlusBadge}>
                          <Text style={styles.promotionPlus}>+</Text>
                        </View>
                      )}
                      {product ? (
                        <Image source={{ uri: product.image }} style={styles.promotionImage} />
                      ) : (
                        <View style={styles.promotionImagePlaceholder} />
                      )}
                      <Text style={styles.promotionProductName} numberOfLines={2}>
                        {product?.name ?? 'Producto'}
                      </Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.promotionTitle} numberOfLines={2}>{promotion.title}</Text>
                <Text style={styles.promotionDescription} numberOfLines={2}>
                  {promotion.description}
                </Text>

                <View style={styles.promotionFooter}>
                  <View>
                    <Text style={styles.promotionPrice}>
                      {promotion.priceLabel}
                    </Text>
                    <Text style={styles.promotionSavings}>Ahorras ${promotion.discountPerBundle}</Text>
                  </View>
                  <View style={[styles.promotionAction, !active && styles.promotionActionInactive]}>
                    <Ionicons
                      name={active ? 'add' : 'calendar-outline'}
                      size={17}
                      color={active ? colors.onPrimary : colors.primary}
                    />
                    <Text
                      style={[
                        styles.promotionActionText,
                        !active && styles.promotionActionTextInactive,
                      ]}
                    >
                      {active ? 'Agregar' : 'Ver vigencia'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
        </View>
      </ScrollView>

      <AppDialog
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        icon="pricetag-outline"
        onClose={() => setDialog(null)}
      />
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
  promotions: {
    width: '100%',
    gap: spacing.md,
  },
  promotionsDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  promotionCard: {
    width: '100%',
    minHeight: 365,
    overflow: 'hidden',
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E9DDCF',
    borderRadius: radius.lg,
    backgroundColor: '#FFFCF8',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(59, 35, 24, 0.07)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 2,
      },
    }),
  },
  promotionCardDesktop: { flex: 1, minWidth: 300 },
  promotionCardInactive: { backgroundColor: '#FCF9F5' },
  promotionAccent: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    width: 48,
    height: 4,
    borderBottomLeftRadius: radius.pill,
    borderBottomRightRadius: radius.pill,
  },
  promotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  promoDayBadge: {
    minWidth: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  promoDay: {
    fontSize: font.tiny,
    fontWeight: '800',
  },
  availabilityBadge: {
    minWidth: 112,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8F1E8',
  },
  availabilityBadgeActive: { backgroundColor: '#E8F3E8' },
  availabilityText: { fontSize: font.tiny, fontWeight: '700', color: colors.muted },
  availabilityTextActive: { color: colors.success },
  promotionProducts: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  promotionProduct: {
    flex: 1,
    position: 'relative',
    alignItems: 'center',
    gap: spacing.sm,
  },
  promotionPlusBadge: {
    position: 'absolute',
    left: -22,
    top: 22,
    zIndex: 1,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promotionPlus: { fontSize: 21, lineHeight: 23, fontWeight: '800', color: colors.primary },
  promotionImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.thumb,
  },
  promotionImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.thumb,
  },
  promotionProductName: {
    width: '100%',
    fontSize: font.tiny,
    lineHeight: 15,
    fontWeight: '700',
    textAlign: 'center',
    color: colors.text,
  },
  promotionTitle: {
    minHeight: 52,
    marginTop: spacing.lg,
    fontSize: font.heading,
    fontWeight: '800',
    color: colors.text,
  },
  promotionDescription: {
    minHeight: 40,
    marginTop: spacing.xs,
    fontSize: font.small,
    lineHeight: 19,
    color: colors.muted,
  },
  promotionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: 'auto',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F0E6DB',
  },
  promotionPrice: { fontSize: 21, fontWeight: '900', color: colors.primary },
  promotionSavings: { marginTop: 2, fontSize: font.tiny, color: colors.muted },
  promotionAction: {
    minWidth: 126,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  promotionActionText: { fontSize: font.small, fontWeight: '800', color: colors.onPrimary },
  promotionActionInactive: {
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.thumb,
  },
  promotionActionTextInactive: { color: colors.primary },
  pressed: {
    opacity: 0.75,
  },
});
