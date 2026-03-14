import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
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
import sightsJson from '../data/sights.json';
import { Sight } from '../types';
import { playAudioForSight } from '../services/audio';
import { getMapboxAccessToken } from '../config/mapbox';

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
  const drawerHeight = 320;
  const drawerTranslate = useRef(new Animated.Value(drawerHeight)).current;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ExploreFilter>('all');
  const [selectedSightId, setSelectedSightId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const sights = useMemo(() => sightsJson as Sight[], []);

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

  const openDrawer = () => {
    Animated.timing(drawerTranslate, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerTranslate, {
      toValue: drawerHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setSelectedSightId(null));
  };

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

  const handlePlay = async () => {
    if (!selectedSight) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playAudioForSight(selectedSight.id, 'quick');
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

        {filteredSights.map((sight) => (
          <Mapbox.PointAnnotation
            key={sight.id}
            id={sight.id}
            coordinate={[sight.lng, sight.lat]}
            onSelected={() => handleSelectSight(sight.id)}
          >
            <View style={styles.pinOuter}>
              <View style={styles.pinInner} />
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>

      <View style={[styles.bottomControls, { paddingBottom: Math.max(16, insets.bottom + 12) }]}>
        <BlurView intensity={80} tint="light" style={styles.controlsCard}>
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

          <View style={styles.chipsRow}>
            <TouchableOpacity
              onPress={() => setFilter('all')}
              activeOpacity={0.9}
              style={[styles.chip, filter === 'all' && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === 'all' && styles.chipTextActive]}>All</Text>
            </TouchableOpacity>
            {chips.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setFilter((v) => (v === c.value ? 'all' : c.value))}
                activeOpacity={0.9}
                style={[styles.chip, filter === c.value && styles.chipActive]}
              >
                <Ionicons
                  name={c.icon}
                  size={16}
                  color={filter === c.value ? '#fff' : 'rgba(60,60,67,0.75)'}
                  style={styles.chipIcon}
                />
                <Text style={[styles.chipText, filter === c.value && styles.chipTextActive]}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      </View>

      {selectedSight && (
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingBottom: Math.max(16, insets.bottom + 12),
              transform: [{ translateY: drawerTranslate }],
            },
          ]}
        >
          <BlurView intensity={90} tint="dark" style={styles.drawerCard}>
            <View style={styles.drawerHandle} />
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

            <View style={styles.drawerBody}>
              <Image source={{ uri: selectedSight.thumbnail }} style={styles.drawerImage} resizeMode="cover" />

              <TouchableOpacity onPress={handlePlay} activeOpacity={0.9} style={styles.playButton}>
                <Ionicons name="play" size={22} color="#0B0B0B" />
                <Text style={styles.playText}>Play Audio</Text>
              </TouchableOpacity>

              <Text style={styles.drawerDescription} numberOfLines={3}>
                {selectedSight.description}
              </Text>
            </View>
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
  pinInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
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
  drawerHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 10,
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
    gap: 12,
  },
  drawerImage: {
    width: '100%',
    height: 140,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  playButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  playText: {
    color: '#0B0B0B',
    fontSize: 16,
    fontWeight: '900',
  },
  drawerDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
});
