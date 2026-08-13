import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRide } from '@/context/RideContext';
import { theme } from '@/constants/colors';

type Period = 'today' | 'week' | 'month';

const WEEK_DATA = [
  { day: 'Mon', amount: 342 },
  { day: 'Tue', amount: 567 },
  { day: 'Wed', amount: 289 },
  { day: 'Thu', amount: 734 },
  { day: 'Fri', amount: 890 },
  { day: 'Sat', amount: 1120 },
  { day: 'Sun', amount: 456 },
];

export default function EarningsScreen() {
  const insets = useSafeAreaInsets();
  const { todayEarnings, completedRides, loadRides } = useRide();
  const [period, setPeriod] = useState<Period>('today');

  useEffect(() => { loadRides(); }, [loadRides]);

  const todayRides = completedRides.filter(r =>
    r.status === 'completed' && new Date(r.timestamp).toDateString() === new Date().toDateString()
  );
  const weekEarnings = todayEarnings + WEEK_DATA.slice(0, 6).reduce((s, d) => s + d.amount, 0);
  const monthEarnings = weekEarnings * 4 + 1200;

  const displayEarnings = period === 'today' ? todayEarnings : period === 'week' ? weekEarnings : monthEarnings;
  const displayRides = period === 'today' ? todayRides.length : period === 'week' ? todayRides.length + 18 : todayRides.length + 72;

  const maxBarValue = Math.max(...WEEK_DATA.map(d => d.amount), 1);

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[theme.colors.dark, theme.colors.darkCard]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Earnings</Text>
        <Pressable
          style={styles.subscriptionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/subscription' as any);
          }}
        >
          <MaterialCommunityIcons name="crown" size={16} color={theme.colors.primary} />
          <Text style={styles.subscriptionBtnText}>Plans</Text>
        </Pressable>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodTabs}>
          {(['today', 'week', 'month'] as Period[]).map(p => (
            <Pressable
              key={p}
              style={[styles.periodTab, period === p && styles.periodTabActive]}
              onPress={() => {
                setPeriod(p);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
                {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
              </Text>
            </Pressable>
          ))}
        </View>

        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.earningsCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View>
              <Text style={styles.cardLabel}>Total Earnings</Text>
              <Text style={styles.cardAmount}>₹{displayEarnings.toLocaleString('en-IN')}</Text>
            </View>
            <Pressable
              style={styles.rateCardBtn}
              onPress={() => router.push('/rate-card' as any)}
            >
              <MaterialCommunityIcons name="text-box-search-outline" size={16} color={theme.colors.dark} />
              <Text style={styles.rateCardText}>Rate Card</Text>
            </Pressable>
          </View>
          <View style={styles.cardRow}>
            <View style={styles.cardStat}>
              <MaterialCommunityIcons name="motorbike" size={16} color={theme.colors.dark + 'CC'} />
              <Text style={styles.cardStatText}>{displayRides} Rides</Text>
            </View>
            <View style={styles.cardStat}>
              <Ionicons name="time" size={16} color={theme.colors.dark + 'CC'} />
              <Text style={styles.cardStatText}>{Math.round(displayRides * 0.7)}h Online</Text>
            </View>
            <View style={styles.cardStat}>
              <MaterialCommunityIcons name="star" size={16} color={theme.colors.dark + 'CC'} />
              <Text style={styles.cardStatText}>4.8 Rating</Text>
            </View>
          </View>
        </LinearGradient>

        <Pressable 
          style={styles.planBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/subscription' as any);
          }}
        >
          <View style={styles.planBannerLeft}>
            <Text style={styles.planBannerTitle}>Choose your{'\n'}earning plan</Text>
            <View style={styles.planBannerBtn}>
              <Text style={styles.planBannerBtnText}>View All Plans</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFF" />
            </View>
          </View>
          <View style={styles.myPlanBadge}>
            <View style={styles.myPlanTop}>
              <Text style={styles.myPlanSmallRupee}>₹</Text>
              <Text style={styles.myPlanText}>MY</Text>
              <Text style={styles.myPlanSmallRupee}>₹</Text>
            </View>
            <Text style={styles.planText}>PLAN</Text>
          </View>
        </Pressable>

        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          <View style={styles.chart}>
            {WEEK_DATA.map((d, i) => {
              const fillHeight = (d.amount / maxBarValue) * 100;
              const isToday = i === new Date().getDay() - 1;
              return (
                <View key={d.day} style={styles.chartBar}>
                  <Text style={styles.chartAmount}>
                    {d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : d.amount}
                  </Text>
                  <View style={styles.barContainer}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${fillHeight}%`, backgroundColor: isToday ? theme.colors.primary : theme.colors.dark + '30' },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDay, isToday && { color: theme.colors.primary, fontFamily: 'Poppins_700Bold' }]}>
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {completedRides.slice(0, 5).map(ride => (
            <View key={ride.id} style={styles.transaction}>
              <View style={[styles.txIcon, { backgroundColor: ride.status === 'completed' ? theme.colors.successLight : theme.colors.dangerLight }]}>
                <MaterialCommunityIcons
                  name="motorbike"
                  size={18}
                  color={ride.status === 'completed' ? theme.colors.success : theme.colors.danger}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txId}>{ride.id}</Text>
                <Text style={styles.txDate}>{ride.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: ride.status === 'completed' ? theme.colors.success : theme.colors.danger }]}>
                {ride.status === 'completed' ? '+' : ''}₹{ride.fare}
              </Text>
            </View>
          ))}
          {completedRides.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="cash-remove" size={40} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubText}>Go online to start earning</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surfaceAlt },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '700', color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
  subscriptionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,184,0,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  subscriptionBtnText: {
    fontSize: 13, fontWeight: '700', color: theme.colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  content: { padding: 16, gap: 14 },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 14, padding: 4, gap: 2,
    ...theme.shadows.sm,
  },
  periodTab: {
    flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10,
  },
  periodTabActive: {
    backgroundColor: theme.colors.primary,
  },
  periodTabText: {
    fontSize: 12, fontWeight: '600', color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  periodTabTextActive: { color: theme.colors.dark },
  earningsCard: {
    borderRadius: 20, padding: 20, gap: 8,
    ...theme.shadows.card,
  },
  cardLabel: {
    fontSize: 13, color: theme.colors.dark + 'BB',
    fontFamily: 'Poppins_400Regular',
  },
  cardAmount: {
    fontSize: 40, fontWeight: '700', color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
  cardRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  cardStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rateCardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  rateCardText: {
    fontSize: 12, fontWeight: '600', color: theme.colors.dark,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardStatText: {
    fontSize: 13, color: theme.colors.dark + 'CC',
    fontFamily: 'Poppins_400Regular',
  },
  planBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#000', borderRadius: 16, padding: 20,
    ...theme.shadows.sm,
  },
  planBannerLeft: { gap: 12 },
  planBannerTitle: {
    fontSize: 18, fontWeight: '700', color: '#FFF',
    fontFamily: 'Poppins_700Bold', lineHeight: 24,
  },
  planBannerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#FFF', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  planBannerBtnText: {
    fontSize: 12, fontWeight: '600', color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  myPlanBadge: {
    backgroundColor: '#003399', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#0044CC',
  },
  myPlanTop: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  myPlanSmallRupee: { fontSize: 10, color: '#FFD700', fontWeight: 'bold' },
  myPlanText: { fontSize: 16, color: '#77AAFF', fontWeight: '900', fontFamily: 'Poppins_700Bold' },
  planText: { fontSize: 22, color: '#FFD700', fontWeight: '900', fontFamily: 'Poppins_700Bold' },
  chartSection: { gap: 12 },
  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  chart: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 16,
    height: 150, alignItems: 'flex-end', gap: 6,
    ...theme.shadows.sm,
  },
  chartBar: {
    flex: 1, alignItems: 'center', height: '100%',
    justifyContent: 'flex-end', gap: 4,
  },
  chartAmount: {
    fontSize: 9, color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular', marginBottom: 2,
  },
  barContainer: {
    width: '70%', flex: 1, justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden',
  },
  barFill: {
    borderRadius: 4, width: '100%',
  },
  chartDay: {
    fontSize: 10, color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  transactionsSection: { gap: 10 },
  transaction: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
    ...theme.shadows.sm,
  },
  txIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  txId: {
    fontSize: 14, fontWeight: '600', color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  txDate: {
    fontSize: 12, color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  txAmount: {
    fontSize: 16, fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  emptyState: {
    alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 16, padding: 32,
    ...theme.shadows.sm,
  },
  emptyText: {
    fontSize: 16, fontWeight: '600', color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubText: {
    fontSize: 13, color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
});
