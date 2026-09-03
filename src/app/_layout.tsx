import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: "#FBF8F3"
                },

                headerTintColor: "#5A2A12",

                headerTitleStyle: {
                    fontWeight: "700"
                },

                headerShadowVisible: false,

                contentStyle: {
                    backgroundColor: "#FBF8F3"
                }
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="products/index"
                options={{
                    headerShown: false
                }}
            />

            <Stack.Screen
                name="products/[id]"
                options={{
                    title: "Producto",
                    headerBackTitle: "Menú"
                }}
            />

            <Stack.Screen
                name="cart/index"
                options={{
                    headerShown: false
                }}
            />
        </Stack>
    );
}