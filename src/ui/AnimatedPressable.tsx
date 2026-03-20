import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  pressedStyle?: StyleProp<ViewStyle>;
  haptics?: 'none' | 'light' | 'medium';
};

export const AnimatedPressable: React.FC<Props> = ({
  style,
  pressedStyle,
  haptics = 'none',
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        {...rest}
        onPressIn={(e) => {
          if (haptics === 'light') Haptics.selectionAsync();
          if (haptics === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
          onPressOut?.(e);
        }}
        onPress={(e) => {
          onPress?.(e);
        }}
        style={({ pressed }) => [
          { borderRadius: 9999, overflow: 'hidden' },
          style as any,
          pressed && pressedStyle,
        ]}
      />
    </Animated.View>
  );
};
