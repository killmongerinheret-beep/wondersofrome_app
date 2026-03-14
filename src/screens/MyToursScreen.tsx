import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import sightsJson from '../data/sights.json';
import { AudioVariant, Sight } from '../types';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { clearAudioStorage, getAudioStorageUsage } from '../services/filesystem';
import { getAllDownloads } from '../services/sqlite';
import { File } from 'expo-file-system';

const formatBytes = (bytes: number) => {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const base = 1024;
  const exp = Math.min(Math.floor(Math.log(bytes) / Math.log(base)), units.length - 1);
  const value = bytes / Math.pow(base, exp);
  const digits = exp === 0 ? 0 : exp === 1 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[exp]}`;
};

export const MyToursScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { downloadedSights, downloadProgress, downloadSight, checkDownloads } = useOfflineContent();
  const sights = useMemo(() => sightsJson as Sight[], []);

  const [refreshing, setRefreshing] = useState(false);
  const [usedBytes, setUsedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);

  const loadStorage = useCallback(async () => {
    const stats = await getAudioStorageUsage();
    setUsedBytes(stats.usedBytes);
    setTotalBytes(stats.totalBytes);
  }, []);

  const loadAll = useCallback(async () => {
    await checkDownloads();
    await loadStorage();
  }, [checkDownloads, loadStorage]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadAll();
    } finally {
      setRefreshing(false);
    }
  }, [loadAll]);

  const handleClearSpace = async () => {
    Alert.alert('Clear downloaded audio?', 'This will remove downloaded audio files from your device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Space',
        style: 'destructive',
        onPress: async () => {
          await clearAudioStorage();
          await loadAll();
        },
      },
    ]);
  };

  const tours = useMemo(() => {
    const order = ['vatican', 'borghese-gallery', 'colosseum', 'trevi', 'pantheon', 'forum'];
    const sorted = [...sights].sort((a, b) => {
      const ia = order.indexOf(a.id);
      const ib = order.indexOf(b.id);
      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return sorted;
  }, [sights]);

  const [sizeBySight, setSizeBySight] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const downloads = await getAllDownloads();
        const next: Record<string, number> = {};
        for (const d of downloads) {
          try {
            const f = new File(d.local_uri);
            if (!f.exists) continue;
            const info = f.info();
            next[d.sight_id] = (next[d.sight_id] ?? 0) + (info.size ?? 0);
          } catch {
            continue;
          }
        }
        if (!cancelled) setSizeBySight(next);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const percentUsed = totalBytes > 0 ? Math.min(1, usedBytes / totalBytes) : 0;

  const renderItem = ({ item }: { item: Sight }) => {
    const downloaded = !!downloadedSights[item.id];
    const downloading = !!downloadProgress[item.id];
    const title = item.id === 'vatican' ? 'Vatican City Pack' : item.name;
    const sizeText = downloaded ? formatBytes(sizeBySight[item.id] ?? 0) : null;
    const badgeText = downloaded ? 'Downloaded' : 'Download on Wi‑Fi';
    const badgeStyle = downloaded ? styles.badgeGreen : styles.badgeGray;

    const onPress = () => {
      if (downloaded || downloading) return;
      downloadSight(item.id);
    };

    return (
      <View style={styles.cardWrap}>
        <BlurView intensity={80} tint="light" style={styles.card}>
          <Image source={{ uri: item.thumbnail }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardContent}>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {title}
              </Text>
              <View style={[styles.badge, badgeStyle]}>
                <Text style={styles.badgeText}>{downloading ? 'Downloading…' : badgeText}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {item.description}
            </Text>
            <View style={styles.cardBottomRow}>
              <View style={styles.metaPill}>
                <Ionicons name="cloud-download-outline" size={14} color="rgba(17,17,17,0.7)" />
                <Text style={styles.metaText}>
                  {sizeText ? sizeText : downloading ? 'In progress' : 'Not downloaded'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.9}
                disabled={downloaded || downloading}
                style={[styles.actionButton, (downloaded || downloading) && styles.actionButtonDisabled]}
              >
                <Ionicons
                  name={downloaded ? 'checkmark' : downloading ? 'cloud-download' : 'arrow-down'}
                  size={18}
                  color={downloaded || downloading ? 'rgba(17,17,17,0.45)' : '#111'}
                />
                <Text style={[styles.actionText, (downloaded || downloading) && styles.actionTextDisabled]}>
                  {downloaded ? 'Ready' : downloading ? 'Downloading' : 'Download'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Text style={styles.headerTitle}>My Tours</Text>
        <Text style={styles.headerSubtitle}>Offline audio, ready when you are</Text>
      </View>

      <View style={[styles.storageCardWrap, { paddingHorizontal: 16 }]}>
        <BlurView intensity={80} tint="light" style={styles.storageCard}>
          <View style={styles.storageTopRow}>
            <View>
              <Text style={styles.storageTitle}>Storage</Text>
              <Text style={styles.storageSubtitle}>
                {formatBytes(usedBytes)} used
              </Text>
            </View>
            <TouchableOpacity onPress={handleClearSpace} activeOpacity={0.9} style={styles.clearSpaceButton}>
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.clearSpaceText}>Clear Space</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(percentUsed * 100)}%` }]} />
          </View>
          <Text style={styles.progressHint}>
            {totalBytes > 0 ? `${Math.round(percentUsed * 100)}% of device storage` : 'Storage info unavailable'}
          </Text>
        </BlurView>
      </View>

      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16), paddingTop: 14 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#111',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.7)',
  },
  storageCardWrap: {
    paddingBottom: 10,
  },
  storageCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  storageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  storageSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.7)',
  },
  clearSpaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 12,
    gap: 8,
  },
  clearSpaceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(118,118,128,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#34C759',
  },
  progressHint: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.7)',
  },
  cardWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  cardImage: {
    width: 92,
    height: 92,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeGreen: {
    backgroundColor: 'rgba(52,199,89,0.16)',
  },
  badgeGray: {
    backgroundColor: 'rgba(142,142,147,0.16)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#111',
  },
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.74)',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 999,
    backgroundColor: 'rgba(118,118,128,0.16)',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(17,17,17,0.75)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#111',
  },
  actionTextDisabled: {
    color: 'rgba(17,17,17,0.45)',
  },
});

