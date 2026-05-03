import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import React, { useCallback, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchConcierge } from '../services/remoteContent';
import { supabase } from '../services/supabase';
import { theme } from '../ui/theme';

const BRAND = theme.colors.brand;

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

  const defaultOffices = useMemo<Office[]>(
    () => [
      {
        name: 'Wonders of Rome — Main Office',
        address: 'Via della Conciliazione, 00193 Roma',
        hours: 'Mon–Sun  09:00–19:00',
      },
      {
        name: 'Vatican Meeting Point',
        address: 'Piazza Pio XII, 00193 Roma',
        hours: 'Daily  08:00–13:00',
      },
      {
        name: 'Colosseum Meeting Point',
        address: 'Via Sacra, 00186 Roma (near Arch of Titus)',
        hours: 'Daily  08:30–17:00',
      },
    ],
    []
  );

  const defaultFaqs = useMemo<FAQ[]>(
    () => [
      {
        q: 'How do I reschedule or cancel my booking?',
        a: 'Message us on WhatsApp with your booking reference (last 6 digits of your confirmation email). We will sort it out fast.',
      },
      {
        q: 'Do I need internet for the audio guide?',
        a: 'Download your sights in the Explore tab first. After that, audio plays fully offline — no signal needed.',
      },
      {
        q: 'What should I wear to churches and the Vatican?',
        a: 'Shoulders and knees must be covered. A light scarf or sarong works perfectly in summer.',
      },
      {
        q: 'Where do I meet my guide?',
        a: 'Meeting point details are in your confirmation email. Arrive 10 minutes early and look for the Wonders of Rome sign.',
      },
      {
        q: 'Can I bring children on the tours?',
        a: 'Yes — most tours are family-friendly. The app has a Kids audio guide with myths and stories for younger visitors.',
      },
      {
        q: 'What if it rains?',
        a: 'Most tours run in light rain. In case of severe weather we will contact you to reschedule at no extra cost.',
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
      'https://wa.me/39060608?text=Hi%2C%20I%20need%20help%20with%20my%20Wonders%20of%20Rome%20booking.';
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  const handleWebsite = async () => {
    await Linking.openURL('https://wondersofrome.com');
  };

  const handleEmail = async () => {
    await Linking.openURL('mailto:info@wondersofrome.com');
  };

  const displayAgent = remote?.agent && remote.agent.name ? remote.agent : null;
  const displayOffices =
    remote?.offices && remote.offices.length > 0 ? remote.offices : defaultOffices;
  const displayFaqs = remote?.faqs && remote.faqs.length > 0 ? remote.faqs : defaultFaqs;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(24, insets.bottom + 16) }}>
        <View style={styles.header}>
          <View style={styles.headerLogoRow}>
            <View style={styles.logoCircle}>
              <Ionicons name="globe" size={22} color={BRAND} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Concierge</Text>
              <Text style={styles.headerSubtitle}>Wonders of Rome · Direct support</Text>
            </View>
          </View>
        </View>

        {remote === null ? (
          <View style={styles.sectionWrap}>
            <View style={styles.skeletonCard} />
            <View style={styles.contactRowSkeleton}>
              <View style={styles.skeletonBtn} />
              <View style={styles.skeletonBtn} />
              <View style={styles.skeletonBtn} />
            </View>
            <View style={[styles.skeletonLine, { width: '40%', marginTop: 20 }]} />
            <View style={styles.skeletonOffice} />
            <View style={styles.skeletonOffice} />
          </View>
        ) : (
          <>
            {/* Agent / WhatsApp card */}
            <View style={styles.sectionWrap}>
              <BlurView intensity={20} tint="dark" style={styles.agentCard}>
                {displayAgent?.avatarUrl?.trim() ? (
                  <Image source={{ uri: displayAgent.avatarUrl }} style={styles.agentAvatar} />
                ) : (
                  <View style={[styles.agentAvatar, styles.agentAvatarFallback]}>
                    <Ionicons name="globe" size={26} color={BRAND} />
                  </View>
                )}
                <View style={styles.agentText}>
                  <Text style={styles.agentTitle}>
                    {displayAgent?.name?.trim() || 'Wonders of Rome'}
                  </Text>
                  <Text style={styles.agentSubtitle}>
                    {displayAgent?.subtitle?.trim() || 'Rome experts  ·  Fast replies'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleWhatsApp}
                  activeOpacity={0.9}
                  style={styles.whatsAppButton}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={styles.whatsAppText}>WhatsApp</Text>
                </TouchableOpacity>
              </BlurView>
            </View>

            {/* Quick contact row */}
            <View style={styles.contactRow}>
              <TouchableOpacity
                onPress={handleWebsite}
                activeOpacity={0.85}
                style={styles.contactBtn}
              >
                <Ionicons name="globe-outline" size={18} color={BRAND} />
                <Text style={styles.contactBtnText}>Website</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEmail}
                activeOpacity={0.85}
                style={styles.contactBtn}
              >
                <Ionicons name="mail-outline" size={18} color={BRAND} />
                <Text style={styles.contactBtnText}>Email us</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => Linking.openURL('tel:+3906060608')}
                activeOpacity={0.85}
                style={styles.contactBtn}
              >
                <Ionicons name="call-outline" size={18} color={BRAND} />
                <Text style={styles.contactBtnText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* Offices */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>Meeting Points</Text>
              {displayOffices.map((o) => (
                <BlurView key={o.name} intensity={20} tint="dark" style={styles.officeCard}>
                  <View style={styles.officeRow}>
                    <Ionicons name="location-outline" size={18} color="#fff" />
                    <Text style={styles.officeName}>{o.name}</Text>
                  </View>
                  <Text style={styles.officeAddress}>{o.address}</Text>
                  <Text style={styles.officeHours}>{o.hours}</Text>
                </BlurView>
              ))}
            </View>

            {/* FAQ */}
            <View style={styles.sectionWrap}>
              <Text style={styles.sectionTitle}>FAQ</Text>
              {displayFaqs.map((f) => (
                <BlurView key={f.q} intensity={20} tint="dark" style={styles.faqCard}>
                  <Text style={styles.faqQ}>{f.q}</Text>
                  <Text style={styles.faqA}>{f.a}</Text>
                </BlurView>
              ))}
            </View>
          </>
        )}
      </ScrollView>
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
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.2,
    color: '#fff',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  sectionWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  agentAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  agentAvatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentText: {
    flex: 1,
    gap: 2,
  },
  agentTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  agentSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 14,
    backgroundColor: '#1DB954',
  },
  whatsAppText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND,
  },
  officeCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: '#fff',
  },
  officeAddress: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  officeHours: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
  },
  faqCard: {
    borderRadius: 18,
    overflow: 'hidden',
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  faqQ: {
    fontSize: 14,
    fontWeight: '900',
    color: '#fff',
  },
  faqA: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  skeletonCard: {
    height: 82,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 10,
  },
  contactRowSkeleton: { flexDirection: 'row', gap: 10, marginTop: 10 },
  skeletonBtn: { flex: 1, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)' },
  skeletonLine: { height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)' },
  skeletonOffice: {
    height: 100,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginTop: 10,
  },
});
