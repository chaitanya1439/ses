import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';

const VEHICLE_TYPES = [
  { type: 'Bike', icon: 'motorbike' },
  { type: 'Scooty', icon: 'scooter' },
  { type: 'Auto', icon: 'car' },
];

export default function AdditionalDetails() {
  const insets = useSafeAreaInsets();
  const { updateDriver, driver } = useAuth();
  
  const [name, setName] = useState(driver?.name || '');
  const [email, setEmail] = useState(driver?.email || '');
  const [phone, setPhone] = useState(driver?.phone || '');
  const [alternatePhone, setAlternatePhone] = useState(driver?.alternatePhone || '');
  const [gender, setGender] = useState(driver?.gender || '');
  const [dob, setDob] = useState(driver?.dob || '');
  const [languages, setLanguages] = useState(driver?.languages || '');
  const [vehicleType, setVehicleType] = useState(driver?.vehicleType || 'Bike');
  const [vehicleNumber, setVehicleNumber] = useState(driver?.vehicleNumber || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !email || !phone || !gender || !dob || !languages || !vehicleType || !vehicleNumber) {
      alert("Please fill in all required fields.");
      return;
    }
    
    setLoading(true);
    // Silently submit to Google Form Database
    try {
      const body = `entry.2005620554=${encodeURIComponent(name)}&entry.1045781291=${encodeURIComponent(email)}&entry.1065046570=${encodeURIComponent(phone)}&entry.1166974658=${encodeURIComponent(alternatePhone)}`;
      await fetch('https://docs.google.com/forms/d/e/1FAIpQLScnTQCQcf85Rd2L9-LBgr9P4qBYhyuE6plE2Ev-S4AJOcwB9A/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
    } catch (e) {
      console.warn('Google Form submission failed', e);
    }
    
    updateDriver({
      name,
      email,
      phone,
      alternatePhone,
      gender,
      dob,
      languages,
      isDetailsVerified: true,
    });

    setLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const genders = ['Male', 'Female', 'Other'];

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Additional Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput 
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter your name"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Email *</Text>
        <TextInput 
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Phone Number *</Text>
        <TextInput 
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter your phone"
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Alternate Phone Number</Text>
        <TextInput 
          style={styles.input}
          value={alternatePhone}
          onChangeText={setAlternatePhone}
          placeholder="Enter alternate phone (optional)"
          keyboardType="phone-pad"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Date of Birth *</Text>
        <TextInput 
          style={styles.input}
          value={dob}
          onChangeText={setDob}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Languages Known *</Text>
        <TextInput 
          style={styles.input}
          value={languages}
          onChangeText={setLanguages}
          placeholder="e.g. English, Telugu, Hindi"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Gender *</Text>
        <View style={styles.genderRow}>
          {genders.map(g => (
            <Pressable 
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>{g}</Text>
            </Pressable>
          ))}
        </View>

        
        <Text style={styles.label}>Vehicle Number *</Text>
        <TextInput 
          style={styles.input}
          value={vehicleNumber}
          onChangeText={setVehicleNumber}
          placeholder="TS09AB1234"
          autoCapitalize="characters"
          placeholderTextColor={theme.colors.textMuted}
        />

        <Text style={styles.label}>Vehicle Type *</Text>
        <View style={styles.vehicleRow}>
          {VEHICLE_TYPES.map(({ type, icon }) => (
            <Pressable
              key={type}
              style={[styles.vehicleChip, vehicleType === type && styles.vehicleChipActive]}
              onPress={() => {
                setVehicleType(type);
                Haptics.selectionAsync();
              }}
            >
              <MaterialCommunityIcons
                name={icon as any}
                size={22}
                color={vehicleType === type ? theme.colors.dark : theme.colors.textLight}
              />
              <Text style={[styles.vehicleText, vehicleType === type && styles.vehicleTextActive]}>{type}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Details'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  scrollContent: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: theme.colors.text,
    marginBottom: 20,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  genderBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  genderBtnActive: {
    backgroundColor: theme.colors.primary + '1A',
    borderColor: theme.colors.primary,
  },
  genderText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: theme.colors.textMuted,
  },
  genderTextActive: {
    color: theme.colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  vehicleChip: {
    flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 2, borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
  },
  vehicleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '18',
  },
  vehicleText: {
    fontSize: 12, fontWeight: '600', color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  vehicleTextActive: {
    color: theme.colors.dark,
  },

  saveBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    ...theme.shadows.card,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
});
