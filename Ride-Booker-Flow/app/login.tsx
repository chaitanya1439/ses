import React, { useState, useEffect } from "react";
import { getAuth, signInWithPhoneNumber } from "@react-native-firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import BrandLogo from "@/components/BrandLogo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

const API_LOGIN_URL = "https://real.shelteric.com/auth/login";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<any | null>(null);

  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const isPhoneValid = phone.length === 10;
  const isOtpValid = otp.length === 6;

  const { login } = useAuth();

  const handleSendOtp = async () => {
    if (!isPhoneValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(withSpring(0.95), withSpring(1));
    
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

  const handleVerifyOtp = async () => {
    if (!isOtpValid || !confirmResult) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    
    try {
      const credential = await confirmResult.confirm(otp);
      if (!credential || !credential.user) throw new Error("Verification failed");
      
      const idToken = await credential.user.getIdToken();
      
      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: idToken, role: "rider" }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to login to backend");

      await login(`+91${phone}`, data.token, data.id, data.user);
      
      if (data.isNewUser) {
        router.replace("/update-profile" as any);
      } else {
        router.replace("/home");
      }

    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.illustrationContainer}>
            <BrandLogo width={160} height={160} />
            <View style={styles.dotPattern}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={[styles.dot, { opacity: 0.15 + i * 0.1 }]} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>{confirmResult ? "Enter OTP" : "Welcome back!"}</Text>
          <Text style={styles.subtitle}>
            {confirmResult ? `Sent to +91 ${phone}` : "Enter your phone number to continue"}
          </Text>

          {!confirmResult ? (
            <>
              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <View style={styles.prefix}>
                  <Text style={styles.flag}>🇮🇳</Text>
                  <Text style={styles.countryCode}>+91</Text>
                  <View style={styles.divider} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter mobile number"
                  placeholderTextColor={Colors.grey}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              <Animated.View style={buttonStyle}>
                <Pressable
                  style={[styles.button, (!isPhoneValid || loading) && styles.buttonDisabled]}
                  onPress={handleSendOtp}
                  disabled={!isPhoneValid || loading}
                >
                  <Text style={styles.buttonText}>{loading ? "Sending..." : "Send OTP"}</Text>
                  {!loading && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
                </Pressable>
              </Animated.View>
            </>
          ) : (
            <>
              <View style={[styles.inputContainer, isFocused && styles.inputFocused]}>
                <TextInput
                  style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 24 }]}
                  placeholder="------"
                  placeholderTextColor={Colors.grey}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>

              <Animated.View style={buttonStyle}>
                <Pressable
                  style={[styles.button, (!isOtpValid || loading) && styles.buttonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={!isOtpValid || loading}
                >
                  <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
                  {!loading && <Ionicons name="checkmark" size={18} color={Colors.white} />}
                </Pressable>
              </Animated.View>
            </>
          )}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New here?</Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.footerLink}> Register</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    ...(Platform.OS === "web" ? { paddingTop: 67 } : {}),
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.lightGrey,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  illustrationContainer: {
    alignItems: "center",
    position: "relative",
  },
  illustration: {
    width: 130,
    height: 130,
    backgroundColor: Colors.white,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  bikeIllustration: {
    position: "absolute",
    bottom: 18,
    right: 18,
  },
  dotPattern: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  greeting: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGrey,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 20,
    paddingRight: 16,
    height: 56,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    gap: 8,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.mediumGrey,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
    height: "100%",
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
});
