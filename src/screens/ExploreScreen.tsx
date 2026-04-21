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
  StatusBar,
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute } from '@react-navigation/native';
import Mapbox from '@rnmapbox/maps';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Sight } from '../types';
import { getMapboxAccessToken } from '../constants/mapbox';
import { useSights } from '../hooks/useSights';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AudioPlayer } from '../components/AudioPlayer';
import { DownloadPackScreen } from './DownloadPackScreen';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { theme } from '../theme';
import { useContinueListening } from '../hooks/useContinueListening';
import { useAudioTours } from '../hooks/useAudioTours';
import { TourSheet } from '../components/TourSheet';
import { UpNextSheet } from '../components/UpNextSheet';
import { AudioToursScreen } from './AudioToursScreen';
import { AudioTour } from '../services/content';

const ROME_CENTER: [number, number] = [12.4922, 41.8902];
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_W = SCREEN_W * 0.85;
const CARD_GAP = 12;

const SightSwipeCard: React.FC<{
  sight: Sight;
  isSelected: boolean;
  onPress: () => void;
}> = ({ sight, isSelected, onPress }) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={[styles.swipeCard, isSelected && styles.swipeCardSelected]}
    >
      <Image source={{ uri: sight.thumbnail }} style={styles.swipeCardImage} contentFit="cover" transition={500} />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.swipeCardGradient}
      />
      <View style={styles.swipeCardContent}>
        <Text style={styles.swipeCardCategory}>{sight.category.toUpperCase()}</Text>
        <Text style={styles.swipeCardTitle} numberOfLines={1}>{sight.name}</Text>
      </View>
      {isSelected && (
        <View style={styles.swipeCardBadge}>
          <Ionicons name="volume-medium" size={16} color={theme.colors.cream} />
        </View>
      )}
    </TouchableOpacity>
  );
};

export const ExploreScreen: React.FC = () => {
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Mapbox.Camera>(null);
  const carouselRef = useRef<FlatList>(null);
  
  const { sights } = useSights();
  const [selectedSightId, setSelectedSightId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  const filteredSights = useMemo(() => {
    if (!query.trim()) return sights;
    const q = query.toLowerCase();
    return sights.filter(s => s.name.toLowerCase().includes(q));
  }, [sights, query]);

  const selectedSight = useMemo(
    () => (selectedSightId ? sights.find((s) => s.id === selectedSightId) ?? null : null),
    [selectedSightId, sights]
  );

  const sightsGeojson = useMemo(() => ({
    type: 'FeatureCollection',
    features: filteredSights.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      properties: { id: s.id },
    })),
  } as any), [filteredSights]);

  const handleSelectSight = (sightId: string) => {
    setSelectedSightId(sightId);
    const sight = sights.find(s => s.id === sightId);
    if (sight) {
      cameraRef.current?.setCamera({
        centerCoordinate: [sight.lng, sight.lat],
        zoomLevel: 16,
        animationDuration: 1000,
      });
      
      const idx = filteredSights.findIndex(s => s.id === sightId);
      if (idx >= 0) {
        carouselRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
      }
    }
  };

  useEffect(() => {
    const pick = route?.params?.pickSightId;
    if (pick) handleSelectSight(pick);
  }, [route?.params?.pickSightId]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Mapbox.MapView 
        style={styles.map} 
        styleURL="mapbox://styles/mapbox/dark-v11" // Premium Dark Style
      >
        <Mapbox.Camera ref={cameraRef} zoomLevel={13} centerCoordinate={ROME_CENTER} />
        
        <Mapbox.ShapeSource
          id="sights"
          shape={sightsGeojson}
          onPress={(e) => {
            const id = e.features[0].properties?.id;
            if (id) handleSelectSight(id);
          }}
        >
          <Mapbox.CircleLayer
            id="sight-points"
            style={{
              circleColor: theme.colors.brand,
              circleRadius: 8,
              circleStrokeColor: '#fff',
              circleStrokeWidth: 2,
            }}
          />
        </Mapbox.ShapeSource>
      </Mapbox.MapView>

      {/* Floating Header Search */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <BlurView intensity={80} tint="dark" style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search the Eternal City..."
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </BlurView>
      </View>

      {/* Horizontal Carousel */}
      <View style={[styles.carouselContainer, { bottom: Platform.OS === 'ios' ? 100 : 80 }]}>
        <FlatList
          ref={carouselRef}
          data={filteredSights}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + CARD_GAP}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          renderItem={({ item }) => (
            <SightSwipeCard
              sight={item}
              isSelected={selectedSightId === item.id}
              onPress={() => handleSelectSight(item.id)}
            />
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.colors.cream,
    fontWeight: '500',
  },
  carouselContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
  },
  carouselContent: {
    paddingHorizontal: 16,
    gap: CARD_GAP,
  },
  swipeCard: {
    width: CARD_W,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  swipeCardSelected: {
    borderColor: theme.colors.brandLight,
    borderWidth: 2,
  },
  swipeCardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  swipeCardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  swipeCardContent: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  swipeCardCategory: {
    fontSize: 10,
    fontWeight: '900',
    color: theme.colors.brandLight,
    letterSpacing: 1,
    marginBottom: 2,
  },
  swipeCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.cream,
  },
  swipeCardBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
