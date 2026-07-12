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

interface Step {
  text: string;
  icon: string;
}

const STEPS: Step[] = [
  { text: 'Tap on claim insurance', icon: 'cellphone-check' },
  { text: 'Submit your details', icon: 'file-document-outline' },
  { text: 'Get claim amount', icon: 'hand-coin-outline' },
];

export default function AccidentalInsuranceScreen() {
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
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Accidental Insurance
          </Text>
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
        {/* ─── BENEFITS ─── */}
        <Text style={styles.sectionTitle}>Benefits</Text>

        <View style={styles.benefitGrid}>
          {/* Hospital Cover */}
          <View style={styles.benefitCard}>
            <View style={styles.benefitIconWrap}>
              <MaterialCommunityIcons
                name="hospital-building"
                size={28}
                color="#4A6CF7"
              />
            </View>
            <Text style={styles.benefitLabel}>Hospital Cover</Text>
            <Text style={styles.benefitValue}>₹50,000</Text>
          </View>
          {/* Death Cover */}
          <View style={styles.benefitCard}>
            <View style={[styles.benefitIconWrap, { backgroundColor: '#FDECEA' }]}>
              <MaterialCommunityIcons
                name="heart-broken"
                size={28}
                color="#EF4444"
              />
            </View>
            <Text style={styles.benefitLabel}>Death Cover</Text>
            <Text style={styles.benefitValue}>₹5,00,000</Text>
          </View>
        </View>

        {/* ─── ACCIDENT STEPS ─── */}
        <View style={styles.accidentCard}>
          <View style={styles.accidentHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.accidentTitle}>Had an accident?</Text>
              <Text style={styles.accidentSub}>Follow these steps</Text>
            </View>
            <MaterialCommunityIcons
              name="motorbike"
              size={40}
              color="#FFB800"
            />
          </View>

          <View style={styles.stepsContainer}>
            {STEPS.map((step, idx) => (
              <View key={idx} style={styles.stepRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumText}>{idx + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
                <View style={styles.stepIcon}>
                  <MaterialCommunityIcons
                    name={step.icon as any}
                    size={22}
                    color="#6B7280"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ─── FOOTER ─── */}
        <View style={styles.footer}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Powered by InsurePartner</Text>
        </View>
      </ScrollView>

      {/* ─── BOTTOM CTA ─── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.claimBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          }
        >
          <Text style={styles.claimBtnText}>Claim Insurance</Text>
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
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    flexShrink: 1,
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

  scrollContent: { padding: 16, gap: 16 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Benefit Grid */
  benefitGrid: { flexDirection: 'row', gap: 12 },
  benefitCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  benefitValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Accident Card */
  accidentCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  accidentHeader: {
    backgroundColor: '#4A6CF7',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  accidentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  accidentSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  stepsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4A6CF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins_400Regular',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Footer */
  footer: { alignItems: 'center', gap: 12, marginTop: 8 },
  footerDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    width: '100%',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },

  /* Bottom CTA */
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
  claimBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  claimBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
});
