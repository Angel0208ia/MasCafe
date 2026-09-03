// Tipos compartidos por el menú, la personalización y el carrito.
export type CustomizationType = 'single' | 'multiple';

export type CustomizationOption = {
  id: string;
  name: string;
  extraPrice: number;
};

export type CustomizationGroup = {
  id: string;
  name: string;
  type: CustomizationType;
  required?: boolean;
  minSelections?: number;
  maxSelections?: number;
  options: CustomizationOption[];
};

export type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  available: boolean;
  category: string;
  customizations?: CustomizationGroup[];
};

export type SelectedOption = CustomizationOption;

export type SelectedCustomization = {
  groupId: string;
  groupName: string;
  options: SelectedOption[];
};

export type CartItem = {
  cartItemId: string;
  productId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  selections: SelectedCustomization[];
  notes: string;
};

export type NewCartItem = Omit<CartItem, 'cartItemId'>;
