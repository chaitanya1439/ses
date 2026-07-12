import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

type DocType = 'aadhaar' | 'pan' | 'dl' | 'rc';

const DOC_CONFIG: Record<DocType, { title: string; icon: any; desc: string }> = {
  aadhaar: { title: 'Aadhaar Card', icon: 'card-account-details-outline', desc: 'Identity verification' },
  pan: { title: 'PAN Card', icon: 'card-bulleted-outline', desc: 'Tax identification' },
  dl: { title: 'Driving License', icon: 'card-account-details-star-outline', desc: 'Valid driving permit' },
  rc: { title: 'Vehicle RC', icon: 'file-document-outline', desc: 'Registration Certificate' },
};

export default function OnboardingIndex() {
  const insets = useSafeAreaInsets();
  const { driver, updateDriver } = useAuth();
  
  const verifiedDocs = driver?.verifiedDocuments || {};
  
  const docs: DocType[] = ['aadhaar', 'pan', 'dl', 'rc'];
  
  const allDocsVerified = docs.every(doc => verifiedDocs[doc]);
  const isVehicleVerified = !!driver?.isVehicleVerified;
  const allVerified = allDocsVerified && isVehicleVerified;

  const handleFinish = () => {
    if (allVerified) {
      updateDriver({ isVerified: true });
      router.replace('/(tabs)/home');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Document Verification</Text>
        <Text style={styles.subtitle}>Please verify your identity and vehicle to start receiving rides.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {docs.map(docId => {
          const config = DOC_CONFIG[docId];
          const isVerified = !!verifiedDocs[docId];
          
          return (
            <Pressable 
              key={docId} 
              style={[styles.docCard, isVerified && styles.docCardVerified]}
              onPress={() => {
                if (!isVerified) {
                  router.push(`/onboarding/scan?type=${docId}` as any);
                }
              }}
            >
              <View style={[styles.iconBox, isVerified && styles.iconBoxVerified]}>
                <MaterialCommunityIcons 
                  name={config.icon} 
                  size={24} 
                  color={isVerified ? theme.colors.success : theme.colors.primary} 
                />
              </View>
              
              <View style={styles.docInfo}>
                <Text style={styles.docTitle}>{config.title}</Text>
                <Text style={styles.docDesc}>
                  {isVerified ? `Verified on ${new Date(verifiedDocs[docId].verifiedAt).toLocaleDateString()}` : config.desc}
                </Text>
              </View>

              <View style={styles.statusBox}>
                {isVerified ? (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                )}
              </View>
            </Pressable>
          );
        })}

        {/* Vehicle Verification Card */}
        <Pressable 
          style={[styles.docCard, isVehicleVerified && styles.docCardVerified]}
          onPress={() => {
            if (!isVehicleVerified) {
              router.push('/onboarding/vehicle' as any);
            }
          }}
        >
          <View style={[styles.iconBox, isVehicleVerified && styles.iconBoxVerified]}>
            <MaterialCommunityIcons 
              name="motorbike" 
              size={24} 
              color={isVehicleVerified ? theme.colors.success : theme.colors.primary} 
            />
          </View>
          
          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>Vehicle Details</Text>
            <Text style={styles.docDesc}>
              {isVehicleVerified ? `${driver.vehicleBrand} ${driver.vehicleModel}` : 'Add your vehicle details'}
            </Text>
          </View>

          <View style={styles.statusBox}>
            {isVehicleVerified ? (
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
            )}
          </View>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <Pressable 
          style={[styles.submitBtn, !allVerified && styles.submitBtnDisabled]} 
          disabled={!allVerified}
          onPress={handleFinish}
        >
          <Text style={styles.submitText}>
            {allVerified ? 'Start Driving' : 'Complete All Steps'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  docCardVerified: {
    borderColor: theme.colors.success + '40',
    backgroundColor: theme.colors.success + '0A',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBoxVerified: {
    backgroundColor: theme.colors.success + '15',
  },
  docInfo: {
    flex: 1,
    marginLeft: 16,
  },
  docTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  docDesc: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  statusBox: {
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  submitBtnDisabled: {
    backgroundColor: theme.colors.border,
    elevation: 0,
    shadowOpacity: 0,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
});
