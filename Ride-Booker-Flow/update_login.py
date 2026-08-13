import re

with open('/media/callidus/callidus2/ses/Ride-Booker-Flow/app/login.tsx', 'r') as f:
    content = f.read()

# Imports
content = content.replace(
    'import React, { useState } from "react";',
    'import React, { useState, useEffect } from "react";\nimport auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";'
)

# API URL
content = content.replace(
    "const API_LOGIN_URL = 'https://12l474pge3.execute-api.us-east-1.amazonaws.com/Prod/login';",
    "const API_LOGIN_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/auth/login' : 'http://localhost:3000/auth/login';"
)

# State
state_str = """  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmResult, setConfirmResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
"""
content = content.replace('  const [phone, setPhone] = useState("");', state_str)

# Validation
content = content.replace('  const isValid = phone.length === 10;', '  const isPhoneValid = phone.length === 10;\n  const isOtpValid = otp.length === 6;')

# Handle Send OTP
new_handle_send_otp = """  const handleSendOtp = async () => {
    if (!isPhoneValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(withSpring(0.95), withSpring(1));
    
    setLoading(true);
    const fullPhone = `+91${phone}`;
    try {
      const confirmation = await auth().signInWithPhoneNumber(fullPhone);
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

      await login(`+91${phone}`, data.token);
      router.replace("/home");

    } catch (error: any) {
      console.error('Verify OTP Error:', error);
      alert('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };"""
content = re.sub(r'  const handleSendOtp = async \(\) => \{[\s\S]*?  \};\n', new_handle_send_otp + '\n', content)

# UI
ui_content = """        <View style={styles.content}>
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
          )}"""

content = re.sub(r'        <View style=\{styles\.content\}>[\s\S]*?        <\/View>\n      <\/ScrollView>', ui_content + '\n          <View style={styles.footer}>\n            <Text style={styles.footerText}>New here?</Text>\n            <Pressable onPress={() => router.push("/register")}>\n              <Text style={styles.footerLink}> Register</Text>\n            </Pressable>\n          </View>\n        </View>\n      </ScrollView>', content)

with open('/media/callidus/callidus2/ses/Ride-Booker-Flow/app/login.tsx', 'w') as f:
    f.write(content)
