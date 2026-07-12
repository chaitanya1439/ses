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
import Svg, { Circle as SvgCircle, Rect } from 'react-native-svg';

/* ─── Confetti dots for the referral section ─── */
function ConfettiDots() {
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 340 120"
      style={StyleSheet.absoluteFill}
    >
      {/* Scattered confetti */}
      <SvgCircle cx="30" cy="20" r="3" fill="#FFD700" opacity={0.7} />
      <SvgCircle cx="310" cy="15" r="2.5" fill="#FF6B6B" opacity={0.6} />
      <SvgCircle cx="60" cy="100" r="2" fill="#4CAF50" opacity={0.5} />
      <SvgCircle cx="280" cy="95" r="3" fill="#2196F3" opacity={0.6} />
      <SvgCircle cx="170" cy="10" r="2" fill="#FF9800" opacity={0.5} />
      <SvgCircle cx="120" cy="105" r="2.5" fill="#E91E63" opacity={0.5} />
      <SvgCircle cx="240" cy="25" r="2" fill="#00BCD4" opacity={0.6} />
      <Rect x="50" y="50" width="5" height="2" rx="1" fill="#FFD700" opacity={0.5} transform="rotate(30 50 50)" />
      <Rect x="290" y="60" width="5" height="2" rx="1" fill="#FF6B6B" opacity={0.5} transform="rotate(-20 290 60)" />
      <Rect x="15" y="70" width="4" height="2" rx="1" fill="#4CAF50" opacity={0.4} transform="rotate(45 15 70)" />
      <Rect x="320" y="40" width="4" height="2" rx="1" fill="#9C27B0" opacity={0.4} transform="rotate(-40 320 40)" />
    </Svg>
  );
}

export default function ReferEarnScreen() {
  const insets = useSafeAreaInsets();
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
          <Text style={styles.topBarTitle}>Refer & Earn</Text>
        </View>
        <Pressable style={styles.helpPill}>
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
      >
        {/* ─── HERO BANNER ─── */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroCharacter}>
              <View style={styles.phoneMock}>
                <MaterialCommunityIcons
                  name="account-cash"
                  size={48}
                  color="#FFFFFF"
                />
              </View>
            </View>
            <View style={styles.heroCharacter}>
              <View style={styles.phoneMock}>
                <MaterialCommunityIcons
                  name="account-cash-outline"
                  size={48}
                  color="#FFFFFF"
                />
              </View>
            </View>
          </View>
          <Text style={styles.heroTitle}>Invite friends & earn together!</Text>
        </View>

        {/* ─── TOTAL EARNINGS CARD ─── */}
        <Pressable style={styles.earningsCard}>
          <View style={styles.earningsIcon}>
            <MaterialCommunityIcons
              name="cash"
              size={24}
              color="#22C55E"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
          </View>
          <Text style={styles.earningsAmount}>₹150</Text>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* ─── ACTIVE CAMPAIGNS ─── */}
        <Text style={styles.sectionLabel}>Active Campaigns</Text>
        <Pressable style={styles.campaignCard}>
          <View style={styles.campaignIcon}>
            <MaterialCommunityIcons
              name="motorbike"
              size={22}
              color="#374151"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.campaignName}>1 Bike Referral</Text>
          </View>
          <View style={styles.campaignValue}>
            <Text style={styles.campaignEquals}>= </Text>
            <Text style={styles.campaignAmount}>₹5000</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* ─── REFERRAL CODE ─── */}
        <View style={styles.referralCard}>
          <ConfettiDots />
          <Text style={styles.referralLabel}>Your referral code is</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>RI0N733</Text>
            <View style={styles.codeDivider} />
            <Pressable
              onPress={() =>
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                )
              }
            >
              <Text style={styles.copyText}>Copy Link</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* ─── BOTTOM CTA ─── */}
      <View style={[styles.bottomCta, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.referBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          }
        >
          <Text style={styles.referBtnText}>Refer Friends</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

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

  scrollContent: { gap: 16 },

  /* Hero */
  heroBanner: {
    backgroundColor: '#00C853',
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroContent: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  heroCharacter: { alignItems: 'center' },
  phoneMock: {
    width: 80,
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },

  /* Earnings Card */
  earningsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  earningsIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F9EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22C55E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Campaigns */
  sectionLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_600SemiBold',
    marginHorizontal: 16,
    marginTop: 4,
  },
  campaignCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  campaignIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  campaignValue: { flexDirection: 'row', alignItems: 'center' },
  campaignEquals: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  campaignAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Referral Code */
  referralCard: {
    backgroundColor: '#7B2FBE',
    borderRadius: 18,
    padding: 24,
    marginHorizontal: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  referralLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 14,
    zIndex: 1,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    flex: 1,
  },
  codeDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#2563EB',
    marginHorizontal: 14,
  },
  copyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Poppins_700Bold',
  },

  /* Bottom CTA */
  bottomCta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  referBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  referBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
});
