import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from './theme';

type Props = {
  visible: boolean;
  title?: string;
  subtitle?: string;
};

export const BrandingSplash: React.FC<Props> = ({ visible, title = 'Wonders of Rome', subtitle = 'Audio Tours' }) => {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: visible ? 1 : 0, duration: visible ? 280 : 220, useNativeDriver: true }).start();
  }, [fade, visible]);
  if (!visible) return null;
  return (
    <Animated.View style={[styles.wrap, { opacity: fade }]}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1200&q=80' }}
        style={StyleSheet.absoluteFill as any}
        resizeMode="cover"
      />
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoGlyph}>♫</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: Platform.OS === 'ios' ? 0 : StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 6,
  },
  logoGlyph: { color: '#fff', fontSize: 40, fontWeight: '900' as const },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' as const, letterSpacing: 0.4 },
  subtitle: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '800' as const },
});

