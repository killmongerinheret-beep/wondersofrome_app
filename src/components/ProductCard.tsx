import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../ui/theme';

type Props = {
  title: string;
  subtitle?: string;
  priceLabel?: string;
  durationLabel?: string;
  stopsLabel?: string;
  image?: string | null;
  onPress?: () => void;
  style?: any;
};

export const ProductCard: React.FC<Props> = ({ title, subtitle, priceLabel, durationLabel, stopsLabel, image, onPress, style }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={[styles.card, style]} onPress={onPress}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : <View style={[styles.image, styles.imageFallback]} />}
      <View style={styles.overlay} />
      <View style={styles.content}>
        {!!priceLabel && (
          <View style={styles.pricePill}>
            <Ionicons name="cash-outline" size={12} color="#000" />
            <Text style={styles.priceText}>{priceLabel}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
        <View style={styles.metaRow}>
          {!!durationLabel && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={12} color="#fff" />
              <Text style={styles.metaText}>{durationLabel}</Text>
            </View>
          )}
          {!!stopsLabel && (
            <View style={styles.metaPill}>
              <Ionicons name="walk-outline" size={12} color="#fff" />
              <Text style={styles.metaText}>{stopsLabel}</Text>
            </View>
          )}
        </View>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Explore</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CARD_RADIUS = 24;
const styles = StyleSheet.create({
  card: { height: 260, borderRadius: CARD_RADIUS, overflow: 'hidden', backgroundColor: '#1C1C1E', marginBottom: 16 },
  image: { ...StyleSheet.absoluteFillObject },
  imageFallback: { backgroundColor: '#2C2C2E' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  content: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 6 },
  pricePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD60A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  priceText: { fontSize: 12, fontWeight: '900', color: '#000' },
  title: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  subtitle: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.8)' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  metaText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  cta: {
    marginTop: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '900' },
});
