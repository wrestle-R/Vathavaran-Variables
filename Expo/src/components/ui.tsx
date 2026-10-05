import { useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAppTheme } from '@/theme';

export function Touch({
  children,
  style,
  ...props
}: Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useRef(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      reduced.current = value;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      reduced.current = value;
    });
    return () => sub.remove();
  }, []);
  function animate(value: number) {
    if (!reduced.current)
      Animated.spring(scale, {
        toValue: value,
        speed: 35,
        bounciness: 0,
        useNativeDriver: true,
      }).start();
  }
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        {...props}
        onPressIn={(e) => {
          animate(0.98);
          props.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          animate(1);
          props.onPressOut?.(e);
        }}
        style={[style, props.disabled && { opacity: 0.55 }]}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
export function Button({
  label,
  onPress,
  secondary = false,
  disabled = false,
  icon,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const { colors } = useAppTheme();
  return (
    <Touch
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: secondary ? colors.secondary : colors.primary,
        borderRadius: 12,
        minHeight: 52,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
      }}>
      {icon && (
        <Ionicons
          name={icon}
          size={18}
          color={secondary ? colors.foreground : colors.primaryForeground}
        />
      )}
      <Text
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 14,
          color: secondary ? colors.foreground : colors.primaryForeground,
        }}>
        {label}
      </Text>
    </Touch>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <Text
      style={{
        fontFamily: 'DMsans_500Medium',
        fontSize: 10,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        color: colors.mutedForeground,
      }}>
      {children}
    </Text>
  );
}
export function Empty({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={{ paddingVertical: 45, paddingHorizontal: 24, alignItems: 'center', gap: 14 }}>
      <View style={{ backgroundColor: colors.secondary, padding: 18, borderRadius: 20 }}>
        <Ionicons name="file-tray-outline" size={27} color={colors.primary} />
      </View>
      <Text
        style={{
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 21,
          color: colors.foreground,
          textAlign: 'center',
        }}>
        {title}
      </Text>
      <Text
        style={{
          fontFamily: 'DMsans_400Regular',
          fontSize: 13,
          lineHeight: 22,
          color: colors.mutedForeground,
          textAlign: 'center',
          maxWidth: 300,
        }}>
        {message}
      </Text>
      {action}
    </View>
  );
}
export function LoadingRows() {
  const { colors } = useAppTheme();
  return (
    <View accessibilityLabel="Loading" style={{ gap: 12, paddingVertical: 20 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            padding: 22,
            borderWidth: 1,
            borderColor: colors.border,
            gap: 13,
          }}>
          <View
            style={{ height: 14, width: '55%', backgroundColor: colors.secondary, borderRadius: 4 }}
          />
          <View
            style={{ height: 10, width: '80%', backgroundColor: colors.secondary, borderRadius: 4 }}
          />
        </View>
      ))}
    </View>
  );
}
export function useStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ReturnType<typeof useAppTheme>['colors']) => T
) {
  const { colors } = useAppTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
