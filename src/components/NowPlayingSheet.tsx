import React, { useMemo, useState } from 'react';
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View, Dimensions, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSights } from '../hooks/useSights';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

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
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        
        {/* Background Artwork */}
        <Image 
          source={{ uri: sight?.thumbnail }} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover"
          blurRadius={40}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', theme.colors.background]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
              <Ionicons name="chevron-down" size={24} color={theme.colors.cream} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.playingFrom}>PLAYING FROM SIGHT</Text>
              <Text style={styles.queueTitle} numberOfLines={1}>{queueTitle || 'Audio Guide'}</Text>
            </View>
            <TouchableOpacity onPress={stop} style={styles.headerBtn}>
              <Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.cream} />
            </TouchableOpacity>
          </View>

          {/* Album Art */}
          <View style={styles.artContainer}>
            <Image source={{ uri: sight?.thumbnail }} style={styles.art} contentFit="cover" transition={1000} />
          </View>

          {/* Info */}
          <View style={styles.infoRow}>
            <View style={styles.titleArea}>
              <Text style={styles.sightTitle}>{sight?.name || 'Now Playing'}</Text>
              <Text style={styles.sightCategory}>{sight?.category.toUpperCase() || 'HISTORY'}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="add-circle-outline" size={28} color={theme.colors.brandLight} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <TouchableOpacity 
              activeOpacity={1}
              style={styles.progressBar}
              onLayout={e => setBarWidth(e.nativeEvent.layout.width)}
              onPress={e => {
                if (durationMs > 0) {
                  const ratio = e.nativeEvent.locationX / barWidth;
                  seek(ratio * durationMs);
                }
              }}
            >
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              <View style={[styles.progressThumb, { left: `${progress * 100}%` }]} />
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{fmt(positionMs)}</Text>
              <Text style={styles.timeText}>{fmt(durationMs)}</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity onPress={() => {}} style={styles.shuffleBtn}>
              <Ionicons name="shuffle" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={prev} style={styles.skipBtn}>
              <Ionicons name="play-back" size={36} color={theme.colors.cream} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => isPlaying ? pause() : resume()} 
              style={styles.playBtn}
            >
              <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={84} color={theme.colors.cream} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={next} style={styles.skipBtn}>
              <Ionicons name="play-forward" size={36} color={theme.colors.cream} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => {}} style={styles.repeatBtn}>
              <Ionicons name="repeat" size={24} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.footerIcon}>
              <Ionicons name="bluetooth" size={20} color={theme.colors.brandLight} />
              <Text style={styles.footerText}>AirPlay</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.footerIcon}>
              <Ionicons name="share-outline" size={20} color={theme.colors.cream} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerBtn: { padding: 8 },
  headerText: { alignItems: 'center' },
  playingFrom: { color: theme.colors.textMuted, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  queueTitle: { color: theme.colors.cream, fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  artContainer: { width: '100%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 20 },
  art: { width: '100%', height: '100%' },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32 },
  titleArea: { flex: 1, marginRight: 16 },
  sightTitle: { color: theme.colors.cream, fontSize: 24, fontWeight: 'bold' },
  sightCategory: { color: theme.colors.brandLight, fontSize: 14, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
  progressSection: { marginTop: 32 },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, justifyContent: 'center' },
  progressFill: { height: '100%', backgroundColor: theme.colors.cream, borderRadius: 2 },
  progressThumb: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.cream, marginLeft: -6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  timeText: { color: theme.colors.textMuted, fontSize: 11, fontWeight: 'bold' },
  controlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20 },
  skipBtn: { padding: 8 },
  playBtn: { padding: 0 },
  shuffleBtn: { padding: 8 },
  repeatBtn: { padding: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerIcon: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { color: theme.colors.brandLight, fontSize: 12, fontWeight: 'bold' }
});
