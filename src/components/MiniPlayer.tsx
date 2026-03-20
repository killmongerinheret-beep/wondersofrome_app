import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export const MiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { isPlaying, positionMs, durationMs, sightId, pause, resume, stop } = useAudioPlayer();
  const visible = !!sightId;

  const bottomTabHeight = Platform.OS === 'ios' ? 88 : 60;
  const translateY = useRef(new Animated.Value(visible ? 0 : 120)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : 120,
      useNativeDriver: true,
      speed: 22,
      bounciness: 7,
    }).start();
  }, [translateY, visible]);

  const progress = durationMs > 0 ? Math.max(0, Math.min(1, positionMs / durationMs)) : 0;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrap,
        {
          transform: [{ translateY }],
          bottom: Math.max(10, insets.bottom + 8 + bottomTabHeight),
        },
      ]}
    >
      <BlurView intensity={90} tint="dark" style={styles.card}>
        <View style={styles.row}>
          <View style={styles.left}>
            <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.85)" />
            <Text style={styles.title} numberOfLines={1}>
              {sightId ?? 'Audio'}
            </Text>
          </View>

          <View style={styles.controls}>
            <AnimatedPressable
              onPress={() => (isPlaying ? pause() : resume())}
              haptics="light"
              style={styles.ctrlBtn}
              pressedStyle={styles.ctrlBtnPressed}
            >
              <View style={styles.ctrlInner}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#0B0B0B" />
              </View>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => stop()}
              haptics="light"
              style={styles.ctrlBtn}
              pressedStyle={styles.ctrlBtnPressed}
            >
              <View style={styles.ctrlInner}>
                <Ionicons name="close" size={18} color="#0B0B0B" />
              </View>
            </AnimatedPressable>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.time}>{fmt(positionMs)}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.time}>{fmt(durationMs)}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 50,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  ctrlBtn: {
    borderRadius: 14,
  },
  ctrlBtnPressed: {
    opacity: 0.92,
  },
  ctrlInner: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  time: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    width: 42,
    textAlign: 'center',
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
});
