import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubscriptionConfirmScreen() {
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
          <Text style={styles.topBarTitle}>Subscription</Text>
        </View>
        <Pressable style={styles.helpPill}>
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      {/* ─── BACKGROUND CARDS (dimmed) ─── */}
      <View style={styles.bgCards}>
        {/* Plan 1 (selected) */}
        <View style={[styles.bgPlanCard, styles.bgPlanActive]}>
          <View style={[styles.bgRadio, styles.bgRadioActive]}>
            <View style={styles.bgRadioInner} />
          </View>
          <Text style={styles.bgPlanText}>₹250 Earnings</Text>
          <Text style={styles.bgPlanText}>2 Days</Text>
          <Text style={styles.bgPlanPrice}>₹9</Text>
        </View>
        {/* Plan 2 */}
        <View style={styles.bgPlanCard}>
          <View style={styles.bgRadio} />
          <Text style={styles.bgPlanText}>₹450 Earnings</Text>
          <Text style={styles.bgPlanText}>2 Days</Text>
          <Text style={styles.bgPlanPrice}>₹19</Text>
        </View>
        {/* Plan 3 (partial) */}
        <View style={[styles.bgPlanCard, { opacity: 0.5 }]}>
          <View style={styles.bgRadio} />
          <Text style={styles.bgPlanText}>₹750 Earnings</Text>
          <Text style={styles.bgPlanText}>2 Days</Text>
          <Text style={styles.bgPlanPrice}>₹29</Text>
        </View>
      </View>

      {/* ─── OVERLAY ─── */}
      <View style={styles.overlay} />

      {/* ─── BOTTOM SHEET ─── */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Illustration strip */}
          <View style={styles.illustrationStrip}>
            <View style={styles.phoneIllustration}>
              <MaterialCommunityIcons
                name="cellphone-check"
                size={48}
                color="#5C35D4"
              />
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ Active</Text>
              </View>
            </View>
          </View>

          {/* Content */}
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>
              Continue to buy ₹9 Subscription plan
            </Text>

            {/* Feature rows */}
            <View style={styles.featureRow}>
              <Ionicons name="time-outline" size={20} color="#5C35D4" />
              <Text style={styles.featureText}>
                GST and Platform Fee will still be deducted
              </Text>
            </View>

            <View style={styles.featureRow}>
              <Ionicons name="time-outline" size={20} color="#5C35D4" />
              <Text style={styles.featureText}>
                Incentives may not be applicable
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [
            styles.payBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          }
        >
          <Text style={styles.payBtnText}>Pay ₹9</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 10,
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

  /* Background cards */
  bgCards: { padding: 16, gap: 10 },
  bgPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  bgPlanActive: { borderColor: '#5C35D4' },
  bgRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgRadioActive: { borderColor: '#5C35D4' },
  bgRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#5C35D4',
  },
  bgPlanText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  bgPlanPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    top: 120,
    zIndex: 5,
  },

  /* Bottom Sheet */
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 10,
    maxHeight: '65%',
  },

  illustrationStrip: {
    backgroundColor: '#EDE9FB',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 24,
    alignItems: 'center',
  },
  phoneIllustration: { position: 'relative' },
  activeBadge: {
    position: 'absolute',
    bottom: -6,
    right: -20,
    backgroundColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  sheetContent: { padding: 24, gap: 16 },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    lineHeight: 28,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  featureBold: {
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },

  payBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 8,
  },
  payBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
});
