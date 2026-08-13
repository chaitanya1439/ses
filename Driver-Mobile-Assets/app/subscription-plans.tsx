import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

// USER REFERENCE: Razorpay Key Secret (Not used by frontend SDK, but kept here as requested)

const SERVICE_TYPES = [
  'Bike Boost',
  'Scooty',
  'Bike Metro',
  'Bike',
  'Parcel'
];

interface Plan {
  id: string;
  earnings: string;
  days: string;
  price: number;
  originalPrice: number;
  type?: string;
}

const PLANS: Plan[] = [
  // Bike
  { id: '1', earnings: '₹355', days: '1', price: 10, originalPrice: 99, type: 'Bike' },
  { id: '2', earnings: '₹750', days: '1', price: 21, originalPrice: 99, type: 'Bike' },
  { id: '3', earnings: '₹1,300', days: '1', price: 31, originalPrice: 99, type: 'Bike' },
  
  // Bike Parcel
  { id: '4', earnings: '₹1,200', days: '1', price: 27, originalPrice: 99, type: 'Bike Parcel' },

  // Weekly
  { id: '5', earnings: 'Unlimited', days: '7', price: 210, originalPrice: 499, type: 'Weekly' },

  // Auto
  { id: '6', earnings: 'Unlimited', days: '1', price: 27, originalPrice: 99, type: 'Auto' },

  // Auto Parcel
  { id: '7', earnings: '₹1,400', days: '1', price: 49, originalPrice: 99, type: 'Auto Parcel' },
];

export default function SubscriptionPlansScreen() {
  const insets = useSafeAreaInsets();
  const { driver, updateDriver } = useAuth();
  const { isNewDriver } = useLocalSearchParams();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const vType = (driver?.vehicleType || 'bike').toLowerCase();
  const isAuto = vType.includes('auto');

  const filteredPlans = PLANS.filter(p => {
    const planType = (p.type || '').toLowerCase();
    if (isAuto) {
      return planType.includes('auto');
    } else {
      // Hide Auto specific plans from Bike drivers
      if (planType.includes('auto')) return false;
      return planType.includes('bike') || planType.includes('weekly') || planType.includes('parcel');
    }
  });

  const [selectedPlan, setSelectedPlan] = useState(filteredPlans[0]?.id);

  let activePlanId = selectedPlan;
  if (!filteredPlans.find(p => p.id === activePlanId)) {
    activePlanId = filteredPlans[0]?.id;
  }
  const selected = PLANS.find((p) => p.id === activePlanId) || filteredPlans[0];

  const visibleServiceTypes = isAuto 
    ? ['Auto', 'Auto Parcel']
    : ['Bike Boost', 'Scooty', 'Bike Metro', 'Bike', 'Parcel'];

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        {/* ─── PARTIAL EARNINGS STRIP ─── */}
        <View style={styles.earningsStrip}>
          <Text style={styles.earningsStripLeft}>Earnings</Text>
          <Text style={styles.earningsStripRight}>saved so far</Text>
        </View>

        {/* ─── SELECT PLAN ─── */}
        <Text style={styles.sectionTitle}>Select Your Next Plan</Text>
        <Text style={styles.sectionSub}>
          All these plans are valid for
        </Text>

        {/* Service type pills */}
        <View style={styles.servicePills}>
          {visibleServiceTypes.map((svc, idx) => (
            <View key={idx} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{svc}</Text>
            </View>
          ))}
        </View>

        {/* ─── PLAN CARDS ─── */}
        {filteredPlans.map((plan) => (
          <Pressable
            key={plan.id}
            style={[
              styles.planCard,
              activePlanId === plan.id && styles.planCardActive,
            ]}
            onPress={() => {
              setSelectedPlan(plan.id);
              Haptics.selectionAsync();
            }}
          >
            {/* Radio */}
            <View
              style={[
                styles.radio,
                activePlanId === plan.id && styles.radioActive,
              ]}
            >
              {activePlanId === plan.id && (
                <View style={styles.radioInner} />
              )}
            </View>

            {/* Earnings */}
            <View style={styles.planCol}>
              <Text style={styles.planValue}>{plan.earnings}</Text>
              <Text style={styles.planLabel}>Earnings</Text>
            </View>

            <View style={styles.planDivider} />

            {/* Type */}
            <View style={styles.planCol}>
              <Text style={styles.planValue}>{plan.type || 'Bike'}</Text>
              <Text style={styles.planLabel}>Type</Text>
            </View>

            <View style={styles.planDivider} />

            {/* Days */}
            <View style={styles.planCol}>
              <Text style={styles.planValue}>{plan.days}</Text>
              <Text style={styles.planLabel}>Days</Text>
            </View>

            <View style={styles.planDivider} />

            {/* Price */}
            <View style={styles.planCol}>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
              <Text style={styles.planOldPrice}>₹{plan.originalPrice}</Text>
            </View>
          </Pressable>
        ))}

        {/* ─── TERMS ─── */}
        <Text style={styles.termsTitle}>Terms and conditions</Text>
        <View style={styles.termsList}>
          <Text style={styles.termItem}>
            • Plan is active for {isAuto ? 'Auto and Auto Parcel' : 'Bike Boost, Scooty, Bike Metro & Bike'} only
          </Text>
          <Text style={styles.termItem}>
            • No refunds will be given once plan is purchased
          </Text>
          <Text style={styles.termItem}>
            • Subscription will be effective immediately as soon as it is
            purchased
          </Text>
        </View>
      </ScrollView>

      {/* ─── BOTTOM FIXED ─── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.payRow}>
          <Text style={styles.payText}>Pay ₹{selected.price}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.subscribeBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            setTimeout(() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              const expiryDate = new Date();
              expiryDate.setDate(expiryDate.getDate() + parseInt(selected.days));

              const isUnlimited = selected.earnings.toLowerCase() === 'unlimited';
              const earningLimit = isUnlimited ? 999999 : parseInt(selected.earnings.replace('₹', '').replace(',', ''));

              updateDriver({
                subscriptionPlanId: selected.id,
                subscriptionExpiryDate: expiryDate.toISOString(),
                subscriptionEarningLimit: earningLimit,
                subscriptionStatus: 'active'
              });

              router.push({ 
                pathname: '/subscription-confirm', 
                params: { 
                  isNewDriver,
                  planPrice: selected.price,
                  planEarnings: selected.earnings,
                  planDays: selected.days
                } 
              } as any);
            }, 1000);
          }}
        >
          <Text style={styles.subscribeBtnText}>Subscribe</Text>
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

  scrollContent: { padding: 16, gap: 14 },

  /* Earnings strip */
  earningsStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FDECEA',
    borderRadius: 10,
    padding: 12,
    opacity: 0.7,
  },
  earningsStripLeft: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  earningsStripRight: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  sectionSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: -8,
  },

  /* Service pills */
  servicePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  servicePill: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  servicePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
    fontFamily: 'Poppins_600SemiBold',
  },

  /* Plan Cards */
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  planCardActive: { borderColor: '#5C35D4' },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioActive: { borderColor: '#5C35D4' },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#5C35D4',
  },

  planCol: { flex: 1, alignItems: 'center' },
  planValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  planLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  planDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  planOldPrice: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },

  /* Terms */
  termsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
  termsList: { gap: 6 },
  termItem: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },

  /* Bottom */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  payRow: { marginBottom: 8 },
  payText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  subscribeBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  subscribeBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
});
