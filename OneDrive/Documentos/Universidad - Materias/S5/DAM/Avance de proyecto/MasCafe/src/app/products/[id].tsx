import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from "react-native";

import {
    Stack,
    useLocalSearchParams
} from "expo-router";

import { useProductsStore } from "../../store/productsStore";

export default function ProductDetailScreen() {

    const { id } = useLocalSearchParams<{ id: string }>();

    const product = useProductsStore(
        (state) => state.getProductById(Number(id))
    );

    const addToCart = useProductsStore(
        (state) => state.addToCart
    );

    if (!product) {
        return (
            <View style={styles.notFound}>
                <Text style={styles.notFoundTitle}>
                    Producto no encontrado
                </Text>

                <Text style={styles.notFoundText}>
                    Es posible que este producto haya sido eliminado.
                </Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
        >

            <Stack.Screen
                options={{
                    title: product.name
                }}
            />

            <Image
                source={{ uri: product.image }}
                style={styles.image}
            />

            <View style={styles.content}>

                <Text style={styles.category}>
                    {product.category}
                </Text>

                <Text style={styles.name}>
                    {product.name}
                </Text>

                <View style={styles.row}>

                    <Text style={styles.price}>
                        ${product.price}
                    </Text>

                    <Text
                        style={[
                            styles.availability,
                            !product.available &&
                                styles.notAvailable
                        ]}
                    >
                        {product.available
                            ? "Disponible"
                            : "Agotado"}
                    </Text>

                </View>

                <View style={styles.separator} />

                <Text style={styles.sectionTitle}>
                    Descripción
                </Text>

                <Text style={styles.description}>
                    {product.description}
                </Text>

                <Pressable
                    style={[
                        styles.cartButton,
                        !product.available &&
                            styles.cartButtonDisabled
                    ]}
                    disabled={!product.available}
                    onPress={() => addToCart(product)}
                >
                    <Text style={styles.cartButtonText}>
                        {product.available
                            ? "Agregar al carrito"
                            : "Producto agotado"}
                    </Text>
                </Pressable>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#FBF8F3"
    },

    image: {
        width: "100%",
        height: 330
    },

    content: {
        padding: 24
    },

    category: {
        fontSize: 14,
        fontWeight: "700",
        color: "#8B5E3C",
        textTransform: "uppercase",
        letterSpacing: 1
    },

    name: {
        fontSize: 32,
        fontWeight: "800",
        color: "#252525",
        marginTop: 8
    },

    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 20
    },

    price: {
        fontSize: 30,
        fontWeight: "800",
        color: "#252525"
    },

    availability: {
        fontSize: 13,
        fontWeight: "700",
        color: "#2E7D32",
        backgroundColor: "#E8F5E9",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 20
    },

    notAvailable: {
        color: "#C62828",
        backgroundColor: "#FFEBEE"
    },

    separator: {
        height: 1,
        backgroundColor: "#DDD6D0",
        marginVertical: 24
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "700",
        color: "#252525"
    },

    description: {
        fontSize: 16,
        lineHeight: 25,
        color: "#666666",
        marginTop: 10
    },

    cartButton: {
        backgroundColor: "#5A2A12",
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 28
    },

    cartButtonDisabled: {
        backgroundColor: "#B9A99E"
    },

    cartButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700"
    },

    notFound: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 30,
        backgroundColor: "#FBF8F3"
    },

    notFoundTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#252525"
    },

    notFoundText: {
        fontSize: 15,
        color: "#777777",
        marginTop: 10,
        textAlign: "center"
    }
});