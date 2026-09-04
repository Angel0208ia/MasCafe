import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../../components/BottomNav';
import CategoryFilter from '../../components/CategoryFilter';
import ProductCard from '../../components/ProductCard';
import { colors, font, getScreenPadding, layout, spacing } from '../../constants/theme';
import { filterByCategory, useProductsStore } from '../../store/productsStore';

export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const products = useProductsStore((state) => state.products);
  const selectedCategory = useProductsStore((state) => state.selectedCategory);
  const setCategory = useProductsStore((state) => state.setCategory);
  const categories = useProductsStore((state) => state.getCategories());

  const visibleProducts = useMemo(
    () => filterByCategory(products, selectedCategory),
    [products, selectedCategory]
  );

  const currentCategory =
    categories.find((category) => category.value === selectedCategory)?.label ?? 'Todos';

  const horizontalPadding = getScreenPadding(width);
  const listWidth = Math.min(width, layout.contentMaxWidth);
  const availableWidth = listWidth - horizontalPadding * 2;
  const columns = width >= 1100 ? 3 : width >= layout.tabletBreakpoint ? 2 : 1;
  const columnGap = spacing.lg;
  const cardWidth = (availableWidth - columnGap * (columns - 1)) / columns;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList
        key={`products-${columns}`}
        style={styles.list}
        data={visibleProducts}
        numColumns={columns}
        keyExtractor={(product) => product.id}
        contentContainerStyle={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
        ]}
        columnWrapperStyle={columns > 1 ? styles.columns : undefined}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Más Café</Text>
            <Text style={styles.subtitle}>Campus Central · Pide y recoge</Text>
            <Text style={styles.categoriesTitle}>Categorías</Text>

            <CategoryFilter
              categories={categories}
              selected={selectedCategory}
              onSelect={setCategory}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {currentCategory === 'Todos' ? 'Menú completo' : currentCategory}
              </Text>
              <Text style={styles.counter}>
                {visibleProducts.length} {visibleProducts.length === 1 ? 'producto' : 'productos'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            style={{ width: cardWidth, maxWidth: cardWidth }}
            onPress={(id) => router.push(`/products/${id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No hay productos</Text>
            <Text style={styles.emptyText}>No encontramos productos en esta categoría.</Text>
          </View>
        }
      />
      <BottomNav active="menu" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    width: '100%',
  },
  content: {
    width: '100%',
    maxWidth: layout.contentMaxWidth,
    alignSelf: 'center',
    paddingBottom: spacing.xl,
  },
  columns: {
    gap: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: font.small,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  categoriesTitle: {
    marginTop: spacing.lg,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
  },
  counter: {
    fontSize: font.small,
    color: colors.muted,
    marginLeft: spacing.md,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontSize: font.heading,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: font.small,
    color: colors.muted,
    textAlign: 'center',
  },
});
