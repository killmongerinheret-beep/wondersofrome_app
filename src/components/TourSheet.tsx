import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AudioTour } from '../services/content';
import { downloadAudioPack, getLocalAudioUri } from '../services/filesystem';
import { getSightImage } from '../services/images';
import { AudioLang, AudioVariant } from '../types';
import { theme } from '../ui/theme';

type Props = {
  visible: boolean;
  tour: AudioTour | null;
  userLocation?: { lat: number; lng: number } | null;
  onClose: () => void;
  onStartAt: (index: number, lang: AudioLang, variant: AudioVariant) => void;
};

const BRAND = theme.colors.brand;
const LANGS: AudioLang[] = ['en', 'it', 'es', 'fr', 'de', 'pt', 'pl', 'ru', 'ar', 'zh', 'ja', 'ko'];
const VARIANTS: AudioVariant[] = ['quick', 'deep', 'kids'];

export const TourSheet: React.FC<Props> = ({ visible, tour, onClose, onStartAt }) => {
  const insets = useSafeAreaInsets();
  const stops = useMemo(() => (tour?.stops ?? []).filter((s) => !!s?.id), [tour]);

  const [lang, setLang] = useState<AudioLang>('en');
  const [variant, setVariant] = useState<AudioVariant>('quick');
  const [downloading, setDownloading] = useState(false);
  const [downloadPct, setDownloadPct] = useState(0);
  const [downloadLabel, setDownloadLabel] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const hasAnyAudio = useMemo(() => {
    return stops.some((s: any) => {
      const url = s.audioFiles?.[lang]?.[variant]?.url;
      return !!url && !String(url).includes('example.com');
    });
  }, [lang, stops, variant]);

  const availableLangs = useMemo(() => {
    return LANGS.map((l) => {
      const ok = stops.some((s: any) => {
        const url = s.audioFiles?.[l]?.[variant]?.url;
        return !!url && !String(url).includes('example.com');
      });
      return { lang: l, ok };
    });
  }, [stops, variant]);

  const availableVariants = useMemo(() => {
    return VARIANTS.map((v) => {
      const ok = stops.some((s: any) => {
        const url = s.audioFiles?.[lang]?.[v]?.url;
        return !!url && !String(url).includes('example.com');
      });
      return { variant: v, ok };
    });
  }, [lang, stops]);

  const handleClose = () => {
    cancelRef.current = true;
    setDownloading(false);
    setDownloadPct(0);
    setDownloadLabel(null);
    onClose();
  };

  const handleDownloadTour = async () => {
    if (!tour) return;
    if (downloading) return;
    cancelRef.current = false;
    setDownloading(true);
    setDownloadPct(0);

    const variantKey = `${lang}_${variant}`;
    const playable = stops
      .map((s: any) => ({
        id: s.id as string,
        name: s.name as string,
        url: s.audioFiles?.[lang]?.[variant]?.url as string | undefined,
      }))
      .filter((s) => !!s.url && !String(s.url).includes('example.com'));

    if (playable.length === 0) {
      setDownloading(false);
      Alert.alert('No audio available', 'This tour has no downloadable audio yet.');
      return;
    }

    const missing: string[] = [];
    let done = 0;

    try {
      for (const s of playable) {
        if (cancelRef.current) break;
        setDownloadLabel(s.name);
        const local = await getLocalAudioUri(s.id, variantKey);
        if (!local) {
          try {
            await downloadAudioPack(s.id, variantKey, s.url!, undefined);
          } catch {
            missing.push(s.name);
          }
        }
        done += 1;
        setDownloadPct(done / playable.length);
      }
    } finally {
      setDownloading(false);
      setDownloadLabel(null);
      if (!cancelRef.current) {
        if (missing.length > 0) {
          Alert.alert(
            'Some audio failed',
            `Could not download: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}`
          );
        } else {
          Alert.alert('Offline ready', 'Tour audio has been downloaded to this device.');
        }
      }
      cancelRef.current = false;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.screen}>
        <View style={[styles.hero, { paddingTop: Math.max(12, insets.top + 10) }]}>
          <Image
            source={{ uri: getSightImage(tour?.id ?? 'rome', tour?.thumbnail) }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.85} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {tour?.title ?? 'Walking tour'}
              </Text>
              <Text style={styles.heroSub} numberOfLines={1}>
                {(tour?.duration ? `${tour.duration} · ` : '') + `${stops.length} stops`}
              </Text>
            </View>
            <View style={{ width: 36 }} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[
            styles.contentInner,
            { paddingBottom: Math.max(18, insets.bottom + 18) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Language</Text>
            <View style={styles.pickerRow}>
              {availableLangs.map((x) => (
                <TouchableOpacity
                  key={x.lang}
                  activeOpacity={0.9}
                  style={[
                    styles.pill,
                    x.lang === lang && styles.pillActive,
                    !x.ok && styles.pillDisabled,
                  ]}
                  onPress={() => {
                    if (!x.ok) return;
                    setLang(x.lang);
                  }}
                  disabled={!x.ok}
                >
                  <Text style={[styles.pillText, x.lang === lang && styles.pillTextActive]}>
                    {x.lang.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Version</Text>
            <View style={styles.pickerRow}>
              {availableVariants.map((x) => (
                <TouchableOpacity
                  key={x.variant}
                  activeOpacity={0.9}
                  style={[
                    styles.pill,
                    x.variant === variant && styles.pillActive,
                    !x.ok && styles.pillDisabled,
                  ]}
                  onPress={() => {
                    if (!x.ok) return;
                    setVariant(x.variant);
                  }}
                  disabled={!x.ok}
                >
                  <Text style={[styles.pillText, x.variant === variant && styles.pillTextActive]}>
                    {x.variant === 'quick' ? 'Quick' : x.variant === 'deep' ? 'Deep' : 'Kids'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </BlurView>

          <View style={styles.actions}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => onStartAt(0, lang, variant)}
                activeOpacity={0.9}
                style={[
                  styles.primaryBtn,
                  (stops.length < 1 || !hasAnyAudio) && styles.btnDisabled,
                ]}
                disabled={stops.length < 1 || !hasAnyAudio}
              >
                <Ionicons name="play" size={20} color="#000" />
                <Text style={styles.primaryText}>Start tour</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleDownloadTour}
              activeOpacity={0.9}
              style={[styles.secondaryBtn, (downloading || !hasAnyAudio) && styles.btnDisabled]}
              disabled={downloading || !hasAnyAudio}
            >
              {downloading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="download-outline" size={18} color="#fff" />
              )}
              <Text style={styles.secondaryText}>
                {downloading ? 'Downloading…' : `Save for offline`}
              </Text>
            </TouchableOpacity>
          </View>

          {downloading && (
            <View style={styles.downloadRow}>
              <Text style={styles.downloadLabel} numberOfLines={1}>
                {downloadLabel ?? 'Downloading'}
              </Text>
              <Text style={styles.downloadPct}>{Math.round(downloadPct * 100)}%</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.round(downloadPct * 100)}%` }]} />
              </View>
            </View>
          )}

          <View style={styles.sectionCardNoBlur}>
            <Text style={styles.sectionTitle}>Stops</Text>
            <View style={styles.list}>
              {stops.map((s: any, idx) => {
                const url = s.audioFiles?.[lang]?.[variant]?.url;
                const ok = !!url && !String(url).includes('example.com');
                return (
                  <TouchableOpacity
                    key={`${tour?.id ?? 'tour'}-${s.id}`}
                    activeOpacity={0.9}
                    style={[styles.stopRow, !ok && styles.stopRowDisabled]}
                    onPress={() => onStartAt(idx, lang, variant)}
                    disabled={!ok}
                  >
                    <View style={styles.stopLeft}>
                      <View style={styles.stopIndex}>
                        <Text style={styles.stopIndexText}>{idx + 1}</Text>
                      </View>
                      <View style={styles.stopThumbWrap}>
                        <Image
                          source={{ uri: getSightImage(s.id, s.thumbnail) }}
                          style={styles.stopThumb}
                          resizeMode="cover"
                        />
                      </View>
                      <View style={styles.stopText}>
                        <Text style={styles.stopTitle} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.stopSub} numberOfLines={1}>
                          {String(s.category ?? 'sight').toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stopRight}>
                      <Ionicons
                        name={ok ? 'play' : 'lock-closed'}
                        size={14}
                        color={ok ? '#000' : 'rgba(255,255,255,0.2)'}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  hero: { height: 240, backgroundColor: '#111' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  heroHeader: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '800' },
  content: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  contentInner: { paddingHorizontal: 16, paddingTop: 24, gap: 16 },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  sectionCardNoBlur: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pickerRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: '#fff' },
  pillDisabled: { opacity: 0.2 },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  pillTextActive: { color: '#000' },
  actions: { gap: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  primaryBtn: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  primaryText: { color: '#000', fontSize: 16, fontWeight: '900' },
  secondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  secondaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.4 },
  downloadRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  downloadLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  downloadPct: {
    position: 'absolute',
    right: 16,
    top: 16,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '800',
  },
  track: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: theme.colors.brand },
  list: { gap: 12 },
  stopRow: {
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stopRowDisabled: { opacity: 0.3 },
  stopLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  stopIndex: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIndexText: { color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: '800' },
  stopThumbWrap: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden' },
  stopThumb: { width: '100%', height: '100%' },
  stopText: { flex: 1, gap: 4 },
  stopTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  stopSub: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  stopRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
