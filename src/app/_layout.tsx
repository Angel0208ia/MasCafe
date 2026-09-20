import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { colors } from '../constants/theme';
import { initializeCustomerNotifications } from '../lib/customerNotifications';
import { startOrderUpdateSubscription } from '../lib/orderUpdates';
import { useProductsStore } from '../store/productsStore';

export const unstable_settings = { anchor: '(tabs)' };

export default function RootLayout() {
  useEffect(() => {
    const store = useProductsStore.getState();
    void initializeCustomerNotifications();
    void store.loadCafeteriaStatus();
    void store.loadTrackedOrders();
    return startOrderUpdateSubscription(() => {
      void useProductsStore.getState().loadTrackedOrders();
    });
  }, []);

  const navigation = (
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
      <Stack.Screen
        name="orders/[id]"
        options={{ title: 'Seguimiento', headerBackTitle: 'Pedidos' }}
      />
    </Stack>
  );

  if (Platform.OS === 'web') return navigation;

  return <KeyboardProvider>{navigation}</KeyboardProvider>;
}
