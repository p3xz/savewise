import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, useWindowDimensions } from 'react-native';

interface BlobSpec {
  size: number;
  color: string;
  fx: number;
  fy: number;
  dur: number;
  dx: number;
  dy: number;
}

const BLOBS: BlobSpec[] = [
  { size: 300, color: 'rgba(26,127,75,0.10)', fx: 0.1, fy: 0.05, dur: 9000, dx: 50, dy: 70 },
  { size: 230, color: 'rgba(46,160,110,0.12)', fx: 0.9, fy: 0.3, dur: 11000, dx: -60, dy: 50 },
  { size: 340, color: 'rgba(26,127,75,0.07)', fx: 0.3, fy: 0.85, dur: 13000, dx: 70, dy: -60 },
  { size: 180, color: 'rgba(120,200,150,0.14)', fx: 0.75, fy: 0.65, dur: 8000, dx: -40, dy: -45 },
];

function Blob({ size, color, fx, fy, dur, dx, dy, delay }: BlobSpec & { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: dur,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: dur,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, dur, delay]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dx],
  });
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dy],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        left: fx * width - size / 2,
        top: fy * height - size / 2,
        transform: [{ translateX }, { translateY }, { scale }],
      }}
    />
  );
}

export default function AnimatedBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {BLOBS.map((b, i) => (
        <Blob key={i} {...b} delay={i * 1200} />
      ))}
    </View>
  );
}
