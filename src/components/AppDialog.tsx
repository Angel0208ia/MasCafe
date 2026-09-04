import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';

export type AppDialogAction = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
};

type AppDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  actions?: AppDialogAction[];
  onClose: () => void;
};

export default function AppDialog({
  visible,
  title,
  message,
  icon = 'cafe-outline',
  actions = [{ label: 'Entendido' }],
  onClose,
}: AppDialogProps) {
  const { width } = useWindowDimensions();
  const stackActions = width < 360 && actions.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={[styles.actions, stackActions && styles.actionsStacked]}>
            {actions.map((action) => {
              const variant = action.variant ?? 'primary';

              return (
                <Pressable
                  key={action.label}
                  style={({ pressed }) => [
                    styles.button,
                    variant === 'secondary' && styles.secondaryButton,
                    variant === 'danger' && styles.dangerButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => {
                    onClose();
                    action.onPress?.();
                  }}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.buttonText,
                      variant === 'secondary' && styles.secondaryButtonText,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(27, 21, 18, 0.55)',
  },
  card: {
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  iconContainer: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.thumb,
  },
  title: {
    marginTop: spacing.lg,
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.text,
  },
  message: {
    marginTop: spacing.sm,
    fontSize: font.body,
    lineHeight: 21,
    textAlign: 'center',
    color: colors.muted,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionsStacked: {
    flexDirection: 'column-reverse',
  },
  button: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.chipBorder,
    backgroundColor: colors.surface,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    fontSize: font.small,
    fontWeight: '800',
    textAlign: 'center',
    color: colors.onPrimary,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
