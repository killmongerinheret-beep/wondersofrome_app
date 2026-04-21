import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, Dimensions, StatusBar } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { useAudioTours } from '../hooks/useAudioTours';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { Sight } from '../types';
import { useSights } from '../hooks/useSights';
import { useContinueListening } from '../hooks/useContinueListening';
import { SettingsSheet } from '../components/SettingsSheet';

const { width } = Dimensions.get('window');

type TabType = 'featured' | 'vatican' | 'colosseo' | 'all';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { sights, loading: sightsLoading } = useSights();
  const { refresh: refreshContinue } = useContinueListening(sights);
  
  const [activeTab, setActiveTab] = useState<TabType>('featured');
  const [query, setQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filteredSights = useMemo(() => {
    let base = sights ?? [];
    
    if (activeTab === 'featured') {
      base = base.filter(s => s.pack === 'essential').slice(0, 6);
    } else if (activeTab === 'vatican') {
      base = base.filter(s => s.id.includes('vatican') || s.id.includes('sistine') || s.id.includes('st-peters'));
    } else if (activeTab === 'colosseo') {
      base = base.filter(s => s.id === 'colosseum' || s.id === 'forum');
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      base = base.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.description ?? '').toLowerCase().includes(q)
      );
    }
    return base;
  }, [sights, activeTab, query]);

  const Greeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    
    return <Text style={styles.greeting}>{greeting}</Text>;
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 80, paddingBottom: 160 }]}
        onScrollBeginDrag={() => refreshContinue().catch(() => {})}
      >
        <View style={styles.contentContainer}>
          <Greeting />
          
          <View style={styles.featuredRow}>
            {filteredSights.slice(0, 2).map((sight) => (
              <TouchableOpacity 
                key={sight.id}
                style={styles.smallCard}
                onPress={() => navigation.navigate('Explore', { pickSightId: sight.id })}
              >
                <Image source={{ uri: sight.thumbnail }} style={styles.smallCardImage} contentFit="cover" transition={500} />
                <BlurView tint="dark" intensity={40} style={styles.smallCardOverlay}>
                  <Text style={styles.smallCardText} numberOfLines={1}>{sight.name}</Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Jump back in</Text>
          </View>

          {activeTab === 'featured' && (
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.hero}
              onPress={() => navigation.navigate('Explore', { pickSightId: 'colosseum' })}
            >
              <Image source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg' }} style={styles.heroImage} contentFit="cover" transition={500} />
              <LinearGradient
                colors={['transparent', 'rgba(5,5,5,0.8)', theme.colors.background]}
                style={styles.heroGradient}
              />
              <View style={styles.heroContent}>
                <View style={styles.heroTag}>
                  <Ionicons name="flash" size={10} color={theme.colors.cream} />
                  <Text style={styles.heroKicker}>ESSENTIAL</Text>
                </View>
                <Text style={styles.heroTitle}>The Colosseum</Text>
                <Text style={styles.heroDesc}>Explore the heart of the Roman Empire.</Text>
              </TouchableOpacity>
            )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore Categories</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalGrid}>
            {filteredSights.map((sight) => (
              <ProductCard
                key={sight.id}
                style={styles.gridCard}
                title={sight.name}
                subtitle={sight.category.toUpperCase()}
                image={sight.thumbnail}
                onPress={() => navigation.navigate('Explore', { pickSightId: sight.id })}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Floating Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[theme.colors.background, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTop}>
          <Text style={styles.brandTitle}>Wonders of Rome</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => {}} style={styles.headerIcon}>
              <Ionicons name="notifications-outline" size={22} color={theme.colors.cream} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsOpen(true)} style={styles.headerIcon}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.cream} />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {(['featured', 'vatican', 'colosseo', 'all'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { Haptics.selectionAsync(); setActiveTab(tab); }}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>
                {tab === 'colosseo' ? 'Colosseo' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { paddingBottom: 100 },
  contentContainer: { paddingHorizontal: 16 },
  headerContainer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerIcons: { flexDirection: 'row', gap: 16 },
  headerIcon: { padding: 4 },
  brandTitle: { fontSize: 24, fontWeight: 'bold', color: theme.colors.cream, letterSpacing: -0.5 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: theme.colors.cream, marginBottom: 20, marginTop: 10 },
  featuredRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  smallCard: { flex: 1, height: 56, backgroundColor: theme.colors.surface, borderRadius: 6, overflow: 'hidden', flexDirection: 'row', alignItems: 'center' },
  smallCardImage: { width: 56, height: 56 },
  smallCardOverlay: { flex: 1, height: '100%', justifyContent: 'center', paddingHorizontal: 10 },
  smallCardText: { color: theme.colors.cream, fontSize: 12, fontWeight: 'bold' },
  tabsRow: { paddingHorizontal: 16, gap: 8, marginTop: 4 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  activeTab: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brandLight },
  tabLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted },
  activeTabLabel: { color: theme.colors.cream },
  hero: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 32, backgroundColor: theme.colors.surface },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroGradient: { ...StyleSheet.absoluteFillObject },
  heroContent: { position: 'absolute', bottom: 16, left: 16, right: 16, gap: 4 },
  heroTag: { alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroKicker: { color: theme.colors.cream, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { fontSize: 32, fontWeight: 'bold', color: theme.colors.cream, letterSpacing: -1 },
  heroDesc: { fontSize: 14, fontWeight: '500', color: theme.colors.textMuted },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.cream },
  horizontalGrid: { gap: 16, paddingRight: 32 },
  gridCard: { width: 160, height: 220 },
});
