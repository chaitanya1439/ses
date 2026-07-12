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

export default function ParcelDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const [step1Paid, setStep1Paid] = useState(false);
  const [trainingStarted, setTrainingStarted] = useState(false);

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[theme.colors.teal, '#00897B', '#004D40']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </Pressable>

        <View style={styles.headerContent}>
          <View style={styles.deliveryIconRow}>
            <View style={styles.deliveryIconBox}>
              <MaterialCommunityIcons name="package-variant-closed" size={52} color="#FFF" />
            </View>
          </View>
          <Text style={styles.headerTitle}>Parcel Delivery</Text>
          <Text style={styles.headerEarnings}>40% more earnings with Delivery</Text>

          <View style={styles.freeServicesRow}>
            <View style={styles.serviceChip}>
              <MaterialCommunityIcons name="package-variant" size={16} color="#FFF" />
              <Text style={styles.serviceChipText}>Parcel</Text>
            </View>
            <View style={styles.serviceChip}>
              <MaterialCommunityIcons name="food" size={16} color="#FFF" />
              <Text style={styles.serviceChipText}>Food</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepsHeader}>
          <Text style={styles.stepsTitle}>How to get started</Text>
          <Text style={styles.stepsSub}>Complete both steps to unlock parcel delivery</Text>
        </View>

        <View style={[styles.stepCard, step1Paid && styles.stepCardDone]}>
          <View style={styles.stepNumRow}>
            <View style={[styles.stepNum, step1Paid && styles.stepNumDone]}>
              {step1Paid
                ? <Ionicons name="checkmark" size={18} color="#FFF" />
                : <Text style={styles.stepNumText}>1</Text>
              }
            </View>
            <Text style={styles.stepTitle}>Subscribe to Delivery Plan</Text>
          </View>

          <View style={styles.priceRow}>
            <View>
              <View style={styles.priceWithOff}>
                <Text style={styles.originalPriceText}>₹298</Text>
                <View style={styles.offBadge}>
                  <Text style={styles.offText}>50% OFF</Text>
                </View>
              </View>
              <Text style={styles.priceFinal}>₹149 only</Text>
            </View>
            <View style={styles.cashbackBox}>
              <MaterialCommunityIcons name="gift" size={20} color={theme.colors.success} />
              <Text style={styles.cashbackText}>Get ₹150 cashback</Text>
            </View>
          </View>

          <Text style={styles.stepRequirement}>
            After completing 15 RideDriver rides (Bike Taxi or Delivery)
          </Text>

          {!step1Paid ? (
            <Pressable
              style={({ pressed }) => [styles.payBtn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStep1Paid(true);
              }}
            >
              <Text style={styles.payBtnText}>Pay ₹149</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.dark} />
            </Pressable>
          ) : (
            <View style={styles.paidSuccessRow}>
              <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
              <Text style={styles.paidSuccessText}>Payment successful! Awaiting rides completion</Text>
            </View>
          )}
        </View>

        <View style={[styles.stepCard, !step1Paid && styles.stepCardLocked]}>
          <View style={styles.stepNumRow}>
            <View style={[styles.stepNum, !step1Paid && styles.stepNumLocked, trainingStarted && styles.stepNumDone]}>
              {trainingStarted
                ? <Ionicons name="checkmark" size={18} color="#FFF" />
                : <Text style={[styles.stepNumText, !step1Paid && { color: theme.colors.textMuted }]}>2</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepTitle, !step1Paid && { color: theme.colors.textMuted }]}>
                Complete Training
              </Text>
              {!step1Paid && (
                <View style={styles.lockedRow}>
                  <Ionicons name="lock-closed" size={12} color={theme.colors.textMuted} />
                  <Text style={styles.lockedText}>Complete Step 1 first</Text>
                </View>
              )}
            </View>
          </View>

          {step1Paid && (
            <>
              <Text style={styles.trainingDesc}>
                Learn delivery protocols through short videos. Takes about 15 minutes.
              </Text>

              <View style={styles.moduleList}>
                {['Package Handling', 'Customer Interaction', 'Safety Guidelines', 'App Usage'].map((module, i) => (
                  <View key={module} style={styles.moduleRow}>
                    <View style={[styles.moduleIcon, { backgroundColor: theme.colors.tealLight }]}>
                      <MaterialCommunityIcons name="play-circle" size={20} color={theme.colors.teal} />
                    </View>
                    <Text style={styles.moduleText}>{module}</Text>
                    <Text style={styles.moduleDuration}>{3 + i}m</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.startTrainingBtn,
                  { opacity: pressed ? 0.85 : 1, backgroundColor: trainingStarted ? theme.colors.success : theme.colors.teal },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setTrainingStarted(true);
                }}
              >
                <MaterialCommunityIcons name={trainingStarted ? 'check-bold' : 'play'} size={20} color="#FFF" />
                <Text style={styles.startTrainingText}>
                  {trainingStarted ? 'Training Complete!' : 'Start Training'}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {step1Paid && trainingStarted && (
          <View style={styles.allDoneCard}>
            <MaterialCommunityIcons name="party-popper" size={36} color={theme.colors.primary} />
            <Text style={styles.allDoneTitle}>You&apos;re All Set!</Text>
            <Text style={styles.allDoneDesc}>
              Parcel delivery has been enabled on your account. You&apos;ll start seeing delivery requests soon.
            </Text>
          </View>
        )}

        <Pressable style={styles.termsRow} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
          <Ionicons name="document-text-outline" size={16} color={theme.colors.textLight} />
          <Text style={styles.termsText}>Terms & Conditions</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceAlt },
  header: { paddingHorizontal: 20, paddingBottom: 28 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginTop: 16, marginBottom: 12,
  },
  headerContent: { gap: 12, alignItems: 'center' },
  deliveryIconRow: { marginBottom: 4 },
  deliveryIconBox: {
    width: 100, height: 100, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
  headerEarnings: {
    fontSize: 15, color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_500Medium',
  },
  freeServicesRow: { flexDirection: 'row', gap: 10 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  serviceChipText: { fontSize: 13, fontWeight: '600', color: '#FFF', fontFamily: 'Poppins_600SemiBold' },
  content: { padding: 16, gap: 14 },
  stepsHeader: { gap: 4 },
  stepsTitle: {
    fontSize: 18, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  stepsSub: {
    fontSize: 13, color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  stepCard: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 14,
    borderWidth: 2, borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  stepCardDone: { borderColor: theme.colors.success + '60' },
  stepCardLocked: { opacity: 0.7 },
  stepNumRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumDone: { backgroundColor: theme.colors.success },
  stepNumLocked: { backgroundColor: theme.colors.border },
  stepNumText: {
    fontSize: 16, fontWeight: '700', color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
  stepTitle: {
    fontSize: 16, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  priceWithOff: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  originalPriceText: {
    fontSize: 14, color: theme.colors.textMuted,
    textDecorationLine: 'line-through', fontFamily: 'Poppins_400Regular',
  },
  offBadge: {
    backgroundColor: theme.colors.danger, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  offText: { fontSize: 11, fontWeight: '700', color: '#FFF', fontFamily: 'Poppins_700Bold' },
  priceFinal: { fontSize: 24, fontWeight: '700', color: theme.colors.text, fontFamily: 'Poppins_700Bold' },
  cashbackBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.successLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  cashbackText: { fontSize: 12, fontWeight: '600', color: theme.colors.success, fontFamily: 'Poppins_600SemiBold' },
  stepRequirement: { fontSize: 12, color: theme.colors.textLight, fontFamily: 'Poppins_400Regular' },
  payBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 12, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...theme.shadows.sm,
  },
  payBtnText: { fontSize: 16, fontWeight: '700', color: theme.colors.dark, fontFamily: 'Poppins_700Bold' },
  paidSuccessRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  paidSuccessText: { fontSize: 13, color: theme.colors.success, fontFamily: 'Poppins_600SemiBold', flex: 1 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  lockedText: { fontSize: 12, color: theme.colors.textMuted, fontFamily: 'Poppins_400Regular' },
  trainingDesc: { fontSize: 13, color: theme.colors.textLight, fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  moduleList: { gap: 10 },
  moduleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.surfaceAlt, borderRadius: 12, padding: 12,
  },
  moduleIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  moduleText: { flex: 1, fontSize: 13, fontWeight: '600', color: theme.colors.text, fontFamily: 'Poppins_600SemiBold' },
  moduleDuration: { fontSize: 12, color: theme.colors.textMuted, fontFamily: 'Poppins_400Regular' },
  startTrainingBtn: {
    borderRadius: 12, height: 50,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    ...theme.shadows.sm,
  },
  startTrainingText: { fontSize: 16, fontWeight: '700', color: '#FFF', fontFamily: 'Poppins_700Bold' },
  allDoneCard: {
    alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.primary + '18',
    borderRadius: 16, padding: 24,
    borderWidth: 1.5, borderColor: theme.colors.primary + '40',
  },
  allDoneTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, fontFamily: 'Poppins_700Bold' },
  allDoneDesc: { fontSize: 13, color: theme.colors.textLight, textAlign: 'center', fontFamily: 'Poppins_400Regular', lineHeight: 20 },
  termsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 8,
  },
  termsText: { fontSize: 13, color: theme.colors.textLight, fontFamily: 'Poppins_400Regular' },
});
