import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Mapbox from '@rnmapbox/maps';
import sights from '../data/sights.json';

const ROME_CENTER = [12.4922, 41.8902]; // Colosseum

interface OfflineMapProps {
  onSightPress: (sightId: string) => void;
}

export const OfflineMap: React.FC<OfflineMapProps> = ({ onSightPress }) => {
  const cameraRef = useRef<Mapbox.Camera>(null);

  useEffect(() => {
    // Optional: Center map on user location if available
  }, []);

  return (
    <View style={styles.container}>
      <Mapbox.MapView style={styles.map}>
        <Mapbox.Camera
          ref={cameraRef}
          zoomLevel={14}
          centerCoordinate={ROME_CENTER}
        />
        
        {/* User Location */}
        <Mapbox.UserLocation visible={true} showsUserHeadingIndicator={true} />

        {/* Sights Markers */}
        {sights.map((sight) => (
          <Mapbox.PointAnnotation
            key={sight.id}
            id={sight.id}
            coordinate={[sight.lng, sight.lat]}
            onSelected={() => onSightPress(sight.id)}
          >
            <View style={styles.annotationContainer}>
              <View style={styles.annotationFill} />
            </View>
          </Mapbox.PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  annotationContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  annotationFill: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    transform: [{ scale: 0.6 }],
  },
});
