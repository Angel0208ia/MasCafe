import {
    FlatList,
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";

import BottomNav from "../../components/BottomNav";
import { useProductsStore } from "../../store/productsStore";

export default function CartScreen() {

    const cart = useProductsStore(
        (state) => state.cart
    );

    const removeFromCart = useProductsStore(
        (state) => state.removeFromCart
    );

    const increaseQuantity = useProductsStore(
        (state) => state.increaseQuantity
    );

    const decreaseQuantity = useProductsStore(
        (state) => state.decreaseQuantity
    );

    const total = cart.reduce(
        (sum, item) =>
            sum + item.price * item.quantity,
        0
    );

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.content}>

                <Text style={styles.title}>
                    Mi Carrito
                </Text>

                <FlatList
                    data={cart}
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.list}

                    renderItem={({ item }) => (
                        <View style={styles.card}>

                            <Image
                                source={{ uri: item.image }}
                                style={styles.image}
                            />

                            <View style={styles.info}>

                                <Text style={styles.name}>
                                    {item.name}
                                </Text>

                                <Text style={styles.price}>
                                    ${item.price}
                                </Text>

                                <Pressable
                                    onPress={() =>
                                        removeFromCart(item.id)
                                    }
                                >
                                    <Text style={styles.removeText}>
                                        Eliminar
                                    </Text>
                                </Pressable>

                            </View>

                            <View style={styles.quantityContainer}>

                                <Pressable
                                    style={styles.quantityButton}
                                    onPress={() =>
                                        decreaseQuantity(item.id)
                                    }
                                >
                                    <Text style={styles.quantityText}>
                                        -
                                    </Text>
                                </Pressable>

                                <Text style={styles.quantity}>
                                    {item.quantity}
                                </Text>

                                <Pressable
                                    style={styles.quantityButtonActive}
                                    onPress={() =>
                                        increaseQuantity(item.id)
                                    }
                                >
                                    <Text style={styles.quantityTextActive}>
                                        +
                                    </Text>
                                </Pressable>

                            </View>

                        </View>
                    )}

                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>
                                Tu carrito está vacío
                            </Text>

                            <Text style={styles.emptyText}>
                                Agrega productos desde el menú.
                            </Text>
                        </View>
                    }
                />

                {cart.length > 0 && (
                    <View style={styles.totalBox}>

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>
                                Total
                            </Text>

                            <Text style={styles.totalValue}>
                                ${total.toFixed(2)}
                            </Text>
                        </View>

                        <Pressable style={styles.orderButton}>
                            <Text style={styles.orderButtonText}>
                                Realizar pedido
                            </Text>
                        </Pressable>

                    </View>
                )}

            </View>

            <BottomNav active="carrito" />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#FBF8F3"
    },

    content: {
        flex: 1
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#2B211C",
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 12
    },

    list: {
        paddingHorizontal: 18,
        paddingBottom: 20
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E7DDD3",
        borderRadius: 16,
        padding: 10,
        marginBottom: 12
    },

    image: {
        width: 58,
        height: 58,
        borderRadius: 12
    },

    info: {
        flex: 1,
        marginLeft: 12
    },

    name: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2B211C"
    },

    price: {
        fontSize: 14,
        fontWeight: "800",
        color: "#5A2A12",
        marginTop: 4
    },

    removeText: {
        fontSize: 12,
        color: "#B64D45",
        marginTop: 4
    },

    quantityContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },

    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#F3EBDD",
        justifyContent: "center",
        alignItems: "center"
    },

    quantityButtonActive: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#5A2A12",
        justifyContent: "center",
        alignItems: "center"
    },

    quantityText: {
        color: "#5A2A12",
        fontSize: 18
    },

    quantityTextActive: {
        color: "#FFFFFF",
        fontSize: 18
    },

    quantity: {
        fontSize: 15,
        fontWeight: "700",
        color: "#2B211C"
    },

    totalBox: {
        paddingHorizontal: 18,
        paddingBottom: 16
    },

    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },

    totalLabel: {
        fontSize: 18,
        fontWeight: "700",
        color: "#2B211C"
    },

    totalValue: {
        fontSize: 20,
        fontWeight: "800",
        color: "#5A2A12"
    },

    orderButton: {
        backgroundColor: "#5A2A12",
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: "center"
    },

    orderButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700"
    },

    emptyContainer: {
        alignItems: "center",
        marginTop: 80
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2B211C"
    },

    emptyText: {
        color: "#81766F",
        marginTop: 6
    }
});