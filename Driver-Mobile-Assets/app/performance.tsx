import React from 'react';
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
import Svg, { Circle as SvgCircle, G } from 'react-native-svg';

/* ─── Donut Chart ─── */
const DONUT_SIZE = 160;
const STROKE_WIDTH = 14;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function DonutChart({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = current / total;
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <View style={donutStyles.container}>
      <Svg
        width={DONUT_SIZE}
        height={DONUT_SIZE}
        viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
      >
        <G rotation="-90" origin={`${DONUT_SIZE / 2}, ${DONUT_SIZE / 2}`}>
          {/* Background ring */}
          <SvgCircle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={RADIUS}
            stroke="#DBEAFE"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Progress arc */}
          <SvgCircle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={RADIUS}
            stroke="#2979FF"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      {/* Center text */}
      <View style={donutStyles.centerText}>
        <Text style={donutStyles.fraction}>
          {current}/{total}
        </Text>
      </View>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fraction: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2979FF',
    fontFamily: 'Poppins_700Bold',
  },
});

/* ═══════════════════ SCREEN ═══════════════════ */

export default function PerformanceScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

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
        <Text style={styles.topBarTitle}>My Performance</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
      >
        {/* ─── PROGRESS CARD ─── */}
        <View style={styles.progressCard}>
          <DonutChart current={3} total={20} />
          <Text style={styles.progressTitle}>Accept 20 Orders</Text>
          <Text style={styles.progressSub}>to see your performance</Text>
          <Text style={styles.progressNote}>
            Bike Metro, Bike and Bike Lite only
          </Text>
        </View>

        {/* ─── ORDER STATS CARD ─── */}
        <View style={styles.statsCard}>
          <View style={styles.statsTopRow}>
            <View style={styles.statsBox}>
              <Text style={[styles.statsNum, { color: '#22C55E' }]}>3</Text>
              <Text style={styles.statsLabel}>Accepted Orders</Text>
            </View>
            <View style={styles.statsBox}>
              <Text style={[styles.statsNum, { color: '#EF4444' }]}>0</Text>
              <Text style={styles.statsLabel}>Cancelled Orders</Text>
            </View>
          </View>
          <View style={styles.statsFullRow}>
            <Text style={styles.statsLabel}>Completed Orders</Text>
            <Text style={[styles.statsNum, { color: '#22C55E' }]}>3</Text>
          </View>
        </View>

        {/* ─── PERFORMANCE TIPS ─── */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsHeader}>
            To have a good performance
          </Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>🚫</Text>
            <Text style={styles.tipText}>
              Do not cancel orders after accepting
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipIcon}>⭐</Text>
            <Text style={styles.tipText}>
              Get 5 star ratings from customers
            </Text>
          </View>
        </View>

        {/* ─── PROMOTIONAL SECTION (partial peek) ─── */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>Earn More with RideApp!</Text>
            <Text style={styles.promoSub}>
              Complete more rides to unlock premium benefits and higher
              earnings every week.
            </Text>
            <View style={styles.promoTag}>
              <Ionicons name="trending-up" size={16} color="#2979FF" />
              <Text style={styles.promoTagText}>
                Top earners get ₹5,000+ weekly
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ═══════════════════ STYLES ═══════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F5F5' },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  /* Scroll */
  scrollContent: { padding: 16, gap: 16 },

  /* Progress Card */
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginTop: 16,
  },
  progressSub: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  progressNote: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
    marginTop: 8,
  },

  /* Order Stats */
  statsCard: {
    backgroundColor: '#EFF3F8',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  statsTopRow: { flexDirection: 'row', gap: 10 },
  statsBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  statsNum: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  statsLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  statsFullRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
  },

  /* Tips */
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2979FF',
    padding: 20,
    gap: 14,
  },
  tipsHeader: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipIcon: { fontSize: 18, width: 26, textAlign: 'center' },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A2E',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },

  /* Promo */
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promoContent: {
    padding: 20,
    gap: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  promoSub: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
    lineHeight: 20,
  },
  promoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  promoTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2979FF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
