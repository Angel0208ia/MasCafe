import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

import { useProductsStore } from "../store/productsStore";

type BottomNavProps = {
    active: "inicio" | "menu" | "carrito" | "pedidos";
};

export default function BottomNav({
    active
}: BottomNavProps) {

    const cart = useProductsStore(
        (state) => state.cart
    );

    const cartCount = cart.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    return (
        <View style={styles.container}>

            <Pressable style={styles.item}>
                <Ionicons
                    name="home-outline"
                    size={20}
                    color="#82776F"
                />

                <Text style={styles.text}>
                    Inicio
                </Text>
            </Pressable>

            <Pressable
                style={[
                    styles.item,
                    active === "menu" &&
                        styles.activeItem
                ]}
                onPress={() =>
                    router.push("/products")
                }
            >
                <Ionicons
                    name={
                        active === "menu"
                            ? "restaurant"
                            : "restaurant-outline"
                    }
                    size={20}
                    color={
                        active === "menu"
                            ? "#5A2A12"
                            : "#82776F"
                    }
                />

                <Text
                    style={[
                        styles.text,
                        active === "menu" &&
                            styles.activeText
                    ]}
                >
                    Menú
                </Text>
            </Pressable>

            <Pressable
                style={[
                    styles.item,
                    active === "carrito" &&
                        styles.activeItem
                ]}
                onPress={() =>
                    router.push("/cart")
                }
            >
                <View>

                    <Ionicons
                        name={
                            active === "carrito"
                                ? "cart"
                                : "cart-outline"
                        }
                        size={20}
                        color={
                            active === "carrito"
                                ? "#5A2A12"
                                : "#82776F"
                        }
                    />

                    {cartCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {cartCount}
                            </Text>
                        </View>
                    )}

                </View>

                <Text
                    style={[
                        styles.text,
                        active === "carrito" &&
                            styles.activeText
                    ]}
                >
                    Carrito
                </Text>
            </Pressable>

            <Pressable style={styles.item}>
                <Ionicons
                    name="time-outline"
                    size={20}
                    color="#82776F"
                />

                <Text style={styles.text}>
                    Pedidos
                </Text>
            </Pressable>

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        height: 72,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#E8DED4",
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        paddingHorizontal: 8
    },

    item: {
        width: 70,
        height: 52,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 14
    },

    activeItem: {
        backgroundColor: "#F5EBDD"
    },

    text: {
        fontSize: 11,
        marginTop: 3,
        color: "#82776F"
    },

    activeText: {
        color: "#5A2A12",
        fontWeight: "700"
    },

    badge: {
        position: "absolute",
        right: -9,
        top: -7,
        backgroundColor: "#5A2A12",
        minWidth: 17,
        height: 17,
        borderRadius: 9,
        justifyContent: "center",
        alignItems: "center"
    },

    badgeText: {
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700"
    }
});