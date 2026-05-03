import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getSightImage } from '../services/images';
import { theme } from '../ui/theme';

type Props = {
  id?: string;
  title: string;
  subtitle?: string;
  priceLabel?: string;
  durationLabel?: string;
  stopsLabel?: string;
  image?: string | null;
  onPress?: () => void;
  style?: any;
  hasAudio?: boolean;
};

export const ProductCard: React.FC<Props> = ({
  id,
  title,
  subtitle,
  priceLabel,
  durationLabel,
  stopsLabel,
  image,
  onPress,
  style,
  hasAudio = true,
}) => {
  // Use ID for precise image mapping, fallback to title
  const displayImage = getSightImage(id || title, image ?? undefined);

  return (
    <TouchableOpacity 
      activeOpacity={0.92} 
      style={[styles.card, style, !hasAudio && styles.cardDisabled]} 
      onPress={onPress}
    >
      <Image 
        source={{ uri: displayImage }} 
        style={[styles.image, !hasAudio && styles.imageDisabled]} 
        resizeMode="cover"
      />
      <View style={styles.overlay} />
      
      {!hasAudio && (
        <View style={styles.comingSoonOverlay}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
        </View>
      )}

      {hasAudio && (
        <View style={styles.readyBadge}>
          <Ionicons name="headset" size={10} color="#000" />
          <Text style={styles.readyBadgeText}>AUDIO READY</Text>
        </View>
      )}

      <View style={styles.content}>
        {!!priceLabel && (
          <View style={[styles.pricePill, !hasAudio && styles.pillDisabled]}>
            <Text style={styles.priceText}>{priceLabel}</Text>
          </View>
        )}
        <Text style={[styles.title, !hasAudio && styles.textDisabled]} numberOfLines={2}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, !hasAudio && styles.textDisabled]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <View style={styles.metaRow}>
          {!!durationLabel && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={10} color={hasAudio ? "#fff" : "rgba(255,255,255,0.3)"} />
              <Text style={[styles.metaText, !hasAudio && styles.textDisabled]}>{durationLabel}</Text>
            </View>
          )}
          {!!stopsLabel && (
            <View style={styles.metaPill}>
              <Ionicons name="headset-outline" size={10} color={hasAudio ? "#fff" : "rgba(255,255,255,0.3)"} />
              <Text style={[styles.metaText, !hasAudio && styles.textDisabled]}>{stopsLabel}</Text>
            </View>
          )}
        </View>
      </View>
      {hasAudio && (
        <View style={styles.playIcon}>
          <Ionicons name="play" size={18} color="#000" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#181818',
    marginBottom: 0,
  },
  cardDisabled: {
    opacity: 0.8,
  },
  image: { ...StyleSheet.absoluteFillObject, backgroundColor: '#111' },
  imageDisabled: {
    opacity: 0.45,
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
  },
  readyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  readyBadgeText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '900',
  },
  content: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 },
  pricePill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  pillDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  priceText: { fontSize: 10, fontWeight: '900', color: '#000', textTransform: 'uppercase' },
  title: { fontSize: 20, fontWeight: '900', color: '#fff', lineHeight: 24 },
  subtitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  textDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.5)' },
  playIcon: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
