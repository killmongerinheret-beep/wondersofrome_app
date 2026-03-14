import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface AudioPlayerProps {
  sightId: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ sightId }) => {
  const { isPlaying, currentSightId, currentVariant, play, stop } = useAudioPlayer();

  const isCurrentSightPlaying = isPlaying && currentSightId === sightId;

  const renderControl = (variant: 'quick' | 'deep' | 'kids', label: string, icon: keyof typeof Ionicons.glyphMap, duration: string) => {
    const isActive = isCurrentSightPlaying && currentVariant === variant;
    
    return (
      <TouchableOpacity
        style={[styles.controlButton, isActive && styles.activeControl]}
        onPress={() => isActive ? stop() : play(sightId, variant)}
      >
        <Ionicons name={isActive ? "pause" : icon} size={20} color={isActive ? "#fff" : "#007AFF"} />
        <View style={styles.textContainer}>
          <Text style={[styles.controlLabel, isActive && styles.activeText]}>{label}</Text>
          <Text style={[styles.durationLabel, isActive && styles.activeText]}>{duration}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {renderControl('quick', 'Quick', 'play', '2m')}
        {renderControl('deep', 'Deep', 'book', '10m')}
        {renderControl('kids', 'Kids', 'happy', 'Myths')}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  activeControl: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  textContainer: {
    marginLeft: 6,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  durationLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
  },
});
