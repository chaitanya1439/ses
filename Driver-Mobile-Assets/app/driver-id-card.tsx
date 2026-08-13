import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function DriverIdCardScreen() {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={styles.topBarTitle}>Pilot ID Card</Text>
        </View>
        <Pressable
          style={styles.helpPill}
          onPress={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }
        >
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      {/* ─── SCROLLABLE BODY ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ═══ ID CARD ═══ */}
        <View style={styles.card}>
          {/* ── YELLOW TOP HALF ── */}
          <View style={styles.cardTop}>
            {/* App badge top-right */}
            <View style={styles.captainBadge}>
              <Text style={styles.captainAppName}>RideApp</Text>
              <Text style={styles.captainTitle}>Captain</Text>
            </View>
          </View>

          {/* ── Avatar overlapping boundary ── */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons
                name="account"
                size={48}
                color="#9CA3AF"
              />
            </View>
          </View>

          {/* ── WHITE BOTTOM HALF ── */}
          <View style={styles.cardBottom}>
            {/* Approved badge */}
            <View style={styles.approvedRow}>
              <View style={{ flex: 1 }} />
              <View style={styles.approvedPill}>
                <Text style={styles.approvedText}>✓ Approved</Text>
              </View>
            </View>

            {/* Driver name */}
            <Text style={styles.driverName}>
              {driver?.name ?? 'Driver Name'}
            </Text>

            <View style={styles.divider} />

            {/* Info rows */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>MOBILE NUMBER</Text>
              <Text style={styles.infoValue}>
                {driver?.phone ?? '+91 XXXXXXXXXX'}
              </Text>
            </View>

            <View style={styles.infoColumns}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>LICENSE NUMBER</Text>
                <Text style={styles.infoValue}>APXXXXXXXXXX</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>LICENSE VALIDITY</Text>
                <Text style={styles.infoValue}>DD/MM/YYYY</Text>
              </View>
            </View>

            {/* Share button */}
            <Pressable
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <Ionicons name="share-outline" size={18} color="#1A1A2E" />
              <Text style={styles.shareBtnText}>Share</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Below card ── */}
        <View style={styles.belowDivider} />
        <Pressable>
          <Text style={styles.declarationLink}>view declaration</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  helpPill: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  helpPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins_600SemiBold',
  },

  /* Scroll */
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },

  /* Card */
  card: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    overflow: 'hidden',
  },

  /* Yellow Top */
  cardTop: {
    backgroundColor: '#FFD700',
    height: 130,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 16,
  },
  captainBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  captainAppName: {
    fontSize: 9,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.5,
  },
  captainTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginTop: -2,
  },

  /* Avatar */
  avatarWrapper: {
    alignItems: 'flex-start',
    marginTop: -44,
    paddingLeft: 24,
    zIndex: 10,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* White Bottom */
  cardBottom: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  approvedRow: { flexDirection: 'row', marginBottom: 8 },
  approvedPill: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  approvedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  driverName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },

  /* Info Rows */
  infoRow: { marginBottom: 16 },
  infoLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  infoColumns: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  infoCol: { flex: 1 },

  /* Share Button */
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Below Card */
  belowDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  declarationLink: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
