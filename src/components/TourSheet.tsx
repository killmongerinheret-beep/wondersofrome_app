import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AudioTour } from '../services/content';
import { downloadAudioPack, getLocalAudioUri } from '../services/filesystem';
import { theme } from '../theme';
import { AudioLang, AudioVariant } from '../types';

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
const toRadians = (v: number) => (v * Math.PI) / 180;
const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat));
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
};

export const TourSheet: React.FC<Props> = ({ visible, tour, userLocation, onClose, onStartAt }) => {
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
      .map((s: any) => ({ id: s.id as string, name: s.name as string, url: s.audioFiles?.[lang]?.[variant]?.url as string | undefined }))
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
          Alert.alert('Some audio failed', `Could not download: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? '…' : ''}`);
        } else {
          Alert.alert('Offline ready', 'Tour audio has been downloaded to this device.');
        }
      }
      cancelRef.current = false;
    }
  };

  const nearestIndex = useMemo(() => {
    if (!userLocation) return null;
    let bestIdx: number | null = null;
    let bestDist = Infinity;
    for (let i = 0; i < stops.length; i += 1) {
      const s: any = stops[i];
      const lat = s?.lat;
      const lng = s?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;
      const d = distanceMeters(userLocation, { lat, lng });
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }, [stops, userLocation]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <View style={styles.screen}>
        <View style={[styles.hero, { paddingTop: Math.max(12, insets.top + 10) }]}>
          {tour?.thumbnail?.trim() ? (
            <Image source={{ uri: tour.thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : null}
          <View style={styles.heroOverlay} />
          <View style={styles.heroHeader}>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.85} style={styles.closeBtn}>
              <Ionicons name="chevron-back" size={18} color="#fff" />
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
          contentContainerStyle={[styles.contentInner, { paddingBottom: Math.max(18, insets.bottom + 18) }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Language</Text>
            <View style={styles.pickerRow}>
              {availableLangs.map((x) => (
                <TouchableOpacity
                  key={x.lang}
                  activeOpacity={0.9}
                  style={[styles.pill, x.lang === lang && styles.pillActive, !x.ok && styles.pillDisabled]}
                  onPress={() => {
                    if (!x.ok) return;
                    setLang(x.lang);
                  }}
                  disabled={!x.ok}
                >
                  <Text style={[styles.pillText, x.lang === lang && styles.pillTextActive]}>{x.lang.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Version</Text>
            <View style={styles.pickerRow}>
              {availableVariants.map((x) => (
                <TouchableOpacity
                  key={x.variant}
                  activeOpacity={0.9}
                  style={[styles.pill, x.variant === variant && styles.pillActive, !x.ok && styles.pillDisabled]}
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
          </View>

          <View style={styles.actions}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                onPress={() => onStartAt(0, lang, variant)}
                activeOpacity={0.9}
                style={[styles.primaryBtn, (stops.length < 1 || !hasAnyAudio) && styles.btnDisabled]}
                disabled={stops.length < 1 || !hasAnyAudio}
              >
                <Ionicons name="walk-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Start tour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (nearestIndex == null) return;
                  onStartAt(nearestIndex, lang, variant);
                }}
                activeOpacity={0.9}
                style={[styles.primaryBtn, styles.primaryBtnAlt, (nearestIndex == null || !hasAnyAudio) && styles.btnDisabled]}
                disabled={nearestIndex == null || !hasAnyAudio}
              >
                <Ionicons name="navigate-outline" size={18} color="#fff" />
                <Text style={styles.primaryText}>Start nearest</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleDownloadTour}
              activeOpacity={0.9}
              style={[styles.secondaryBtn, (downloading || !hasAnyAudio) && styles.btnDisabled]}
              disabled={downloading || !hasAnyAudio}
            >
              {downloading ? (
                <ActivityIndicator color={BRAND} size="small" />
              ) : (
                <Ionicons name="download-outline" size={18} color={BRAND} />
              )}
              <Text style={styles.secondaryText}>
                {downloading ? 'Downloading…' : `Download ${lang.toUpperCase()} ${variant === 'quick' ? 'Quick' : variant === 'deep' ? 'Deep' : 'Kids'}`}
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

          <View style={styles.sectionCard}>
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
                        {s.thumbnail?.trim() ? (
                          <Image source={{ uri: s.thumbnail }} style={styles.stopThumb} resizeMode="cover" />
                        ) : (
                          <View style={styles.stopThumbFallback}>
                            <Ionicons name="image-outline" size={16} color="rgba(60,60,67,0.55)" />
                          </View>
                        )}
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
                      <Ionicons name={ok ? 'play' : 'close'} size={14} color={ok ? '#fff' : 'rgba(0,0,0,0.25)'} />
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
  screen: { flex: 1, backgroundColor: '#F2F2F7' },
  hero: { height: 160, backgroundColor: '#111' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  heroHeader: { paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 2 },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '700' },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: 14, paddingTop: 12, gap: 12 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(60,60,67,0.65)', marginBottom: 10, letterSpacing: 0.6 },
  pickerRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  pill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(118,118,128,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: 'rgba(0,0,0,0.08)' },
  pillDisabled: { opacity: 0.35 },
  pillText: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  pillTextActive: { color: theme.colors.text },
  actions: { gap: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryBtnAlt: { backgroundColor: '#111' },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  secondaryBtn: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryText: { color: theme.colors.text, fontSize: 14, fontWeight: '900' },
  btnDisabled: { opacity: 0.55 },
  downloadRow: { backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)', gap: 6 },
  downloadLabel: { color: theme.colors.text, fontSize: 12, fontWeight: '800' },
  downloadPct: { position: 'absolute', right: 12, top: 12, color: 'rgba(60,60,67,0.55)', fontSize: 12, fontWeight: '800' },
  track: { height: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#34C759' },
  list: { gap: 10 },
  stopRow: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  stopRowDisabled: { opacity: 0.5 },
  stopLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  stopIndex: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(118,118,128,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIndexText: { color: theme.colors.text, fontSize: 12, fontWeight: '900' },
  stopThumbWrap: { width: 34, height: 34, borderRadius: 12, overflow: 'hidden' },
  stopThumb: { width: '100%', height: '100%' },
  stopThumbFallback: { flex: 1, backgroundColor: 'rgba(118,118,128,0.14)', alignItems: 'center', justifyContent: 'center' },
  stopText: { flex: 1, gap: 2 },
  stopTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  stopSub: { color: 'rgba(60,60,67,0.6)', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  stopRight: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
