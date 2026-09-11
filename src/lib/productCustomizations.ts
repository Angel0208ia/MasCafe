import type { Product, SelectedCustomization } from '../types/product';

export function createDefaultSelections(product: Product): SelectedCustomization[] {
  return (product.customizations ?? []).flatMap((group) => {
    const minimum = group.minSelections ?? (group.required ? 1 : 0);
    if (minimum === 0) return [];

    const preferredOption = group.id === 'temperature'
      ? group.options.find((option) => option.id === 'cold')
      : undefined;
    const options = preferredOption && minimum === 1
      ? [preferredOption]
      : group.options.slice(0, minimum);
    return options.length > 0
      ? [{ groupId: group.id, groupName: group.name, options }]
      : [];
  });
}

export function calculateUnitPrice(
  product: Product,
  selections: SelectedCustomization[]
): number {
  const extras = selections.reduce(
    (total, selection) => total + selection.options.reduce(
      (selectionTotal, option) => selectionTotal + option.extraPrice,
      0
    ),
    0
  );

  return product.price + extras;
}
