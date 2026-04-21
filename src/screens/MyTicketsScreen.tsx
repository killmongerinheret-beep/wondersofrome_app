import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Brightness from 'expo-brightness';
import QRCode from 'react-native-qrcode-svg';
import { getSupabase, supabase } from '../services/supabase';
import { theme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const BRAND = theme.colors.brand;

type Booking = {
  id: string;
  tour_title: string;
  tour_slug: string | null;
  date: string;
  time: string;
  guests: number;
  adults: number;
  students: number;
  youths: number;
  total_price: number;
  customer_name: string;
  status: 'pending' | 'paid' | 'cancelled' | string;
  created_at: string;
  site_id: string;
};

const STATUS_COLORS: Record<string, string> = {
  paid: '#34C759',
  pending: '#FF9500',
  cancelled: '#FF3B30',
};
const STATUS_LABELS: Record<string, string> = {
  paid: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

const formatDate = (d: string) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return d; }
};

// ── Single booking card with inline QR ───────────────────────────────────────
const BookingCard: React.FC<{
  item: Booking;
  onQROpen: () => void;
  onQRClose: () => void;
}> = ({ item, onQROpen, onQRClose }) => {
  const [qrOpen, setQrOpen] = useState(false);
  const qrAnim = useRef(new Animated.Value(0)).current;
  const isPaid = item.status === 'paid';

  const toggleQR = () => {
    const next = !qrOpen;
    setQrOpen(next);
    Animated.spring(qrAnim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false,
      speed: 18,
      bounciness: 4,
    }).start();
    if (next) onQROpen(); else onQRClose();
  };

  const statusColor = STATUS_COLORS[item.status] ?? '#8E8E93';
  const statusLabel = STATUS_LABELS[item.status] ?? item.status;
  const guestParts = [
    item.adults ? `${item.adults} adult${item.adults !== 1 ? 's' : ''}` : null,
    item.students ? `${item.students} student${item.students !== 1 ? 's' : ''}` : null,
    item.youths ? `${item.youths} youth${item.youths !== 1 ? 's' : ''}` : null,
  ].filter(Boolean);
  const guestLabel = guestParts.length > 0 ? guestParts.join(', ') : `${item.guests} guest${item.guests !== 1 ? 's' : ''}`;
  const qrValue = `WONDERS:${item.id.toUpperCase()}`;

  const qrHeight = qrAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.tour_title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Meta pills */}
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="rgba(60,60,67,0.7)" />
          <Text style={styles.metaText}>{formatDate(item.date)}</Text>
        </View>
        {item.time ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color="rgba(60,60,67,0.7)" />
            <Text style={styles.metaText}>{item.time}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color="rgba(60,60,67,0.7)" />
          <Text style={styles.metaText}>{guestLabel}</Text>
        </View>
        {item.total_price ? (
          <View style={styles.metaItem}>
            <Ionicons name="card-outline" size={13} color="rgba(60,60,67,0.7)" />
            <Text style={styles.metaText}>€{Number(item.total_price).toFixed(2)}</Text>
          </View>
        ) : null}
      </View>

      {/* QR section — only for confirmed bookings */}
      {isPaid && (
        <>
          <TouchableOpacity onPress={toggleQR} activeOpacity={0.85} style={styles.qrToggleBtn}>
            <Ionicons name={qrOpen ? 'chevron-up' : 'qr-code-outline'} size={16} color={BRAND} />
            <Text style={styles.qrToggleText}>{qrOpen ? 'Hide ticket' : 'Show entry ticket'}</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.qrWrap, { height: qrHeight, overflow: 'hidden' }]}>
            <LinearGradient colors={['#111', '#1C1C2E']} style={styles.qrCard}>
              <Text style={styles.qrCardTitle}>{item.tour_title}</Text>
              <Text style={styles.qrCardSub}>{formatDate(item.date)}{item.time ? ` · ${item.time}` : ''} · {guestLabel}</Text>
              <View style={styles.qrCodeBox}>
                <QRCode value={qrValue} size={140} />
              </View>
              <Text style={styles.qrHint}>Show this at the meeting point</Text>
              <Text style={styles.qrRef}>Ref: {item.id.slice(-8).toUpperCase()}</Text>
            </LinearGradient>
          </Animated.View>
        </>
      )}

      {/* Footer */}
      <View style={styles.cardFooter}>
        <Text style={styles.refText}>#{item.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.siteText}>{item.site_id === 'wondersofrome' ? 'Wonders of Rome' : 'Tickets in Rome'}</Text>
      </View>
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
export const MyTicketsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const previousBrightness = useRef<number | null>(null);
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [qrOpenCount, setQrOpenCount] = useState(0);

  // Boost brightness when any QR is visible
  const handleQROpen = useCallback(async () => {
    setQrOpenCount((n) => {
      if (n === 0) {
        (async () => {
          try {
            const { status } = await Brightness.requestPermissionsAsync();
            if (status !== 'granted') return;
            previousBrightness.current = await Brightness.getBrightnessAsync();
            await Brightness.setBrightnessAsync(1);
          } catch {}
        })();
      }
      return n + 1;
    });
  }, []);

  const handleQRClose = useCallback(async () => {
    setQrOpenCount((n) => {
      const next = Math.max(0, n - 1);
      if (next === 0 && previousBrightness.current != null) {
        Brightness.setBrightnessAsync(previousBrightness.current).catch(() => {});
        previousBrightness.current = null;
      }
      return next;
    });
  }, []);

  // Restore brightness when leaving screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (previousBrightness.current != null) {
          Brightness.setBrightnessAsync(previousBrightness.current).catch(() => {});
          previousBrightness.current = null;
          setQrOpenCount(0);
        }
      };
    }, [])
  );

  const fetchBookings = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    
    const client = getSupabase();
    if (!client) {
      setError('Ticket lookup is not available. Please check your configuration.');
      setSearched(true);
      setBookings([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const { data, error: e } = await client
        .from('bookings')
        .select('id,tour_title,tour_slug,date,time,guests,adults,students,youths,total_price,customer_name,status,created_at,site_id')
        .eq('customer_email', trimmed)
        .order('created_at', { ascending: false });
      if (e) throw e;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setBookings((data as Booking[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load bookings.');
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [email]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tickets</Text>
        <Text style={styles.headerSubtitle}>Bookings & entry QR codes</Text>
      </View>

      <View style={styles.lookupCard}>
        <Text style={styles.lookupLabel}>Enter your booking email</Text>
        <View style={styles.lookupRow}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@example.com"
            placeholderTextColor="rgba(60,60,67,0.45)"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="search"
            onSubmitEditing={fetchBookings}
            style={styles.input}
          />
          <TouchableOpacity
            onPress={fetchBookings}
            activeOpacity={0.85}
            disabled={loading || !email.trim()}
            style={[styles.searchBtn, (loading || !email.trim()) && styles.searchBtnDisabled]}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="search" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {bookings !== null ? (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => (
            <BookingCard item={item} onQROpen={handleQROpen} onQRClose={handleQRClose} />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(24, insets.bottom + 16), paddingTop: 8 }}
          ListEmptyComponent={
            searched && !loading ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="ticket-outline" size={48} color="rgba(60,60,67,0.3)" />
                <Text style={styles.emptyTitle}>No bookings found</Text>
                <Text style={styles.emptySubtitle}>Use the same email from your booking confirmation.</Text>
              </View>
            ) : null
          }
        />
      ) : (
        !loading && (
          <View style={styles.emptyWrap}>
            <Ionicons name="ticket-outline" size={56} color="rgba(60,60,67,0.25)" />
            <Text style={styles.emptyTitle}>Find your tickets</Text>
            <Text style={styles.emptySubtitle}>Enter the email you used when booking. Confirmed bookings include a QR entry ticket.</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 34, fontWeight: '900', letterSpacing: 0.2, color: '#111' },
  headerSubtitle: { marginTop: 2, fontSize: 13, fontWeight: '700', color: 'rgba(60,60,67,0.7)' },
  lookupCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 18, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  lookupLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(60,60,67,0.7)', marginBottom: 10 },
  lookupRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, height: 46, borderRadius: 14, paddingHorizontal: 14, backgroundColor: 'rgba(118,118,128,0.1)', fontSize: 14, fontWeight: '700', color: '#111' },
  searchBtn: { width: 46, height: 46, borderRadius: 14, backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center' },
  searchBtnDisabled: { backgroundColor: 'rgba(0,122,255,0.35)' },
  errorWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 10, padding: 12, backgroundColor: 'rgba(255,59,48,0.08)', borderRadius: 12 },
  errorText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#FF3B30' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: '#111', lineHeight: 20 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '900' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(118,118,128,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  metaText: { fontSize: 12, fontWeight: '700', color: 'rgba(60,60,67,0.85)' },
  qrToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  qrToggleText: { fontSize: 13, fontWeight: '800', color: BRAND },
  qrWrap: { borderRadius: 16, overflow: 'hidden' },
  qrCard: { padding: 16, alignItems: 'center', gap: 8, borderRadius: 16 },
  qrCardTitle: { fontSize: 15, fontWeight: '900', color: '#fff', textAlign: 'center' },
  qrCardSub: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  qrCodeBox: { width: 156, height: 156, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginVertical: 4 },
  qrHint: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.65)', textAlign: 'center' },
  qrRef: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)' },
  refText: { fontSize: 11, fontWeight: '800', color: 'rgba(60,60,67,0.5)', fontFamily: 'monospace' },
  siteText: { fontSize: 11, fontWeight: '700', color: 'rgba(60,60,67,0.45)' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: '600', color: 'rgba(60,60,67,0.6)', textAlign: 'center', lineHeight: 20 },
});
