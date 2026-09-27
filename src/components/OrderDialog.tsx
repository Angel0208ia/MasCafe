import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import AppDialog, { type AppDialogProps } from './AppDialog';

export type OrderLoadingStage = 'location' | 'notifications' | 'submitting';
const LOADING_DELAY_MS = 1000;

const messages: Record<OrderLoadingStage, { title: string; description: string }> = {
  location: {
    title: 'Verificando tu ubicación',
    description: 'Estamos comprobando que estás dentro de Tecmilenio Campus Cancún. Puede tardar unos segundos.',
  },
  notifications: {
    title: 'Preparando los avisos',
    description: 'Si aparece una solicitud de notificaciones, elige si deseas recibir avisos de tu pedido.',
  },
  submitting: {
    title: 'Generando tu pedido',
    description: 'Estamos enviando tu pedido a la cafetería. Espera un momento.',
  },
};

type OrderDialogData = Omit<AppDialogProps, 'visible' | 'onClose' | 'iconContent'>;

export default function OrderDialog({ loadingStage, dialog, onClose }: {
  loadingStage: OrderLoadingStage | null;
  dialog: OrderDialogData | null;
  onClose: () => void;
}) {
  const [rotation] = useState(() => new Animated.Value(0));
  const reduceMotion = useReduceMotion();
  const isIOS = Platform.OS === 'ios';
  const isLoading = loadingStage !== null;
  const [loadingVisible, setLoadingVisible] = useState(false);
  const showLoading = isLoading && loadingVisible;

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoadingVisible(true), LOADING_DELAY_MS);
    return () => {
      clearTimeout(timer);
      setLoadingVisible(false);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!showLoading || reduceMotion || isIOS) return;
    const animation = Animated.loop(Animated.timing(rotation, {
      toValue: 1,
      duration: 1800,
      easing: Easing.linear,
      useNativeDriver: Platform.OS !== 'web',
      isInteraction: false,
    }));
    animation.start();
    return () => {
      animation.stop();
      rotation.setValue(0);
    };
  }, [isIOS, reduceMotion, rotation, showLoading]);

  const loadingIcon = isIOS ? (
    <View style={styles.nativeCoffee} accessible={false}>
      <Ionicons name="cafe-outline" size={28} color={colors.primary} />
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  ) : (
    <Animated.View
      accessible={false}
      style={{ transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}
    >
      <Ionicons name="cafe-outline" size={28} color={colors.primary} />
    </Animated.View>
  );
  const loadingMessage = loadingStage ? messages[loadingStage] : null;

  // Keep one native modal mounted from loading through the result. Both states
  // share the full-window center, card dimensions and icon container.
  return (
    <AppDialog
      visible={showLoading || dialog !== null}
      title={showLoading ? loadingMessage?.title ?? '' : dialog?.title ?? ''}
      message={showLoading ? loadingMessage?.description ?? '' : dialog?.message ?? ''}
      messageStyle={showLoading ? undefined : dialog?.messageStyle}
      icon={dialog?.icon}
      iconContent={showLoading ? loadingIcon : undefined}
      actions={showLoading ? [] : dialog?.actions}
      onClose={isLoading ? () => {} : onClose}
    />
  );
}

const styles = StyleSheet.create({
  nativeCoffee: { alignItems: 'center', justifyContent: 'center', gap: 2 },
});
