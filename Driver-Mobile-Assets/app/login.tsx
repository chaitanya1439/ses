import React, { useState, useRef } from 'react';
import { signUpUser, initiateLogin } from '@/lib/aws-cognito';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
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

  const handleSendOTP = async () => {
    if (phone.length < 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    const fullPhone = `+91${phone}`;
    try {
      let response = await initiateLogin(fullPhone);
      router.push({ pathname: '/otp', params: { phone: fullPhone, session: response.Session } });
    } catch (error: any) {
      console.error('AWS Login Error:', error);
      if (error.name === 'UserNotFoundException') {
        try {
          await signUpUser(fullPhone);
          const loginResponse = await initiateLogin(fullPhone);
          router.push({ pathname: '/otp', params: { phone: fullPhone, session: loginResponse.Session } });
        } catch (signUpError: any) {
          console.error('AWS Signup Error:', signUpError);
          // 🚨 TESTING BACKDOOR: If AWS fails, go to OTP anyway
          alert('AWS Error, but bypassing for testing. Enter 123456 as OTP.');
          router.push({ pathname: '/otp', params: { phone: fullPhone, session: 'dummy' } });
        }
      } else {
        // 🚨 TESTING BACKDOOR: Bypassing AWS errors
        alert('AWS Login Error: ' + error.message + ' - Bypassing for testing. Enter 123456 as OTP.');
        router.push({ pathname: '/otp', params: { phone: fullPhone, session: 'dummy' } });
      }
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
          <View style={styles.logoMini}>
            <MaterialCommunityIcons name="steering" size={36} color={theme.colors.primary} />
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
          <Text style={styles.sectionTitle}>Enter your phone number</Text>
          <Text style={styles.sectionSub}>We&apos;ll send you a verification code</Text>

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

          <View style={styles.dividerRow}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>OR</Text>
            <View style={styles.divLine} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.registerText}>New driver? </Text>
            <Text style={styles.registerLink}>Register here</Text>
          </Pressable>
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
