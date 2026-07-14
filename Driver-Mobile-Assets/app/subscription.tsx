import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/colors';

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  originalPrice: number;
}

const PLANS: Plan[] = [
  { id: 'p1', name: '₹250 Earnings', duration: '2 Days', price: 9, originalPrice: 99 },
  { id: 'p2', name: '₹450 Earnings', duration: '2 Days', price: 19, originalPrice: 199 },
  { id: 'p3', name: '₹750 Earnings', duration: '2 Days', price: 29, originalPrice: 399 },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string>('p1');
  const [subscribed, setSubscribed] = useState(false);

  const topPad = Platform.OS === 'web' ? insets.top + 10 : insets.top;
  const selected = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Recharge</Text>
        <Pressable style={styles.helpBtn}>
          <MaterialCommunityIcons name="face-agent" size={18} color={theme.colors.text} />
          <Text style={styles.helpBtnText}>Help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* PURPLE BANNER */}
        <LinearGradient
          colors={['#6A1B9A', '#4527A0']}
          style={styles.purpleBanner}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.zeroCommRow}>
            <Text style={styles.rupeeZero}>₹</Text>
            <Text style={styles.bigZero}>0</Text>
            <View>
              <Text style={styles.zeroCommText}>ZERO</Text>
              <Text style={styles.zeroCommSub}>COMMISSION</Text>
              <Text style={styles.zeroCommSub}>RECHARGE</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* COMMISSION SAVED */}
          <View style={styles.savedRow}>
            <View>
              <Text style={styles.savedAmount}>₹196.91 <Text style={styles.savedLabel}>Commission saved</Text></Text>
              <Text style={styles.tillNow}>Till Now</Text>
            </View>
            <Text style={styles.emojiIcon}>🪙</Text>
          </View>

          {/* CURRENT PLAN */}
          <Text style={styles.sectionTitle}>Current Plan</Text>
          <View style={styles.currentPlanCard}>
            <View style={styles.cpHeader}>
              <View>
                <Text style={styles.cpTitle}>Your Current Plan</Text>
                <Text style={styles.cpPaid}>₹49 Paid <Ionicons name="checkmark-done" size={14} color="green" /></Text>
              </View>
              <View style={styles.expiredBox}>
                <View style={styles.expiredBadge}>
                  <Ionicons name="alert-circle" size={12} color="#FFF" />
                  <Text style={styles.expiredBadgeText}>Expired</Text>
                </View>
                <Text style={styles.cpDate}>On 25/01/2025</Text>
                <Text style={styles.cpTime}>11:56 AM</Text>
              </View>
            </View>
            <View style={styles.cpDivider} />
            <View style={styles.cpFooter}>
              <View>
                <Text style={styles.cpBenefitTitle}>Unlimited</Text>
                <Text style={styles.cpBenefitSub}>Earnings</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cpSavedAmount}>₹30.32</Text>
                <Text style={styles.cpBenefitSub}>saved so far</Text>
              </View>
            </View>
          </View>

          {/* NEXT PLAN */}
          <View style={styles.nextPlanHeader}>
            <Text style={styles.sectionTitle}>Select Your Next Plan</Text>
            <Text style={styles.subTitle}>All these plans are valid for</Text>
            <View style={styles.scootyBadge}>
              <Text style={styles.scootyBadgeText}>Scooty</Text>
            </View>
          </View>

          <View style={styles.plansList}>
            {PLANS.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <Pressable
                  key={plan.id}
                  style={[styles.planRow, isSelected && styles.planRowActive]}
                  onPress={() => {
                    setSelectedPlan(plan.id);
                    Haptics.selectionAsync();
                  }}
                >
                  <View style={styles.radio}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.planCol1}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planSub}>Earnings</Text>
                  </View>
                  <View style={styles.planDivider} />
                  <View style={styles.planCol2}>
                    <Text style={styles.planName}>{plan.duration.split(' ')[0]}</Text>
                    <Text style={styles.planSub}>{plan.duration.split(' ')[1]}</Text>
                  </View>
                  <View style={styles.planDivider} />
                  <View style={styles.planCol3}>
                    <Text style={styles.planName}>₹{plan.price}</Text>
                    <Text style={styles.planStrike}>₹{plan.originalPrice}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* TERMS */}
          <Text style={styles.termsTitle}>Terms and conditions</Text>
          <View style={styles.termsList}>
            {[
              'Plan is active for Scooty only',
              'No refunds will be given once plan is purchased',
              'Recharge will be effective immediately as soon as it is purchased',
              'Once a recharge plan is purchased, Daily and weekly incentives may not be applicable',
              'Expiry date is applicable for all plans',
              'Enjoy ₹0 commission orders but GST will be charged on the orders',
              'GST is included in the plan price',
            ].map((term, i) => (
              <View key={i} style={styles.termItem}>
                <View style={styles.bullet} />
                <Text style={styles.termText}>{term}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM FIXED BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.payBox}>
          <Text style={styles.payText}>Pay <Text style={styles.payAmount}>₹{selected.price}</Text></Text>
        </View>
        <Pressable
          style={styles.subscribeBtn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.back();
          }}
        >
          <Text style={styles.subscribeBtnText}>Recharge</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', 
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF'
  },
  backBtn: { padding: 4, marginRight: 16 },
  headerTitle: {
    flex: 1, fontSize: 18, fontWeight: '700', color: '#000',
    fontFamily: 'Poppins_700Bold',
  },
  helpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: '#CCC',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8,
  },
  helpBtnText: {
    fontSize: 14, fontWeight: '600', color: '#000',
    fontFamily: 'Poppins_600SemiBold',
  },
  purpleBanner: {
    paddingVertical: 30, paddingHorizontal: 20,
    borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
    alignItems: 'center', justifyContent: 'center'
  },
  zeroCommRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center'
  },
  rupeeZero: { fontSize: 20, color: '#FFF', fontWeight: 'bold', marginTop: -30, marginRight: 4 },
  bigZero: { fontSize: 70, fontWeight: '800', color: '#FFF', includeFontPadding: false },
  zeroCommText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginLeft: 10 },
  zeroCommSub: { fontSize: 14, color: '#FFF', marginLeft: 10 },
  content: { padding: 16 },
  savedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  savedAmount: { fontSize: 24, fontWeight: '700', color: '#000', fontFamily: 'Poppins_700Bold' },
  savedLabel: { fontSize: 16, fontWeight: '400', color: '#333' },
  tillNow: { fontSize: 14, color: '#555' },
  emojiIcon: { fontSize: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', fontFamily: 'Poppins_700Bold', marginBottom: 12 },
  currentPlanCard: {
    backgroundColor: '#FFF', borderRadius: 12,
    borderWidth: 1, borderColor: '#EEE',
    ...theme.shadows.sm, marginBottom: 24,
  },
  cpHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  cpTitle: { fontSize: 18, fontWeight: '700', color: '#000', fontFamily: 'Poppins_700Bold' },
  cpPaid: { fontSize: 14, color: '#444', marginTop: 4 },
  expiredBox: { alignItems: 'flex-end', marginTop: -20, marginRight: -20 },
  expiredBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#D32F2F', paddingHorizontal: 8, paddingVertical: 4,
    borderTopRightRadius: 12, borderBottomLeftRadius: 8,
  },
  expiredBadgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  cpDate: { fontSize: 12, color: '#555', marginTop: 8, marginRight: 16 },
  cpTime: { fontSize: 12, color: '#555', marginRight: 16 },
  cpDivider: { height: 4, backgroundColor: '#D32F2F', opacity: 0.8 },
  cpFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: '#FCF3F3', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  cpBenefitTitle: { fontSize: 14, fontWeight: '700', color: '#000' },
  cpBenefitSub: { fontSize: 12, color: '#666' },
  cpSavedAmount: { fontSize: 14, fontWeight: '700', color: '#000' },
  nextPlanHeader: { marginBottom: 12 },
  subTitle: { fontSize: 14, color: '#555', marginBottom: 8 },
  scootyBadge: {
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#4CAF50',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, alignSelf: 'flex-start'
  },
  scootyBadgeText: { color: '#2E7D32', fontSize: 12, fontWeight: '600' },
  plansList: { gap: 12, marginBottom: 24 },
  planRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA',
    borderRadius: 12, padding: 16, borderWidth: 2, borderColor: 'transparent'
  },
  planRowActive: {
    borderColor: '#4527A0', backgroundColor: '#F3E5F5',
  },
  radio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#4527A0',
    marginRight: 12, alignItems: 'center', justifyContent: 'center'
  },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4527A0' },
  planCol1: { flex: 2 },
  planCol2: { flex: 1, alignItems: 'center' },
  planCol3: { flex: 1, alignItems: 'flex-end' },
  planDivider: { width: 1, height: 30, backgroundColor: '#DDD' },
  planName: { fontSize: 16, fontWeight: '700', color: '#000', fontFamily: 'Poppins_700Bold' },
  planSub: { fontSize: 12, color: '#666' },
  planStrike: { fontSize: 12, color: '#888', textDecorationLine: 'line-through' },
  termsTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 },
  termsList: { gap: 8 },
  termItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bullet: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#555', marginTop: 8 },
  termText: { flex: 1, fontSize: 13, color: '#444', lineHeight: 20 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE',
    padding: 16, gap: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
  },
  payBox: { backgroundColor: '#F5F5F5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flex: 1, marginRight: 12 },
  payText: { fontSize: 14, color: '#333' },
  payAmount: { fontSize: 18, fontWeight: '700', color: '#000' },
  subscribeBtn: {
    backgroundColor: '#FFC107', borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center', flex: 1
  },
  subscribeBtnText: { fontSize: 16, fontWeight: '700', color: '#000', fontFamily: 'Poppins_700Bold' }
});
