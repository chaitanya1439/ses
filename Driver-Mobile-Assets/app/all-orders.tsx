import React, { useState } from 'react';
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

type Period = 'Day' | 'Week' | 'Month';
type Filter = 'Completed' | 'Cancelled' | 'Missed';

const DATES = [
  { day: 'Sun', date: 8 },
  { day: 'Mon', date: 9 },
  { day: 'Tue', date: 10 },
];

export default function AllOrdersScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const [period, setPeriod] = useState<Period>('Day');
  const [selectedDate, setSelectedDate] = useState(2);
  const [filter, setFilter] = useState<Filter>('Completed');

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
          <Text style={styles.topBarTitle}>All Orders</Text>
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
        {/* ─── PERIOD TOGGLE ─── */}
        <View style={styles.periodToggle}>
          {(['Day', 'Week', 'Month'] as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[
                styles.periodPill,
                period === p && styles.periodPillActive,
              ]}
              onPress={() => {
                setPeriod(p);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}
              >
                {p}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── DATE SELECTOR ─── */}
        <View style={styles.dateRow}>
          <Pressable style={styles.dateArrow}>
            <Ionicons name="chevron-back" size={18} color="#6B7280" />
          </Pressable>
          {DATES.map((d, idx) => (
            <Pressable
              key={idx}
              style={[
                styles.dateCard,
                selectedDate === idx && styles.dateCardActive,
              ]}
              onPress={() => {
                setSelectedDate(idx);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.dateDay,
                  selectedDate === idx && styles.dateDayActive,
                ]}
              >
                {d.day}
              </Text>
              <Text
                style={[
                  styles.dateNum,
                  selectedDate === idx && styles.dateNumActive,
                ]}
              >
                {d.date}
              </Text>
            </Pressable>
          ))}
          <Pressable style={styles.dateArrow}>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>
        </View>

        {/* ─── SUMMARY CARD ─── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryValue}>0</Text>
            <Text style={styles.summaryLabel}>Completed Orders</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={[styles.summaryValue, { color: '#22C55E' }]}>₹0</Text>
            <Text style={styles.summaryLabel}>Order Earnings</Text>
          </View>
        </View>

        {/* ─── ORDER HISTORY ─── */}
        <Text style={styles.sectionLabel}>Order History</Text>

        <View style={styles.filterRow}>
          {(['Completed', 'Cancelled', 'Missed'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              style={[
                styles.filterPill,
                filter === f && styles.filterPillActive,
              ]}
              onPress={() => {
                setFilter(f);
                Haptics.selectionAsync();
              }}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ─── EMPTY STATE ─── */}
        <View style={styles.emptyState}>
          <View style={styles.emptyIllustration}>
            <MaterialCommunityIcons
              name="file-document-multiple-outline"
              size={56}
              color="#D1D5DB"
            />
            <View style={styles.emptyCheck}>
              <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
            </View>
          </View>
          <Text style={styles.emptyText}>
            You have not completed any orders
          </Text>
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

  scrollContent: { padding: 16, gap: 16 },

  /* Period Toggle */
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
  },
  periodPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  periodPillActive: { backgroundColor: '#FFB800' },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold',
  },
  periodTextActive: { color: '#1A1A2E' },

  /* Date Selector */
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dateArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateCard: {
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateCardActive: { backgroundColor: '#1B5E20' },
  dateDay: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'Poppins_400Regular',
  },
  dateDayActive: { color: '#FFFFFF' },
  dateNum: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  dateNumActive: { color: '#FFFFFF' },

  /* Summary */
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    borderStyle: 'dashed',
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  /* Filter Pills */
  sectionLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_600SemiBold',
  },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: {
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterPillActive: { backgroundColor: '#FFF3CD' },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold',
  },
  filterTextActive: { color: '#1A1A2E' },

  /* Empty State */
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIllustration: { position: 'relative', marginBottom: 16 },
  emptyCheck: { position: 'absolute', bottom: -4, right: -4 },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
