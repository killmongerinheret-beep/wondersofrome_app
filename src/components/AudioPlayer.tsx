import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
} from 'react-native';

import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { seekAudio } from '../services/audio';
import { AudioVariant, AudioLang, Sight } from '../types';
import { theme } from '../ui/theme';

const BRAND = theme.colors.brand;

interface Props {
  sight: Sight;
}

// Only show variants that have audio uploaded — deep/kids hidden until content is ready
const ALL_VARIANTS: {
  key: AudioVariant;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  duration: string;
}[] = [
  { key: 'quick', label: 'Quick', icon: 'flash', duration: '~2 min' },
  { key: 'deep', label: 'Deep', icon: 'book', duration: '40–50 min' },
  { key: 'kids', label: 'Kids', icon: 'happy', duration: 'Myths' },
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
  const { isPlaying, positionMs, durationMs, sightId, variant, play, pause, resume, stop } =
    useAudioPlayer();
  const [activeLang, setActiveLang] = useState<AudioLang>('en');
  const [activeVariant, setActiveVariant] = useState<AudioVariant>('quick');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [barWidth, setBarWidth] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);

  const trackKey = `${activeLang}_${activeVariant}`;
  const isThisSight = sightId === sight.id;
  const isThisTrack = isThisSight && variant === trackKey;
  const progress = isThisTrack && durationMs > 0 ? positionMs / durationMs : 0;

  const getTrack = (lang: AudioLang, v: AudioVariant) => sight.audioFiles?.[lang]?.[v];
  const hasAudio = (lang: AudioLang, v: AudioVariant) => !!getTrack(lang, v)?.url;
  const langHasAny = (lang: AudioLang) => ALL_VARIANTS.some((v) => hasAudio(lang, v.key));

  // Only show variants that have at least one language with audio
  const VARIANTS = ALL_VARIANTS.filter((v) => LANGS.some((l) => hasAudio(l.code, v.key)));

  const handlePlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisTrack && isPlaying) {
      pause();
      return;
    }
    if (isThisTrack && !isPlaying) {
      resume();
      return;
    }
    if (isPlaying) stop();
    const track = getTrack(activeLang, activeVariant);
    if (!track?.url) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      const success = await play(sight.id, trackKey as any, track.url, (p) => setDownloadProgress(p));
      if (!success) setDownloading(false);
    } catch {
      setDownloading(false);
    } finally {
      setDownloading(false);
    }
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
    const { locationX } = e.nativeEvent;
    const ratio = Math.max(0, Math.min(1, locationX / barWidth));
    seekAudio(ratio * durationMs);
  };

  const currentTrack = getTrack(activeLang, activeVariant);
  const transcript = sight.transcripts?.[activeLang]?.[activeVariant];

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
              <Text style={[styles.langLabel, active && styles.langLabelActive]}>{l.label}</Text>
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
              style={[styles.tab, active && styles.tabActive, !available && styles.tabDisabled]}
              disabled={!available}
            >
              <Ionicons
                name={v.icon}
                size={14}
                color={active ? '#000' : available ? '#fff' : '#555'}
              />
              <Text
                style={[
                  styles.tabLabel,
                  active && styles.tabLabelActive,
                  !available && styles.tabLabelDisabled,
                ]}
              >
                {v.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Progress bar */}
      {isThisTrack && durationMs > 0 && (
        <View style={styles.progressWrap}>
          <Text style={styles.timeLabel}>{fmt(positionMs)}</Text>
          <View
            style={styles.progressTrack}
            onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={handleSeek}
            />
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]}>
              <View style={styles.progressKnob} />
            </View>
          </View>
          <Text style={styles.timeLabel}>{fmt(durationMs)}</Text>
        </View>
      )}

      {/* Play row */}
      <View style={styles.playRow}>
        <TouchableOpacity
          onPress={handlePlayPause}
          activeOpacity={0.85}
          style={[styles.playBtn, !currentTrack?.url && styles.playBtnDisabled]}
          disabled={!currentTrack?.url || downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Ionicons
              name={isThisTrack && isPlaying ? 'pause' : 'play'}
              size={28}
              color="#000"
            />
          )}
          <Text style={styles.playBtnText}>
            {downloading
              ? `Loading ${Math.round(downloadProgress * 100)}%`
              : isThisTrack && isPlaying
                ? 'Pause'
                : 'Play Guide'}
          </Text>
        </TouchableOpacity>

        {isThisSight && (
          <TouchableOpacity onPress={stop} style={styles.stopBtn} activeOpacity={0.8}>
            <Ionicons name="stop" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {!!transcript?.trim() && (
        <>
          <TouchableOpacity
            onPress={() => setShowTranscript(true)}
            activeOpacity={0.85}
            style={styles.transcriptBtn}
          >
            <Ionicons name="document-text-outline" size={16} color="#fff" />
            <Text style={styles.transcriptText}>Transcript</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.65)" />
          </TouchableOpacity>

          <Modal
            visible={showTranscript}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowTranscript(false)}
          >
            <View style={styles.transcriptScreen}>
              <View style={styles.transcriptHeader}>
                <TouchableOpacity
                  onPress={() => setShowTranscript(false)}
                  activeOpacity={0.85}
                  style={styles.transcriptClose}
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </TouchableOpacity>
                <View style={styles.transcriptHeaderText}>
                  <Text style={styles.transcriptTitle} numberOfLines={1}>
                    {sight.name}
                  </Text>
                  <Text style={styles.transcriptSub} numberOfLines={1}>
                    {activeLang.toUpperCase()} · {activeVariant.toUpperCase()}
                  </Text>
                </View>
                <View style={{ width: 36 }} />
              </View>
              <ScrollView
                style={styles.transcriptBody}
                contentContainerStyle={styles.transcriptBodyContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.transcriptBodyText}>{transcript}</Text>
              </ScrollView>
            </View>
          </Modal>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 14 },
  langRow: { gap: 8, paddingVertical: 2 },
  langBtn: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 4,
    minWidth: 50,
  },
  langBtnActive: { backgroundColor: '#fff' },
  langBtnDisabled: { opacity: 0.2 },
  langFlag: { fontSize: 18 },
  langLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  langLabelActive: { color: '#000' },
  tabs: { flexDirection: 'row', gap: 10 },
  tab: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    gap: 8,
  },
  tabActive: { backgroundColor: '#fff' },
  tabDisabled: { opacity: 0.3 },
  tabLabel: { fontSize: 13, fontWeight: '800', color: '#fff' },
  tabLabelActive: { color: '#000' },
  tabLabelDisabled: { color: '#888' },
  playRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  playBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  playBtnDisabled: { opacity: 0.3 },
  playBtnText: { color: '#000', fontSize: 16, fontWeight: '900' },
  stopBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'visible',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.brand,
    position: 'relative',
  },
  progressKnob: {
    position: 'absolute',
    right: -6,
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    minWidth: 36,
    textAlign: 'center',
  },
  transcriptBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  transcriptText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  transcriptScreen: { flex: 1, backgroundColor: '#121212' },
  transcriptHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  transcriptClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptHeaderText: { flex: 1, gap: 4 },
  transcriptTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  transcriptSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '800' },
  transcriptBody: { flex: 1 },
  transcriptBodyContent: { paddingHorizontal: 16, paddingVertical: 20 },
  transcriptBodyText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});
