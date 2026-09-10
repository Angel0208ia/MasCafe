import { Tabs } from 'expo-router';
import { Easing, Platform } from 'react-native';
import BottomNav from '../../components/BottomNav';
import { colors } from '../../constants/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export default function TabLayout() {
  const reduceMotion = useReduceMotion();
  const isIOS = Platform.OS === 'ios';
  const animateScenes = !isIOS && !reduceMotion;

  return (
    <Tabs
      initialRouteName="index"
      backBehavior="history"
      // On iOS, use ordinary views so switching tabs never depends on native
      // screen reattachment or an interrupted opacity animation completing.
      detachInactiveScreens={!isIOS}
      tabBar={(props) => <BottomNav {...props} reduceMotion={reduceMotion} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        animation: animateScenes ? 'fade' : 'none',
        transitionSpec: animateScenes ? {
          animation: 'timing',
          config: { duration: 180, easing: Easing.out(Easing.cubic) },
        } : undefined,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="products" options={{ title: 'Menú' }} />
      <Tabs.Screen name="cart" options={{ title: 'Carrito' }} />
      <Tabs.Screen name="orders" options={{ title: 'Pedidos' }} />
    </Tabs>
  );
}
