import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

interface InfoField {
  label: string;
  value: string;
  editable?: boolean;
}

export default function ProfileInfoScreen() {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  const fields: InfoField[] = [
    { label: 'Name', value: driver?.name ?? 'John Doe' },
    {
      label: 'Registered Number',
      value: driver?.phone ?? '98XXXXXXXX',
      editable: true,
    },
    { label: 'Gender', value: 'Male' },
    { label: 'Date of Birth', value: 'day  month, year' },
    {
      label: 'Languages I Speak',
      value: 'English, Hindi, Telugu',
      editable: true,
    },
  ];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.topBarTitle}>Profile Info</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ─── AVATAR ─── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons
                name="account"
                size={52}
                color="#9CA3AF"
              />
            </View>
            {/* Camera overlay */}
            <Pressable
              style={styles.cameraBtn}
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        {/* ─── FORM FIELDS ─── */}
        <View style={styles.fieldsContainer}>
          {fields.map((field, idx) => (
            <View
              key={field.label}
              style={[
                styles.fieldRow,
                idx < fields.length - 1 && styles.fieldBorder,
              ]}
            >
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue}>{field.value}</Text>
              </View>
              {field.editable && (
                <Pressable
                  onPress={() =>
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  }
                >
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* ─── VERIFIED DOCUMENTS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Verified Documents</Text>
        </View>
        <View style={styles.docsContainer}>
          {['aadhaar', 'pan', 'dl', 'rc'].map((docId, idx) => {
            const docLabels: Record<string, string> = { aadhaar: 'Aadhaar Card', pan: 'PAN Card', dl: 'Driving License', rc: 'Vehicle RC' };
            const docData = driver?.verifiedDocuments?.[docId];
            if (!docData) return null;
            
            return (
              <View key={docId} style={styles.docRow}>
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{docLabels[docId]}</Text>
                  <Text style={styles.docNumber}>
                    {/* Securely mask part of the number */}
                    {docData.number.slice(0, 2) + '******' + docData.number.slice(-4)}
                  </Text>
                  <Text style={styles.docMeta}>
                    Verified: {new Date(docData.verifiedAt).toLocaleDateString()}
                    {docData.expiry && ` • Exp: ${docData.expiry}`}
                  </Text>
                </View>
                <View style={styles.docStatusBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
                  <Text style={styles.docStatusText}>Verified</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ─── VEHICLE DETAILS ─── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
        </View>
        <View style={styles.docsContainer}>
          <View style={styles.docRow}>
            <View style={styles.docInfo}>
              <Text style={styles.docLabel}>{driver?.vehicleBrand} {driver?.vehicleModel}</Text>
              <Text style={styles.docNumber}>{driver?.vehicleNumber}</Text>
              <Text style={styles.docMeta}>
                Type: {driver?.vehicleType} • Color: {driver?.vehicleColor} • Year: {driver?.vehicleYear}
              </Text>
            </View>
            <View style={styles.docStatusBadge}>
              <Ionicons name={driver?.isVehicleVerified ? "checkmark-circle" : "time"} size={14} color={driver?.isVehicleVerified ? "#22C55E" : "#EAB308"} />
              <Text style={[styles.docStatusText, !driver?.isVehicleVerified && { color: "#EAB308" }]}>
                {driver?.isVehicleVerified ? "Verified" : "Pending"}
              </Text>
            </View>
          </View>
          <Pressable style={styles.editVehicleBtn} onPress={() => router.push('/onboarding/vehicle' as any)}>
            <Text style={styles.editVehicleText}>Update Vehicle Details</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Scroll */
  scrollContent: { paddingHorizontal: 16 },

  /* Avatar */
  avatarSection: { alignItems: 'center', marginTop: 8, marginBottom: 28 },
  avatarOuter: { position: 'relative' },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  /* Fields */
  fieldsContainer: { paddingHorizontal: 4 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  fieldContent: { flex: 1 },
  fieldLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  editText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Poppins_700Bold',
  },
  /* Documents Section */
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  docsContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  docInfo: {
    flex: 1,
  },
  docLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_500Medium',
  },
  docNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginTop: 2,
    marginBottom: 4,
  },
  docMeta: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  docStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  docStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    fontFamily: 'Poppins_600SemiBold',
  },
  /* Edit Vehicle */
  editVehicleBtn: { marginTop: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB', alignItems: 'center' },
  editVehicleText: { fontSize: 14, fontWeight: '600', color: '#2563EB', fontFamily: 'Poppins_600SemiBold' },
});
