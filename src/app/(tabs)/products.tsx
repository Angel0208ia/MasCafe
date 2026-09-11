import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CategoryFilter from '@/components/CategoryFilter';
import ProductCard from '@/components/ProductCard';
import { colors, font, getScreenPadding, layout, radius, spacing } from '@/constants/theme';
import { filterByCategory, useProductsStore } from '@/store/productsStore';
import type { Product } from '@/types/product';

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es-MX')
    .trim();
}

export default function ProductsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const products = useProductsStore((state) => state.products);
  const selectedCategory = useProductsStore((state) => state.selectedCategory);
  const setCategory = useProductsStore((state) => state.setCategory);
  const loadMenu = useProductsStore((state) => state.loadMenu);
  const getCategories = useProductsStore((state) => state.getCategories);
  const [searchQuery, setSearchQuery] = useState('');

  // getCategories crea el arreglo a partir del menú remoto. Memorizarlo aquí
  // evita que Zustand reciba una referencia distinta en cada render.
  const categories = useMemo(() => getCategories(), [getCategories, products]);

  const visibleProducts = useMemo(() => {
    const productsInCategory = filterByCategory(products, selectedCategory);
    const normalizedQuery = normalizeSearchText(searchQuery);

    if (!normalizedQuery) return productsInCategory;

    return productsInCategory.filter((product) =>
      normalizeSearchText(`${product.name} ${product.description}`).includes(normalizedQuery)
    );
  }, [products, searchQuery, selectedCategory]);

  const currentCategory =
    categories.find((category) => category.value === selectedCategory)?.label ?? 'Todos';

  const horizontalPadding = getScreenPadding(width);
  const listWidth = Math.min(width, layout.contentMaxWidth);
  const availableWidth = listWidth - horizontalPadding * 2;
  const columns = width >= 1100 ? 3 : width >= layout.tabletBreakpoint ? 2 : 1;
  const columnGap = spacing.lg;
  const cardWidth = (availableWidth - columnGap * (columns - 1)) / columns;
  const cardStyle = useMemo(
    () => ({ width: cardWidth, maxWidth: cardWidth }),
    [cardWidth]
  );

  const openProduct = useCallback(
    (id: string) => router.push(`/products/${id}`),
    [router]
  );

  const renderProduct = useCallback<ListRenderItem<Product>>(
    ({ item }) => (
      <ProductCard product={item} style={cardStyle} onPress={openProduct} />
    ),
    [cardStyle, openProduct]
  );

  useFocusEffect(useCallback(() => {
    void loadMenu();
  }, [loadMenu]));

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
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Más Café</Text>
            <Text style={styles.subtitle}>Campus Principal · Pide y recoge</Text>

            <Text style={styles.searchTitle}>Buscar</Text>
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={colors.muted} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Busca café, bebidas o comida"
                placeholderTextColor={colors.muted}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Buscar productos"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  style={styles.clearSearch}
                  onPress={() => setSearchQuery('')}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={20} color={colors.muted} />
                </Pressable>
              )}
            </View>

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
        renderItem={renderProduct}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={30} color={colors.muted} />
            <Text style={styles.emptyTitle}>No encontramos resultados</Text>
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? `Prueba con otra palabra o cambia la categoría.`
                : 'No encontramos productos en esta categoría.'}
            </Text>
          </View>
        }
      />
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
  searchTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.text,
  },
  searchContainer: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(59, 35, 24, 0.04)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      },
    }),
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 0,
    fontSize: font.body,
    color: colors.text,
  },
  clearSearch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesTitle: {
    marginTop: spacing.xl,
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
