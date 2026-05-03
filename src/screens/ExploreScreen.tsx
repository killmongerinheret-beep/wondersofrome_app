import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AudioToursScreen } from './AudioToursScreen';
import { DownloadPackScreen } from './DownloadPackScreen';
import { AudioPlayer } from '../components/AudioPlayer';
import { TourSheet } from '../components/TourSheet';
import { UpNextSheet } from '../components/UpNextSheet';
import { getMapboxAccessToken } from '../config/mapbox';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useAudioTours } from '../hooks/useAudioTours';
import { useContinueListening } from '../hooks/useContinueListening';
import { useSights } from '../hooks/useSights';
import { AudioTour } from '../services/content';
import { getSightImage } from '../services/images';
import { Sight } from '../types';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Skeleton } from '../ui/Skeleton';
import { theme } from '../ui/theme';

type ExploreFilter = 'all' | 'ancient' | 'religious' | 'museum' | 'piazza' | 'other';

const ROME_CENTER: [number, number] = [12.4922, 41.8902];
const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.72;
const CARD_GAP = 12;
const BRAND = theme.colors.brand;
const BG = theme.colors.bg;
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 60;
const MINI_PLAYER_HEIGHT = 86;

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

  const hasAudio = !!sight.audioFiles?.en?.quick?.url?.trim() &&
                   !sight.audioFiles.en.quick.url.includes('example.com');

  return (
    <Animated.View style={[styles.swipeCard, { transform: [{ scale }] }, !hasAudio && styles.swipeCardDisabled]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.92} style={styles.swipeCardInner}>
        <Image
          source={{ uri: getSightImage(sight.id, sight.thumbnail) }}
          style={[styles.swipeCardImage, !hasAudio && styles.swipeCardImageDisabled]}
          resizeMode="cover"
        />
        <View style={styles.swipeCardOverlay} />
        {isSelected && (
          <View style={styles.swipeCardSelectedBadge}>
            <Ionicons name="checkmark" size={12} color="#000" />
          </View>
        )}
        <View style={styles.swipeCardContent}>
          <View style={styles.swipeCardCategoryRow}>
            <Ionicons
              name={CATEGORY_ICONS[sight.category] ?? 'location-outline'}
              size={11}
              color={hasAudio ? theme.colors.brand : "rgba(255,255,255,0.4)"}
            />
            <Text style={[styles.swipeCardCategory, !hasAudio && styles.swipeCardTextDisabled]}>{sight.category.toUpperCase()}</Text>
          </View>
          <Text style={[styles.swipeCardTitle, !hasAudio && styles.swipeCardTextDisabled]} numberOfLines={2}>
            {sight.name}
          </Text>
          <View style={styles.swipeCardMeta}>
            {distance != null && (
              <View style={styles.swipeCardPill}>
                <Ionicons name="navigate-outline" size={10} color={hasAudio ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)"} />
                <Text style={[styles.swipeCardPillText, !hasAudio && styles.swipeCardTextDisabled]}>
                  {distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}
                </Text>
              </View>
            )}
            {hasAudio && (
              <View style={[styles.swipeCardPill, styles.swipeCardPillBlue]}>
                <Ionicons name="headset-outline" size={10} color="#000" />
                <Text style={styles.swipeCardPillTextDark}>Audio</Text>
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
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const shapeSourceRef = useRef<any>(null);
  const carouselRef = useRef<FlatList>(null);
  const windowHeight = Dimensions.get('window').height;
  const {
    sightId: playingSightId,
    isPlaying,
    play,
    startQueue,
    queue,
    queueIndex,
    queueTitle,
    jumpToIndex,
  } = useAudioPlayer();
  const isMiniPlayerVisible = !!playingSightId;

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
  const [selectedTour, setSelectedTour] = useState<AudioTour | null>(null);
  const [upNextOpen, setUpNextOpen] = useState(false);
  const [toursHubOpen, setToursHubOpen] = useState(false);

  const { sights, loading } = useSights();
  const { top: continueTop, refresh: refreshContinue } = useContinueListening(sights);
  const { tours: audioTours } = useAudioTours();

  const filteredSights = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = sights.filter((s) => {
      if (filter !== 'all' && s.category !== filter) return false;
      if (!q) return true;
      return (
        (s.name ?? '').toLowerCase().includes(q) || (s.name_it ?? '').toLowerCase().includes(q)
      );
    });

    // Sort: Available audio first
    list.sort((a, b) => {
      const hasA = !!a.audioFiles?.en?.quick?.url?.trim() && !a.audioFiles.en.quick.url.includes('example.com');
      const hasB = !!b.audioFiles?.en?.quick?.url?.trim() && !b.audioFiles.en.quick.url.includes('example.com');
      if (hasA && !hasB) return -1;
      if (!hasA && hasB) return 1;
      return 0;
    });

    return list;
  }, [filter, query, sights]);

  const selectedSight = useMemo(
    () => (selectedSightId ? (sights.find((s) => s.id === selectedSightId) ?? null) : null),
    [selectedSightId, sights]
  );

  const sightsGeojson = useMemo(
    () =>
      ({
        type: 'FeatureCollection',
        features: filteredSights.map((s) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
          properties: { id: s.id, category: s.category, name: s.name },
        })),
      }) as any,
    [filteredSights]
  );

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

  useEffect(() => {
    refreshContinue().catch(() => {});
  }, [isPlaying, playingSightId, refreshContinue]);

  const playableTours = useMemo(() => {
    return (audioTours ?? []).filter((t) => (t.stops?.length ?? 0) >= 2);
  }, [audioTours]);

  const tourStopSights = useMemo(() => {
    if (!queue?.length) return [];
    const mapped = queue
      .map((q) => sights.find((s) => s.id === q.sightId))
      .filter((s): s is Sight => !!s);
    return mapped;
  }, [queue, sights]);

  const tourRouteGeojson = useMemo(() => {
    if (tourStopSights.length < 2) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: tourStopSights.map((s) => [s.lng, s.lat]),
          },
          properties: {},
        },
      ],
    } as any;
  }, [tourStopSights]);

  const tourStopsGeojson = useMemo(() => {
    if (tourStopSights.length < 1) return null;
    return {
      type: 'FeatureCollection',
      features: tourStopSights.map((s, idx) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { id: s.id, idx, active: idx === queueIndex ? 1 : 0 },
      })),
    } as any;
  }, [queueIndex, tourStopSights]);

  // ── Drawer helpers ──────────────────────────────────────────────────────────
  const animateDrawerTo = (y: number, velocity?: number) => {
    Animated.spring(drawerTranslate, {
      toValue: y,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
      velocity,
    }).start();
  };
  const openDrawer = () => animateDrawerTo(drawerCollapsedY);
  const expandDrawer = () => animateDrawerTo(0);
  const closeDrawer = () => {
    Animated.timing(drawerTranslate, {
      toValue: drawerHiddenY,
      duration: 170,
      useNativeDriver: true,
    }).start(() => setSelectedSightId(null));
  };

  const onHandleDrag = (_: any, g: PanResponderGestureState) => {
    drawerTranslate.setValue(Math.max(0, Math.min(drawerHiddenY, drawerDragStart.current + g.dy)));
  };
  const onHandleRelease = (_: any, g: PanResponderGestureState) => {
    if (g.vy > 0.75 || drawerDragStart.current + g.dy > drawerMaxHeight * 0.7) {
      closeDrawer();
      return;
    }
    const projected = drawerDragStart.current + g.dy + g.vy * 80;
    if (projected < drawerMaxHeight * 0.35) {
      expandDrawer();
      return;
    }
    animateDrawerTo(drawerCollapsedY);
  };

  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, g) =>
          Math.abs(g.dy) > 4 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderGrant: () => {
          drawerTranslate.stopAnimation((v) => {
            drawerDragStart.current = typeof v === 'number' ? v : 0;
          });
        },
        onPanResponderMove: onHandleDrag,
        onPanResponderRelease: onHandleRelease,
        onPanResponderTerminate: onHandleRelease,
      }),
    [drawerCollapsedY, drawerHiddenY, drawerMaxHeight]
  );

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

  useEffect(() => {
    const pick = String(route?.params?.pickSightId ?? '').trim();
    if (!pick) return;
    handleSelectSight(pick);
  }, [route?.params?.pickSightId]);

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
          cameraRef.current?.setCamera({
            centerCoordinate: coords,
            zoomLevel: zoom ?? 15,
            animationDuration: 420,
          });
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

  const categoryCounts = useMemo(() => {
    const counts: Record<Exclude<ExploreFilter, 'all'>, number> = {
      ancient: 0,
      religious: 0,
      museum: 0,
      piazza: 0,
      other: 0,
    };
    for (const s of sights) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  }, [sights]);

  const chips = useMemo(() => {
    const config: {
      label: string;
      value: Exclude<ExploreFilter, 'all'>;
      icon: keyof typeof Ionicons.glyphMap;
    }[] = [
      { label: 'Ancient', value: 'ancient', icon: 'business-outline' },
      { label: 'Churches', value: 'religious', icon: 'library-outline' },
      { label: 'Museums', value: 'museum', icon: 'color-palette-outline' },
      { label: 'Piazzas', value: 'piazza', icon: 'sunny-outline' },
      { label: 'Hidden', value: 'other', icon: 'sparkles-outline' },
    ];
    return config.filter((c) => (categoryCounts[c.value] ?? 0) > 0);
  }, [categoryCounts]);

  if (!accessToken) {
    return (
      <View style={styles.noTokenContainer}>
        <Text style={styles.noTokenTitle}>Mapbox token needed</Text>
        <Text style={styles.noTokenBody}>
          Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env file, then rebuild.
        </Text>
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
            if (loc?.coords)
              setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }}
        />

        {!!tourRouteGeojson && (
          <Mapbox.ShapeSource id="tour-route" shape={tourRouteGeojson}>
            <Mapbox.LineLayer
              id="tour-route-line"
              style={{
                lineColor: BRAND,
                lineWidth: 4,
                lineOpacity: 0.85,
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          </Mapbox.ShapeSource>
        )}

        {!!tourStopsGeojson && (
          <Mapbox.ShapeSource id="tour-stops" shape={tourStopsGeojson}>
            <Mapbox.CircleLayer
              id="tour-stops-halo"
              style={{
                circleColor: '#fff',
                circleOpacity: ['case', ['==', ['get', 'active'], 1], 1, 0.6],
                circleRadius: ['case', ['==', ['get', 'active'], 1], 10, 7],
              }}
            />
            <Mapbox.CircleLayer
              id="tour-stops-core"
              style={{
                circleColor: BRAND,
                circleOpacity: 1,
                circleRadius: ['case', ['==', ['get', 'active'], 1], 6, 4],
              }}
            />
          </Mapbox.ShapeSource>
        )}

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
            style={{
              circleColor: theme.colors.brand,
              circleOpacity: 0.95,
              circleRadius: ['step', ['get', 'point_count'], 18, 10, 22, 30, 28],
            }}
          />
          <Mapbox.SymbolLayer
            id="cluster-count"
            filter={['has', 'point_count']}
            style={{
              textField: ['get', 'point_count'],
              textSize: 12,
              textColor: '#000',
              textFont: ['System Bold'],
            }}
          />
          <Mapbox.CircleLayer
            id="sight-selected"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['==', ['get', 'id'], selectedSightId ?? ''],
            ]}
            style={{
              circleColor: '#fff',
              circleOpacity: 1,
              circleStrokeColor: theme.colors.brand,
              circleStrokeWidth: 3,
              circleRadius: 14,
            }}
          />
          <Mapbox.CircleLayer
            id="sight-points"
            filter={[
              'all',
              ['!', ['has', 'point_count']],
              ['!=', ['get', 'id'], selectedSightId ?? ''],
            ]}
            style={{
              circleColor: '#fff',
              circleOpacity: 1,
              circleStrokeColor: '#111',
              circleStrokeWidth: 2,
              circleRadius: 10,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* Recenter */}
      <View style={[styles.recenterWrap, { top: insets.top + 12 }]}>
        <AnimatedPressable
          onPress={handleRecenter}
          haptics="light"
          disabled={!userLocation}
          accessibilityRole="button"
          accessibilityLabel="Recenter map"
          style={[styles.mapBtn, !userLocation && styles.mapBtnDisabled]}
          pressedStyle={{ opacity: 0.85 }}
        >
          <BlurView intensity={20} tint="dark" style={styles.mapBtnBlur}>
            <Ionicons name="locate" size={20} color="#fff" />
          </BlurView>
        </AnimatedPressable>
      </View>

      {/* Download pack */}
      <View style={[styles.downloadBtnWrap, { top: insets.top + 12 }]}>
        <AnimatedPressable
          onPress={() => setShowDownloadPack(true)}
          haptics="light"
          accessibilityRole="button"
          accessibilityLabel="Open offline downloads"
          style={styles.mapBtn}
          pressedStyle={{ opacity: 0.85 }}
        >
          <BlurView intensity={20} tint="dark" style={styles.mapBtnBlur}>
            <Ionicons name="cloud-download" size={20} color="#fff" />
          </BlurView>
        </AnimatedPressable>
      </View>

      {/* Bottom controls: search + chips + swipe carousel */}
      <View
        style={[
          styles.bottomControls,
          {
            bottom: TAB_BAR_HEIGHT + (isMiniPlayerVisible ? MINI_PLAYER_HEIGHT + 12 : 0),
            paddingBottom: 12,
          },
        ]}
      >
        <BlurView intensity={30} tint="dark" style={styles.controlsCard}>
          {loading && (
            <View style={styles.loadingRow}>
              <Skeleton style={styles.loadingPill} />
              <Skeleton style={styles.loadingPillSmall} />
            </View>
          )}

          {!!queue?.length && (
            <AnimatedPressable
              onPress={() => setUpNextOpen(true)}
              haptics="light"
              style={styles.tourNowCard}
              pressedStyle={styles.tourNowCardPressed}
            >
              <View style={styles.tourNowRow}>
                <View style={styles.tourNowIcon}>
                  <Ionicons name="walk" size={16} color="#000" />
                </View>
                <View style={styles.tourNowText}>
                  <Text style={styles.tourNowLabel} numberOfLines={1}>
                    Tour playing
                  </Text>
                  <Text style={styles.tourNowTitle} numberOfLines={1}>
                    {queueTitle?.trim() ? queueTitle : 'Walking tour'}
                  </Text>
                </View>
                <View style={styles.tourNowPill}>
                  <Text style={styles.tourNowPillText}>
                    {queueIndex + 1}/{queue.length}
                  </Text>
                  <Ionicons name="chevron-up" size={14} color="#000" />
                </View>
              </View>
            </AnimatedPressable>
          )}

          {!!continueTop && !isMiniPlayerVisible && (
            <AnimatedPressable
              onPress={() => {
                const key = continueTop.progress.last_played_variant ?? 'en_quick';
                const [lang, vRaw] = key.split('_');
                const v = (vRaw || 'quick') as any;
                const url = (continueTop.sight.audioFiles as any)?.[lang || 'en']?.[v]?.url;
                play(continueTop.sight.id, key, url);
              }}
              haptics="light"
              style={styles.continueCard}
              pressedStyle={styles.continueCardPressed}
            >
              <View style={styles.continueRow}>
                <View style={styles.continueThumbWrap}>
                  <Image
                    source={{ uri: getSightImage(continueTop.sight.id, continueTop.sight.thumbnail) }}
                    style={styles.continueThumb}
                  />
                </View>
                <View style={styles.continueText}>
                  <Text style={styles.continueLabel}>Continue listening</Text>
                  <Text style={styles.continueTitle} numberOfLines={1}>
                    {continueTop.sight.name}
                  </Text>
                </View>
                <View style={styles.continueBtn}>
                  <Ionicons name="play" size={16} color="#000" />
                </View>
              </View>
            </AnimatedPressable>
          )}

          {playableTours.length > 0 && !isMiniPlayerVisible && (
            <View style={styles.toursBlock}>
              <View style={styles.toursHeader}>
                <Text style={styles.toursTitle}>Walking tours</Text>
                <TouchableOpacity
                  onPress={() => setToursHubOpen(true)}
                  activeOpacity={0.85}
                  style={styles.seeAllBtn}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                  <Ionicons name="chevron-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.toursRow}
              >
                {playableTours.slice(0, 8).map((t) => (
                  <AnimatedPressable
                    key={t.id}
                    haptics="light"
                    style={styles.tourCard}
                    pressedStyle={styles.tourCardPressed}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedTour(t);
                    }}
                  >
                    <Image
                      source={{ uri: getSightImage(t.id, t.thumbnail) }}
                      style={styles.tourCardImage}
                      resizeMode="cover"
                    />
                    <View style={styles.tourCardOverlay} />
                    <View style={styles.tourCardContent}>
                      <Text style={styles.tourCardLabel} numberOfLines={1}>
                        {t.duration ? `${t.duration} · ` : ''}
                        {t.stops?.length ?? 0} stops
                      </Text>
                      <Text style={styles.tourCardTitle} numberOfLines={2}>
                        {t.title}
                      </Text>
                    </View>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Search */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" />
            <TextInput
              onChangeText={setQuery}
              placeholder="Search sights…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>

          {/* Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            <AnimatedPressable
              onPress={() => setFilter('all')}
              haptics="light"
              style={[styles.chip, filter === 'all' && styles.chipActive]}
              pressedStyle={styles.chipPressed}
            >
              <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>All</Text>
            </AnimatedPressable>
            {chips.map((c) => (
              <AnimatedPressable
                key={c.value}
                onPress={() => setFilter((v) => (v === c.value ? 'all' : c.value))}
                haptics="light"
                style={[styles.chip, filter === c.value && styles.chipActive]}
                pressedStyle={styles.chipPressed}
              >
                <Ionicons
                  name={c.icon}
                  size={14}
                  color={filter === c.value ? '#000' : 'rgba(255,255,255,0.6)'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.chipText, filter === c.value && styles.chipTextActive]}>
                  {c.label}
                </Text>
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
            renderItem={({ item }) => (
              <SightSwipeCard
                sight={item}
                isSelected={selectedSightId === item.id}
                distance={
                  userLocation
                    ? distanceMeters(userLocation, { lat: item.lat, lng: item.lng })
                    : null
                }
                onPress={() => handleSelectSight(item.id)}
              />
            )}
          />
        )}
      </View>

      <Modal visible={showDownloadPack} animationType="slide" presentationStyle="fullScreen">
        <DownloadPackScreen onClose={() => setShowDownloadPack(false)} />
      </Modal>

      <Modal visible={toursHubOpen} animationType="slide" presentationStyle="fullScreen">
        <AudioToursScreen
          tours={audioTours}
          onClose={() => setToursHubOpen(false)}
          onOpenTour={(t) => {
            setToursHubOpen(false);
            setSelectedTour(t);
          }}
        />
      </Modal>

      <TourSheet
        visible={!!selectedTour}
        tour={selectedTour}
        onClose={() => setSelectedTour(null)}
        onStartAt={(index, lang, variant) => {
          const t = selectedTour;
          if (!t) return;
          const stops = (t.stops ?? []) as any[];
          const key = `${lang}_${variant}`;
          const items = stops
            .filter((s) => s?.id)
            .map((s) => ({
              sightId: s.id,
              variant: key,
              remoteUrl: s.audioFiles?.[lang]?.[variant]?.url,
              title: s.name,
            }));
          if (items.length < 1) return;
          const startAt = Math.max(0, Math.min(items.length - 1, index));
          startQueue(items, startAt, t.title);
          handleSelectSight(items[startAt].sightId);
          setSelectedTour(null);
        }}
      />

      {!!queue?.length && (
        <UpNextSheet
          visible={upNextOpen}
          title={queueTitle}
          items={queue}
          activeIndex={queueIndex}
          onClose={() => setUpNextOpen(false)}
          onSelectIndex={(idx) => {
            jumpToIndex(idx);
            setUpNextOpen(false);
            const next = queue[idx];
            if (next?.sightId) handleSelectSight(next.sightId);
          }}
        />
      )}

      {/* Detail drawer */}
      {selectedSight && (
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingBottom: Math.max(16, insets.bottom + 12),
              height: drawerMaxHeight,
              transform: [{ translateY: drawerTranslate }],
            },
          ]}
        >
          <BlurView intensity={40} tint="dark" style={styles.drawerCard}>
            <View style={styles.drawerHandleHit} {...drawerPanResponder.panHandlers}>
              <View style={styles.drawerHandle} />
            </View>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleWrap}>
                <Text style={styles.drawerTitle} numberOfLines={1}>
                  {selectedSight.name}
                </Text>
                <Text style={styles.drawerMeta}>
                  {currentDistance != null
                    ? `${currentDistance < 1000 ? `${currentDistance}m` : `${(currentDistance / 1000).toFixed(1)}km`} away`
                    : 'Audio guide available'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={closeDrawer}
                style={styles.drawerClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.drawerBody}
              contentContainerStyle={styles.drawerBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={{ uri: getSightImage(selectedSight.id, selectedSight.thumbnail) }}
                style={styles.drawerImage}
                resizeMode="cover"
              />

              {/* Audio guide section */}
              <View style={styles.drawerSection}>
                <View style={styles.drawerSectionHeader}>
                  <Ionicons name="headset" size={14} color={theme.colors.brand} />
                  <Text style={styles.drawerSectionLabel}>AUDIO GUIDE</Text>
                </View>
                <AudioPlayer sight={selectedSight} />
              </View>

              {/* Book tour section */}
              {selectedSight.linkedTour && (
                <View style={styles.drawerSection}>
                  <View style={styles.drawerSectionHeader}>
                    <Ionicons name="ticket" size={14} color={theme.colors.brand} />
                    <Text style={styles.drawerSectionLabel}>GUIDED TOUR</Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleBookNow}
                    activeOpacity={0.9}
                    style={styles.bookButton}
                  >
                    <Text style={styles.bookText}>
                      {selectedSight.linkedTour.title?.trim()
                        ? selectedSight.linkedTour.title
                        : 'Book Tour'}
                      {selectedSight.linkedTour.price
                        ? ` · €${selectedSight.linkedTour.price}`
                        : ''}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color="#000" />
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.drawerDescription}>{selectedSight.description}</Text>

              {!!selectedSight.tips?.length && (
                <View style={styles.drawerSection}>
                  <View style={styles.drawerSectionHeader}>
                    <Ionicons name="bulb" size={14} color={theme.colors.brand} />
                    <Text style={styles.drawerSectionLabel}>TIPS</Text>
                  </View>
                  <View style={styles.tipsWrap}>
                    {selectedSight.tips.slice(0, 6).map((t, idx) => (
                      <View key={`${selectedSight.id}-tip-${idx}`} style={styles.tipRow}>
                        <View style={styles.tipDot} />
                        <Text style={styles.tipText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
  noTokenBody: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  noTokenStep: { marginTop: 14, color: '#fff', fontSize: 13, fontWeight: '800' },
  map: { flex: 1 },

  recenterWrap: { position: 'absolute', left: 16 },
  downloadBtnWrap: { position: 'absolute', right: 16 },
  mapBtn: { borderRadius: 22, overflow: 'hidden' },
  mapBtnDisabled: { opacity: 0.4 },
  mapBtnBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  bottomControls: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  controlsCard: {
    marginHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  continueCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  continueCardPressed: { opacity: 0.92 },
  tourNowCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: BRAND,
    marginBottom: 12,
  },
  tourNowCardPressed: { opacity: 0.92 },
  tourNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  tourNowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tourNowText: { flex: 1, gap: 2 },
  tourNowLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 0.5,
  },
  tourNowTitle: { fontSize: 14, fontWeight: '900', color: '#000' },
  tourNowPill: {
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tourNowPillText: { color: '#000', fontSize: 13, fontWeight: '900' },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 12,
  },
  continueThumbWrap: { width: 44, height: 44, borderRadius: 8, overflow: 'hidden' },
  continueThumb: { width: '100%', height: '100%' },
  continueText: { flex: 1, gap: 2 },
  continueLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
  continueTitle: { fontSize: 14, fontWeight: '900', color: '#fff' },
  continueBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toursBlock: { marginBottom: 14 },
  toursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  toursTitle: { fontSize: 15, fontWeight: '900', color: '#fff' },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: { fontSize: 12, fontWeight: '900', color: theme.colors.brand },
  toursRow: { gap: 12 },
  tourCard: {
    width: 220,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#181818',
  },
  tourCardPressed: { opacity: 0.92 },
  tourCardImage: { ...StyleSheet.absoluteFillObject },
  tourCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  tourCardContent: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 4 },
  tourCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.brand,
    letterSpacing: 0.5,
  },
  tourCardTitle: { fontSize: 15, fontWeight: '900', color: '#fff', lineHeight: 18 },
  loadingRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  loadingPill: { height: 16, borderRadius: 999, flex: 1 },
  loadingPillSmall: { height: 16, borderRadius: 999, width: 84 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  chipsRow: {
    gap: 10,
    paddingTop: 14,
    paddingBottom: 2,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  chipPressed: { opacity: 0.86 },
  chipActive: { backgroundColor: '#fff' },
  chipText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.6)' },
  chipTextActive: { color: '#000' },

  carouselContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 6, gap: CARD_GAP },
  swipeCard: { width: CARD_W, height: 140, borderRadius: 14, overflow: 'hidden' },
  swipeCardDisabled: { opacity: 0.8 },
  swipeCardInner: { flex: 1 },
  swipeCardImage: { ...StyleSheet.absoluteFillObject },
  swipeCardImageDisabled: { opacity: 0.35 },
  swipeCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  swipeCardSelectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeCardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, gap: 4 },
  swipeCardCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swipeCardCategory: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.8,
  },
  swipeCardTitle: { fontSize: 16, fontWeight: '900', color: '#fff', lineHeight: 20 },
  swipeCardTextDisabled: { color: 'rgba(255,255,255,0.3)' },
  swipeCardMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  swipeCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  swipeCardPillBlue: { backgroundColor: theme.colors.brand },
  swipeCardPillText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  swipeCardPillTextDark: { fontSize: 10, fontWeight: '900', color: '#000' },

  drawer: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  drawerCard: {
    marginHorizontal: 10,
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  drawerHandleHit: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: -4,
    marginBottom: 2,
  },
  drawerHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  drawerTitleWrap: { flex: 1, paddingRight: 12 },
  drawerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  drawerMeta: { marginTop: 2, color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '700' },
  drawerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: { marginTop: 14 },
  drawerBodyContent: { gap: 18, paddingBottom: 10 },
  drawerImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#111',
  },
  drawerSection: { gap: 12 },
  drawerSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  drawerSectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
  },
  drawerDescription: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  bookButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
  },
  bookText: { color: '#000', fontSize: 16, fontWeight: '900' },
  tipsWrap: { gap: 12, marginTop: 2 },
  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.brand,
    marginTop: 7,
  },
  tipText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
});
