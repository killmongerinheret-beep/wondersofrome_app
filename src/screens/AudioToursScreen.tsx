import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AudioTour } from '../services/content';
import { theme } from '../theme';

type Props = {
  tours: AudioTour[];
  onClose: () => void;
  onOpenTour: (tour: AudioTour) => void;
};

const BRAND = theme.colors.brand;

export const AudioToursScreen: React.FC<Props> = ({ tours, onClose, onOpenTour }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = (tours ?? []).filter((t) => (t.stops?.length ?? 0) >= 2);
    if (!q) return base;
    return base.filter((t) => (t.title ?? '').toLowerCase().includes(q));
  }, [query, tours]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={[styles.header, { paddingTop: Math.max(10, insets.top + 6) }]}>
        <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close tours">
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Walking tours</Text>
          <Text style={styles.headerSub}>{filtered.length} tours</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="rgba(255,255,255,0.75)" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search tours…"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(18, insets.bottom + 18), paddingTop: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.card}
            onPress={() => onOpenTour(item)}
            accessibilityRole="button"
            accessibilityLabel={`Open tour ${item.title}`}
          >
            <View style={styles.cardImageWrap}>
              {item.thumbnail?.trim() ? (
                <Image source={{ uri: item.thumbnail }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={styles.cardImageFallback} />
              )}
              <View style={styles.cardOverlay} />
              <View style={styles.cardBadge}>
                <Ionicons name="walk-outline" size={12} color="#fff" />
                <Text style={styles.cardBadgeText}>{item.stops?.length ?? 0} stops</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.duration ? `${item.duration} · ` : ''}
                Auto-play route
              </Text>
              <View style={styles.cardCtaRow}>
                <View style={styles.cardCta}>
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={styles.cardCtaText}>Open</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="walk-outline" size={22} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No tours found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '800' },
  searchRow: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '700' },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 12,
  },
  cardImageWrap: { height: 140, backgroundColor: '#111' },
  cardImage: { ...StyleSheet.absoluteFillObject },
  cardImageFallback: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  cardBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  cardBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  cardBody: { padding: 12, gap: 6 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 20 },
  cardSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700' },
  cardCtaRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardCta: { height: 34, borderRadius: 14, backgroundColor: BRAND, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardCtaText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '800' },
});
