import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
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
  price: number;
  originalPrice?: number;
  duration: string;
  description: string;
  popular?: boolean;
}

const PLANS: Plan[] = [
  { id: 'scooty', name: 'Scooty', price: 9, originalPrice: 19, duration: '7 days', description: 'Zero commission on scooty rides' },
  { id: 'bike-boost', name: 'Bike Boost', price: 29, originalPrice: 59, duration: '15 days', description: 'Zero commission + priority rides', popular: true },
  { id: 'bike-metro', name: 'Bike Metro', price: 49, originalPrice: 99, duration: '30 days', description: 'Full month zero commission' },
  { id: 'bike-pro', name: 'Bike Pro', price: 89, originalPrice: 179, duration: '60 days', description: 'Best value for serious drivers' },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string>('bike-boost');
  const [subscribed, setSubscribed] = useState(false);

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const selected = PLANS.find(p => p.id === selectedPlan)!;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[theme.colors.purple, '#4527A0', '#1A0050']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <View style={styles.crownRow}>
            <MaterialCommunityIcons name="crown" size={32} color={theme.colors.primary} />
            <View>
              <Text style={styles.zeroText}>₹0 ZERO COMMISSION</Text>
              <Text style={styles.rideText}>RIDES</Text>
            </View>
          </View>

          <View style={styles.savedBanner}>
            <MaterialCommunityIcons name="medal" size={20} color={theme.colors.primary} />
            <Text style={styles.savedText}>₹196.91 Commission Saved Till Now</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.currentPlanCard}>
          <View style={styles.currentPlanHeader}>
            <Text style={styles.currentPlanTitle}>Your Current Plan</Text>
            <View style={styles.expiredBadge}>
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          </View>
          <View style={styles.planPaidRow}>
            <View style={styles.planPaidInfo}>
              <Text style={styles.planPrice}>₹49 Paid</Text>
              <View style={styles.checkRow}>
                <Ionicons name="checkmark-done" size={16} color={theme.colors.success} />
                <Text style={styles.planDate}>25 Jan 2026</Text>
              </View>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%', backgroundColor: theme.colors.danger }]} />
          </View>
          <Text style={styles.planBenefits}>Unlimited Earnings · ₹30.32 saved so far</Text>
        </View>

        <Text style={styles.sectionTitle}>Select Your Next Plan</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.plansScroll} contentContainerStyle={styles.plansScrollContent}>
          {PLANS.map(plan => (
            <Pressable
              key={plan.id}
              style={[styles.planChip, selectedPlan === plan.id && styles.planChipActive]}
              onPress={() => {
                setSelectedPlan(plan.id);
                Haptics.selectionAsync();
              }}
            >
              {plan.popular && (
                <View style={styles.popularTag}>
                  <Text style={styles.popularTagText}>Popular</Text>
                </View>
              )}
              <Text style={[styles.planChipName, selectedPlan === plan.id && styles.planChipNameActive]}>
                {plan.name}
              </Text>
              <Text style={[styles.planChipDuration, selectedPlan === plan.id && { color: theme.colors.success }]}>
                {plan.duration}
              </Text>
              <Text style={[styles.planChipPrice, selectedPlan === plan.id && styles.planChipPriceActive]}>
                ₹{plan.price}
              </Text>
              {plan.originalPrice && (
                <Text style={styles.originalPrice}>₹{plan.originalPrice}</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.selectedPlanDetails}>
          <View style={styles.planDetailRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
            <Text style={styles.planDetailText}>Zero commission on all {selected.name} rides</Text>
          </View>
          <View style={styles.planDetailRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
            <Text style={styles.planDetailText}>Valid for {selected.duration}</Text>
          </View>
          <View style={styles.planDetailRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
            <Text style={styles.planDetailText}>Priority ride allocation</Text>
          </View>
          <View style={styles.planDetailRow}>
            <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success} />
            <Text style={styles.planDetailText}>{selected.description}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.subscribeBtn,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setSubscribed(!subscribed);
          }}
        >
          <MaterialCommunityIcons name="crown" size={20} color={theme.colors.dark} />
          <Text style={styles.subscribeBtnText}>
            {subscribed ? 'Subscribed!' : `Subscribe for ₹${selected.price}`}
          </Text>
        </Pressable>

        <Text style={styles.termsText}>
          By subscribing, you agree to our Terms & Conditions. Plans auto-renew unless cancelled.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceAlt },
  header: { paddingHorizontal: 20, paddingBottom: 28, gap: 16 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, marginTop: 16,
  },
  headerContent: { gap: 12 },
  crownRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  zeroText: {
    fontSize: 22, fontWeight: '700', color: theme.colors.primary,
    fontFamily: 'Poppins_700Bold', lineHeight: 26,
  },
  rideText: {
    fontSize: 22, fontWeight: '700', color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
  savedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,184,0,0.15)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)',
  },
  savedText: {
    fontSize: 13, fontWeight: '600', color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  content: { padding: 16, gap: 16 },
  currentPlanCard: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16,
    gap: 12, ...theme.shadows.card,
  },
  currentPlanHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  currentPlanTitle: {
    fontSize: 15, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  expiredBadge: {
    backgroundColor: theme.colors.dangerLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: theme.colors.danger + '30',
  },
  expiredText: {
    fontSize: 12, fontWeight: '700', color: theme.colors.danger,
    fontFamily: 'Poppins_700Bold',
  },
  planPaidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planPaidInfo: { gap: 4 },
  planPrice: {
    fontSize: 20, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planDate: { fontSize: 12, color: theme.colors.textLight, fontFamily: 'Poppins_400Regular' },
  progressBar: {
    height: 6, backgroundColor: theme.colors.border, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },
  planBenefits: {
    fontSize: 12, color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  plansScroll: { marginHorizontal: -16 },
  plansScrollContent: { paddingHorizontal: 16 },
  planChip: {
    width: 130, backgroundColor: theme.colors.surface, borderRadius: 16,
    padding: 14, marginRight: 10, alignItems: 'center', gap: 4,
    borderWidth: 2, borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  planChipActive: { borderColor: theme.colors.success, backgroundColor: '#F0FBF4' },
  popularTag: {
    backgroundColor: theme.colors.primary, borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
    position: 'absolute', top: 10, right: 10,
  },
  popularTagText: { fontSize: 9, fontWeight: '700', color: theme.colors.dark, fontFamily: 'Poppins_700Bold' },
  planChipName: {
    fontSize: 15, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  planChipNameActive: { color: theme.colors.success },
  planChipDuration: {
    fontSize: 11, color: theme.colors.textMuted, fontFamily: 'Poppins_400Regular',
  },
  planChipPrice: {
    fontSize: 22, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  planChipPriceActive: { color: theme.colors.success },
  originalPrice: {
    fontSize: 12, color: theme.colors.textMuted, textDecorationLine: 'line-through',
    fontFamily: 'Poppins_400Regular',
  },
  selectedPlanDetails: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 12,
    ...theme.shadows.sm,
  },
  planDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  planDetailText: {
    flex: 1, fontSize: 13, color: theme.colors.text,
    fontFamily: 'Poppins_400Regular', lineHeight: 20,
  },
  subscribeBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 16, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...theme.shadows.card,
  },
  subscribeBtnText: {
    fontSize: 17, fontWeight: '700', color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
  termsText: {
    fontSize: 11, color: theme.colors.textMuted, textAlign: 'center',
    fontFamily: 'Poppins_400Regular', lineHeight: 17,
  },
});
