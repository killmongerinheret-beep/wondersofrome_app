import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  PanResponderGestureState,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
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
import { Linking, Modal } from 'react-native';
import { DownloadPackScreen } from './DownloadPackScreen';
import { AnimatedPressable } from '../ui/AnimatedPressable';
import { Skeleton } from '../ui/Skeleton';

type ExploreFilter = 'all' | 'museum' | 'religious' | 'other' | 'piazza';

const ROME_CENTER: [number, number] = [12.4922, 41.8902];

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const earthRadius = 6371000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.round(earthRadius * c);
};

export const ExploreScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const shapeSourceRef = useRef<any>(null);
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
      const name = (s.name ?? '').toLowerCase();
      const nameIt = (s.name_it ?? '').toLowerCase();
      return name.includes(q) || nameIt.includes(q);
    });
  }, [filter, query, sights]);

  const selectedSight = useMemo(() => {
    if (!selectedSightId) return null;
    return sights.find((s) => s.id === selectedSightId) ?? null;
  }, [selectedSightId, sights]);

  const sightsGeojson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: filteredSights.map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
        properties: { id: s.id, category: s.category, name: s.name },
      })),
    } as any;
  }, [filteredSights]);

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

  const animateDrawerTo = (y: number, velocity?: number) => {
    Animated.spring(drawerTranslate, {
      toValue: y,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
      velocity,
    }).start();
  };

  const openDrawer = () => {
    animateDrawerTo(drawerCollapsedY);
  };

  const expandDrawer = () => {
    animateDrawerTo(0);
  };

  const closeDrawer = () => {
    Animated.timing(drawerTranslate, {
      toValue: drawerHiddenY,
      duration: 170,
      useNativeDriver: true,
    }).start(() => setSelectedSightId(null));
  };

  const onHandleDrag = (_: any, gesture: PanResponderGestureState) => {
    const next = Math.max(0, Math.min(drawerHiddenY, drawerDragStart.current + gesture.dy));
    drawerTranslate.setValue(next);
  };

  const onHandleRelease = (_: any, gesture: PanResponderGestureState) => {
    const vy = gesture.vy;
    const shouldClose = vy > 0.75 || drawerDragStart.current + gesture.dy > drawerMaxHeight * 0.7;
    if (shouldClose) {
      closeDrawer();
      return;
    }
    const projected = drawerDragStart.current + gesture.dy + vy * 80;
    if (projected < drawerMaxHeight * 0.35) {
      expandDrawer();
      return;
    }
    animateDrawerTo(drawerCollapsedY);
  };

  const drawerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
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
    const isCluster = !!props.cluster;
    if (isCluster) {
      try {
        const zoom = await shapeSourceRef.current?.getClusterExpansionZoom(feature);
        const coords = feature.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length === 2) {
          cameraRef.current?.setCamera({
            centerCoordinate: coords,
            zoomLevel: typeof zoom === 'number' ? zoom : 15,
            animationDuration: 420,
          });
        }
      } catch {
      }
      return;
    }
    const id = String(props.id ?? '').trim();
    if (id) handleSelectSight(id);
  };

  const chips: Array<{ label: string; value: ExploreFilter; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: 'Museums', value: 'museum', icon: 'color-palette-outline' },
    { label: 'Churches', value: 'religious', icon: 'library-outline' },
    { label: 'Agency Secrets', value: 'other', icon: 'sparkles-outline' },
    { label: 'Gelato', value: 'piazza', icon: 'ice-cream-outline' },
  ];

  const currentDistance = useMemo(() => {
    if (!selectedSight || !userLocation) return null;
    return distanceMeters(userLocation, { lat: selectedSight.lat, lng: selectedSight.lng });
  }, [selectedSight, userLocation]);

  const accessToken = useMemo(() => getMapboxAccessToken(), []);

  const handleBookNow = async () => {
    if (!selectedSight?.linkedTour) return;
    const domain = selectedSight.linkedTour.site?.domain ?? 'https://ticketsinrome.com';
    const url = `${domain}/tour/${selectedSight.linkedTour.slug}`;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Linking.openURL(url);
  };

  if (!accessToken) {
    return (
      <View style={styles.noTokenContainer}>
        <Text style={styles.noTokenTitle}>Mapbox token needed</Text>
        <Text style={styles.noTokenBody}>
          Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN (a public pk.* token), then rebuild the dev client.
        </Text>
        <View style={styles.noTokenSteps}>
          <Text style={styles.noTokenStep}>1) Set env var: EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk...</Text>
          <Text style={styles.noTokenStep}>2) Run: npx expo run:android</Text>
        </View>
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
            if (!loc?.coords) return;
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
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
            style={{
              circleColor: 'rgba(0,122,255,0.9)',
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
              textColor: '#fff',
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
              circleColor: '#111',
              circleOpacity: 1,
              circleStrokeColor: '#fff',
              circleStrokeWidth: 2,
              circleRadius: 12,
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
              circleStrokeColor: '#007AFF',
              circleStrokeWidth: 2,
              circleRadius: 10,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* Recenter button — top left */}
      <View style={[styles.recenterWrap, { top: insets.top + 12 }]}>
        <AnimatedPressable
          onPress={handleRecenter}
          haptics="light"
          disabled={!userLocation}
          style={[styles.recenterBtn, !userLocation && styles.recenterBtnDisabled]}
          pressedStyle={styles.recenterBtnPressed}
        >
          <BlurView intensity={80} tint="dark" style={styles.recenterBtnBlur}>
            <Ionicons name="locate-outline" size={18} color="#fff" />
          </BlurView>
        </AnimatedPressable>
      </View>

      {/* Download pack button — top right */}
      <View style={[styles.downloadBtnWrap, { top: insets.top + 12 }]}>
        <AnimatedPressable
          onPress={() => setShowDownloadPack(true)}
          haptics="light"
          style={styles.downloadBtn}
          pressedStyle={styles.downloadBtnPressed}
        >
          <BlurView intensity={80} tint="dark" style={styles.downloadBtnBlur}>
            <Ionicons name="cloud-download-outline" size={18} color="#fff" />
          </BlurView>
        </AnimatedPressable>
      </View>

      <View style={[styles.bottomControls, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        <BlurView intensity={80} tint="light" style={styles.controlsCard}>
          {loading && (
            <View style={styles.loadingRow}>
              <Skeleton style={styles.loadingPill} />
              <Skeleton style={styles.loadingPillSmall} />
            </View>
          )}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color="rgba(60,60,67,0.75)" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search places…"
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

          {topResults.length > 0 && (
            <Animated.View
              style={[
                styles.resultsWrap,
                {
                  opacity: resultsAnim,
                  transform: [
                    {
                      translateY: resultsAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <ScrollView
                style={styles.resultsList}
                contentContainerStyle={styles.resultsContent}
                showsVerticalScrollIndicator={false}
              >
                {topResults.map((s) => (
                  <AnimatedPressable
                    key={s.id}
                    onPress={() => handlePickResult(s)}
                    haptics="light"
                    style={styles.resultRow}
                    pressedStyle={styles.resultRowPressed}
                  >
                    <View style={styles.resultInner}>
                      <View style={styles.resultText}>
                        <Text style={styles.resultTitle} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={styles.resultSub} numberOfLines={1}>
                          {s.category.toUpperCase()}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color="rgba(60,60,67,0.75)" />
                    </View>
                  </AnimatedPressable>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          <View style={styles.chipsRow}>
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
                  size={16}
                  color={filter === c.value ? '#fff' : 'rgba(60,60,67,0.75)'}
                  style={styles.chipIcon}
                />
                <Text style={[styles.chipText, filter === c.value && styles.chipTextActive]}>{c.label}</Text>
              </AnimatedPressable>
            ))}
          </View>
        </BlurView>
      </View>

      {/* Offline download modal */}
      <Modal visible={showDownloadPack} animationType="slide" presentationStyle="fullScreen">
        <DownloadPackScreen onClose={() => setShowDownloadPack(false)} />
      </Modal>

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
          <BlurView intensity={90} tint="dark" style={styles.drawerCard}>
            <View style={styles.drawerHandleHit} {...drawerPanResponder.panHandlers}>
              <View style={styles.drawerHandle} />
            </View>
            <View style={styles.drawerHeader}>
              <View style={styles.drawerTitleWrap}>
                <Text style={styles.drawerTitle} numberOfLines={1}>
                  {selectedSight.name}
                </Text>
                <Text style={styles.drawerMeta}>
                  {currentDistance != null ? `${currentDistance} m away` : 'Distance unavailable'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeDrawer} style={styles.drawerClose} activeOpacity={0.8}>
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.drawerBody} contentContainerStyle={styles.drawerBodyContent} showsVerticalScrollIndicator={false}>
              <Image source={{ uri: selectedSight.thumbnail }} style={styles.drawerImage} resizeMode="cover" />

              <AudioPlayer sight={selectedSight} />

              {selectedSight.linkedTour && (
                <TouchableOpacity onPress={handleBookNow} activeOpacity={0.9} style={styles.bookButton}>
                  <Ionicons name="ticket-outline" size={18} color="#fff" />
                  <Text style={styles.bookText}>
                    Book Tour{selectedSight.linkedTour.price ? ` · €${selectedSight.linkedTour.price}` : ''}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.drawerDescription} numberOfLines={3}>
                {selectedSight.description}
              </Text>
            </ScrollView>
          </BlurView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  noTokenContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  noTokenTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  noTokenBody: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  noTokenSteps: {
    marginTop: 14,
    gap: 8,
  },
  noTokenStep: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  map: {
    flex: 1,
  },
  pinOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  pinOuterActive: {
    borderColor: '#111',
    backgroundColor: '#111',
    transform: [{ scale: 1.12 }],
  },
  pinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  pinInnerActive: {
    backgroundColor: '#fff',
    transform: [{ scale: 0.92 }],
  },
  recenterWrap: {
    position: 'absolute',
    left: 16,
  },
  recenterBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  recenterBtnDisabled: {
    opacity: 0.4,
  },
  recenterBtnPressed: {
    opacity: 0.92,
  },
  recenterBtnBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  controlsCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  loadingPill: {
    height: 16,
    borderRadius: 999,
    flex: 1,
  },
  loadingPillSmall: {
    height: 16,
    borderRadius: 999,
    width: 84,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118,118,128,0.16)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  clearButton: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  resultsWrap: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  resultsList: {
    maxHeight: 210,
  },
  resultsContent: {
    paddingVertical: 6,
  },
  resultRow: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 6,
    marginVertical: 4,
    backgroundColor: 'rgba(118,118,128,0.12)',
  },
  resultRowPressed: {
    opacity: 0.92,
  },
  resultInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#111',
  },
  resultSub: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(60,60,67,0.7)',
    letterSpacing: 0.4,
  },
  chipsRow: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(118,118,128,0.16)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipPressed: {
    opacity: 0.92,
  },
  chipActive: {
    backgroundColor: '#111',
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(60,60,67,0.75)',
  },
  chipTextActive: {
    color: '#fff',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  drawerCard: {
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  drawerTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  drawerMeta: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
  },
  drawerClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: {
    marginTop: 12,
  },
  drawerBodyContent: {
    gap: 12,
    paddingBottom: 10,
  },
  drawerImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  drawerDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  bookButton: {
    height: 46,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bookText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  downloadBtnWrap: {
    position: 'absolute',
    right: 16,
  },
  downloadBtn: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  downloadBtnPressed: {
    opacity: 0.92,
  },
  downloadBtnBlur: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
