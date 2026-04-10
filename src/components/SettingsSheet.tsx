import React from 'react';
import { Linking, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { getLegalLinks } from '../config/legal';
import { theme } from '../ui/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export const SettingsSheet: React.FC<Props> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const links = getLegalLinks();

  const open = async (url: string) => {
    const u = url.trim();
    if (!u) return;
    await Linking.openURL(u);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      presentationStyle="overFullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetWrap, { paddingBottom: Math.max(14, insets.bottom + 10) }]}>
          <BlurView intensity={95} tint="light" style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.title}>About</Text>
              <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close settings">
                <Ionicons name="close" size={18} color="#111" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => open(links.privacy)}>
              <View style={styles.rowLeft}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.brand} />
                <Text style={styles.rowText}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(60,60,67,0.5)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => open(links.terms)}>
              <View style={styles.rowLeft}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.brand} />
                <Text style={styles.rowText}>Terms</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(60,60,67,0.5)" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => open(links.support)}>
              <View style={styles.rowLeft}>
                <Ionicons name="help-circle-outline" size={18} color={theme.colors.brand} />
                <Text style={styles.rowText}>Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(60,60,67,0.5)" />
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{links.domain.replace(/^https?:\/\//, '')}</Text>
              <Text style={styles.footerSub}>Built for iOS-style audio touring</Text>
            </View>
          </BlurView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'flex-end' },
  sheetWrap: { paddingHorizontal: 12 },
  sheet: { borderRadius: 24, overflow: 'hidden', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, backgroundColor: 'rgba(255,255,255,0.85)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontWeight: '900', color: '#111' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginBottom: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { fontSize: 14, fontWeight: '800', color: '#111' },
  footer: { alignItems: 'center', paddingTop: 6, paddingBottom: 4, gap: 4 },
  footerText: { fontSize: 12, fontWeight: '800', color: 'rgba(60,60,67,0.75)' },
  footerSub: { fontSize: 11, fontWeight: '700', color: 'rgba(60,60,67,0.55)' },
});

