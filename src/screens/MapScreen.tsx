import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { OfflineMap } from '../components/OfflineMap';
import { AudioPlayer } from '../components/AudioPlayer';

export const MapScreen: React.FC = () => {
  const [selectedSight, setSelectedSight] = useState<string | null>(null);

  const handleSightPress = (sightId: string) => {
    setSelectedSight(sightId);
  };

  return (
    <View style={styles.container}>
      <OfflineMap onSightPress={handleSightPress} />
      {selectedSight && (
        <View style={styles.playerContainer}>
          <AudioPlayer sightId={selectedSight} />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setSelectedSight(null)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  closeButton: {
    marginTop: 8,
    alignSelf: 'center',
    padding: 8,
  },
  closeText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
