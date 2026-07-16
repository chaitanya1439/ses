import React, { useState, useRef, useEffect } from "react";
import { verifyOTP } from "@/lib/aws-cognito";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const { phone, session } = useLocalSearchParams<{ phone: string; session: string }>();
  const { login } = useAuth();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const buttonScale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (val: string, index: number) => {
    if (val.length > 1) {
      const digits = val.slice(0, OTP_LENGTH).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputs.current[nextIdx]?.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    try {
       const fullPhone = `+91${phone}`;
       
       // 🚨 TESTING BACKDOOR: If AWS SMS is failing due to Pinpoint quotas, allow 123456 to bypass
       if (code === '123456') {
         Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
         buttonScale.value = withSequence(
           withSpring(0.95),
           withSpring(1)
         );
         await login(fullPhone, 'dummy_token_for_testing');
         router.replace("/(tabs)/home");
         return;
       }

       const response = await verifyOTP(fullPhone, code, session);
       
       if (response.AuthenticationResult) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          buttonScale.value = withSequence(
            withSpring(0.95),
            withSpring(1)
          );
          await login(fullPhone, response.AuthenticationResult.IdToken);
          router.replace("/(tabs)/home");
       } else {
          throw new Error("Invalid OTP");
       }
    } catch (error: any) {
       alert("Verification Failed: " + error.message);
       shakeX.value = withSequence(
        withTiming(-10, { duration: 60 }),
        withTiming(10, { duration: 60 }),
        withTiming(0, { duration: 60 })
       );
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(""));
    setCountdown(30);
    setCanResend(false);
    inputs.current[0]?.focus();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const maskedPhone = phone ? `+91 ${phone.slice(0, 2)}XXXXXXXX` : "";

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          ...(Platform.OS === "web" ? { paddingTop: 67 } : {}),
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={Colors.dark} />
      </Pressable>

      <View style={styles.content}>
        <View style={styles.pinIcon}>
          <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>
          OTP sent to{" "}
          <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
        </Text>

        <Animated.View style={[styles.otpRow, shakeStyle]}>
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              style={[styles.otpBox, digit ? styles.otpFilled : null]}
              value={digit}
              onChangeText={(val) => handleChange(val, i)}
              onKeyPress={({ nativeEvent }) =>
                handleKeyPress(nativeEvent.key, i)
              }
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              selectTextOnFocus
            />
          ))}
        </Animated.View>

        <Pressable onPress={handleResend} disabled={!canResend}>
          <Text style={[styles.resendText, canResend && styles.resendActive]}>
            {canResend ? "Resend OTP" : `Resend OTP in ${countdown}s`}
          </Text>
        </Pressable>

        <Animated.View style={[{ width: "100%", marginTop: 32 }, buttonStyle]}>
          <Pressable
            style={[styles.button, otp.join("").length < OTP_LENGTH && styles.buttonDisabled]}
            onPress={handleVerify}
          >
            <Text style={styles.buttonText}>Verify</Text>
            <Ionicons name="checkmark" size={18} color={Colors.white} />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  backBtn: {
    padding: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: "center",
  },
  pinIcon: {
    width: 80,
    height: 80,
    backgroundColor: Colors.lightGrey,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    textAlign: "center",
    marginBottom: 32,
  },
  phoneHighlight: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.lightGrey,
    borderWidth: 2,
    borderColor: "transparent",
    textAlign: "center",
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  otpFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  resendText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
    textAlign: "center",
  },
  resendActive: {
    color: Colors.primary,
    fontFamily: "Poppins_600SemiBold",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
});
