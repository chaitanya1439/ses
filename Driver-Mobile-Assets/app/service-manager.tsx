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

interface ActiveService {
  id: string;
  name: string;
}

interface NewService {
  id: string;
  name: string;
}

const ACTIVE_SERVICES: ActiveService[] = [
  { id: 'bike-metro', name: 'Bike Metro' },
  { id: 'bike-boost', name: 'Bike Boost' },
  { id: 'bike', name: 'Bike' },
];

const NEW_SERVICES: NewService[] = [
  { id: 'video-intro', name: 'Video Introduction' },
  { id: 'food', name: 'Food Delivery' },
  { id: 'grocery', name: 'Grocery Delivery' },
];

export default function ServiceManagerScreen() {
  const insets = useSafeAreaInsets();
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
          <Text style={styles.topBarTitle}>Service Manager</Text>
        </View>
        <Pressable style={styles.helpPill}>
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ─── ACTIVE SERVICES ─── */}
        <View style={styles.section}>
          {ACTIVE_SERVICES.map((svc) => (
            <View key={svc.id} style={styles.activeCard}>
              <View style={styles.activeIconCircle}>
                <MaterialCommunityIcons
                  name="motorbike"
                  size={24}
                  color="#FF8C00"
                />
              </View>
              <Text style={styles.activeCardName}>{svc.name}</Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>✓ Active</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ─── PROMO BANNER ─── */}
        <View style={styles.promoBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.promoText}>Delivery captains earn</Text>
            <Text style={styles.promoHighlight}>40% extra daily!! 🎉</Text>
          </View>
          <View style={styles.coinStack}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={40}
              color="#FFB800"
            />
          </View>
        </View>

        {/* ─── NEW SERVICES ─── */}
        <View style={styles.section}>
          {NEW_SERVICES.map((svc) => (
            <View key={svc.id} style={styles.newServiceCard}>
              <View style={styles.newServiceIcon}>
                <MaterialCommunityIcons
                  name={
                    svc.id === 'food'
                      ? 'food'
                      : svc.id === 'grocery'
                      ? 'shopping'
                      : 'play-circle-outline'
                  }
                  size={24}
                  color="#374151"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.newServiceName}>{svc.name}</Text>
                <Pressable>
                  <Text style={styles.watchVideoText}>Watch Video ▶</Text>
                </Pressable>
              </View>
              <Pressable
                style={styles.startBtn}
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
              >
                <Text style={styles.startBtnText}>Start</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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

  scrollContent: { padding: 16, gap: 16 },

  section: { gap: 10 },

  /* Active Service Cards */
  activeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  activeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE082',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCardName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  activeBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  /* Promo Banner */
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 20,
  },
  promoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },
  promoHighlight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginTop: 2,
  },
  coinStack: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* New Service Cards */
  newServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newServiceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  watchVideoText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#22C55E',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 4,
  },
  startBtn: {
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  startBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22C55E',
    fontFamily: 'Poppins_700Bold',
  },
});
