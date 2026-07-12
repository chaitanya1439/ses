import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

interface Props {
  amount: number;
  rides: number;
}

export function EarningsCard({ amount, rides }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View>
          <Text style={styles.label}>Today&apos;s Earnings</Text>
          <Text style={styles.amount}>₹{amount.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons name="currency-inr" size={28} color={theme.colors.dark} />
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{rides}</Text>
          <Text style={styles.statLabel}>Rides</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>₹{rides > 0 ? Math.round(amount / rides) : 0}</Text>
          <Text style={styles.statLabel}>Avg/Ride</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>₹{Math.round(amount * 0.15)}</Text>
          <Text style={styles.statLabel}>Bonus</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.card,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: theme.colors.dark + 'BB',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 4,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(26,26,46,0.15)',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.dark + 'BB',
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(26,26,46,0.2)',
  },
});
