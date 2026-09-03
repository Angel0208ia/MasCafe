import { create } from 'zustand';
import productsData from '../data/products.json';
import type { CartItem, NewCartItem, Product } from '../types/product';

export type { CartItem, Product } from '../types/product';

export const ALL_CATEGORIES = 'Todos';

export type CategoryOption = {
  label: string;
  value: string;
};

const initialProducts = productsData as Product[];

const CATEGORY_LABELS: Record<string, string> = {
  'Necesito despertar': 'Café',
  'Para los milk lovers': 'Con leche',
  'Hoy no quiero café': 'Sin café',
  Licuados: 'Licuados',
  Frappés: 'Frappés',
  Granizados: 'Granizados',
  'Pancita llena, corazón contento': 'Comida',
  'La vida es corta... pide postre': 'Postres',
  Snacks: 'Snacks',
  'Mi lado fit': 'Fit',
  'Hoy sí voy al gym': 'Proteína',
};

export const CATEGORIES: CategoryOption[] = [
  { label: ALL_CATEGORIES, value: ALL_CATEGORIES },
  ...Array.from(new Set(initialProducts.map((product) => product.category))).map(
    (category) => ({
      label: CATEGORY_LABELS[category] ?? category,
      value: category,
    })
  ),
];

export function filterByCategory(products: Product[], category: string): Product[] {
  if (category === ALL_CATEGORIES) return products;
  return products.filter((product) => product.category === category);
}

function createCartItemId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

type ProductsState = {
  products: Product[];
  selectedCategory: string;
  cart: CartItem[];
  setCategory: (category: string) => void;
  addToCart: (item: NewCartItem) => void;
  increaseQuantity: (cartItemId: string) => void;
  decreaseQuantity: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  getProductById: (id: string) => Product | undefined;
  getFilteredProducts: () => Product[];
  getCategories: () => CategoryOption[];
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: initialProducts,
  selectedCategory: ALL_CATEGORIES,
  cart: [],

  setCategory: (category) => set({ selectedCategory: category }),

  addToCart: (item) =>
    set((state) => ({
      cart: [...state.cart, { ...item, cartItemId: createCartItemId() }],
    })),

  increaseQuantity: (cartItemId) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ),
    })),

  decreaseQuantity: (cartItemId) =>
    set((state) => ({
      cart: state.cart
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0),
    })),

  removeFromCart: (cartItemId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.cartItemId !== cartItemId),
    })),

  clearCart: () => set({ cart: [] }),

  getProductById: (id) => get().products.find((product) => product.id === id),

  getFilteredProducts: () => filterByCategory(get().products, get().selectedCategory),

  getCategories: () => CATEGORIES,
}));
