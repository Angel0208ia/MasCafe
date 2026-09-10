import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, spacing } from '../constants/theme';
import { useProductsStore } from '../store/productsStore';

type TabIcon = keyof typeof Ionicons.glyphMap;
const icons: Record<string, { selected: TabIcon; idle: TabIcon }> = {
  index: { selected: 'home', idle: 'home-outline' },
  products: { selected: 'cafe', idle: 'cafe-outline' },
  cart: { selected: 'cart', idle: 'cart-outline' },
  orders: { selected: 'time', idle: 'time-outline' },
};

function TabItem({
  selected, label, icon, badge, reduceMotion, onPress, onLongPress,
}: {
  selected: boolean;
  label: string;
  icon: TabIcon;
  badge: number;
  reduceMotion: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const highlight = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      highlight.setValue(selected ? 1 : 0);
      return;
    }
    const animation = Animated.timing(highlight, {
      toValue: selected ? 1 : 0,
      duration: 160,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [highlight, reduceMotion, selected]);

  return (
    <Pressable
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      aria-selected={selected}
      accessibilityLabel={badge > 0 ? `${label}, ${badge} artículos` : label}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.activeItem, { opacity: highlight, pointerEvents: 'none' }]}
      />
      <View>
        <Ionicons name={icon} size={23} color={selected ? colors.primary : colors.muted} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, selected && styles.activeLabel]}>{label}</Text>
    </Pressable>
  );
}

export default function BottomNav({
  state, descriptors, navigation, insets, reduceMotion,
}: BottomTabBarProps & { reduceMotion: boolean }) {
  const cartCount = useProductsStore((state) =>
    state.cart.reduce((total, item) => total + item.quantity, 0)
  );

  return (
    <View
      testID="bottom-navigation"
      style={[styles.bar, {
        paddingBottom: Math.max(insets.bottom, spacing.md),
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }]}
    >
      <View style={styles.container} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const selected = state.index === index;
          const icon = icons[route.name] ?? icons.index;
          const label = descriptors[route.key].options.title ?? route.name;

          return (
            <TabItem
              key={route.key}
              selected={selected}
              label={label}
              icon={selected ? icon.selected : icon.idle}
              badge={route.name === 'cart' ? cartCount : 0}
              reduceMotion={reduceMotion}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress', target: route.key, canPreventDefault: true,
                });
                if (!selected && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
  item: {
    flex: 1,
    maxWidth: 110,
    minHeight: 52,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    borderRadius: radius.md,
  },
  activeItem: { borderRadius: radius.md, backgroundColor: colors.thumb },
  pressed: { opacity: 0.7 },
  label: { fontSize: font.tiny, fontWeight: '600', color: colors.muted },
  activeLabel: { color: colors.primary },
  badge: {
    position: 'absolute', top: -7, right: -12,
    minWidth: 19, height: 19, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, backgroundColor: colors.danger,
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: '800' },
});
