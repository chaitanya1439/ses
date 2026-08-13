import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { theme } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Permission {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  granted: boolean;
}

const PERMISSIONS: Omit<Permission, 'granted'>[] = [
  {
    id: 'location',
    title: 'Background Location',
    description: 'Helps find rides based on your location and track active rides',
    icon: 'location',
    iconColor: '#007AFF',
  },
  {
    id: 'display',
    title: 'Display Over Other Apps',
    description: 'Permits app to display on top of other apps to get ride alerts',
    icon: 'phone-portrait',
    iconColor: '#FF9500',
  },
  {
    id: 'battery',
    title: 'Battery Optimization',
    description: 'Helps the app run in background to receive ride requests',
    icon: 'battery-charging',
    iconColor: '#34C759',
  },
];

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const togglePermission = async (id: string) => {
    if (id === 'location') {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
          setCheckedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
          });
        }
      } catch {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
        setCheckedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id); else next.add(id);
          return next;
        });
      }
    } else {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
      setCheckedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    }
  };

  const allGranted = checkedIds.size === PERMISSIONS.length;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'web' ? insets.top + 67 : 0 }]}>
      <LinearGradient
        colors={['#007AFF', '#0055CC']}
        style={[styles.header, { paddingTop: insets.top + 24 }]}
      >
        <MaterialCommunityIcons name="shield-check" size={36} color="#FFF" />
        <Text style={styles.headerTitle}>App Permissions</Text>
        <Text style={styles.headerSub}>Give all permissions to proceed</Text>
      </LinearGradient>

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.permissionsContainer}>
          {PERMISSIONS.map(perm => {
            const isChecked = checkedIds.has(perm.id);
            return (
              <Pressable
                key={perm.id}
                style={[styles.permCard, isChecked && styles.permCardChecked]}
                onPress={() => togglePermission(perm.id)}
              >
                <View style={[styles.permIcon, { backgroundColor: perm.iconColor + '18' }]}>
                  <Ionicons name={perm.icon as any} size={26} color={perm.iconColor} />
                </View>
                <View style={styles.permText}>
                  <Text style={styles.permTitle}>{perm.title}</Text>
                  <Text style={styles.permDesc}>{perm.description}</Text>
                </View>
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && <Ionicons name="checkmark" size={16} color="#FFF" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#007AFF" />
          <Text style={styles.infoText}>
            These permissions help us provide the best experience while you are on duty.
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            !allGranted && styles.submitBtnDisabled,
            { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
          onPress={() => {
            if (!allGranted) return;
            try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
            router.replace('/(tabs)/home');
          }}
          disabled={!allGranted}
        >
          <Text style={styles.submitBtnText}>
            {allGranted ? 'All Set — Start Driving' : `${checkedIds.size}/${PERMISSIONS.length} Permissions Granted`}
          </Text>
          {allGranted && <Ionicons name="arrow-forward" size={20} color={theme.colors.dark} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceAlt },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 8,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '700', color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
  headerSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_400Regular',
  },
  content: {
    flex: 1, padding: 16, gap: 14,
    justifyContent: 'space-between',
  },
  permissionsContainer: { gap: 10 },
  permCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  permCardChecked: {
    borderColor: '#34C759',
    backgroundColor: '#F0FBF4',
  },
  permIcon: {
    width: 52, height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  permText: { flex: 1 },
  permTitle: {
    fontSize: 15, fontWeight: '600', color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold', marginBottom: 3,
  },
  permDesc: {
    fontSize: 12, color: theme.colors.textLight, lineHeight: 17,
    fontFamily: 'Poppins_400Regular',
  },
  checkbox: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: theme.colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#34C759', borderColor: '#34C759',
  },
  infoBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#EEF4FF', borderRadius: 12, padding: 12,
  },
  infoText: {
    flex: 1, fontSize: 12, color: '#007AFF',
    fontFamily: 'Poppins_400Regular', lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 14, height: 58,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...theme.shadows.card,
  },
  submitBtnDisabled: {
    backgroundColor: theme.colors.border,
  },
  submitBtnText: {
    fontSize: 16, fontWeight: '700', color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
});
