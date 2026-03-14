import React, { useCallback, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchConcierge } from '../services/remoteContent';
import { supabase } from '../services/supabase';

type Office = {
  name: string;
  address: string;
  hours: string;
};

type FAQ = {
  q: string;
  a: string;
};

export const ConciergeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [remote, setRemote] = useState<{
    agent: { name: string; subtitle: string; avatarUrl: string; whatsappUrl: string } | null;
    offices: Office[];
    faqs: FAQ[];
  } | null>(null);

  const offices = useMemo<Office[]>(
    () => [
      {
        name: 'Rome Center Office',
        address: 'Via del Corso 123, 00186 Roma',
        hours: 'Daily • 09:00–19:00',
      },
      {
        name: 'Vatican Meeting Point',
        address: 'Piazza Pio XII, 00193 Roma',
        hours: 'Daily • 08:00–12:00',
      },
    ],
    []
  );

  const faqs = useMemo<FAQ[]>(
    () => [
      {
        q: 'Can you reschedule my ticket?',
        a: 'If your ticket provider supports rescheduling, we’ll handle it. Send your order ID in WhatsApp.',
      },
      {
        q: 'Do I need internet for the audio guide?',
        a: 'Once you download a tour in My Tours, playback works offline.',
      },
      {
        q: 'What should I bring to churches?',
        a: 'Cover shoulders and knees. A light scarf works perfectly in summer.',
      },
    ],
    []
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        if (!supabase) {
          if (!cancelled) setRemote(null);
          return;
        }
        try {
          const data = await fetchConcierge();
          if (!cancelled) setRemote(data);
        } catch {
          if (!cancelled) setRemote({ agent: null, offices: [], faqs: [] });
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleWhatsApp = async () => {
    const url =
      remote?.agent?.whatsappUrl?.trim() ||
      'https://wa.me/393000000000?text=Hi%20Marco%2C%20I%20need%20help%20with%20my%20Rome%20tour.';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const displayAgent = remote?.agent && remote.agent.name ? remote.agent : null;
  const displayOffices = remote?.offices && remote.offices.length > 0 ? remote.offices : offices;
  const displayFaqs = remote?.faqs && remote.faqs.length > 0 ? remote.faqs : faqs;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Concierge</Text>
          <Text style={styles.headerSubtitle}>Direct access to your agency</Text>
        </View>

        <View style={styles.sectionWrap}>
          <BlurView intensity={80} tint="light" style={styles.agentCard}>
            <Image
              source={{
                uri:
                  displayAgent?.avatarUrl?.trim() ||
                  'https://images.unsplash.com/photo-1520975958225-9f0b21a1124e?auto=format&fit=crop&w=400&q=80',
              }}
              style={styles.agentAvatar}
            />
            <View style={styles.agentText}>
              <Text style={styles.agentTitle}>{displayAgent?.name?.trim() || 'Chat with Marco'}</Text>
              <Text style={styles.agentSubtitle}>{displayAgent?.subtitle?.trim() || 'Rome local • Fast replies'}</Text>
            </View>
            <TouchableOpacity onPress={handleWhatsApp} activeOpacity={0.9} style={styles.whatsAppButton}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsAppText}>WhatsApp</Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Offices</Text>
          {displayOffices.map((o) => (
            <BlurView key={o.name} intensity={70} tint="light" style={styles.officeCard}>
              <View style={styles.officeRow}>
                <Ionicons name="location-outline" size={18} color="#111" />
                <Text style={styles.officeName}>{o.name}</Text>
              </View>
              <Text style={styles.officeAddress}>{o.address}</Text>
              <Text style={styles.officeHours}>{o.hours}</Text>
            </BlurView>
          ))}
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          {displayFaqs.map((f) => (
            <BlurView key={f.q} intensity={70} tint="light" style={styles.faqCard}>
              <Text style={styles.faqQ}>{f.q}</Text>
              <Text style={styles.faqA}>{f.a}</Text>
            </BlurView>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#111',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.7)',
  },
  sectionWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(60,60,67,0.7)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  agentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  agentAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  agentText: {
    flex: 1,
    gap: 2,
  },
  agentTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111',
  },
  agentSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.7)',
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#25D366',
  },
  whatsAppText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  officeCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 6,
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officeName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111',
  },
  officeAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.78)',
  },
  officeHours: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(60,60,67,0.7)',
  },
  faqCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.85)',
    gap: 8,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111',
  },
  faqA: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: 'rgba(60,60,67,0.78)',
  },
});
