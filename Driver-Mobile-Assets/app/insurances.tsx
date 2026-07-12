import React, { useState } from 'react';
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

interface Benefit {
  icon: string;
  text: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: 'cash-multiple',
    text: 'Covid and other insurance coverage of upto ₹3 Lakhs',
  },
  {
    icon: 'cellphone-text',
    text: 'Cashless insurance in more than 6000+ hospitals',
  },
  {
    icon: 'pill',
    text: 'Accidental hospitalization coverage from Day 1',
  },
];

export default function InsurancesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const [agreed, setAgreed] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.topBarTitle}>Insurances</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 90 },
        ]}
      >
        {/* ─── BENEFITS SECTION ─── */}
        <Text style={styles.sectionTitle}>Benefits of the Insurance</Text>

        {BENEFITS.map((benefit, idx) => (
          <View key={idx} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <MaterialCommunityIcons
                name={benefit.icon as any}
                size={22}
                color="#4DB6AC"
              />
            </View>
            <Text style={styles.benefitText}>{benefit.text}</Text>
          </View>
        ))}

        {/* ─── WHO CAN APPLY ─── */}
        <View style={styles.applyHeader}>
          <Text style={styles.applyHeaderText}>Who all can apply?</Text>
        </View>
        <View style={styles.applyContent}>
          <View style={styles.applyRow}>
            <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
            <Text style={styles.applyText}>
              Individuals and their family under the age of 60 can apply.
            </Text>
          </View>
        </View>
        <View style={styles.divider} />

        {/* ─── TERMS ─── */}
        <Pressable>
          <Text style={styles.termsLink}>View Terms & Conditions*</Text>
        </Pressable>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => {
            setAgreed(!agreed);
            Haptics.selectionAsync();
          }}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
            {agreed && (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agreed to Terms of the medical assistance scheme.
          </Text>
        </Pressable>
      </ScrollView>

      {/* ─── BOTTOM CTA ─── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.proceedBtn,
            { opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          }
        >
          <Text style={styles.proceedBtnText}>PROCEED</Text>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  scrollContent: { padding: 16, gap: 16 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4DB6AC',
    fontFamily: 'Poppins_700Bold',
  },

  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
    paddingTop: 10,
  },

  applyHeader: {
    backgroundColor: '#4DB6AC',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  applyHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  applyContent: { paddingVertical: 4 },
  applyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  applyText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  termsLink: {
    fontSize: 14,
    color: '#2563EB',
    fontFamily: 'Poppins_400Regular',
    textDecorationLine: 'underline',
  },

  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#4DB6AC',
    borderColor: '#4DB6AC',
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },

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
  proceedBtn: {
    backgroundColor: '#FFB800',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  proceedBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
});
