import { Stack } from 'expo-router';
import { colors } from '../constants/theme';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="products/[id]"
        options={{ title: 'Producto', headerBackTitle: 'Menú' }}
      />
    </Stack>
  );
}
