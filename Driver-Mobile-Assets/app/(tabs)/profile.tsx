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
import IndianCityscapeBanner from '@/components/IndianCityscapeBanner';

/* ───── Menu item type ───── */
interface MenuItem {
  id: string;
  emoji: string;
  label: string;
  route?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'performance', emoji: '🎯', label: 'Performance', route: '/performance' },
  { id: 'profile-info', emoji: '👤', label: 'Profile Info', route: '/profile-info' },
  { id: 'driver-id', emoji: '🪪', label: 'Driver ID Card', route: '/driver-id-card' },
  { id: 'documents', emoji: '📋', label: 'Documents (RC, DL, PAN)', route: '/driving-license' },
  { id: 'language', emoji: 'अA', label: 'Language Settings' },
];

/* ═══════════════════════════════════════════════════ */

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { driver, logout } = useAuth();

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable
            hitSlop={12}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
          </Pressable>
          <Text style={styles.topBarTitle}>My Profile</Text>
        </View>

        <Pressable
          style={styles.helpPill}
          onPress={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }
        >
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      {/* ─── SCROLLABLE CONTENT ─── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
      >
        {/* Hero Banner */}
        <IndianCityscapeBanner />

        {/* Avatar + Name */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarCircle}>
            {driver?.avatar ? (
              <View style={styles.avatarImgWrap}>
                {/* If a real URI comes in, swap for <Image> */}
                <MaterialCommunityIcons
                  name="account"
                  size={52}
                  color="#9CA3AF"
                />
              </View>
            ) : (
              <MaterialCommunityIcons
                name="account"
                size={52}
                color="#9CA3AF"
              />
            )}
          </View>
        </View>

        <Text style={styles.driverName}>
          {driver?.name ?? 'Driver'}
        </Text>

        {/* ─── STATS ROW ─── */}
        <View style={styles.statsCard}>
          {/* Rating */}
          <Pressable style={styles.statItem}>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>
                {driver?.rating ? driver.rating.toFixed(1) : '--'}
              </Text>
              <Text style={styles.starIcon}> ★</Text>
            </View>
            <Text style={styles.statLabel}>RATING {'>'}</Text>
          </Pressable>

          <View style={styles.statDivider} />

          {/* Orders */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {driver?.totalRides ?? 726}
            </Text>
            <Text style={styles.statLabel}>ORDERS</Text>
          </View>

          <View style={styles.statDivider} />

          {/* Years */}
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3.0</Text>
            <Text style={styles.statLabel}>YEARS</Text>
          </View>
        </View>

        <View style={styles.horizontalDivider} />

        {/* ─── MENU LIST ─── */}
        <View style={styles.menuSection}>
          {MENU_ITEMS.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.menuCard,
                { opacity: pressed ? 0.75 : 1 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.route) router.push(item.route as any);
              }}
            >
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={18}
                color="#9CA3AF"
              />
            </Pressable>
          ))}
        </View>

        {/* ─── BOTTOM ACTIONS ─── */}
        <View style={styles.actionsSection}>
          {/* Logout */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutBtn,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={async () => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              await logout();
              router.replace('/login');
            }}
          >
            <Text style={styles.logoutText}>⏻ Logout</Text>
          </Pressable>

          {/* Delete Account */}
          <Pressable
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() =>
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Error,
              )
            }
          >
            <Text style={styles.deleteText}>🗑 Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* ── Top Bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  helpPill: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  helpPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Poppins_600SemiBold',
  },

  /* ── Scroll ── */
  scrollContent: {
    gap: 0,
  },

  /* ── Avatar ── */
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -48,
    zIndex: 10,
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImgWrap: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverName: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginTop: 8,
    marginBottom: 16,
  },

  /* ── Stats Row ── */
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 14,
    marginHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  starIcon: {
    fontSize: 16,
    color: '#FBBF24',
    marginLeft: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.8,
    marginTop: 3,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E5E7EB',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    marginBottom: 12,
  },

  /* ── Menu List ── */
  menuSection: {
    marginHorizontal: 16,
    gap: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 14,
  },
  menuEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },

  /* ── Bottom Actions ── */
  actionsSection: {
    marginHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  logoutBtn: {
    borderWidth: 1.5,
    borderColor: '#1A1A2E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  deleteBtn: {
    backgroundColor: '#7B1818',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
});
