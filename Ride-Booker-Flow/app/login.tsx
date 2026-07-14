import React, { useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const buttonScale = useSharedValue(1);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const isValid = phone.length === 10;

  const handleSendOtp = async () => {
    if (!isValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    router.push({ pathname: "/otp", params: { phone } });
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
            <View style={styles.illustration}>
              <MaterialCommunityIcons name="map-marker-radius" size={60} color={Colors.primary} />
              <View style={styles.bikeIllustration}>
                <MaterialCommunityIcons name="motorbike" size={32} color={Colors.dark} />
              </View>
            </View>
            <View style={styles.dotPattern}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={[styles.dot, { opacity: 0.15 + i * 0.1 }]} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            Enter your phone number to continue
          </Text>

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
              style={[styles.button, !isValid && styles.buttonDisabled]}
              onPress={handleSendOtp}
              disabled={!isValid}
            >
              <Text style={styles.buttonText}>Send OTP</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </Pressable>
          </Animated.View>

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
