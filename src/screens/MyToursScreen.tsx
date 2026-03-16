import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSupabase } from '../services/supabase';
import { supabase } from '../services/supabase';
import { getSiteId } from '../config/site';

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

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const MyToursScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchBookings = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!supabase) {
      setError('Supabase not configured.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const client = getSupabase();
      const { data, error: fetchError } = await client
        .from('bookings')
        .select(
          'id,tour_title,tour_slug,date,time,guests,adults,students,youths,total_price,customer_name,status,created_at,site_id'
        )
        .eq('customer_email', trimmed)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setBookings((data as Booking[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load bookings.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const renderItem = ({ item }: { item: Booking }) => {
    const statusColor = STATUS_COLORS[item.status] ?? '#8E8E93';
    const statusLabel = STATUS_LABELS[item.status] ?? item.status;
    const guestParts = [
      item.adults ? `${item.adults} adult${item.adults !== 1 ? 's' : ''}` : null,
      item.students ? `${item.students} student${item.students !== 1 ? 's' : ''}` : null,
      item.youths ? `${item.youths} youth${item.youths !== 1 ? 's' : ''}` : null,
    ].filter(Boolean);
    const guestLabel = guestParts.length > 0 ? guestParts.join(', ') : `${item.guests} guests`;

    return (
      <View style={styles.card}>
        {/* Status badge */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.tour_title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="rgba(60,60,67,0.7)" />
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
          </View>
          {item.time ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color="rgba(60,60,67,0.7)" />
              <Text style={styles.metaText}>{item.time}</Text>
            </View>
          ) : null}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={14} color="rgba(60,60,67,0.7)" />
            <Text style={styles.metaText}>{guestLabel}</Text>
          </View>
          {item.total_price ? (
            <View style={styles.metaItem}>
              <Ionicons name="card-outline" size={14} color="rgba(60,60,67,0.7)" />
              <Text style={styles.metaText}>€{Number(item.total_price).toFixed(2)}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.refText}>Ref: {item.id.slice(-8).toUpperCase()}</Text>
          <Text style={styles.siteText}>{item.site_id === 'wondersofrome' ? 'Wonders of Rome' : 'Tickets in Rome'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Text style={styles.headerTitle}>My Tours</Text>
        <Text style={styles.headerSubtitle}>View your booked tours</Text>
      </View>

      {/* Email lookup */}
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
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="search" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Error */}
      {error && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results */}
      {bookings !== null && (
        <FlatList
          data={bookings}
          keyExtractor={(b) => b.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(24, insets.bottom + 16), paddingTop: 8 }}
          ListEmptyComponent={
            searched && !loading ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="ticket-outline" size={48} color="rgba(60,60,67,0.3)" />
                <Text style={styles.emptyTitle}>No bookings found</Text>
                <Text style={styles.emptySubtitle}>
                  No tours found for this email. Make sure you use the same email from checkout.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {/* Initial state */}
      {bookings === null && !loading && (
        <View style={styles.emptyWrap}>
          <Ionicons name="map-outline" size={56} color="rgba(60,60,67,0.25)" />
          <Text style={styles.emptyTitle}>Find your bookings</Text>
          <Text style={styles.emptySubtitle}>Enter the email you used when booking a tour.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 34, fontWeight: '900', letterSpacing: 0.2, color: '#111' },
  headerSubtitle: { marginTop: 2, fontSize: 14, fontWeight: '700', color: 'rgba(60,60,67,0.7)' },
  lookupCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  lookupLabel: { fontSize: 13, fontWeight: '800', color: 'rgba(60,60,67,0.7)', marginBottom: 10 },
  lookupRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(118,118,128,0.1)',
    fontSize: 14,
    fontWeight: '700',
    color: '#111',
  },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnDisabled: { backgroundColor: 'rgba(0,122,255,0.35)' },
  errorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 12,
  },
  errorText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#FF3B30' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '900', color: '#111', lineHeight: 20 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '900' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(118,118,128,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  metaText: { fontSize: 12, fontWeight: '700', color: 'rgba(60,60,67,0.85)' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  refText: { fontSize: 11, fontWeight: '800', color: 'rgba(60,60,67,0.5)', fontFamily: 'monospace' },
  siteText: { fontSize: 11, fontWeight: '700', color: 'rgba(60,60,67,0.45)' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '900', color: '#111', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, fontWeight: '600', color: 'rgba(60,60,67,0.6)', textAlign: 'center', lineHeight: 20 },
});
