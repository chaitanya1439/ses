import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DrivingLicenseScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const licenseNumber = 'AP29 2020\n0012345';

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
        <Text style={styles.topBarTitle}>Driving License</Text>
      </View>

      {/* ─── BODY ─── */}
      <View style={styles.body}>
        {/* Verification Card */}
        <View style={styles.card}>
          {/* Green check icon */}
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
          </View>

          <Text style={styles.verifiedText}>
            Your Driving License is verified
          </Text>

          {/* License number box */}
          <View style={styles.licenseBox}>
            <View style={styles.blueBar} />
            <Text style={styles.licenseNumber}>{licenseNumber}</Text>
          </View>

          {/* View button */}
          <Pressable
            style={({ pressed }) => [
              styles.viewBtn,
              { opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <Text style={styles.viewBtnText}>View Driving License</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F0F2F5' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Body */
  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 5,
  },

  /* Green circle */
  checkCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  verifiedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 24,
  },

  /* License Box */
  licenseBox: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 24,
  },
  blueBar: {
    width: 6,
    backgroundColor: '#2979FF',
  },
  licenseNumber: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    paddingVertical: 16,
    paddingHorizontal: 16,
    letterSpacing: 1.5,
    lineHeight: 30,
  },

  /* View button */
  viewBtn: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2979FF',
    fontFamily: 'Poppins_700Bold',
  },
});
