import React, { useMemo, useState } from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { theme } from '../ui/theme';
import { ProductCard } from '../components/ProductCard';
import { useAudioTours } from '../hooks/useAudioTours';
import { SanityAudioTour } from '../services/sanity';
import { TourSheet } from '../components/TourSheet';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AudioLang, AudioVariant, Sight } from '../types';
import { useSights } from '../hooks/useSights';
import { useContinueListening } from '../hooks/useContinueListening';
import { Skeleton } from '../ui/Skeleton';

type Chip = { key: string; label: string };
const CHIPS: Chip[] = [
  { key: 'all', label: 'All' },
  { key: 'ancient', label: 'Ancient' },
  { key: 'religious', label: 'Religious' },
  { key: 'museum', label: 'Museums' },
  { key: 'piazza', label: 'Piazze' },
];

const AUDIO_LANGS: { code: AudioLang; label: string; flag: string }[] = [
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'it', label: 'IT', flag: '🇮🇹' },
  { code: 'es', label: 'ES', flag: '🇪🇸' },
  { code: 'fr', label: 'FR', flag: '🇫🇷' },
  { code: 'de', label: 'DE', flag: '🇩🇪' },
  { code: 'pt', label: 'PT', flag: '🇧🇷' },
  { code: 'pl', label: 'PL', flag: '🇵🇱' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'ar', label: 'AR', flag: '🇸🇦' },
  { code: 'zh', label: 'ZH', flag: '🇨🇳' },
  { code: 'ja', label: 'JA', flag: '🇯🇵' },
  { code: 'ko', label: 'KO', flag: '🇰🇷' },
];

const AUDIO_VARIANTS: { key: AudioVariant; label: string }[] = [
  { key: 'quick', label: 'Quick' },
  { key: 'deep', label: 'Deep' },
  { key: 'kids', label: 'Kids' },
];

const fmtMin = (sec: number) => {
  const m = Math.round(Math.max(0, sec) / 60);
  if (!m) return '';
  return `${m} min`;
};

