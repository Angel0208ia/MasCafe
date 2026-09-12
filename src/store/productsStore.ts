import { create } from 'zustand';
import productsData from '../data/products.json';
import type {
  CartActionResult,
  CartItem,
  CancelOrderResult,
  NewCartItem,
  Order,
  PlaceOrderResult,
  Product,
  SelectedCustomization,
} from '../types/product';
import { fetchMenu } from '../lib/menuApi';
import {
  cancelAnonymousOrder,
  createAnonymousOrder,
  fetchTrackedOrders,
  getOrderingBlockedUntil,
} from '../lib/ordersApi';
import { calculateUnitPrice, createDefaultSelections } from '../lib/productCustomizations';
import { getCartPricing, getPromotionById, isPromotionActive } from '../constants/promotions';
import { getProductImage } from '../constants/productImages';

export type { CartItem, Product } from '../types/product';

export const ALL_CATEGORIES = 'Todos';
export const MAX_ITEMS_PER_ORDER = 3;
export const ORDER_COOLDOWN_MS = 30 * 60 * 1000;
export const CANCELLATION_BLOCK_MS = 2 * 60 * 60 * 1000;

export type CategoryOption = {
  label: string;
  value: string;
};

const initialProducts = (productsData as Product[]).map((product) => ({
  ...product,
  image: getProductImage(product.id, product.image),
}));

const CATEGORY_LABELS: Record<string, string> = {
  Licuados: 'Licuados',
  Frappés: 'Frappés',
  Granizados: 'Granizados',
  'Pancita llena, corazón contento': 'Comida',
  'La vida es corta... pide postre': 'Postres',
  Snacks: 'Snacks',
  'Mi lado fit': 'Fit',
  'Hoy sí voy al gym': 'Proteína',
};

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

function restoreSelections(
  product: Product,
  previousSelections: SelectedCustomization[]
): SelectedCustomization[] {
  return (product.customizations ?? []).flatMap((group) => {
    const previousOptionIds = new Set(
      previousSelections.find((selection) => selection.groupId === group.id)
        ?.options.map((option) => option.id) ?? []
    );
    const minimum = group.minSelections ?? (group.required ? 1 : 0);
    const maximum = group.type === 'single' ? 1 : group.maxSelections ?? group.options.length;
    const selected = group.options.filter((option) => previousOptionIds.has(option.id));

    for (const option of group.options) {
      if (selected.length >= minimum || selected.length >= maximum) break;
      if (!selected.some((item) => item.id === option.id)) selected.push(option);
    }

    const options = selected.slice(0, maximum);
    return options.length > 0
      ? [{ groupId: group.id, groupName: group.name, options }]
      : [];
  });
}

function preserveUnchangedProducts(current: Product[], incoming: Product[]): Product[] {
  const currentById = new Map(current.map((product) => [product.id, product]));
  const reconciled = incoming.map((product) => {
    const existing = currentById.get(product.id);
    return existing && JSON.stringify(existing) === JSON.stringify(product)
      ? existing
      : product;
  });

  return current.length === reconciled.length &&
    current.every((product, index) => product === reconciled[index])
    ? current
    : reconciled;
}

