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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

interface Field {
  label: string;
  value: string;
  setter: (v: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "email-address";
  icon: "person-outline" | "call-outline" | "mail-outline";
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const isValid = name.trim().length > 0 && phone.length === 10 && email.includes("@");

  const handleCreate = async () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await register(name.trim(), `+91 ${phone}`, email.trim());
    router.replace("/(tabs)/home");
  };

  const fields: Field[] = [
    {
      label: "Full Name",
      value: name,
      setter: setName,
      placeholder: "Enter your full name",
      keyboardType: "default",
      icon: "person-outline",
    },
    {
      label: "Phone Number",
      value: phone,
      setter: setPhone,
      placeholder: "10-digit mobile number",
      keyboardType: "phone-pad",
      icon: "call-outline",
    },
    {
      label: "Email Address",
      value: email,
      setter: setEmail,
      placeholder: "Enter your email",
      keyboardType: "email-address",
      icon: "mail-outline",
    },
  ];

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

      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={Colors.grey} />
          </View>
          <Pressable style={styles.editAvatarBtn}>
            <Ionicons name="camera" size={16} color={Colors.dark} />
          </Pressable>
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join RideGo and start riding</Text>

        <View style={styles.form}>
          {fields.map((field) => (
            <View key={field.label} style={styles.fieldContainer}>
              <Text style={styles.label}>{field.label}</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === field.label && styles.inputFocused,
                ]}
              >
                <Ionicons
                  name={field.icon}
                  size={20}
                  color={
                    focusedField === field.label ? Colors.primary : Colors.grey
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={Colors.grey}
                  keyboardType={field.keyboardType ?? "default"}
                  autoCapitalize={field.keyboardType === "default" ? "words" : "none"}
                  onFocus={() => setFocusedField(field.label)}
                  onBlur={() => setFocusedField(null)}
                  maxLength={field.keyboardType === "phone-pad" ? 10 : undefined}
                />
              </View>
            </View>
          ))}
        </View>

        <Pressable
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!isValid || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating account..." : "Create Account"}
          </Text>
          {!loading && <Ionicons name="arrow-forward" size={18} color={Colors.white} />}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.footerLink}> Login</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: "35%",
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    textAlign: "center",
    marginBottom: 28,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  fieldContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGrey,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    height: 54,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    paddingRight: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
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
