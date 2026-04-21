import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AnimatedPressable } from './AnimatedPressable';

const { width } = Dimensions.get('window');

export const MiniPlayer: React.FC = () => {
  const { currentSight, isPlaying, togglePlay, progress } = useAudioPlayer();

  if (!currentSight) return null;

  return (
    <View style={styles.outerContainer}>
      <AnimatedPressable style={styles.container}>
        <BlurView intensity={90} tint="dark" style={styles.blur}>
          <View style={styles.content}>
            <Image source={{ uri: currentSight.thumbnail }} style={styles.image} contentFit="cover" transition={500} />
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{currentSight.name}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>Audio Tour • Wonders of Rome</Text>
            </View>
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => {}} style={styles.iconButton}>
                <Ionicons name="bluetooth" size={20} color={theme.colors.brandLight} />
              </TouchableOpacity>
              <TouchableOpacity onPress={togglePlay} style={styles.playButton}>
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={theme.colors.cream} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Progress Line */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressLine, { width: `${(progress ?? 0) * 100}%` }]} />
          </View>
        </BlurView>
      </AnimatedPressable>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 95 : 72, // Above the tab bar
    left: 8,
    right: 8,
    zIndex: 100,
  },
  container: {
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  blur: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: theme.colors.cream,
    fontSize: 13,
    fontWeight: 'bold',
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  playButton: {
    padding: 4,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressLine: {
    height: '100%',
    backgroundColor: theme.colors.cream, // White/Cream progress like Spotify
  }
});
