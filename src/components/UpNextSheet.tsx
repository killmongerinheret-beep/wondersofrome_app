import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QueueItem } from '../services/audio';
import { theme } from '../theme';

type Props = {
  visible: boolean;
  title?: string | null;
  items: QueueItem[];
  activeIndex: number;
  onClose: () => void;
  onSelectIndex: (index: number) => void;
};

const BRAND = theme.colors.brand;

export const UpNextSheet: React.FC<Props> = ({ visible, title, items, activeIndex, onClose, onSelectIndex }) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: Math.max(12, insets.top + 10) }]}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close up next">
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Up Next
            </Text>
            {!!title?.trim() && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {title}
              </Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: Math.max(18, insets.bottom + 18) }]}
          showsVerticalScrollIndicator={false}
        >
          {items.map((it, idx) => {
            const active = idx === activeIndex;
            return (
              <TouchableOpacity
                key={`${it.sightId}-${idx}`}
                activeOpacity={0.9}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => onSelectIndex(idx)}
                accessibilityRole="button"
                accessibilityLabel={`Play stop ${idx + 1}`}
              >
                <View style={[styles.indexPill, active && styles.indexPillActive]}>
                  <Text style={[styles.indexText, active && styles.indexTextActive]}>{idx + 1}</Text>
                </View>
                <View style={styles.textCol}>
                  <Text style={[styles.title, active && styles.titleActive]} numberOfLines={1}>
                    {it.title?.trim() ? it.title : it.sightId}
                  </Text>
                  <Text style={styles.sub} numberOfLines={1}>
                    {it.variant}
                  </Text>
                </View>
                <View style={[styles.playPill, active && styles.playPillActive]}>
                  <Ionicons name={active ? 'volume-high' : 'play'} size={14} color={active ? BRAND : '#fff'} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '800' },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 14, paddingTop: 12, gap: 10 },
  row: {
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowActive: {
    backgroundColor: 'rgba(0,122,255,0.18)',
    borderColor: 'rgba(0,122,255,0.35)',
  },
  indexPill: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexPillActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  indexText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '900' },
  indexTextActive: { color: '#fff' },
  textCol: { flex: 1, gap: 2 },
  title: { color: '#fff', fontSize: 13, fontWeight: '900' },
  titleActive: { color: '#fff' },
  sub: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '800' },
  playPill: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPillActive: {
    backgroundColor: '#fff',
  },
});
