import React, { useMemo, useState } from 'react';
import { Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSights } from '../hooks/useSights';
import { theme } from '../ui/theme';

const BRAND = theme.colors.brand;

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const NowPlayingSheet: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { sights } = useSights();
  const { isPlaying, positionMs, durationMs, sightId, queueTitle, pause, resume, next, prev, stop, seek } = useAudioPlayer();
  const [barWidth, setBarWidth] = useState(1);

  const sight = useMemo(() => sights.find((s) => s.id === sightId) ?? null, [sights, sightId]);
  const progress = durationMs > 0 ? Math.max(0, Math.min(1, positionMs / durationMs)) : 0;
  const title = sight?.name ?? (sightId ?? 'Now playing');
  const subtitle = queueTitle ? queueTitle : (sight?.category ? sight.category.toUpperCase() : 'Audio guide');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
      <View style={[styles.screen, { paddingTop: Math.max(10, insets.top + 8), paddingBottom: Math.max(16, insets.bottom + 16) }]}>
        <Image
          source={{ uri: sight?.thumbnail ?? '' }}
          style={StyleSheet.absoluteFill as any}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 14 : 10}
        />
        <View style={styles.backdrop} />
        <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />

        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Close now playing">
            <Ionicons name="chevron-down" size={18} color="#111" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerKicker} numberOfLines={1}>{subtitle}</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          </View>
          <TouchableOpacity onPress={stop} activeOpacity={0.85} style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Stop audio">
            <Ionicons name="close" size={18} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.artWrap}>
          {sight?.thumbnail ? (
            <Image source={{ uri: sight.thumbnail }} style={styles.art} resizeMode="cover" />
          ) : (
            <View style={[styles.art, styles.artFallback]}>
              <Ionicons name="headset" size={54} color="rgba(60,60,67,0.55)" />
            </View>
          )}
        </View>

        <View style={styles.progressWrap}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.progressTrack}
            onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
            onPress={(e) => {
              if (!durationMs) return;
              const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
              seek(ratio * durationMs);
            }}
          >
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.time}>{fmt(positionMs)}</Text>
            <Text style={styles.time}>{fmt(durationMs)}</Text>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={prev} activeOpacity={0.85} style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Previous stop">
            <Ionicons name="play-skip-back" size={24} color="#111" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => (isPlaying ? pause() : resume())}
            activeOpacity={0.9}
            style={styles.playBtn}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause audio' : 'Play audio'}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={next} activeOpacity={0.85} style={styles.ctrlBtn} accessibilityRole="button" accessibilityLabel="Next stop">
            <Ionicons name="play-skip-forward" size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color="#111" />
            <Text style={styles.badgeText}>Guided audio</Text>
          </View>
          <View style={styles.badge}>
            <View style={[styles.dot, { backgroundColor: BRAND }]} />
            <Text style={styles.badgeText}>Offline-ready</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F3F7', paddingHorizontal: 18, gap: 18 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.55)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center', gap: 2 },
  headerKicker: { fontSize: 11, fontWeight: '800', color: 'rgba(60,60,67,0.7)', letterSpacing: 0.8, textTransform: 'uppercase' },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#111' },
  artWrap: { alignItems: 'center' },
  art: { width: '100%', aspectRatio: 1, borderRadius: 26, backgroundColor: 'rgba(0,0,0,0.06)' },
  artFallback: { alignItems: 'center', justifyContent: 'center' },
  progressWrap: { gap: 10 },
  progressTrack: { height: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.12)', overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 999, backgroundColor: BRAND },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  time: { fontSize: 12, fontWeight: '800', color: 'rgba(60,60,67,0.7)' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 2 },
  ctrlBtn: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  footerRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.06)' },
  badgeText: { fontSize: 12, fontWeight: '800', color: 'rgba(60,60,67,0.85)' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
