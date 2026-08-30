import {
    FlatList,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View
} from "react-native";

import BottomNav from "../../components/BottomNav";
import ProductCard from "../../components/ProductCard";

import { useProductsStore } from "../../store/productsStore";

export default function ProductsScreen() {

    const products = useProductsStore(
        (state) => state.products
    );

    const selectedCategory = useProductsStore(
        (state) => state.selectedCategory
    );

    const setCategory = useProductsStore(
        (state) => state.setCategory
    );

    const categories = [
        "Todos",
        ...Array.from(
            new Set(
                products.map(
                    (product) => product.category
                )
            )
        )
    ];

    const filteredProducts =
        selectedCategory === "Todos"
            ? products
            : products.filter(
                (product) =>
                    product.category === selectedCategory
            );

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.content}>

                <FlatList
                    data={filteredProducts}

                    keyExtractor={(item) =>
                        item.id.toString()
                    }

                    showsVerticalScrollIndicator={false}

                    contentContainerStyle={styles.list}

                    ListHeaderComponent={
                        <View>

                            <Text style={styles.title}>
                                Mas Café
                            </Text>

                            <Text style={styles.subtitle}>
                                Campus Central · Pide y recoge
                            </Text>

                            <FlatList
                                horizontal
                                data={categories}
                                keyExtractor={(item) => item}
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={
                                    styles.categories
                                }

                                renderItem={({ item }) => {

                                    const active =
                                        selectedCategory === item;

                                    return (
                                        <Pressable
                                            onPress={() =>
                                                setCategory(item)
                                            }

                                            style={[
                                                styles.categoryButton,
                                                active &&
                                                    styles.activeCategory
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryText,
                                                    active &&
                                                        styles.activeCategoryText
                                                ]}
                                            >
                                                {item}
                                            </Text>
                                        </Pressable>
                                    );
                                }}
                            />

                            <Text style={styles.sectionTitle}>
                                Recomendados de hoy
                            </Text>

                        </View>
                    }

                    renderItem={({ item }) => (
                        <ProductCard
                            product={item}
                        />
                    )}

                    ListEmptyComponent={
                        <View style={styles.empty}>

                            <Text style={styles.emptyTitle}>
                                No hay productos
                            </Text>

                            <Text style={styles.emptyText}>
                                No encontramos productos en esta categoría.
                            </Text>

                        </View>
                    }
                />

            </View>

            <BottomNav active="menu" />

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

    list: {
        paddingHorizontal: 18,
        paddingTop: 20,
        paddingBottom: 30
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#2B211C"
    },

    subtitle: {
        fontSize: 13,
        color: "#81766F",
        marginTop: 3
    },

    categories: {
        paddingVertical: 16,
        gap: 8
    },

    categoryButton: {
        paddingHorizontal: 15,
        paddingVertical: 8,

        backgroundColor: "#FFFFFF",

        borderWidth: 1,
        borderColor: "#E3D6C8",

        borderRadius: 20
    },

    activeCategory: {
        borderColor: "#5A2A12",
        backgroundColor: "#F7EEE4"
    },

    categoryText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#675B54"
    },

    activeCategoryText: {
        color: "#5A2A12",
        fontWeight: "700"
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#2B211C",
        marginBottom: 10
    },

    empty: {
        alignItems: "center",
        marginTop: 60
    },

    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#2B211C"
    },

    emptyText: {
        color: "#81766F",
        marginTop: 7,
        textAlign: "center"
    }
});