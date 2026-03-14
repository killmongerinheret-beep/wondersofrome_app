import React, { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList, Text, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOfflineContent } from '../hooks/useOfflineContent';
import { SightCard } from '../components/SightCard';
import sights from '../data/sights.json';
import { Sight } from '../types';

export const HomeScreen: React.FC = () => {
  const { downloadedSights, downloadProgress, downloadSight } = useOfflineContent();
  const [language, setLanguage] = useState<'en' | 'it'>('en');
  const [packFilter, setPackFilter] = useState<'essential' | 'all'>('essential');

  const visibleSights = useMemo(() => {
    const allSights = sights as Sight[];
    if (packFilter === 'all') return allSights;
    return allSights.filter((s) => (s.pack ?? 'full') === 'essential');
  }, [packFilter]);

  const renderItem = ({ item }: { item: Sight }) => (
    <SightCard
      sight={item}
      onDownload={() => downloadSight(item.id)}
      isDownloaded={downloadedSights[item.id]}
      isDownloading={!!downloadProgress[item.id]}
      language={language}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={visibleSights}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.date}>TODAY</Text>
            <Text style={styles.header}>Rome</Text>
            <View style={styles.controlsRow}>
              <View style={styles.segment}>
                <TouchableOpacity
                  style={[styles.segmentButton, packFilter === 'essential' && styles.segmentButtonActive]}
                  onPress={() => setPackFilter('essential')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, packFilter === 'essential' && styles.segmentTextActive]}>Essential</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, packFilter === 'all' && styles.segmentButtonActive]}
                  onPress={() => setPackFilter('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, packFilter === 'all' && styles.segmentTextActive]}>All</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.segment}>
                <TouchableOpacity
                  style={[styles.segmentButton, language === 'en' && styles.segmentButtonActive]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, language === 'en' && styles.segmentTextActive]}>EN</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentButton, language === 'it' && styles.segmentButtonActive]}
                  onPress={() => setLanguage('it')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, language === 'it' && styles.segmentTextActive]}>IT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // iOS System Gray 6
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93', // iOS System Gray
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  header: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.3,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(118,118,128,0.12)',
    borderRadius: 12,
    padding: 2,
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3C3C43',
  },
  segmentTextActive: {
    color: '#000000',
  },
  listContent: {
    paddingBottom: 40,
  },
});
