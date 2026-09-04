import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import type { Product } from '../types/product';

type ProductCardProps = {
  product: Product;
  onPress: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

export default function ProductCard({ product, onPress, style }: ProductCardProps) {
  const hasPriceOptions = product.customizations?.some((group) =>
    group.options.some((option) => option.extraPrice > 0)
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.card, style, pressed && styles.cardPressed]}
      onPress={() => onPress(product.id)}
      disabled={!product.available}
      accessibilityRole="button"
      accessibilityLabel={`Personalizar ${product.name}`}
    >
      <Image source={{ uri: product.image }} style={styles.image} />

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>
            {hasPriceOptions ? 'Desde ' : ''}${product.price.toFixed(2)}
          </Text>
          <View style={styles.chooseButton}>
            <Text style={styles.chooseText}>
              {product.available ? 'Elegir' : 'Agotado'}
            </Text>
            {product.available && (
              <Ionicons name="chevron-forward" size={15} color={colors.onPrimary} />
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardPressed: {
    opacity: 0.82,
  },
  image: {
    width: 82,
    height: 82,
    borderRadius: radius.sm,
    backgroundColor: colors.thumb,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: font.body,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: font.small,
    lineHeight: 18,
    color: colors.muted,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  price: {
    flex: 1,
    fontSize: font.small,
    fontWeight: '700',
    color: colors.primary,
  },
  chooseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  chooseText: {
    fontSize: font.tiny,
    fontWeight: '700',
    color: colors.onPrimary,
  },
});
