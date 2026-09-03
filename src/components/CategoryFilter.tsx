import { FlatList, Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import type { CategoryOption } from '../store/productsStore';

type CategoryFilterProps = {
  categories: CategoryOption[];
  selected: string;
  onSelect: (category: string) => void;
};

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(category) => category.value}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isActive = item.value === selected;

        return (
          <Pressable
            style={[styles.chip, isActive && styles.chipActive]}
            onPress={() => onSelect(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.text,
  },
  labelActive: {
    color: colors.onPrimary,
  },
});