const parseVariantKey = (key: string | null): { lang: AudioLang; variant: AudioVariant } | null => {
  const k = String(key ?? '').trim();
  const parts = k.split('_');
  if (parts.length < 2) return null;
  const lang = parts[0] as AudioLang;
  const variant = parts[1] as AudioVariant;
  return { lang, variant };
};

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { tours: audioTours, loading: toursLoading } = useAudioTours();
  const { sights, loading: sightsLoading } = useSights();
  const { startQueue, play } = useAudioPlayer();
  const { items: continueItems, refresh: refreshContinue } = useContinueListening(sights);
  const [query, setQuery] = useState('');
  const [chip, setChip] = useState<Chip>(CHIPS[0]);
  const [selectedTour, setSelectedTour] = useState<SanityAudioTour | null>(null);
  const [audioLang, setAudioLang] = useState<AudioLang>('en');
  const [audioVariant, setAudioVariant] = useState<AudioVariant>('deep');

  const tours = audioTours ?? [];
  const loading = toursLoading || sightsLoading;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tours.filter((t: SanityAudioTour) => {
      const c = t.stops?.[0]?.category ?? 'other';
      if (chip.key !== 'all' && c !== chip.key) return false;
      if (!q) return true;
      return (t.title ?? '').toLowerCase().includes(q);
    });
  }, [tours, chip, query]);

  const hero = tours[0];
  const audioProducts = useMemo(() => {
    const hasValidTrack = (s: Sight) => {
      const t = s.audioFiles?.[audioLang]?.[audioVariant];
      const url = (t?.url ?? '').trim();
      return !!url && !url.includes('example.com');
    };
    const items = (sights ?? []).filter(hasValidTrack);
    items.sort((a, b) => {
      const ap = a.pack === 'essential' ? 0 : 1;
      const bp = b.pack === 'essential' ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
    return items.slice(0, 12);
  }, [sights, audioLang, audioVariant]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(10, insets.top + 6), paddingBottom: 140 }]}
        onScrollBeginDrag={() => refreshContinue().catch(() => {})}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.hTitle}>Good evening</Text>
            <Text style={styles.hSub}>Pick an audio guide and press play</Text>
          </View>
          <View style={styles.hAvatar}>
            <Ionicons name="person" size={18} color="#0B0B0B" />
          </View>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="rgba(60,60,67,0.75)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tours…"
            placeholderTextColor="rgba(60,60,67,0.45)"
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {!!query && (
            <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.8} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="rgba(60,60,67,0.45)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.chipsRow}>
          {CHIPS.map((c) => {
            const active = chip.key === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setChip(c)}
                activeOpacity={0.85}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {continueItems.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jump back in</Text>
              <Text style={styles.sectionSub}>Recent</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.resumeRow}>
              {continueItems.map(({ sight, progress }) => {
                const parsed = parseVariantKey(progress.last_played_variant);
                const lang = parsed?.lang ?? 'en';
                const variant = parsed?.variant ?? 'quick';
                const track = sight.audioFiles?.[lang]?.[variant];
                const url = (track?.url ?? '').trim();
                const durationLabel = track?.duration ? fmtMin(track.duration) : undefined;
                return (
                  <ProductCard
                    key={`${sight.id}:${lang}:${variant}`}
                    style={styles.resumeCard}
                    title={sight.name}
                    subtitle={`${variant.toUpperCase()} · ${lang.toUpperCase()}`}
                    durationLabel={durationLabel}
                    stopsLabel="Continue"
                    image={sight.thumbnail ?? null}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      if (url) await play(sight.id, `${lang}_${variant}`, url);
                      navigation.navigate('Explore', { pickSightId: sight.id });
                    }}
                  />
                );
              })}
            </ScrollView>
          </>
        )}

        {hero ? (
          <TouchableOpacity
            activeOpacity={0.92}
            style={styles.hero}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTour(hero);
            }}
          >
            <Image source={{ uri: hero.thumbnail ?? '' }} style={styles.heroImage} />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <Text style={styles.heroKicker}>{hero.stops?.[0]?.category ?? 'Tour'}</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>{hero.title}</Text>
            </View>
          </TouchableOpacity>
        ) : loading ? (
          <View style={[styles.hero, { backgroundColor: '#fff' }]}>
            <Skeleton backgroundColor="rgba(0,0,0,0.06)" style={StyleSheet.absoluteFill as any} />
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Audio guides</Text>
          <Text style={styles.sectionSub}>{audioVariant.toUpperCase()} · {audioLang.toUpperCase()}</Text>
        </View>

        <View style={styles.audioPicks}>
          <View style={styles.audioVariants}>
            {AUDIO_VARIANTS.map((v) => {
              const active = audioVariant === v.key;
              return (
                <TouchableOpacity
                  key={v.key}
                  onPress={() => { Haptics.selectionAsync(); setAudioVariant(v.key); }}
                  activeOpacity={0.85}
                  style={[styles.audioVariantPill, active && styles.audioVariantPillActive]}
                >
                  <Text style={[styles.audioVariantText, active && styles.audioVariantTextActive]}>{v.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.audioLangs}>
            {AUDIO_LANGS.map((l) => {
              const active = audioLang === l.code;
              return (
                <TouchableOpacity
                  key={l.code}
                  onPress={() => { Haptics.selectionAsync(); setAudioLang(l.code); }}
                  activeOpacity={0.85}
                  style={[styles.audioLangPill, active && styles.audioLangPillActive]}
                >
                  <Text style={styles.audioLangFlag}>{l.flag}</Text>
                  <Text style={[styles.audioLangText, active && styles.audioLangTextActive]}>{l.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <FlatList
          data={audioProducts}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(s) => `${audioLang}:${audioVariant}:${s.id}`}
          contentContainerStyle={styles.audioRow}
          renderItem={({ item }) => {
            const track = item.audioFiles?.[audioLang]?.[audioVariant];
            const url = (track?.url ?? '').trim();
            const durationLabel = track?.duration ? fmtMin(track.duration) : undefined;
            return (
              <ProductCard
                style={styles.audioCard}
                title={item.name}
                subtitle={item.category.toUpperCase()}
                priceLabel={item.pack === 'essential' ? 'Essential' : undefined}
                durationLabel={durationLabel}
                stopsLabel={audioVariant === 'kids' ? 'Myths' : 'Audio'}
                image={item.thumbnail ?? null}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (url) await play(item.id, `${audioLang}_${audioVariant}`, url);
                  navigation.navigate('Explore', { pickSightId: item.id });
                }}
              />
            );
          }}
          ListEmptyComponent={
            loading ? (
              <View style={styles.audioSkeletonRow}>
                <Skeleton backgroundColor="rgba(0,0,0,0.06)" style={styles.audioSkeletonCard} />
                <Skeleton backgroundColor="rgba(0,0,0,0.06)" style={styles.audioSkeletonCard} />
              </View>
            ) : (
              <View style={styles.audioEmpty}>
                <Ionicons name="headset-outline" size={34} color="rgba(60,60,67,0.35)" />
                <Text style={styles.audioEmptyText}>No audio found for this selection</Text>
              </View>
            )
          }
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Walking tours</Text>
          <Text style={styles.sectionSub}>{filtered.length} tours</Text>
        </View>

        <View style={styles.cardsCol}>
          {loading ? (
            <>
              <Skeleton backgroundColor="rgba(0,0,0,0.06)" style={styles.tourSkeleton} />
              <Skeleton backgroundColor="rgba(0,0,0,0.06)" style={styles.tourSkeleton} />
            </>
          ) : filtered.length ? (
            filtered.slice(0, 12).map((item) => (
              <ProductCard
                key={item.id}
                title={item.title}
                subtitle={item.stops?.[0]?.category ?? 'Tour'}
                durationLabel={item.duration ?? undefined}
                stopsLabel={item.stops?.length ? `${item.stops.length} stops` : undefined}
                image={item.thumbnail ?? null}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTour(item);
                }}
              />
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="sparkles-outline" size={48} color="rgba(60,60,67,0.25)" />
              <Text style={styles.emptyText}>No tours match your search</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TourSheet
        visible={!!selectedTour}
        tour={selectedTour}
        onClose={() => setSelectedTour(null)}
        onStartAt={async (index: number, lang: AudioLang, variant: AudioVariant) => {
          const t = selectedTour;
          if (!t) return;
          const stops = (t.stops ?? []) as any[];
          const key = `${lang}_${variant}`;
          const items = stops
            .filter((s) => s?.id)
            .map((s) => ({ sightId: s.id, variant: key, remoteUrl: s.audioFiles?.[lang]?.[variant]?.url, title: s.name }));
          if (items.length < 1) return;
          const startAt = Math.max(0, Math.min(items.length - 1, index));
          await startQueue(items, startAt, t.title);
          setSelectedTour(null);
          navigation.navigate('Explore');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F3F7' },
  scrollContent: { paddingHorizontal: 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  hTitle: { fontSize: 28, fontWeight: '900', color: '#111' },
  hSub: { fontSize: 12, fontWeight: '700', color: 'rgba(60,60,67,0.7)' },
  hAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111' },
  clearBtn: { padding: 2 },
  chipsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(118,118,128,0.12)' },
  chipActive: { backgroundColor: theme.colors.brand },
  chipLabel: { fontSize: 12, fontWeight: '900', color: 'rgba(60,60,67,0.8)' },
  chipLabelActive: { color: '#fff' },
  hero: { height: 220, borderRadius: 26, overflow: 'hidden', marginHorizontal: 16, marginBottom: 14, backgroundColor: '#1C1C1E' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  heroContent: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 6 },
  heroKicker: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.7, textTransform: 'uppercase' },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginTop: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  sectionSub: { fontSize: 12, fontWeight: '800', color: 'rgba(60,60,67,0.6)' },
  resumeRow: { paddingHorizontal: 16, paddingBottom: 6 },
  resumeCard: { width: 240, height: 200, marginRight: 12 },
  audioPicks: { paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  audioVariants: { flexDirection: 'row', gap: 8 },
  audioVariantPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(118,118,128,0.12)' },
  audioVariantPillActive: { backgroundColor: '#111' },
  audioVariantText: { fontSize: 12, fontWeight: '900', color: 'rgba(60,60,67,0.75)' },
  audioVariantTextActive: { color: '#fff' },
  audioLangs: { gap: 8, paddingRight: 6 },
  audioLangPill: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: 'rgba(118,118,128,0.12)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  audioLangPillActive: { backgroundColor: theme.colors.brand },
  audioLangFlag: { fontSize: 13 },
  audioLangText: { fontSize: 11, fontWeight: '900', color: 'rgba(60,60,67,0.75)' },
  audioLangTextActive: { color: '#fff' },
  audioRow: { paddingHorizontal: 16, paddingBottom: 4 },
  audioCard: { width: 280, marginRight: 12, marginBottom: 0 },
  audioSkeletonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  audioSkeletonCard: { width: 280, height: 260, borderRadius: 24 },
  audioEmpty: { width: 280, height: 260, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  audioEmptyText: { fontSize: 13, fontWeight: '800', color: 'rgba(60,60,67,0.6)', textAlign: 'center' },
  cardsCol: { paddingHorizontal: 16, gap: 14, paddingBottom: 10 },
  tourSkeleton: { height: 260, borderRadius: 24 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 13, fontWeight: '700', color: 'rgba(60,60,67,0.6)' },
});
