import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'earnings' | 'wallet';

export default function EarningsOverviewScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const [activeTab, setActiveTab] = useState<Tab>('earnings');

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
          <Text style={styles.topBarTitle}>Earnings</Text>
        </View>
        <Pressable style={styles.helpPill}>
          <Text style={styles.helpPillText}>🎧 Help</Text>
        </Pressable>
      </View>

      {/* ─── TAB BAR ─── */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'earnings' && styles.tabActive]}
          onPress={() => {
            setActiveTab('earnings');
            Haptics.selectionAsync();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'earnings' && styles.tabTextActive,
            ]}
          >
            All Earnings
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'wallet' && styles.tabActive]}
          onPress={() => {
            setActiveTab('wallet');
            Haptics.selectionAsync();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'wallet' && styles.tabTextActive,
            ]}
          >
            Wallet
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ─── TODAY EARNINGS CARD ─── */}
        <View style={styles.todayCard}>
          <Text style={styles.todayLabel}>Today&apos;s Earnings</Text>
          <Text style={styles.todayAmount}>
            <Text style={styles.todayCurrency}>₹</Text>0
          </Text>
        </View>

        {/* ─── MENU ITEMS ─── */}
        <Pressable
          style={styles.menuCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/all-orders' as any);
          }}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="document-text-outline" size={22} color="#374151" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>All Orders</Text>
            <Text style={styles.menuSub}>Order History and Order Earnings</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        <Pressable 
          style={styles.menuCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/rate-card' as any);
          }}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.rupeeIcon}>₹</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuTitle}>View Rate Card</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </Pressable>

        {/* ─── EARNING PLAN PROMO ─── */}
        <Pressable 
          style={styles.promoCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/subscription-plans' as any);
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.promoTitle}>Choose your earning plan</Text>
            <View style={styles.promoBtn}>
              <Text style={styles.promoBtnText}>View All Plans →</Text>
            </View>
          </View>
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeSmall}>MY</Text>
            <Text style={styles.planBadgeLarge}>PLAN</Text>
            <Text style={styles.planBadgeRupee}>₹₹</Text>
          </View>
        </Pressable>

        {/* ─── LEARN MORE BANNER ─── */}
        <View style={styles.learnBanner}>
          <Text style={styles.learnText}>Know all about your Earnings</Text>
          <View style={styles.learnIcons}>
            <Text style={{ fontSize: 24 }}>💰</Text>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={14} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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

  /* Tab Bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#2563EB' },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Poppins_600SemiBold',
  },
  tabTextActive: { color: '#2563EB' },

  scrollContent: { padding: 16, gap: 12 },

  /* Today Card */
  todayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  todayLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  todayAmount: {
    fontSize: 42,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  todayCurrency: { fontSize: 28 },

  /* Menu Cards */
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rupeeIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    fontFamily: 'Poppins_700Bold',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  menuSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },

  /* Promo Card */
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 20,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  promoBtn: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  planBadge: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#4A6CF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  planBadgeSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  planBadgeLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB800',
    fontFamily: 'Poppins_700Bold',
    marginTop: -2,
  },
  planBadgeRupee: {
    fontSize: 10,
    color: '#FFB800',
    fontFamily: 'Poppins_700Bold',
  },

  /* Learn Banner */
  learnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FB',
    borderRadius: 14,
    padding: 16,
  },
  learnText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  learnIcons: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
