import React, { useCallback, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { fetchConcierge } from '../services/remoteContent';
import { supabase } from '../services/supabase';
import { theme } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

export const ConciergeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [remote, setRemote] = useState<{
    agent: { name: string; subtitle: string; avatarUrl: string; whatsappUrl: string } | null;
    offices: any[];
    faqs: any[];
  } | null>(null);

  const defaultOffices = useMemo(() => [
    { name: 'Main Office', address: 'Via della Conciliazione, 00193 Roma', hours: 'Mon–Sun 09:00–19:00' },
    { name: 'Vatican Point', address: 'Piazza Pio XII, 00193 Roma', hours: 'Daily 08:00–13:00' },
    { name: 'Colosseum Point', address: 'Via Sacra, 00186 Roma', hours: 'Daily 08:30–17:00' },
  ], []);

  const defaultFaqs = useMemo(() => [
    { q: 'How do I reschedule?', a: 'Message us on WhatsApp with your booking reference.' },
    { q: 'Do I need internet?', a: 'No, download your sights first and they work fully offline.' },
    { q: 'Dress code for Vatican?', a: 'Shoulders and knees must be covered.' },
  ], []);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const data = await fetchConcierge();
          setRemote(data);
        } catch {
          setRemote({ agent: null, offices: [], faqs: [] });
        }
      })();
    }, [])
  );

  const handleAction = async (type: 'whatsapp' | 'website' | 'email' | 'call') => {
    let url = '';
    switch(type) {
      case 'whatsapp': url = remote?.agent?.whatsappUrl || 'https://wa.me/39060608'; break;
      case 'website': url = 'https://wondersofrome.com'; break;
      case 'email': url = 'mailto:info@wondersofrome.com'; break;
      case 'call': url = 'tel:+3906060608'; break;
    }
    await Linking.openURL(url);
  };

  const agent = remote?.agent || { name: 'Wonders of Rome', subtitle: 'Rome Experts · Fast Replies' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 120 }}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Ionicons name="chatbubbles" size={20} color={theme.colors.cream} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Concierge</Text>
              <Text style={styles.headerSub}>Personal assistance for your stay</Text>
            </View>
          </View>
        </View>

        {/* Agent Card */}
        <View style={styles.section}>
          <BlurView intensity={20} tint="dark" style={styles.agentCard}>
            <Image 
              source={{ uri: agent.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop' }} 
              style={styles.avatar} 
            />
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentStatus}>{agent.subtitle}</Text>
            </View>
            <TouchableOpacity onPress={() => handleAction('whatsapp')} style={styles.waBtn}>
              <Ionicons name="logo-whatsapp" size={18} color={theme.colors.cream} />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Quick Contacts */}
        <View style={styles.contactRow}>
          {['website', 'email', 'call'].map((type: any) => (
            <TouchableOpacity key={type} onPress={() => handleAction(type)} style={styles.contactBtn}>
              <Ionicons name={type === 'website' ? 'globe-outline' : type === 'email' ? 'mail-outline' : 'call-outline'} size={18} color={theme.colors.brandLight} />
              <Text style={styles.contactBtnText}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meeting Points</Text>
          {defaultOffices.map((o, i) => (
            <View key={i} style={styles.infoCard}>
              <Ionicons name="location" size={16} color={theme.colors.brand} />
              <View style={styles.infoContent}>
                <Text style={styles.infoName}>{o.name}</Text>
                <Text style={styles.infoSub}>{o.address}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked</Text>
          {defaultFaqs.map((f, i) => (
            <View key={i} style={styles.infoCard}>
              <View style={styles.infoContent}>
                <Text style={styles.infoName}>{f.q}</Text>
                <Text style={styles.infoSub}>{f.a}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: 20, marginBottom: 24 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.cream },
  headerSub: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500' },
  section: { paddingHorizontal: 20, marginTop: 24, gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '900', color: theme.colors.brandLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  agentCard: { padding: 16, borderRadius: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.surface },
  agentInfo: { flex: 1, marginLeft: 16 },
  agentName: { fontSize: 18, fontWeight: 'bold', color: theme.colors.cream },
  agentStatus: { fontSize: 12, color: theme.colors.textMuted },
  waBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  contactRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 20, gap: 10 },
  contactBtn: { flex: 1, height: 44, borderRadius: 12, backgroundColor: theme.colors.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  contactBtnText: { color: theme.colors.cream, fontSize: 13, fontWeight: 'bold' },
  infoCard: { padding: 16, borderRadius: 16, backgroundColor: theme.colors.surface, flexDirection: 'row', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  infoContent: { flex: 1 },
  infoName: { fontSize: 15, fontWeight: 'bold', color: theme.colors.cream, marginBottom: 2 },
  infoSub: { fontSize: 13, color: theme.colors.textMuted, lineHeight: 18 }
});
