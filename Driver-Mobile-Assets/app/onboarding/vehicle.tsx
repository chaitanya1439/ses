import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import * as Haptics from 'expo-haptics';
import { SOCKET_URL } from '@/constants/config';

export default function VehicleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { driver, updateDriver } = useAuth();
  
  const [vehicleTypes, setVehicleTypes] = useState<{id: string, name: string}[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    vehicleType: driver?.vehicleType || '',
    vehicleBrand: driver?.vehicleBrand || '',
    vehicleModel: driver?.vehicleModel || '',
    vehicleNumber: driver?.vehicleNumber || '',
    vehicleColor: driver?.vehicleColor || '',
    vehicleYear: driver?.vehicleYear || '',
    seatingCapacity: driver?.seatingCapacity?.toString() || '',
  });

  useEffect(() => {
    // Fetch dynamic vehicle types from backend
    const fetchTypes = async () => {
      try {
        const API_URL = SOCKET_URL.replace('ws://', 'http://').replace('wss://', 'https://');
        const res = await fetch(`${API_URL}/api/vehicle-types`);
        if (res.ok) {
          const data = await res.json();
          setVehicleTypes(data.types);
        } else {
          // Fallback for dev without backend
          setVehicleTypes([
            { id: 'bike', name: 'Bike' },
            { id: 'auto', name: 'Auto Rickshaw' },
            { id: 'mini', name: 'Mini Cab' },
            { id: 'sedan', name: 'Sedan' },
            { id: 'suv', name: 'SUV' }
          ]);
        }
      } catch (err) {
        setVehicleTypes([
          { id: 'bike', name: 'Bike' },
          { id: 'auto', name: 'Auto Rickshaw' },
          { id: 'mini', name: 'Mini Cab' },
          { id: 'sedan', name: 'Sedan' },
          { id: 'suv', name: 'SUV' }
        ]);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchTypes();
  }, []);

  const handleSave = async () => {
    if (!form.vehicleType || !form.vehicleBrand || !form.vehicleModel || !form.vehicleNumber) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);

    // Simulate saving to backend
    setTimeout(() => {
      updateDriver({
        ...form,
        seatingCapacity: parseInt(form.seatingCapacity) || 4,
        isVehicleVerified: true,
      });
      setSaving(false);
      router.back();
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Vehicle Details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Required Information</Text>
        
        <Text style={styles.label}>Vehicle Type *</Text>
        {loadingTypes ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ alignSelf: 'flex-start', marginVertical: 16 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll} contentContainerStyle={{ gap: 12 }}>
            {vehicleTypes.map(type => (
              <Pressable 
                key={type.id} 
                style={[styles.typePill, form.vehicleType === type.id && styles.typePillActive]}
                onPress={() => setForm({ ...form, vehicleType: type.id })}
              >
                <Text style={[styles.typeText, form.vehicleType === type.id && styles.typeTextActive]}>
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Brand *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Honda"
              placeholderTextColor={theme.colors.textLight}
              value={form.vehicleBrand}
              onChangeText={t => setForm({...form, vehicleBrand: t})}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Model *</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Activa 6G"
              placeholderTextColor={theme.colors.textLight}
              value={form.vehicleModel}
              onChangeText={t => setForm({...form, vehicleModel: t})}
            />
          </View>
        </View>

        <Text style={styles.label}>Registration Number *</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. TS 09 EA 1234"
          placeholderTextColor={theme.colors.textLight}
          value={form.vehicleNumber}
          autoCapitalize="characters"
          onChangeText={t => setForm({...form, vehicleNumber: t})}
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Color</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Black"
              placeholderTextColor={theme.colors.textLight}
              value={form.vehicleColor}
              onChangeText={t => setForm({...form, vehicleColor: t})}
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Year</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 2022"
              placeholderTextColor={theme.colors.textLight}
              keyboardType="number-pad"
              value={form.vehicleYear}
              onChangeText={t => setForm({...form, vehicleYear: t})}
            />
          </View>
        </View>

        <Text style={styles.label}>Seating Capacity</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. 4"
          placeholderTextColor={theme.colors.textLight}
          keyboardType="number-pad"
          value={form.seatingCapacity}
          onChangeText={t => setForm({...form, seatingCapacity: t})}
        />

        <View style={styles.photoUploadSection}>
          <Text style={styles.label}>Vehicle Photos</Text>
          <Text style={styles.photoHint}>Required for final verification. You can add these later.</Text>
          <View style={styles.photoGrid}>
            <View style={styles.photoBox}><Ionicons name="camera-outline" size={32} color={theme.colors.textLight} /><Text style={styles.photoLabel}>Front</Text></View>
            <View style={styles.photoBox}><Ionicons name="camera-outline" size={32} color={theme.colors.textLight} /><Text style={styles.photoLabel}>Back</Text></View>
            <View style={styles.photoBox}><Ionicons name="camera-outline" size={32} color={theme.colors.textLight} /><Text style={styles.photoLabel}>Side</Text></View>
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable 
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save & Verify</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E2E8F0' },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, fontFamily: 'Poppins_700Bold' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, fontFamily: 'Poppins_600SemiBold', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: theme.colors.text, fontFamily: 'Poppins_500Medium', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 52, fontSize: 16, color: theme.colors.text, fontFamily: 'Poppins_400Regular' },
  row: { flexDirection: 'row', gap: 16 },
  flex1: { flex: 1 },
  typeScroll: { marginBottom: 8 },
  typePill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  typePillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  typeText: { fontSize: 14, fontWeight: '600', color: theme.colors.text, fontFamily: 'Poppins_600SemiBold' },
  typeTextActive: { color: '#FFF' },
  photoUploadSection: { marginTop: 32, padding: 20, backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  photoHint: { fontSize: 13, color: theme.colors.textMuted, fontFamily: 'Poppins_400Regular', marginBottom: 16 },
  photoGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  photoBox: { flex: 1, aspectRatio: 1, backgroundColor: '#F1F5F9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  photoLabel: { fontSize: 12, color: theme.colors.textMuted, fontFamily: 'Poppins_500Medium', marginTop: 8 },
  footer: { paddingHorizontal: 24, paddingTop: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E2E8F0' },
  saveBtn: { backgroundColor: theme.colors.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
