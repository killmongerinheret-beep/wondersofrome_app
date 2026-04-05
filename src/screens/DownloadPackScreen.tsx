import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSights } from '../hooks/useSights';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { getAudioStorageUsage, clearAudioStorage } from '../services/filesystem';
import { checkMapPackStatus, deleteMapPack, downloadRomeMap } from '../services/mapboxOffline';
import { Sight, AudioLang, AudioVariant } from '../types';
import { theme } from '../ui/theme';

const VARIANTS: AudioVariant[] = ['quick', 'deep', 'kids'];
const LANG: AudioLang = 'en';
const BRAND = theme.colors.brand;

const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const totalAudioSize = (sight: Sight) =>
  VARIANTS.reduce((sum, v) => sum + (sight.audioFiles?.[LANG]?.[v]?.size ?? 0), 0);

export const DownloadPackScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { sights } = useSights();
  const { downloadedSights, downloadProgress, downloadSight, checkDownloads } = useOfflineContent();
  const [storage, setStorage] = useState({ usedBytes: 0, availableBytes: 0 });
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [mapDownloading, setMapDownloading] = useState(false);
  const [mapPercent, setMapPercent] = useState(0);
  const [hasOfflineMap, setHasOfflineMap] = useState(false);

  useEffect(() => {
    loadStorage();
  }, [downloadedSights]);

  useEffect(() => {
    (async () => {
      try {
        const pack = await checkMapPackStatus();
        setHasOfflineMap(!!pack);
      } catch {
        setHasOfflineMap(false);
      }
    })();
  }, []);

  const loadStorage = async () => {
    const s = await getAudioStorageUsage();
    setStorage(s);
  };

  const downloadedCount = Object.values(downloadedSights).filter(Boolean).length;
  const totalCount = sights.length;

  const handleDownloadAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDownloadingAll(true);
    for (const sight of sights) {
      if (!downloadedSights[sight.id]) {
        await downloadSight(sight.id);
      }
    }
    setDownloadingAll(false);
    await checkDownloads();
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Downloads',
      'This will delete all downloaded audio files. You can re-download them anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAudioStorage();
            await checkDownloads();
            await loadStorage();
          },
        },
      ],
    );
  };

  const handleDownloadMap = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMapDownloading(true);
    setMapPercent(0);
    try {
      await downloadRomeMap(
        (p) => setMapPercent(p),
        (e) => {
          throw e;
        }
      );
      setHasOfflineMap(true);
    } catch (e: any) {
      Alert.alert('Offline map failed', e?.message ?? 'Could not download map tiles.');
      setHasOfflineMap(false);
    } finally {
      setMapDownloading(false);
    }
  };

  const handleDeleteMap = async () => {
    Alert.alert('Delete Offline Map', 'This removes the saved Rome map tiles from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMapPack();
            setHasOfflineMap(false);
            setMapPercent(0);
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message ?? 'Could not delete offline map.');
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Close offline pack"
        >
          <Ionicons name="close" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Offline Pack</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Storage summary */}
      <View style={styles.storageCard}>
        <View style={styles.storageRow}>
          <Ionicons name="cloud-download-outline" size={22} color={BRAND} />
          <View style={styles.storageText}>
            <Text style={styles.storageLabel}>
              {downloadedCount} / {totalCount} sights downloaded
            </Text>
            <Text style={styles.storageSubLabel}>
              {fmtBytes(storage.usedBytes)} used · {fmtBytes(storage.availableBytes)} free
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.overallTrack}>
          <View style={[styles.overallFill, { width: `${totalCount > 0 ? (downloadedCount / totalCount) * 100 : 0}%` }]} />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleDownloadAll}
          activeOpacity={0.85}
          style={[styles.downloadAllBtn, downloadingAll && styles.btnDisabled]}
          disabled={downloadingAll || downloadedCount === totalCount}
        >
          {downloadingAll ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="download-outline" size={18} color="#fff" />
          )}
          <Text style={styles.downloadAllText}>
            {downloadedCount === totalCount ? 'All Downloaded ✓' : 'Download All'}
          </Text>
        </TouchableOpacity>

        {storage.usedBytes > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mapCard}>
        <View style={styles.mapRow}>
          <Ionicons name="map-outline" size={20} color="#34C759" />
          <View style={styles.mapText}>
            <Text style={styles.mapTitle}>Offline Map (Rome)</Text>
            <Text style={styles.mapSubtitle}>
              {hasOfflineMap ? 'Downloaded' : 'Not downloaded'}{mapDownloading ? ` · ${Math.round(mapPercent)}%` : ''}
            </Text>
          </View>
          {hasOfflineMap ? (
            <TouchableOpacity onPress={handleDeleteMap} activeOpacity={0.85} style={styles.mapAction}>
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleDownloadMap}
              activeOpacity={0.85}
              style={[styles.mapAction, mapDownloading && styles.btnDisabled]}
              disabled={mapDownloading}
            >
              {mapDownloading ? (
                <ActivityIndicator color={BRAND} size="small" />
              ) : (
                <Ionicons name="download-outline" size={18} color={BRAND} />
              )}
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.mapTrack}>
          <View style={[styles.mapFill, { width: `${hasOfflineMap ? 100 : Math.max(0, Math.min(100, mapPercent))}%` }]} />
        </View>
      </View>

      {/* Sight list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        {sights.map((sight) => {
          const isDownloaded = downloadedSights[sight.id];
          const progress = downloadProgress[sight.id];
          const isDownloading = progress !== undefined;
          const size = totalAudioSize(sight);
          const hasAudio = VARIANTS.some((v) => !!sight.audioFiles?.[LANG]?.[v]?.url);

          return (
            <View key={sight.id} style={styles.sightRow}>
              <Image source={{ uri: sight.thumbnail }} style={styles.sightThumb} />
              <View style={styles.sightInfo}>
                <Text style={styles.sightName} numberOfLines={1}>{sight.name}</Text>
                <Text style={styles.sightMeta}>
                  {hasAudio ? fmtBytes(size) : 'Audio coming soon'}
                  {' · '}
                  {VARIANTS.filter((v) => !!sight.audioFiles?.[LANG]?.[v]?.url).length} tracks
                </Text>
                {isDownloading && (
                  <View style={styles.sightTrack}>
                    <View style={[styles.sightFill, { width: `${(progress ?? 0) * 100}%` }]} />
                  </View>
                )}
              </View>

              {isDownloading ? (
                <ActivityIndicator size="small" color={BRAND} />
              ) : isDownloaded ? (
                <View style={styles.doneIcon}>
                  <Ionicons name="checkmark-circle" size={26} color="#34C759" />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => { Haptics.selectionAsync(); downloadSight(sight.id); }}
                  activeOpacity={0.8}
                  style={[styles.dlBtn, !hasAudio && styles.dlBtnDisabled]}
                  disabled={!hasAudio}
                >
                  <Ionicons name="download-outline" size={18} color={hasAudio ? BRAND : '#555'} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { color: '#fff', fontSize: 17, fontWeight: '900' },
  storageCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 14, gap: 10,
  },
  storageRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  storageText: { flex: 1 },
  storageLabel: { color: '#fff', fontSize: 14, fontWeight: '800' },
  storageSubLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  overallTrack: {
    height: 4, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  overallFill: { height: '100%', borderRadius: 2, backgroundColor: BRAND },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  downloadAllBtn: {
    flex: 1, height: 48, borderRadius: 14,
    backgroundColor: BRAND,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  downloadAllText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  clearBtn: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,59,48,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  mapCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  mapRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mapText: { flex: 1, gap: 2 },
  mapTitle: { color: '#fff', fontSize: 14, fontWeight: '900' },
  mapSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '700' },
  mapAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  mapFill: { height: '100%', borderRadius: 2, backgroundColor: '#34C759' },
  list: { flex: 1, paddingHorizontal: 16 },
  sightRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  sightThumb: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#222' },
  sightInfo: { flex: 1, gap: 3 },
  sightName: { color: '#fff', fontSize: 14, fontWeight: '800' },
  sightMeta: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
  sightTrack: {
    marginTop: 4, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  sightFill: { height: '100%', borderRadius: 2, backgroundColor: BRAND },
  doneIcon: { width: 36, alignItems: 'center' },
  dlBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(0,122,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  dlBtnDisabled: { opacity: 0.3 },
});
