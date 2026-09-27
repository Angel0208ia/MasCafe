import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '@/constants/theme';
import { useReduceMotion } from '@/hooks/useReduceMotion';

export type OrderLoadingStage = 'location' | 'notifications' | 'submitting';

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

export default function OrderLoadingOverlay({ stage }: { stage: OrderLoadingStage }) {
  const [rotation] = useState(() => new Animated.Value(0));
  const reduceMotion = useReduceMotion();
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    if (reduceMotion || isIOS) return;
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
  }, [isIOS, reduceMotion, rotation]);

  const content = (
      <View style={styles.overlay} accessibilityViewIsModal>
        <View style={styles.card} accessibilityRole="progressbar" accessibilityState={{ busy: true }} accessibilityLabel={messages[stage].title}>
          {isIOS ? (
            <View style={styles.coffee} accessible={false}>
              <Ionicons name="cafe-outline" size={36} color={colors.primary} />
              <ActivityIndicator size="small" color={colors.primary} style={styles.nativeSpinner} />
            </View>
          ) : <Animated.View
            accessible={false}
            style={[styles.coffee, { transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}
          >
            <Ionicons name="cafe-outline" size={40} color={colors.primary} />
          </Animated.View>}
          <Text style={styles.title} accessibilityLiveRegion="polite">{messages[stage].title}</Text>
          <Text style={styles.description}>{messages[stage].description}</Text>
        </View>
      </View>
  );

  // iOS must not dismiss this native modal while presenting the result dialog.
  // A screen overlay also leaves system location/notification prompts independent.
  if (isIOS) {
    return <View style={styles.screenOverlay}>{content}</View>;
  }
  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screenOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: 'rgba(27, 21, 18, 0.55)' },
  card: { width: '100%', maxWidth: 390, alignItems: 'center', padding: spacing.xl, backgroundColor: colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  coffee: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.thumb },
  nativeSpinner: { marginTop: spacing.xs },
  title: { marginTop: spacing.lg, fontSize: 21, fontWeight: '800', textAlign: 'center', color: colors.text },
  description: { marginTop: spacing.sm, fontSize: font.body, lineHeight: 23, textAlign: 'center', color: colors.muted },
});
