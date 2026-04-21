import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image'; // High-performance Image component

interface ProductCardProps {
  title: string;
  subtitle?: string;
  image?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ProductCard: React.FC<ProductCardProps> = ({ title, subtitle, image, onPress, style }) => {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.container, style]}>
      <Image 
        source={image} 
        style={styles.image} 
        contentFit="cover"
        transition={500} // Premium fade-in effect
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />
      <View style={styles.content}>
        {subtitle && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{subtitle}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
      </View>
      
      <View style={styles.glassBorder} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  tag: {
    backgroundColor: theme.colors.brand,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  tagText: {
    color: theme.colors.cream,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: theme.colors.cream,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  glassBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  }
});
