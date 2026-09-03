import { create } from 'zustand';
import productsData from '../data/products.json';
import type {
  CartActionResult,
  CartItem,
  NewCartItem,
  Order,
  PlaceOrderResult,
  Product,
} from '../types/product';

export type { CartItem, Product } from '../types/product';

export const ALL_CATEGORIES = 'Todos';
export const MAX_ITEMS_PER_ORDER = 3;
export const ORDER_COOLDOWN_MS = 30 * 60 * 1000;

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

function getCartQuantity(cart: CartItem[]): number {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function createOrderNumber(): string {
  return `MC-${Date.now().toString().slice(-6)}`;
}

type ProductsState = {
  products: Product[];
  selectedCategory: string;
  cart: CartItem[];
  orders: Order[];
  setCategory: (category: string) => void;
  addToCart: (item: NewCartItem) => CartActionResult;
  increaseQuantity: (cartItemId: string) => CartActionResult;
  decreaseQuantity: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  placeOrder: () => PlaceOrderResult;
  getProductById: (id: string) => Product | undefined;
  getFilteredProducts: () => Product[];
  getCategories: () => CategoryOption[];
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: initialProducts,
  selectedCategory: ALL_CATEGORIES,
  cart: [],
  orders: [],

  setCategory: (category) => set({ selectedCategory: category }),

  addToCart: (item) => {
    const cartQuantity = getCartQuantity(get().cart);

    if (cartQuantity + item.quantity > MAX_ITEMS_PER_ORDER) {
      return {
        success: false,
        message: `Solo puedes pedir ${MAX_ITEMS_PER_ORDER} artículos por pedido.`,
      };
    }

    set((state) => ({
      cart: [...state.cart, { ...item, cartItemId: createCartItemId() }],
    }));

    return { success: true };
  },

  increaseQuantity: (cartItemId) => {
    if (getCartQuantity(get().cart) >= MAX_ITEMS_PER_ORDER) {
      return {
        success: false,
        message: `Solo puedes pedir ${MAX_ITEMS_PER_ORDER} artículos por pedido.`,
      };
    }

    set((state) => ({
      cart: state.cart.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: item.quantity + 1 }
        : item
      ),
    }));

    return { success: true };
  },

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

  placeOrder: () => {
    const state = get();

    if (state.cart.length === 0) {
      return { success: false, reason: 'empty', remainingMs: 0 };
    }

    const now = Date.now();
    const latestOrder = state.orders[0];
    const nextOrderAt = latestOrder
      ? latestOrder.createdAt + ORDER_COOLDOWN_MS
      : 0;

    if (now < nextOrderAt) {
      return {
        success: false,
        reason: 'cooldown',
        remainingMs: nextOrderAt - now,
      };
    }

    const order: Order = {
      id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
      number: createOrderNumber(),
      items: state.cart,
      total: state.cart.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      ),
      createdAt: now,
      status: 'received',
    };

    set({ orders: [order, ...state.orders], cart: [] });
    return { success: true, order };
  },

  getProductById: (id) => get().products.find((product) => product.id === id),

  getFilteredProducts: () => filterByCategory(get().products, get().selectedCategory),

  getCategories: () => CATEGORIES,
}));
