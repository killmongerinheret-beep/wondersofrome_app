import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

export const Skeleton: React.FC<{ style?: StyleProp<ViewStyle>; backgroundColor?: string }> = ({ style, backgroundColor }) => {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.95, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: backgroundColor ?? 'rgba(255,255,255,0.12)',
          borderRadius: 14,
          opacity,
        },
        style as any,
      ]}
    />
  );
};
