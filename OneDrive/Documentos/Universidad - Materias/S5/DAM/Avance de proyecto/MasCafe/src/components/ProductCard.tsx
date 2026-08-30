import { router } from "expo-router";

import {
    Image,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";

import { useProductsStore } from "../store/productsStore";
import { Product } from "../types/product";

type ProductCardProps = {
    product: Product;
};

export default function ProductCard({
    product
}: ProductCardProps) {

    const addToCart = useProductsStore(
        (state) => state.addToCart
    );

    const openProduct = () => {
        router.push({
            pathname: "/products/[id]",
            params: {
                id: product.id.toString()
            }
        });
    };

    return (
        <Pressable
            style={styles.card}
            onPress={openProduct}
        >

            <Image
                source={{ uri: product.image }}
                style={styles.image}
            />

            <View style={styles.info}>

                <Text style={styles.name}>
                    {product.name}
                </Text>

                <Text
                    style={styles.description}
                    numberOfLines={2}
                >
                    {product.description}
                </Text>

                <Text style={styles.price}>
                    ${product.price}
                </Text>

            </View>

            <View style={styles.rightSide}>

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

                <Pressable
                    style={[
                        styles.addButton,
                        !product.available &&
                            styles.addButtonDisabled
                    ]}
                    disabled={!product.available}
                    onPress={(event) => {
                        event.stopPropagation();
                        addToCart(product);
                    }}
                >
                    <Text style={styles.addText}>
                        +
                    </Text>
                </Pressable>

            </View>

        </Pressable>
    );
}

const styles = StyleSheet.create({

    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E7DDD3"
    },

    image: {
        width: 65,
        height: 65,
        borderRadius: 12,
        backgroundColor: "#F5EEDF"
    },

    info: {
        flex: 1,
        marginLeft: 12
    },

    name: {
        fontSize: 16,
        fontWeight: "700",
        color: "#2B211C"
    },

    description: {
        fontSize: 12,
        lineHeight: 16,
        color: "#81766F",
        marginTop: 3
    },

    price: {
        fontSize: 15,
        fontWeight: "800",
        color: "#5A2A12",
        marginTop: 4
    },

    rightSide: {
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 65
    },

    availability: {
        fontSize: 10,
        color: "#398A4A",
        fontWeight: "600"
    },

    notAvailable: {
        color: "#B64D45"
    },

    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#5A2A12",
        justifyContent: "center",
        alignItems: "center"
    },

    addButtonDisabled: {
        backgroundColor: "#B9A99E"
    },

    addText: {
        color: "#FFFFFF",
        fontSize: 24,
        lineHeight: 26,
        fontWeight: "500"
    }
});