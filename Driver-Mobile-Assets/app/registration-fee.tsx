import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

export default function RegistrationFeeScreen() {
  const insets = useSafeAreaInsets();
  const { updateDriver } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      setLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      updateDriver({ hasPaidRegistrationFee: true });
      Alert.alert('Success', 'Payment successful. You can now go online.');
      router.back();
    }, 1500);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Activation Fee</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="shield-check-outline" size={64} color={theme.colors.primary} />
        </View>
        <Text style={styles.title}>Pilot Activation</Text>
        <Text style={styles.desc}>
          To start receiving rides and go online, a one-time activation fee is required for new pilots.
        </Text>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>One-time fee</Text>
          <Text style={styles.priceValue}>₹200</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable 
          style={[styles.payBtn, loading && styles.payBtnDisabled]} 
          onPress={handlePayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.dark} />
          ) : (
            <Text style={styles.payBtnText}>Pay ₹200 to Activate</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, fontFamily: 'Poppins_600SemiBold' },
  content: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.primary + '1A', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: theme.colors.text, fontFamily: 'Poppins_700Bold', marginBottom: 12 },
  desc: { fontSize: 15, color: theme.colors.textMuted, fontFamily: 'Poppins_400Regular', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  priceCard: { width: '100%', backgroundColor: theme.colors.surfaceAlt, borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  priceLabel: { fontSize: 14, color: theme.colors.textLight, fontFamily: 'Poppins_500Medium', marginBottom: 4 },
  priceValue: { fontSize: 36, fontWeight: '700', color: theme.colors.text, fontFamily: 'Poppins_700Bold' },
  footer: { paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface },
  payBtn: { height: 56, backgroundColor: theme.colors.primary, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { fontSize: 16, fontWeight: '700', color: theme.colors.dark, fontFamily: 'Poppins_700Bold' },
});
