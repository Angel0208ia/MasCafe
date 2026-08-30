import { create } from "zustand";

import productsData from "../data/products.json";
import { Product } from "../types/product";

type CartItem = Product & {
    quantity: number;
};

type ProductsStore = {
    products: Product[];
    selectedCategory: string;
    cart: CartItem[];

    deleteProduct: (id: number) => void;
    getProductById: (id: number) => Product | undefined;
    setCategory: (category: string) => void;

    addToCart: (product: Product) => void;
    removeFromCart: (id: number) => void;
    increaseQuantity: (id: number) => void;
    decreaseQuantity: (id: number) => void;
};

export const useProductsStore = create<ProductsStore>((set, get) => ({
    products: productsData as Product[],
    selectedCategory: "Todos",
    cart: [],

    deleteProduct: (id) => {
        set((state) => ({
            products: state.products.filter(
                (product) => product.id !== id
            )
        }));
    },

    getProductById: (id) => {
        return get().products.find(
            (product) => product.id === id
        );
    },

    setCategory: (category) => {
        set({
            selectedCategory: category
        });
    },

    addToCart: (product) => {
        set((state) => {
            const existingProduct = state.cart.find(
                (item) => item.id === product.id
            );

            if (existingProduct) {
                return {
                    cart: state.cart.map((item) =>
                        item.id === product.id
                            ? {
                                ...item,
                                quantity: item.quantity + 1
                            }
                            : item
                    )
                };
            }

            return {
                cart: [
                    ...state.cart,
                    {
                        ...product,
                        quantity: 1
                    }
                ]
            };
        });
    },

    removeFromCart: (id) => {
        set((state) => ({
            cart: state.cart.filter(
                (item) => item.id !== id
            )
        }));
    },

    increaseQuantity: (id) => {
        set((state) => ({
            cart: state.cart.map((item) =>
                item.id === id
                    ? {
                        ...item,
                        quantity: item.quantity + 1
                    }
                    : item
            )
        }));
    },

    decreaseQuantity: (id) => {
        set((state) => ({
            cart: state.cart
                .map((item) =>
                    item.id === id
                        ? {
                            ...item,
                            quantity: item.quantity - 1
                        }
                        : item
                )
                .filter((item) => item.quantity > 0)
        }));
    }
}));