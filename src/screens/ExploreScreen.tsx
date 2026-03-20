import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  PanResponderGestureState,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
  Modal,
} from 'react-native';
import Mapbox from '@rnmapbox/maps';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sight } from '../types';
import { getMapboxAccessToken } from '../config/mapbox';
import { useSights } from '../hooks/useSights';
import { AudioPlayer } from '../components/AudioPlayer';
import { DownloadPackScreen } from './DownloadPackScreen';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Skeleton } from '../ui/Skeleton';

type ExploreFilter = 'all' | 'ancient' | 'religious' | 'museum' | 'piazza' | 'other';

const ROME_CENTER: [number, number] = [12.4922, 41.8902];
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.72;
const CARD_GAP = 12;

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

// ── Swipeable sight card ──────────────────────────────────────────────────────
const SightSwipeCard: React.FC<{
  sight: Sight;
  isSelected: boolean;
  distance: number | null;
  onPress: () => void;
}> = ({ sight, isSelected, distance, onPress }) => {
  const scale = useRef(new Animated.Value(isSelected ? 1 : 0.94)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: isSelected ? 1 : 0.94,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [isSelected]);

  const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    ancient: 'business-outline',
    religious: 'library-outline',
    museum: 'color-palette-outline',
    piazza: 'sunny-outline',
    other: 'sparkles-outline',
  };

  return (
    <Animated.View style={[styles.swipeCard, { transform: [{ scale }] }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.swipeCardInner}>
        <Image source={{ uri: sight.thumbnail }} style={styles.swipeCardImage} resizeMode="cover" />
        <View style={styles.swipeCardOverlay} />
        {isSelected && (
          <View style={styles.swipeCardSelectedBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
        <View style={styles.swipeCardContent}>
          <View style={styles.swipeCardCategoryRow}>
            <Ionicons
              name={CATEGORY_ICONS[sight.category] ?? 'location-outline'}
              size={11}
              color="rgba(255,255,255,0.8)"
            />
            <Text style={styles.swipeCardCategory}>
              {sight.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.swipeCardTitle} numberOfLines={2}>{sight.name}</Text>
          <View style={styles.swipeCardMeta}>
            {distance != null && (
              <View style={styles.swipeCardPill}>
                <Ionicons name="navigate-outline" size={10} color="rgba(255,255,255,0.8)" />
                <Text style={styles.swipeCardPillText}>{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</Text>
              </View>
            )}
            {sight.pack === 'essential' && (
              <View style={[styles.swipeCardPill, styles.swipeCardPillGold]}>
                <Text style={styles.swipeCardPillTextGold}>Essential</Text>
              </View>
            )}
            {sight.linkedTour && (
              <View style={[styles.swipeCardPill, styles.swipeCardPillBlue]}>
                <Ionicons name="ticket-outline" size={10} color="#fff" />
                <Text style={styles.swipeCardPillText}>Tour available</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export const ExploreScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const shapeSourceRef = useRef<any>(null);
  const carouselRef = useRef<FlatList>(null);
  const windowHeight = Dimensions.get('window').height;

  const drawerMaxHeight = Math.min(Math.max(520, Math.round(windowHeight * 0.7)), 680);
  const drawerPeekHeight = 170;
  const drawerHiddenY = drawerMaxHeight + 56;
  const drawerCollapsedY = Math.max(0, drawerMaxHeight - drawerPeekHeight);
  const drawerTranslate = useRef(new Animated.Value(drawerHiddenY)).current;
  const resultsAnim = useRef(new Animated.Value(0)).current;
  const drawerDragStart = useRef(0);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ExploreFilter>('all');
  const [selectedSightId, setSelectedSightId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showDownloadPack, setShowDownloadPack] = useState(false);

  const { sights, loading } = useSights();

  const filteredSights = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sights.filter((s) => {
      if (filter !== 'all' && s.category !== filter) return false;
      if (!q) return true;
      return (s.name ?? '').toLowerCase().includes(q) || (s.name_it ?? '').toLowerCase().includes(q);
    });
  }, [filter, query, sights]);

  const selectedSight = useMemo(
    () => (selectedSightId ? sights.find((s) => s.id === selectedSightId) ?? null : null),
    [selectedSightId, sights]
  );

  const sightsGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredSights.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: { id: s.id, category: s.category, name: s.name },
    })),
  } as any), [filteredSights]);

  const topResults = useMemo(() => {
    if (!query.trim()) return [];
    return filteredSights.slice(0, 6);
  }, [filteredSights, query]);

  useEffect(() => {
    const show = query.trim().length > 0 && topResults.length > 0;
    Animated.timing(resultsAnim, {
      toValue: show ? 1 : 0,
      duration: show ? 160 : 120,
      useNativeDriver: true,
    }).start();
  }, [query, resultsAnim, topResults.length]);

  // ── Drawer helpers ──────────────────────────────────────────────────────────
  const animateDrawerTo = (y: number, velocity?: number) => {
    Animated.spring(drawerTranslate, {
      toValue: y, useNativeDriver: true, speed: 28, bounciness: 6, velocity,
    }).start();
  };
  const openDrawer = () => animateDrawerTo(drawerCollapsedY);
  const expandDrawer = () => animateDrawerTo(0);
  const closeDrawer = () => {
    Animated.timing(drawerTranslate, { toValue: drawerHiddenY, duration: 170, useNativeDriver: true })
      .start(() => setSelectedSightId(null));
  };

  const onHandleDrag = (_: any, g: PanResponderGestureState) => {
    drawerTranslate.setValue(Math.max(0, Math.min(drawerHiddenY, drawerDragStart.current + g.dy)));
  };
  const onHandleRelease = (_: any, g: PanResponderGestureState) => {
    if (g.vy > 0.75 || drawerDragStart.current + g.dy > drawerMaxHeight * 0.7) { closeDrawer(); return; }
    const projected = drawerDragStart.current + g.dy + g.vy * 80;
    if (projected < drawerMaxHeight * 0.35) { expandDrawer(); return; }
    animateDrawerTo(drawerCollapsedY);
  };

  const drawerPanResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      drawerTranslate.stopAnimation((v) => { drawerDragStart.current = typeof v === 'number' ? v : 0; });
    },
    onPanResponderMove: onHandleDrag,
    onPanResponderRelease: onHandleRelease,
    onPanResponderTerminate: onHandleRelease,
  }), [drawerCollapsedY, drawerHiddenY, drawerMaxHeight]);

  // ── Select sight ────────────────────────────────────────────────────────────
  const handleSelectSight = (sightId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSightId(sightId);
    const sight = sights.find((s) => s.id === sightId);
    if (sight) {
      cameraRef.current?.setCamera({
        centerCoordinate: [sight.lng, sight.lat],
        zoomLevel: 15.5,
        animationDuration: 700,
      });
    }
    openDrawer();
    // Scroll carousel to this card
    const idx = filteredSights.findIndex((s) => s.id === sightId);
    if (idx >= 0) {
      setTimeout(() => {
        carouselRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      }, 100);
    }
  };

  const handlePickResult = (sight: Sight) => {
    setQuery('');
    setFilter('all');
    handleSelectSight(sight.id);
  };

  const handleRecenter = () => {
    if (!userLocation) return;
    Haptics.selectionAsync();
    cameraRef.current?.setCamera({
      centerCoordinate: [userLocation.lng, userLocation.lat],
      zoomLevel: 15.2,
      animationDuration: 650,
    });
  };

  const handleMapPress = async (e: any) => {
    const feature = e?.features?.[0];
    if (!feature) return;
    const props = feature.properties ?? {};
    if (props.cluster) {
      try {
        const zoom = await shapeSourceRef.current?.getClusterExpansionZoom(feature);
        const coords = feature.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          cameraRef.current?.setCamera({ centerCoordinate: coords, zoomLevel: zoom ?? 15, animationDuration: 420 });
        }
      } catch {}
      return;
    }
    const id = String(props.id ?? '').trim();
    if (id) handleSelectSight(id);
  };

  const handleBookNow = async () => {
    if (!selectedSight?.linkedTour) return;
    const domain = selectedSight.linkedTour.site?.domain ?? 'https://ticketsinrome.com';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Linking.openURL(`${domain}/tour/${selectedSight.linkedTour.slug}`);
  };

  const currentDistance = useMemo(() => {
    if (!selectedSight || !userLocation) return null;
    return distanceMeters(userLocation, { lat: selectedSight.lat, lng: selectedSight.lng });
  }, [selectedSight, userLocation]);

  const accessToken = useMemo(() => getMapboxAccessToken(), []);

  // ── Category chips config ───────────────────────────────────────────────────
  const chips: Array<{ label: string; value: ExploreFilter; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Ancient', value: 'ancient', icon: 'business-outline' },
    { label: 'Churches', value: 'religious', icon: 'library-outline' },
    { label: 'Museums', value: 'museum', icon: 'color-palette-outline' },
    { label: 'Piazzas', value: 'piazza', icon: 'sunny-outline' },
    { label: 'Hidden', value: 'other', icon: 'sparkles-outline' },
  ];

  if (!accessToken) {
    return (
      <View style={styles.noTokenContainer}>
        <Text style={styles.noTokenTitle}>Mapbox token needed</Text>
        <Text style={styles.noTokenBody}>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file, then rebuild.</Text>
        <Text style={styles.noTokenStep}>npx expo run:android</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map} styleURL={Mapbox.StyleURL.Street}>
        <Mapbox.Camera ref={cameraRef} zoomLevel={13.8} centerCoordinate={ROME_CENTER} />
        <Mapbox.UserLocation
          visible
          showsUserHeadingIndicator
          onUpdate={(loc) => {
            if (loc?.coords) setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }}
        />
        <Mapbox.ShapeSource
          id="sights"
          ref={shapeSourceRef}
          shape={sightsGeojson}
          cluster
          clusterRadius={46}
          onPress={handleMapPress}
        >
          <Mapbox.CircleLayer
            id="clusters"
            filter={['has', 'point_count']}
            style={{ circleColor: 'rgba(0,122,255,0.9)', circleOpacity: 0.95, circleRadius: ['step', ['get', 'point_count'], 18, 10, 22, 30, 28] }}
          />
          <Mapbox.SymbolLayer
            id="cluster-count"
            filter={['has', 'point_count']}
            style={{ textField: ['get', 'point_count'], textSize: 12, textColor: '#fff', textFont: ['System Bold'] }}
          />
          <Mapbox.CircleLayer
            id="sight-selected"
            filter={['all', ['!', ['has', 'point_count']], ['==', ['get', 'id'], selectedSightId ?? '']]}
            style={{ circleColor: '#111', circleOpacity: 1, circleStrokeColor: '#fff', circleStrokeWidth: 2, circleRadius: 12 }}
          />
          <Mapbox.CircleLayer
            id="sight-points"
            filter={['all', ['!', ['has', 'point_count']], ['!=', ['get', 'id'], selectedSightId ?? '']]}
            style={{ circleColor: '#fff', circleOpacity: 1, circleStrokeColor: '#007AFF', circleStrokeWidth: 2, circleRadius: 10 }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* Recenter */}
      <View style={[styles.recenterWrap, { top: insets.top + 12 }]}>
        <AnimatedPressable onPress={handleRecenter} haptics="light" disabled={!userLocation}
          style={[styles.mapBtn, !userLocation && styles.mapBtnDisabled]} pressedStyle={{ opacity: 0.85 }}>
          <BlurView intensity={80} tint="dark" style={styles.mapBtnBlur}>
            <Ionicons name="locate-outline" size={18} color="#fff" />
          </BlurView>
        </AnimatedPressable>
      </View>

      {/* Download pack */}
      <View style={[styles.downloadBtnWrap, { top: insets.top + 12 }]}>
        <AnimatedPressable onPress={() => setShowDownloadPack(true)} haptics="light"
          style={styles.mapBtn} pressedStyle={{ opacity: 0.85 }}>
          <BlurView intensity={80} tint="dark" style={styles.mapBtnBlur}>
            <Ionicons name="cloud-download-outline" size={18} color="#fff" />
          </BlurView>
        </AnimatedPressable>
      </View>

      {/* Bottom controls: search + chips + swipe carousel */}
      <View style={[styles.bottomControls, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        <BlurView intensity={80} tint="light" style={styles.controlsCard}>
          {loading && (
            <View style={styles.loadingRow}>
              <Skeleton style={styles.loadingPill} />
              <Skeleton style={styles.loadingPillSmall} />
            </View>
          )}

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="rgba(60,60,67,0.75)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search sights…"
              placeholderTextColor="rgba(60,60,67,0.55)"
              style={styles.searchInput}
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} activeOpacity={0.8} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color="rgba(60,60,67,0.55)" />
              </TouchableOpacity>
            )}
          </View>

          {/* Search results dropdown */}
          {topResults.length > 0 && (
            <Animated.View style={[styles.resultsWrap, {
              opacity: resultsAnim,
              transform: [{ translateY: resultsAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
            }]}>
              <ScrollView style={styles.resultsList} contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
                {topResults.map((s) => (
                  <AnimatedPressable key={s.id} onPress={() => handlePickResult(s)} haptics="light"
                    style={styles.resultRow} pressedStyle={styles.resultRowPressed}>
                    <View style={styles.resultInner}>
                      <View style={styles.resultText}>
                        <Text style={styles.resultTitle} numberOfLines={1}>{s.name}</Text>
                        <Text style={styles.resultSub} numberOfLines={1}>{s.category.toUpperCase()}</Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color="rgba(60,60,67,0.75)" />
                    </View>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            <AnimatedPressable onPress={() => setFilter('all')} haptics="light"
              style={[styles.chip, filter === 'all' && styles.chipActive]} pressedStyle={{ opacity: 0.85 }}>
              <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>All</Text>
            </AnimatedPressable>
            {chips.map((c) => (
              <AnimatedPressable key={c.value} onPress={() => setFilter((v) => v === c.value ? 'all' : c.value)}
                haptics="light" style={[styles.chip, filter === c.value && styles.chipActive]} pressedStyle={{ opacity: 0.85 }}>
                <Ionicons name={c.icon} size={14} color={filter === c.value ? '#fff' : 'rgba(60,60,67,0.75)'} style={{ marginRight: 4 }} />
                <Text style={[styles.chipText, filter === c.value && styles.chipTextActive]}>{c.label}</Text>
              </AnimatedPressable>
            ))}
          </ScrollView>
        </BlurView>

        {/* Swipeable sight cards carousel */}
        {!loading && filteredSights.length > 0 && (
          <FlatList
            ref={carouselRef}
            data={filteredSights}
            keyExtractor={(s) => s.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselContent}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => (
              <SightSwipeCard
                sight={item}
                isSelected={selectedSightId === item.id}
                distance={userLocation ? distanceMeters(userLocation, { lat: item.lat, lng: item.lng }) : null}
                onPress={() => handleSelectSight(item.id)}
              />
            )}
          />
        )}
      </View>

      {/* Offline download modal */}
      <Modal visible={showDownloadPack} animationType="slide" presentationStyle="fullScreen">
        <DownloadPackScreen onClose={() => setShowDownloadPack(false)} />
      </Modal>

      {/* Detail drawer */}
      {selectedSight && (
        <Animated.View style={[styles.drawer, {
          paddingBottom: Math.max(16, insets.bottom + 12),
          height: drawerMaxHeight,
          transform: [{ translateY: drawerTranslate }],
        }]}>
          <BlurView intensity={90} tint="dark" style={styles.drawerCard}>
            <View style={styles.drawerHandleHit} {...drawerPanResponder.panHandlers}>
              <View style={styles.drawerHandle} />
            </View>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleWrap}>
                <Text style={styles.drawerTitle} numberOfLines={1}>{selectedSight.name}</Text>
                <Text style={styles.drawerMeta}>
                  {currentDistance != null ? `${currentDistance < 1000 ? `${currentDistance}m` : `${(currentDistance / 1000).toFixed(1)}km`} away` : 'Audio guide available'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={styles.drawerClose} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerBody} contentContainerStyle={styles.drawerBodyContent} showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedSight.thumbnail }} style={styles.drawerImage} resizeMode="cover" />

              {/* Audio guide section */}
              <View style={styles.drawerSection}>
                <View style={styles.drawerSectionHeader}>
                  <Ionicons name="headset-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.drawerSectionLabel}>AUDIO GUIDE</Text>
                </View>
                <AudioPlayer sight={selectedSight} />
              </View>

              {/* Book tour section — only if linked */}
              {selectedSight.linkedTour && (
                <View style={styles.drawerSection}>
                  <View style={styles.drawerSectionHeader}>
                    <Ionicons name="ticket-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.drawerSectionLabel}>GUIDED TOUR</Text>
                  </View>
                  <TouchableOpacity onPress={handleBookNow} activeOpacity={0.9} style={styles.bookButton}>
                    <Ionicons name="ticket-outline" size={18} color="#fff" />
                    <Text style={styles.bookText}>
                      Book Tour{selectedSight.linkedTour.price ? ` · €${selectedSight.linkedTour.price}` : ''}
                    </Text>
                    <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                  <Text style={styles.tourNote}>Opens booking page in browser</Text>
                </View>
              )}

              <Text style={styles.drawerDescription}>{selectedSight.description}</Text>
            </ScrollView>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  noTokenContainer: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#000' },
  noTokenTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  noTokenBody: { marginTop: 10, color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  noTokenStep: { marginTop: 14, color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '800' },
  map: { flex: 1 },

  // Map overlay buttons
  recenterWrap: { position: 'absolute', left: 16 },
  downloadBtnWrap: { position: 'absolute', right: 16 },
  mapBtn: { borderRadius: 22, overflow: 'hidden' },
  mapBtnDisabled: { opacity: 0.4 },
  mapBtnBlur: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },

  // Bottom controls
  bottomControls: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  controlsCard: { marginHorizontal: 12, borderRadius: 18, overflow: 'hidden', padding: 12, backgroundColor: 'rgba(255,255,255,0.8)' },
  loadingRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  loadingPill: { height: 16, borderRadius: 999, flex: 1 },
  loadingPillSmall: { height: 16, borderRadius: 999, width: 84 },

  // Search
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(118,118,128,0.16)', borderRadius: 14, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, fontWeight: '600', color: '#111' },
  clearButton: { paddingLeft: 8, paddingVertical: 6 },

  // Search results
  resultsWrap: { marginTop: 10, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' },
  resultsList: { maxHeight: 210 },
  resultsContent: { paddingVertical: 6 },
  resultRow: { borderRadius: 12, overflow: 'hidden', marginHorizontal: 6, marginVertical: 4, backgroundColor: 'rgba(118,118,128,0.12)' },
  resultRowPressed: { opacity: 0.92 },
  resultInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  resultText: { flex: 1, gap: 2 },
  resultTitle: { fontSize: 13, fontWeight: '900', color: '#111' },
  resultSub: { fontSize: 11, fontWeight: '800', color: 'rgba(60,60,67,0.7)', letterSpacing: 0.4 },

  // Category chips
  chipsRow: { gap: 8, paddingTop: 10, paddingBottom: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(118,118,128,0.16)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: '#111' },
  chipText: { fontSize: 12, fontWeight: '800', color: 'rgba(60,60,67,0.75)' },
  chipTextActive: { color: '#fff' },

  // Swipe carousel
  carouselContent: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, gap: CARD_GAP },
  swipeCard: { width: CARD_W, height: 130, borderRadius: 18, overflow: 'hidden' },
  swipeCardInner: { flex: 1 },
  swipeCardImage: { ...StyleSheet.absoluteFillObject },
  swipeCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  swipeCardSelectedBadge: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#007AFF',
    alignItems: 'center', justifyContent: 'center',
  },
  swipeCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, gap: 4 },
  swipeCardCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  swipeCardCategory: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.6 },
  swipeCardTitle: { fontSize: 15, fontWeight: '900', color: '#fff', lineHeight: 18 },
  swipeCardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  swipeCardPill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999 },
  swipeCardPillGold: { backgroundColor: 'rgba(255,214,10,0.25)' },
  swipeCardPillBlue: { backgroundColor: 'rgba(0,122,255,0.4)' },
  swipeCardPillText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  swipeCardPillTextGold: { fontSize: 9, fontWeight: '800', color: '#FFD60A' },

  // Detail drawer
  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  drawerCard: { marginHorizontal: 12, borderRadius: 24, overflow: 'hidden', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, backgroundColor: 'rgba(0,0,0,0.6)' },
  drawerHandleHit: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10, marginTop: -4, marginBottom: 2 },
  drawerHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  drawerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  drawerTitleWrap: { flex: 1, paddingRight: 12 },
  drawerTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  drawerMeta: { marginTop: 2, color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '700' },
  drawerClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  drawerBody: { marginTop: 12 },
  drawerBodyContent: { gap: 14, paddingBottom: 10 },
  drawerImage: { width: '100%', height: 140, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  drawerSection: { gap: 8 },
  drawerSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  drawerSectionLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8 },
  drawerDescription: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18, fontWeight: '600' },
  bookButton: { height: 46, borderRadius: 16, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  bookText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  tourNote: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
});
