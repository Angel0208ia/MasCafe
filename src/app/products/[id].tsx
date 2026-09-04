import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import AppDialog, { type AppDialogAction } from '../../components/AppDialog';
import { colors, font, getScreenPadding, layout, radius, spacing } from '../../constants/theme';
import { MAX_ITEMS_PER_ORDER, useProductsStore } from '../../store/productsStore';
import type { CustomizationGroup, Product, SelectedCustomization } from '../../types/product';

type SelectionState = Record<string, string[]>;

type DialogState = {
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actions?: AppDialogAction[];
};

function createInitialSelections(product: Product): SelectionState {
  const initial: SelectionState = {};

  product.customizations?.forEach((group) => {
    if (group.type === 'single' && group.required && group.options[0]) {
      initial[group.id] = [group.options[0].id];
    }
  });

  return initial;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const product = useProductsStore((state) => state.getProductById(id));
  const addToCart = useProductsStore((state) => state.addToCart);
  const cartQuantity = useProductsStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );
  const [selections, setSelections] = useState<SelectionState>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [dialog, setDialog] = useState<DialogState | null>(null);

  const hasPriceOptions = product?.customizations?.some((group) =>
    group.options.some((option) => option.extraPrice > 0)
  );

  useEffect(() => {
    if (product) {
      setSelections(createInitialSelections(product));
      setQuantity(1);
      setNotes('');
    }
  }, [product?.id]);

  const visibleGroups = useMemo(() => {
    const groups = product?.customizations ?? [];
    const temperature = selections.temperature?.[0];
    return groups.filter((group) => group.id !== 'ice' || temperature !== 'hot');
  }, [product, selections.temperature]);

  const unitPrice = useMemo(() => {
    if (!product) return 0;

    return visibleGroups.reduce((total, group) => {
      const selectedIds = selections[group.id] ?? [];
      const extras = group.options
        .filter((option) => selectedIds.includes(option.id))
        .reduce((sum, option) => sum + option.extraPrice, 0);
      return total + extras;
    }, product.price);
  }, [product, selections, visibleGroups]);

  const availableSlots = MAX_ITEMS_PER_ORDER - cartQuantity;
  const canAddToCart = availableSlots > 0;
  const horizontalPadding = getScreenPadding(width);
  const isDesktop = width >= layout.desktopBreakpoint;

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Producto no encontrado</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/products')}>
          <Text style={styles.primaryButtonText}>Volver al menú</Text>
        </Pressable>
      </View>
    );
  }

  const selectOption = (group: CustomizationGroup, optionId: string) => {
    const selectedIds = selections[group.id] ?? [];

    if (
      group.type === 'multiple' &&
      !selectedIds.includes(optionId) &&
      group.maxSelections &&
      selectedIds.length >= group.maxSelections
    ) {
      setDialog({
        title: 'Límite alcanzado',
        message: `Puedes elegir hasta ${group.maxSelections} opciones.`,
        icon: 'information-circle-outline',
      });
      return;
    }

    setSelections((current) => {
      const currentIds = current[group.id] ?? [];

      if (group.type === 'single') {
        const next = { ...current, [group.id]: [optionId] };
        if (group.id === 'temperature' && optionId === 'hot') {
          delete next.ice;
        }
        if (group.id === 'temperature' && optionId === 'cold' && !next.ice) {
          const iceGroup = product.customizations?.find((item) => item.id === 'ice');
          if (iceGroup?.options[0]) {
            next.ice = [iceGroup.options[0].id];
          }
        }
        return next;
      }

      if (currentIds.includes(optionId)) {
        return { ...current, [group.id]: currentIds.filter((idValue) => idValue !== optionId) };
      }

      return { ...current, [group.id]: [...currentIds, optionId] };
    });
  };

  const validateSelections = (): boolean => {
    for (const group of visibleGroups) {
      const selectedCount = selections[group.id]?.length ?? 0;
      const minimum = group.minSelections ?? (group.required ? 1 : 0);

      if (selectedCount < minimum) {
        setDialog({
          title: 'Falta una elección',
          message: minimum > 1
            ? `Selecciona ${minimum} opciones en “${group.name}”.`
            : `Selecciona una opción en “${group.name}”.`,
          icon: 'list-outline',
        });
        return false;
      }
    }

    return true;
  };

  const buildSelections = (): SelectedCustomization[] =>
    visibleGroups.flatMap((group) => {
      const selectedIds = selections[group.id] ?? [];
      const options = group.options.filter((option) => selectedIds.includes(option.id));

      return options.length > 0
        ? [{ groupId: group.id, groupName: group.name, options }]
        : [];
    });

  const addProduct = () => {
    if (!validateSelections()) return;

    const result = addToCart({
      productId: product.id,
      name: product.name,
      image: product.image,
      quantity,
      unitPrice,
      selections: buildSelections(),
      notes: notes.trim(),
    });

    if (!result.success) {
      setDialog({
        title: 'Límite de artículos',
        message: result.message ?? 'El carrito alcanzó el límite permitido.',
        icon: 'bag-handle-outline',
      });
      return;
    }

    setDialog({
      title: 'Agregado al carrito',
      message: `${quantity} × ${product.name}`,
      icon: 'checkmark-circle-outline',
      actions: [
        { label: 'Seguir comprando', variant: 'secondary', onPress: () => router.back() },
        { label: 'Ver carrito', onPress: () => router.replace('/cart') },
      ],
    });
  };

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.productLayout, isDesktop && styles.productLayoutDesktop]}>
            <View style={[styles.summaryColumn, isDesktop && styles.summaryColumnDesktop]}>
              <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />

              <View style={styles.header}>
                <Text style={styles.category}>{product.category}</Text>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.description}>{product.description}</Text>
                <Text style={styles.price}>
                  {hasPriceOptions ? 'Desde ' : ''}${product.price.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={[styles.formColumn, isDesktop && styles.formColumnDesktop]}>
              {visibleGroups.map((group) => {
                const selectedIds = selections[group.id] ?? [];
                const minimum = group.minSelections ?? 0;
                const maximum = group.maxSelections;
                const selectionHelp = group.type === 'multiple'
                  ? minimum === maximum
                    ? `Elige ${minimum}`
                    : `Elige ${minimum}${maximum ? ` a ${maximum}` : ''}`
                  : group.required
                    ? 'Elige una opción'
                    : 'Opcional';

                return (
                  <View key={group.id} style={styles.customizationSection}>
                    <View style={styles.groupHeader}>
                      <Text style={styles.sectionTitle}>{group.name}</Text>
                      <Text style={styles.groupHelp}>{selectionHelp}</Text>
                    </View>

                    {group.options.map((option) => {
                      const isSelected = selectedIds.includes(option.id);

                      return (
                        <Pressable
                          key={option.id}
                          style={[styles.option, isSelected && styles.optionSelected]}
                          onPress={() => selectOption(group, option.id)}
                        >
                          <View style={[styles.selector, isSelected && styles.selectorSelected]}>
                            {isSelected && <Ionicons name="checkmark" size={14} color={colors.onPrimary} />}
                          </View>
                          <Text style={styles.optionName}>{option.name}</Text>
                          <Text style={styles.optionPrice}>
                            {option.extraPrice > 0 ? `+$${option.extraPrice.toFixed(2)}` : 'Incluido'}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              <View style={styles.customizationSection}>
                <Text style={styles.sectionTitle}>Indicaciones especiales</Text>
                <TextInput
                  style={styles.notesInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ej. Sin azúcar o bien caliente"
                  placeholderTextColor={colors.muted}
                  multiline
                  maxLength={140}
                  textAlignVertical="top"
                />
                <Text style={styles.characterCount}>{notes.length}/140</Text>
              </View>

              <View style={styles.quantityRow}>
                <Text style={styles.sectionTitle}>Cantidad</Text>
                <View style={styles.quantityControl}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => setQuantity((current) => Math.max(1, current - 1))}
                  >
                    <Ionicons name="remove" size={20} color={colors.primary} />
                  </Pressable>
                  <Text style={styles.quantityText}>{quantity}</Text>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => {
                      if (quantity >= availableSlots) {
                        setDialog({
                          title: 'Límite de artículos',
                          message: `Solo puedes pedir ${MAX_ITEMS_PER_ORDER} artículos por pedido.`,
                          icon: 'bag-handle-outline',
                        });
                        return;
                      }

                      setQuantity((current) => current + 1);
                    }}
                  >
                    <Ionicons name="add" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={[styles.addButton, !canAddToCart && styles.addButtonDisabled]}
                onPress={addProduct}
                disabled={!canAddToCart}
              >
                <Text style={styles.addButtonText}>
                  {canAddToCart ? 'Agregar al carrito' : 'Carrito lleno'}
                </Text>
                <Text style={styles.addButtonPrice}>${(unitPrice * quantity).toFixed(2)}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <AppDialog
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        icon={dialog?.icon}
        actions={dialog?.actions}
        onClose={() => setDialog(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { width: '100%', alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: layout.detailMaxWidth,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  productLayout: { width: '100%' },
  productLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 32,
  },
  summaryColumn: { width: '100%' },
  summaryColumnDesktop: { flex: 0.85 },
  formColumn: { width: '100%' },
  formColumnDesktop: { flex: 1.15 },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.thumb,
  },
  header: { marginTop: spacing.lg, gap: spacing.xs },
  category: {
    fontSize: font.tiny,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  name: { fontSize: font.title, fontWeight: '800', color: colors.text },
  description: { fontSize: font.body, lineHeight: 22, color: colors.muted },
  price: { fontSize: font.heading, fontWeight: '700', color: colors.primary },
  customizationSection: { marginTop: spacing.xl },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  groupHelp: { fontSize: font.tiny, color: colors.muted },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.thumb },
  selector: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    marginRight: spacing.md,
  },
  selectorSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionName: { flex: 1, fontSize: font.body, color: colors.text },
  optionPrice: { fontSize: font.small, fontWeight: '600', color: colors.primary },
  notesInput: {
    minHeight: 90,
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: font.body,
  },
  characterCount: { marginTop: spacing.xs, textAlign: 'right', fontSize: font.tiny, color: colors.muted },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  quantityControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  quantityButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.surface,
  },
  quantityText: { minWidth: 24, textAlign: 'center', fontSize: font.heading, fontWeight: '700', color: colors.text },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  addButtonDisabled: { opacity: 0.45 },
  addButtonText: { fontSize: font.body, fontWeight: '700', color: colors.onPrimary },
  addButtonPrice: { fontSize: font.body, fontWeight: '800', color: colors.onPrimary },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  notFoundTitle: { fontSize: font.heading, fontWeight: '700', color: colors.text },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  primaryButtonText: { color: colors.onPrimary, fontWeight: '700' },
});
