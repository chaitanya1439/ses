import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable,
  ScrollView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type VehicleType = 'Bike' | 'Scooty' | 'Auto';

const VEHICLE_TYPES: { type: VehicleType; icon: string }[] = [
  { type: 'Bike', icon: 'motorbike' },
  { type: 'Scooty', icon: 'scooter' },
  { type: 'Auto', icon: 'car' },
];

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Bike');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !phone || !vehicleNumber) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await register({
      name,
      phone: `+91 ${phone}`,
      email,
      vehicleType,
      vehicleNumber: vehicleNumber.toUpperCase(),
    });
    router.replace('/permissions');
    setLoading(false);
  };

  const Field = ({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'words' }: any) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? insets.top + 67 : 0 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Create Account</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={48} color={theme.colors.textMuted} />
          </View>
          <Pressable style={styles.addPhotoBtn}>
            <Ionicons name="camera" size={16} color={theme.colors.primary} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </Pressable>
        </View>

        <Field label="Full Name" value={name} onChangeText={setName} placeholder="Enter your full name" />
        <Field label="Phone Number" value={phone} onChangeText={setPhone} placeholder="10-digit number" keyboardType="phone-pad" autoCapitalize="none" />
        <Field label="Email (optional)" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Vehicle Number" value={vehicleNumber} onChangeText={setVehicleNumber} placeholder="TS09AB1234" autoCapitalize="characters" />

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Vehicle Type</Text>
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
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.registerBtn,
            { opacity: (!name || !phone || !vehicleNumber || loading) ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={handleRegister}
          disabled={!name || !phone || !vehicleNumber || loading}
        >
          <Text style={styles.registerBtnText}>{loading ? 'Creating Account...' : 'Register'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  content: {
    padding: 24, gap: 16,
  },
  avatarSection: {
    alignItems: 'center', gap: 8, marginBottom: 8,
  },
  avatarCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 2, borderColor: theme.colors.border,
    justifyContent: 'center', alignItems: 'center',
    borderStyle: 'dashed',
  },
  addPhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  addPhotoText: {
    fontSize: 13, fontWeight: '600', color: theme.colors.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  fieldContainer: { gap: 8 },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  fieldInput: {
    height: 52, backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: theme.colors.text,
    fontFamily: 'Poppins_400Regular',
  },
  vehicleRow: { flexDirection: 'row', gap: 10 },
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
  registerBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 14, height: 58,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    ...theme.shadows.card,
  },
  registerBtnText: {
    fontSize: 17, fontWeight: '700', color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
});
