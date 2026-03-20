import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, LayoutAnimation, Platform, StyleSheet, Text, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Brightness from 'expo-brightness';
import QRCode from 'react-native-qrcode-svg';
import { fetchWalletTickets } from '../services/remoteContent';
import { supabase } from '../services/supabase';
import { getSiteId } from '../config/site';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Ticket = {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  qrValue: string;
  colors: [string, string];
};

export const WalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const previousBrightness = useRef<number | null>(null);
  const [brightnessReady, setBrightnessReady] = useState(false);
  const [remoteTickets, setRemoteTickets] = useState<Ticket[] | null>(null);
  const [lookupEmail, setLookupEmail] = useState('');
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);

  const demoTickets = useMemo<Ticket[]>(
    () => [
      {
        id: 'ticket-colosseum',
        title: 'Colosseum Entry',
        subtitle: 'Fast-track • 1 adult',
        dateLabel: 'Today • 16:30',
        qrValue: 'ROME-AUDIO-GUIDE:TICKET:COLOSSEUM:DEMO',
        colors: ['#111111', '#2D2D2D'],
      },
      {
        id: 'ticket-vatican',
        title: 'Vatican Museums',
        subtitle: 'Skip-the-line • 2 adults',
        dateLabel: 'Tomorrow • 09:00',
        qrValue: 'ROME-AUDIO-GUIDE:TICKET:VATICAN:DEMO',
        colors: ['#0B3D2E', '#0E6E4A'],
      },
    ],
    []
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const permissions = await Brightness.requestPermissionsAsync();
          if (permissions.status !== 'granted') return;
          const current = await Brightness.getBrightnessAsync();
          if (!cancelled) {
            previousBrightness.current = current;
            await Brightness.setBrightnessAsync(1);
            setBrightnessReady(true);
          }
        } catch {
        }
      })();

      if (!supabase) {
        if (!cancelled) setRemoteTickets(null);
      }

      return () => {
        (async () => {
          try {
            const prev = previousBrightness.current;
            if (prev != null) {
              await Brightness.setBrightnessAsync(prev);
            }
            previousBrightness.current = null;
            setBrightnessReady(false);
          } catch {
          }
        })();
      };
    }, [])
  );

  const loadRemoteTickets = useCallback(async () => {
    if (!supabase) return;
    const email = lookupEmail.trim();
    if (!email) return;

    setIsLoadingRemote(true);
    try {
      const tickets = await fetchWalletTickets(email);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRemoteTickets(tickets);
    } catch {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setRemoteTickets([]);
    } finally {
      setIsLoadingRemote(false);
    }
  }, [lookupEmail]);

  const tickets = remoteTickets && remoteTickets.length > 0 ? remoteTickets : demoTickets;

  const renderItem = ({ item }: { item: Ticket }) => {
    return (
      <View style={styles.cardWrap}>
        <LinearGradient colors={item.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>

          <View style={styles.qrRow}>
            <View style={styles.qrBox}>
              <QRCode value={item.qrValue} size={160} />
            </View>
            <View style={styles.metaColumn}>
              <Text style={styles.metaLabel}>Show this at entry</Text>
              <Text style={styles.metaValue}>{item.dateLabel}</Text>
              <Text style={styles.metaHint}>
                {Platform.OS === 'android'
                  ? 'Brightness boosts while this tab is open'
                  : brightnessReady
                    ? 'Brightness boosted for scanning'
                    : 'Allow brightness permission for best scanning'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wallet</Text>
        <Text style={styles.headerSubtitle}>Tickets ready for scanning</Text>
      </View>

      {supabase && (
        <View style={styles.lookupWrap}>
          <View style={styles.lookupCard}>
            <Text style={styles.lookupTitle}>Find your tickets</Text>
            <Text style={styles.lookupSubtitle}>
              Enter the email you used at checkout ({getSiteId()}).
            </Text>
            <View style={styles.lookupRow}>
              <TextInput
                value={lookupEmail}
                onChangeText={setLookupEmail}
                placeholder="email@example.com"
                placeholderTextColor="rgba(235,235,245,0.6)"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.lookupInput}
              />
              <TouchableOpacity
                onPress={loadRemoteTickets}
                activeOpacity={0.9}
                disabled={isLoadingRemote || !lookupEmail.trim()}
                style={[styles.lookupButton, (isLoadingRemote || !lookupEmail.trim()) && styles.lookupButtonDisabled]}
              >
                <Text style={styles.lookupButtonText}>{isLoadingRemote ? 'Loading…' : 'Load'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={tickets}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(235,235,245,0.72)',
  },
  lookupWrap: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  lookupCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  lookupTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  lookupSubtitle: {
    marginTop: 6,
    color: 'rgba(235,235,245,0.75)',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  lookupRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  lookupInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  lookupButton: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lookupButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  lookupButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  cardWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    overflow: 'hidden',
  },
  cardTop: {
    gap: 4,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.75)',
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrBox: {
    width: 176,
    height: 176,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaColumn: {
    flex: 1,
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
  },
  metaValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  metaHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
});
