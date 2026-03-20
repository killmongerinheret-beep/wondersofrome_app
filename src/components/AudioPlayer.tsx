import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, GestureResponderEvent, LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AudioVariant, AudioLang, Sight } from '../types';

interface Props {
  sight: Sight;
}

// Only show variants that have audio uploaded — deep/kids hidden until content is ready
const ALL_VARIANTS: { key: AudioVariant; label: string; icon: keyof typeof Ionicons.glyphMap; duration: string }[] = [
  { key: 'quick', label: 'Quick', icon: 'flash', duration: '~2 min' },
  { key: 'deep',  label: 'Deep',  icon: 'book',  duration: '40–50 min' },
  { key: 'kids',  label: 'Kids',  icon: 'happy', duration: 'Myths' },
];

const LANGS: { code: AudioLang; flag: string; label: string }[] = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'it', flag: '🇮🇹', label: 'IT' },
  { code: 'es', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'de', flag: '🇩🇪', label: 'DE' },
  { code: 'zh', flag: '🇨🇳', label: 'ZH' },
  { code: 'ja', flag: '🇯🇵', label: 'JA' },
  { code: 'pt', flag: '🇧🇷', label: 'PT' },
  { code: 'pl', flag: '🇵🇱', label: 'PL' },
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'ar', flag: '🇸🇦', label: 'AR' },
  { code: 'ko', flag: '🇰🇷', label: 'KO' },
];

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};

export const AudioPlayer: React.FC<Props> = ({ sight }) => {
  const { isPlaying, positionMs, durationMs, sightId, variant, play, pause, resume, stop } = useAudioPlayer();
  const [activeLang, setActiveLang] = useState<AudioLang>('en');
  const [activeVariant, setActiveVariant] = useState<AudioVariant>('quick');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [barWidth, setBarWidth] = useState(1);

  const trackKey = `${activeLang}_${activeVariant}`;
  const isThisSight = sightId === sight.id;
  const isThisTrack = isThisSight && variant === trackKey;
  const progress = isThisTrack && durationMs > 0 ? positionMs / durationMs : 0;

  const getTrack = (lang: AudioLang, v: AudioVariant) => sight.audioFiles?.[lang]?.[v];
  const hasAudio = (lang: AudioLang, v: AudioVariant) => !!getTrack(lang, v)?.url;
  const langHasAny = (lang: AudioLang) => ALL_VARIANTS.some((v) => hasAudio(lang, v.key));

  // Only show variants that have at least one language with audio
  const VARIANTS = ALL_VARIANTS.filter((v) =>
    LANGS.some((l) => hasAudio(l.code, v.key))
  );

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisTrack && isPlaying) { pause(); return; }
    if (isThisTrack && !isPlaying) { resume(); return; }
    if (isPlaying) stop();
    const track = getTrack(activeLang, activeVariant);
    if (!track?.url) return;
    setDownloading(true);
    setDownloadProgress(0);
    await play(sight.id, trackKey as any, track.url, (p) => setDownloadProgress(p));
    setDownloading(false);
  };

  const handleLangPress = (lang: AudioLang) => {
    Haptics.selectionAsync();
    setActiveLang(lang);
    if (isThisSight && isPlaying) stop();
  };

  const handleVariantPress = (v: AudioVariant) => {
    Haptics.selectionAsync();
    setActiveVariant(v);
    if (isThisSight && isPlaying) stop();
  };

  const handleSeek = (e: GestureResponderEvent) => {
    if (!isThisTrack || durationMs === 0) return;
    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / barWidth));
    const { seekAudio } = require('../services/audio');
    seekAudio(ratio * durationMs);
  };

  const currentTrack = getTrack(activeLang, activeVariant);

  return (
    <View style={styles.container}>
      {/* Language picker */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.langRow}
      >
        {LANGS.map((l) => {
          const active = activeLang === l.code;
          const available = langHasAny(l.code);
          return (
            <TouchableOpacity
              key={l.code}
              onPress={() => handleLangPress(l.code)}
              activeOpacity={0.8}
              disabled={!available}
              style={[
                styles.langBtn,
                active && styles.langBtnActive,
                !available && styles.langBtnDisabled,
              ]}
            >
              <Text style={styles.langFlag}>{l.flag}</Text>
              <Text style={[styles.langLabel, active && styles.langLabelActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Variant tabs */}
      <View style={styles.tabs}>
        {VARIANTS.map((v) => {
          const active = activeVariant === v.key;
          const available = hasAudio(activeLang, v.key);
          return (
            <TouchableOpacity
              key={v.key}
              onPress={() => handleVariantPress(v.key)}
              activeOpacity={0.8}
              style={[
                styles.tab,
                active && styles.tabActive,
                !available && styles.tabDisabled,
              ]}
              disabled={!available}
            >
              <Ionicons
                name={v.icon}
                size={14}
                color={active ? '#fff' : available ? '#007AFF' : '#555'}
              />
              <Text style={[
                styles.tabLabel,
                active && styles.tabLabelActive,
                !available && styles.tabLabelDisabled,
              ]}>
                {v.label}
              </Text>
              <Text style={[
                styles.tabDuration,
                active && styles.tabLabelActive,
                !available && styles.tabLabelDisabled,
              ]}>
                {v.duration}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Play row */}
      <View style={styles.playRow}>
        <TouchableOpacity
          onPress={handlePlayPause}
          activeOpacity={0.85}
          style={[styles.playBtn, !currentTrack?.url && styles.playBtnDisabled]}
          disabled={!currentTrack?.url || downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#0B0B0B" size="small" />
          ) : (
            <Ionicons
              name={isThisTrack && isPlaying ? 'pause' : 'play'}
              size={22}
              color="#0B0B0B"
            />
          )}
          <Text style={styles.playBtnText}>
            {downloading
              ? `Downloading ${Math.round(downloadProgress * 100)}%`
              : isThisTrack && isPlaying
              ? 'Pause'
              : currentTrack?.url
              ? 'Play Audio'
              : 'No audio yet'}
          </Text>
        </TouchableOpacity>

        {isThisSight && (
          <TouchableOpacity onPress={stop} style={styles.stopBtn} activeOpacity={0.8}>
            <Ionicons name="stop" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      {isThisTrack && durationMs > 0 && (
        <View style={styles.progressWrap}>
          <Text style={styles.timeLabel}>{fmt(positionMs)}</Text>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.progressTrack}
            onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
            onPress={handleSeek}
          >
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </TouchableOpacity>
          <Text style={styles.timeLabel}>{fmt(durationMs)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  langRow: { gap: 6, paddingVertical: 2 },
  langBtn: {
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 2,
    minWidth: 44,
  },
  langBtnActive: { backgroundColor: '#007AFF' },
  langBtnDisabled: { opacity: 0.3 },
  langFlag: { fontSize: 16 },
  langLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  langLabelActive: { color: '#fff' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    gap: 2,
  },
  tabActive: { backgroundColor: '#007AFF' },
  tabDisabled: { opacity: 0.35 },
  tabLabel: { fontSize: 11, fontWeight: '800', color: '#007AFF' },
  tabLabelActive: { color: '#fff' },
  tabLabelDisabled: { color: '#888' },
  tabDuration: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },
  playRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  playBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  playBtnDisabled: { opacity: 0.4 },
  playBtnText: { color: '#0B0B0B', fontSize: 15, fontWeight: '900' },
  stopBtn: {
    width: 44,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#007AFF' },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    minWidth: 32,
    textAlign: 'center',
  },
});
