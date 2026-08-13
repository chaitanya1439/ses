import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { DutyToggle } from './DutyToggle';
import { theme } from '@/constants/colors';

interface Props {
  isOnDuty: boolean;
  onToggle: (val: boolean) => void;
  notificationCount?: number;
  onMenuPress?: () => void;
  onHeartPress?: () => void;
  onBellPress?: () => void;
}

export function TopNavBar({
  isOnDuty,
  onToggle,
  notificationCount = 8,
  onMenuPress,
  onHeartPress,
  onBellPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 10 : insets.top + 8;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* User Profile */}
      <Pressable
        style={styles.iconBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMenuPress?.();
        }}
      >
        <Image source={require('@/assets/images/driver_avatar.png')} style={{ width: 32, height: 32, borderRadius: 16 }} />
      </Pressable>

      {/* Duty Toggle Pill */}
      <View style={[styles.dutyPill, { backgroundColor: isOnDuty ? theme.colors.success : '#E0E0E0' }]}>
        <DutyToggle isOnDuty={isOnDuty} onToggle={onToggle} />
      </View>

      {/* Right icons */}
      <View style={styles.rightIcons}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onHeartPress?.();
          }}
        >
          <MaterialCommunityIcons name="map-marker-radius" size={24} color={theme.colors.teal} />
        </Pressable>

        <Pressable
          style={styles.iconBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBellPress?.();
          }}
        >
          <Ionicons name="notifications" size={22} color={theme.colors.text} />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: theme.colors.surface,
    zIndex: 20,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
});
