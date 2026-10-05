import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';

/**
 * Fades a view in while sliding it up slightly on mount.
 * Returns a style object to spread onto an Animated.View.
 */
export function useEntrance(delayMs = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay: delayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay: delayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [opacity, translateY, delayMs]);

  return { opacity, transform: [{ translateY }] };
}

interface AnimatedBarProps {
  /** Progress between 0 and 1. */
  progress: number;
  color: string;
  height: number;
}

/**
 * A progress bar whose fill width animates smoothly toward `progress`.
 */
export function AnimatedBar({ progress, color, height }: AnimatedBarProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const width = useRef(new Animated.Value(clamped)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: clamped,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, width]);

  return (
    <Animated.View
      style={{
        height,
        backgroundColor: color,
        borderRadius: height / 2,
        width: width.interpolate({
          inputRange: [0, 1],
          outputRange: ['0%', '100%'],
        }),
      }}
    />
  );
}

interface AnimatedAmountProps {
  value: number;
  format: (value: number) => string;
  style?: StyleProp<TextStyle>;
}

/**
 * A number that tweens smoothly to its new value instead of jumping.
 */
export function AnimatedAmount({ value, format, style }: AnimatedAmountProps) {
  const anim = useRef(new Animated.Value(value)).current;
  const prev = useRef(value);
  const [display, setDisplay] = useState(value);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      prev.current = value;
      anim.setValue(value);
      setDisplay(value);
      return;
    }
    const from = prev.current;
    prev.current = value;
    if (from === value) return;
    anim.setValue(from);
    const listenerId = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, {
      toValue: value,
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listenerId);
  }, [value, anim]);

  return <Text style={style}>{format(display)}</Text>;
}

interface PressFeedbackProps {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  hitSlop?: number;
}

/**
 * A button wrapper that scales down slightly while pressed,
 * giving tactile feedback on key actions.
 */
export function PressFeedback({
  children,
  onPress,
  style,
  disabled,
  hitSlop,
}: PressFeedbackProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        disabled={disabled}
        hitSlop={hitSlop}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}
