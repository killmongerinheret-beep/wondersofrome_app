import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AudioPlayer } from './AudioPlayer';
import { Sight } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface SightCardProps {
  sight: Sight;
  onDownload: () => void;
  isDownloaded: boolean;
  isDownloading: boolean;
  language: 'en' | 'it';
}

export const SightCard: React.FC<SightCardProps> = ({ sight, onDownload, isDownloaded, isDownloading, language }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDownloadPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDownload();
  };

  const imageUri = useMemo(() => {
    const uri = sight.thumbnail?.trim();
    if (!uri) return null;
    return uri;
  }, [sight.thumbnail]);

  const displayName = useMemo(() => {
    if (language === 'it' && sight.name_it?.trim()) return sight.name_it.trim();
    return sight.name;
  }, [language, sight.name, sight.name_it]);

  const tips = useMemo(() => {
    if (sight.tips && sight.tips.length > 0) return sight.tips;
    if (!sight.has_tips) return [];
    if (sight.category === 'religious') return ['Dress respectfully (shoulders/knees covered).', 'Quiet voices inside.'];
    if (sight.category === 'museum') return ['Book a time slot if possible.', 'Go early for shorter queues.'];
    if (sight.category === 'piazza') return ['Best photos at golden hour.', 'Watch your belongings in crowds.'];
    return ['Go early to avoid crowds.', 'Carry water, especially in summer.'];
  }, [sight.category, sight.has_tips, sight.tips]);

  const handleToggleDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDetails((v) => !v);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {imageUri && !imageFailed ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <View style={styles.fallbackImage}>
            <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.85)" />
          </View>
        )}
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        />

        <View style={styles.textOverlay}>
          <Text style={styles.category}>{sight.category.toUpperCase()}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>{displayName}</Text>
            <TouchableOpacity style={styles.detailsButton} onPress={handleToggleDetails} activeOpacity={0.8}>
              <BlurView intensity={30} tint="dark" style={styles.detailsButtonBlur}>
                <Ionicons name="information-circle-outline" size={20} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </View>
          {language === 'it' && sight.name_it?.trim() && (
            <Text style={styles.subtitle} numberOfLines={1}>{sight.name}</Text>
          )}
          <Text style={styles.description} numberOfLines={2}>{sight.description}</Text>
        </View>

        {isDownloaded ? (
          <View style={styles.playerWrapper}>
             <BlurView intensity={80} tint="light" style={styles.blurContainer}>
                <AudioPlayer sight={sight} />
             </BlurView>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.downloadButton} 
            onPress={handleDownloadPress}
            disabled={isDownloading}
            activeOpacity={0.8}
          >
            <BlurView intensity={50} tint="dark" style={styles.downloadBlur}>
              <Ionicons name={isDownloading ? "cloud-download" : "cloud-download-outline"} size={24} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.downloadText}>
                {isDownloading ? 'Downloading...' : 'Get Audio Pack'}
              </Text>
            </BlurView>
          </TouchableOpacity>
        )}

        {showDetails && (
          <BlurView intensity={85} tint="dark" style={styles.detailsOverlay}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Details</Text>
              <TouchableOpacity onPress={handleToggleDetails} style={styles.detailsClose} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.detailsText}>{sight.description}</Text>
              {tips.length > 0 && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Tips</Text>
                  {tips.map((t, idx) => (
                    <Text key={`${sight.id}-tip-${idx}`} style={styles.detailsBullet}>{`• ${t}`}</Text>
                  ))}
                </View>
              )}
              {sight.kidsMyth?.trim() && (
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Kids Story</Text>
                  <Text style={styles.detailsText}>{sight.kidsMyth.trim()}</Text>
                </View>
              )}
            </ScrollView>
          </BlurView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    height: 380,
    borderRadius: 24,
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  fallbackImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  textOverlay: {
    position: 'absolute',
    bottom: 90, // Space for player/button
    left: 20,
    right: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsButton: {
    marginTop: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  detailsButtonBlur: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  category: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 1,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
  },
  subtitle: {
    marginTop: -4,
    marginBottom: 6,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  playerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  blurContainer: {
    padding: 16,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    left: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  downloadBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  downloadText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 18,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  detailsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  detailsClose: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  detailsContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 10,
  },
  detailsSection: {
    gap: 6,
    marginTop: 8,
  },
  detailsSectionTitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '800',
  },
  detailsText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  detailsBullet: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});
