import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { UpNextSheet } from './UpNextSheet';

export const MINI_PLAYER_HEIGHT = 86;

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export const MiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    isPlaying,
    positionMs,
    durationMs,
    sightId,
    queue,
    queueIndex,
    queueTitle,
    pause,
    resume,
    next,
    prev,
    jumpToIndex,
    stop,
  } = useAudioPlayer();
  const [upNextOpen, setUpNextOpen] = useState(false);
  const visible = !!sightId;

  if (!visible) return null;

  const bottomTabHeight = Platform.OS === 'ios' ? 88 : 60;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 7,
    }).start();
  }, [translateY]);

  const progress = durationMs > 0 ? Math.max(0, Math.min(1, positionMs / durationMs)) : 0;
  const qLen = queue?.length ?? 0;
  const canPrev = qLen > 0 && queueIndex > 0;
  const canNext = qLen > 0 && queueIndex < qLen - 1;
  const subtitle = queueTitle && qLen > 0 ? `${queueTitle} · ${queueIndex + 1}/${qLen}` : null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          transform: [{ translateY }],
          bottom: bottomTabHeight + Math.max(8, insets.bottom) + 8,
        },
      ]}
    >
      <View pointerEvents={visible ? 'auto' : 'none'}>
        <BlurView intensity={90} tint="dark" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.left}>
              <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.85)" />
              <View style={styles.titleCol}>
                <Text style={styles.title} numberOfLines={1}>
                  {sightId ?? 'Audio'}
                </Text>
                {!!subtitle && (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.controls}>
              {qLen > 0 && (
                <AnimatedPressable
                  onPress={() => setUpNextOpen(true)}
                  haptics="light"
                  accessibilityRole="button"
                  accessibilityLabel="Open up next list"
                  style={styles.ctrlBtn}
                  pressedStyle={styles.ctrlBtnPressed}
                >
                  <View style={styles.ctrlInner}>
                    <Ionicons name="list" size={18} color="#0B0B0B" />
                  </View>
                </AnimatedPressable>
              )}

              <AnimatedPressable
                onPress={() => prev()}
                haptics="light"
                disabled={!canPrev}
                accessibilityRole="button"
                accessibilityLabel="Previous stop"
                style={[styles.ctrlBtn, !canPrev && styles.ctrlBtnDisabled]}
                pressedStyle={styles.ctrlBtnPressed}
              >
                <View style={styles.ctrlInner}>
                  <Ionicons name="play-skip-back" size={18} color="#0B0B0B" />
                </View>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => (isPlaying ? pause() : resume())}
                haptics="light"
                accessibilityRole="button"
                accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
                style={styles.ctrlBtn}
                pressedStyle={styles.ctrlBtnPressed}
              >
                <View style={styles.ctrlInner}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#0B0B0B" />
                </View>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => next()}
                haptics="light"
                disabled={!canNext}
                accessibilityRole="button"
                accessibilityLabel="Next stop"
                style={[styles.ctrlBtn, !canNext && styles.ctrlBtnDisabled]}
                pressedStyle={styles.ctrlBtnPressed}
              >
                <View style={styles.ctrlInner}>
                  <Ionicons name="play-skip-forward" size={18} color="#0B0B0B" />
                </View>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => stop()}
                haptics="light"
                accessibilityRole="button"
                accessibilityLabel="Stop audio"
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
      </View>

      {!!queue && queue.length > 0 && (
        <UpNextSheet
          visible={upNextOpen}
          title={queueTitle}
          items={queue}
          activeIndex={queueIndex}
          onClose={() => setUpNextOpen(false)}
          onSelectIndex={(idx) => {
            jumpToIndex(idx);
            setUpNextOpen(false);
          }}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
    elevation: 999,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    minHeight: MINI_PLAYER_HEIGHT,
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
  titleCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '800',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  ctrlBtn: {
    borderRadius: 14,
  },
  ctrlBtnDisabled: {
    opacity: 0.5,
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
