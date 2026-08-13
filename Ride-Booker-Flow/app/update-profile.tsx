import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function UpdateProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | null>(null);
  const [loading, setLoading] = useState(false);

  const isFormValid = name.trim().length > 2 && email.includes('@') && gender !== null;

  const handleSubmit = async () => {
    if (!isFormValid || !user?.token) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://real.shelteric.com/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          gender
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Update local context
      if (updateUser) {
        updateUser({ name: data.user.name, email: data.user.email, gender: data.user.gender });
      }
      
      router.replace('/home');
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.subtitle}>Just a few more details to get started</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Doe"
            placeholderTextColor={Colors.grey}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. john@example.com"
            placeholderTextColor={Colors.grey}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map((g) => (
              <Pressable
                key={g}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g as any)}
              >
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Pressable 
          style={[styles.submitBtn, (!isFormValid || loading) && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!isFormValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Continue to RideGo</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: Colors.grey,
  },
  form: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: Colors.dark,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  genderText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: Colors.grey,
  },
  genderTextActive: {
    color: Colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGrey,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});
