import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

interface Props {
  amount: number;
}

export function EarningsBanner({ amount }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={styles.banner}
      onPress={() => setExpanded(!expanded)}
    >
      <Text style={styles.label}>Today&apos;s Earnings</Text>
      <View style={styles.right}>
        <Text style={styles.amount}>₹{amount.toLocaleString('en-IN')}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.colors.text}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.lavender,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
});