type ProductsState = {
  products: Product[];
  selectedCategory: string;
  cart: CartItem[];
  orders: Order[];
  orderingBlockedUntil: number;
  isSubmittingOrder: boolean;
  isCancellingOrder: boolean;
  setCategory: (category: string) => void;
  addToCart: (item: NewCartItem) => CartActionResult;
  addPromotionToCart: (promotionId: string) => CartActionResult;
  repeatOrder: (orderId: string) => CartActionResult;
  updateCartItem: (cartItemId: string, item: NewCartItem) => CartActionResult;
  increaseQuantity: (cartItemId: string) => CartActionResult;
  decreaseQuantity: (cartItemId: string) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  placeOrder: () => Promise<PlaceOrderResult>;
  cancelOrder: (orderId: string) => Promise<CancelOrderResult>;
  loadMenu: () => Promise<void>;
  loadTrackedOrders: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  getFilteredProducts: () => Product[];
  getCategories: () => CategoryOption[];
};

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: initialProducts,
  selectedCategory: ALL_CATEGORIES,
  cart: [],
  orders: [],
  orderingBlockedUntil: getOrderingBlockedUntil(),
  isSubmittingOrder: false,
  isCancellingOrder: false,

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

  addPromotionToCart: (promotionId) => {
    const promotion = getPromotionById(promotionId);
    if (!promotion) {
      return { success: false, message: 'No encontramos esta promoción.' };
    }

    if (!isPromotionActive(promotion)) {
      return {
        success: false,
        message: `Esta promoción es válida únicamente los ${promotion.dayLabel.toLowerCase()}.`,
      };
    }

    const state = get();
    const promotionQuantity = promotion.requirements.reduce(
      (total, requirement) => total + requirement.quantity,
      0
    );

    if (getCartQuantity(state.cart) + promotionQuantity > MAX_ITEMS_PER_ORDER) {
      return {
        success: false,
        message: `Necesitas espacio para ${promotionQuantity} artículos. El máximo por pedido es ${MAX_ITEMS_PER_ORDER}.`,
      };
    }

    const promotionItems: CartItem[] = [];

    for (const requirement of promotion.requirements) {
      const product = state.products.find((item) => item.id === requirement.productId);
      if (!product?.available) {
        return {
          success: false,
          message: 'Uno de los productos de la promoción no está disponible.',
        };
      }

      for (let index = 0; index < requirement.quantity; index += 1) {
        const selections = createDefaultSelections(product);
        promotionItems.push({
          cartItemId: createCartItemId(),
          productId: product.id,
          name: product.name,
          image: product.image,
          quantity: 1,
          unitPrice: calculateUnitPrice(product, selections),
          selections,
          notes: '',
        });
      }
    }

    set({ cart: [...state.cart, ...promotionItems] });
    return { success: true };
  },

  repeatOrder: (orderId) => {
    const state = get();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order || order.items.length === 0) {
      return { success: false, message: 'No encontramos los artículos de este pedido.' };
    }

    const originalSubtotal = order.items.reduce(
      (total, item) => total + item.unitPrice * item.quantity,
      0
    );
    const originalPricing = getCartPricing(order.items, new Date(order.createdAt));
    const originalPromotions = originalSubtotal > order.total
      ? originalPricing.appliedPromotions
      : [];

    for (const appliedPromotion of originalPromotions) {
      const promotion = getPromotionById(appliedPromotion.id);
      if (promotion && !isPromotionActive(promotion)) {
        return {
          success: false,
          message: `Este pedido incluía “${promotion.title}”, válida únicamente los ${promotion.dayLabel.toLowerCase()}.`,
        };
      }
    }

    const repeatedQuantity = getCartQuantity(order.items);
    const availableSpace = MAX_ITEMS_PER_ORDER - getCartQuantity(state.cart);
    if (repeatedQuantity > availableSpace) {
      return {
        success: false,
        message: availableSpace > 0
          ? `Este pedido tiene ${repeatedQuantity} artículos y solo queda espacio para ${availableSpace}.`
          : 'Tu carrito ya alcanzó el máximo de artículos.',
      };
    }

    const repeatedItems: CartItem[] = [];
    for (const previousItem of order.items) {
      const product = state.products.find((item) => item.id === previousItem.productId);
      if (!product?.available) {
        return {
          success: false,
          message: `${previousItem.name} ya no está disponible.`,
        };
      }

      const selections = restoreSelections(product, previousItem.selections);
      repeatedItems.push({
        cartItemId: createCartItemId(),
        productId: product.id,
        name: product.name,
        image: product.image,
        quantity: previousItem.quantity,
        unitPrice: calculateUnitPrice(product, selections),
        selections,
        notes: previousItem.notes,
      });
    }

    set({ cart: [...state.cart, ...repeatedItems] });
    return { success: true };
  },

  updateCartItem: (cartItemId, item) => {
    const state = get();
    const currentItem = state.cart.find((cartItem) => cartItem.cartItemId === cartItemId);
    if (!currentItem) {
      return { success: false, message: 'Este artículo ya no está en el carrito.' };
    }

    const quantityWithoutCurrentItem = getCartQuantity(state.cart) - currentItem.quantity;
    if (quantityWithoutCurrentItem + item.quantity > MAX_ITEMS_PER_ORDER) {
      return {
        success: false,
        message: `Solo puedes pedir ${MAX_ITEMS_PER_ORDER} artículos por pedido.`,
      };
    }

    set({
      cart: state.cart.map((cartItem) =>
        cartItem.cartItemId === cartItemId
          ? { ...item, cartItemId }
          : cartItem
      ),
    });
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

  placeOrder: async () => {
    const state = get();

    if (state.cart.length === 0) {
      return { success: false, reason: 'empty', remainingMs: 0 };
    }

    if (state.isSubmittingOrder) {
      return { success: false, reason: 'busy', remainingMs: 0 };
    }

    const now = Date.now();
    if (now < state.orderingBlockedUntil) {
      return {
        success: false,
        reason: 'blocked',
        remainingMs: state.orderingBlockedUntil - now,
        message: 'Tu cuenta temporal está bloqueada por cancelaciones reiteradas.',
      };
    }

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

    set({ isSubmittingOrder: true });

    try {
      const order = await createAnonymousOrder(state.cart);
      set((current) => ({
        orders: [order, ...current.orders.filter((item) => item.id !== order.id)],
        cart: [],
      }));
      return { success: true, order };
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'No se pudo conectar con el servidor.';
      return { success: false, reason: 'network', remainingMs: 0, message };
    } finally {
      set({ isSubmittingOrder: false });
    }
  },

  cancelOrder: async (orderId) => {
    const state = get();
    const order = state.orders.find((item) => item.id === orderId);
    if (!order) return { success: false, message: 'No encontramos este pedido.' };
    if (order.status !== 'received') {
      return {
        success: false,
        message: order.status === 'preparing'
          ? 'El pedido ya está en preparación y no se puede cancelar.'
          : 'Este pedido ya no se puede cancelar.',
      };
    }
    if (state.isCancellingOrder) {
      return { success: false, message: 'La cancelación ya está en proceso.' };
    }

    set({ isCancellingOrder: true });
    try {
      const result = await cancelAnonymousOrder(orderId);
      if (!result.success) return result;

      const cancelledAt = Date.now();
      set((current) => ({
        orderingBlockedUntil: result.blockedUntil,
        orders: current.orders.map((item) => item.id === orderId
          ? {
              ...item,
              status: 'cancelled',
              statusEvents: [
                ...item.statusEvents.filter((event) => event.status !== 'cancelled'),
                { status: 'cancelled', createdAt: cancelledAt },
              ],
            }
          : item),
      }));
      return result;
    } finally {
      set({ isCancellingOrder: false });
    }
  },

  loadMenu: async () => {
    try {
      const products = await fetchMenu();
      if (products.length > 0) {
        set((state) => ({
          products: preserveUnchangedProducts(state.products, products),
        }));
      }
    } catch {
      // El catálogo incluido permite seguir explorando si aún no hay conexión.
    }
  },

  loadTrackedOrders: async () => {
    try {
      const orders = await fetchTrackedOrders();
      set({ orders });
    } catch {
      // No se borra el estado visible si la red falla temporalmente.
    }
  },

  getProductById: (id) => get().products.find((product) => product.id === id),

  getFilteredProducts: () => filterByCategory(get().products, get().selectedCategory),

  getCategories: () => [
    { label: ALL_CATEGORIES, value: ALL_CATEGORIES },
    ...Array.from(new Set(get().products.map((product) => product.category))).map((category) => ({
      label: CATEGORY_LABELS[category] ?? category,
      value: category,
    })),
  ],
}));
