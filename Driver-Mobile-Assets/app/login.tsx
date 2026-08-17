import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '@/components/BrandLogo';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

const API_LOGIN_URL = 'https://real.shelteric.com/auth/login';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmResult, setConfirmResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start();
  };

  const handleBlur = () => {
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.border, theme.colors.primary],
  });

  const { login } = useAuth();

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    const fullPhone = `+91${phone}`;
    try {
      const auth = getAuth();
      const confirmation = await signInWithPhoneNumber(auth, fullPhone);
      setConfirmResult(confirmation);
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      alert('Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 6 || !confirmResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    const fullPhone = `+91${phone}`;
    try {
      const credential = await confirmResult.confirm(otp);
      if (!credential || !credential.user) throw new Error("Verification failed");
      
      const idToken = await credential.user.getIdToken();

      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: idToken, role: "driver" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to login");
      }

      // Store the JWT token and login
      const driverData = data.driver || data.user || {};
      await login(fullPhone, data.token, data.user?.id || data.id, {
        ...driverData,
        isVerified: !data.isNewUser,
        subscriptionExpiryDate: driverData.subscriptionExpiryDate || driverData.subscriptionExpiry,
      });
      
      // Route based on user existence
      if (data.isNewUser) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? insets.top + 67 : 0 }]}>
      <LinearGradient
        colors={[theme.colors.dark, theme.colors.darkCard]}
        style={styles.topSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.topContent, { paddingTop: insets.top + 24 }]}>
          <View style={[styles.logoMini, { backgroundColor: 'transparent', padding: 0 }]}>
            <BrandLogo width={80} height={80} />
          </View>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.subText}>Sign in to continue earning</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.formContainer}
      >
        <ScrollView
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{confirmResult ? "Enter OTP" : "Enter your phone number"}</Text>
          <Text style={styles.sectionSub}>
            {confirmResult ? `Sent to +91 ${phone}` : "We'll send you a verification code"}
          </Text>

          {!confirmResult ? (
            <>
              <Animated.View style={[styles.inputWrapper, { borderColor }]}>
                <View style={styles.flagBox}>
                  <Text style={styles.flag}>IN</Text>
                  <Text style={styles.dialCode}>+91</Text>
                  <View style={styles.inputDivider} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="98765 43210"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                {phone.length === 10 && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.success} />
                )}
              </Animated.View>

              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  { opacity: phone.length < 10 || loading ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                onPress={handleSendOTP}
                disabled={phone.length < 10 || loading}
              >
                <Text style={styles.sendBtnText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                {!loading && <Ionicons name="arrow-forward" size={20} color={theme.colors.dark} />}
              </Pressable>
            </>
          ) : (
            <>
              <Animated.View style={[styles.inputWrapper, { borderColor }]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
                  placeholder="------"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </Animated.View>

              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  { opacity: otp.length < 6 || loading ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
                onPress={handleVerifyOTP}
                disabled={otp.length < 6 || loading}
              >
                <Text style={styles.sendBtnText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
                {!loading && <Ionicons name="checkmark" size={20} color={theme.colors.dark} />}
              </Pressable>
            </>
          )}

          <View style={styles.dividerRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>


        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  topSection: { height: 240 },
  topContent: {
    flex: 1,
    paddingHorizontal: 24,
    gap: 8,
  },
  logoMini: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,184,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
  subText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Poppins_400Regular',
  },
  formContainer: { flex: 1 },
  formContent: {
    padding: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 13,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceAlt,
    paddingRight: 12,
    height: 58,
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 6,
  },
  flag: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textLight,
    fontFamily: 'Poppins_700Bold',
  },
  dialCode: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border,
    marginLeft: 6,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1,
    paddingHorizontal: 12,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4,
    ...theme.shadows.card,
  },
  sendBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  divText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  registerBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 15,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
});
