import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRide } from '@/context/RideContext';
import { OrderCard } from '@/components/OrderCard';
import { theme } from '@/constants/colors';

type Filter = 'all' | 'completed' | 'cancelled';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { completedRides, loadRides } = useRide();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => { loadRides(); }, [loadRides]);

  const filtered = completedRides.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <LinearGradient
        colors={[theme.colors.dark, theme.colors.darkCard]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.orderCount}>{completedRides.length} total</Text>
      </LinearGradient>

      <View style={styles.filterRow}>
        {(['all', 'completed', 'cancelled'] as Filter[]).map(f => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => {
              setFilter(f);
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <OrderCard ride={item} />}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 },
          filtered.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-off-outline" size={56} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyDesc}>
              {filter === 'all'
                ? 'Accept rides to see your order history here'
                : `No ${filter} orders yet`}
            </Text>
          </View>
        }
        scrollEnabled={!!filtered.length}
      />
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
  orderCount: {
    fontSize: 13, color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Poppins_400Regular',
  },
  filterRow: {
    flexDirection: 'row', gap: 8, padding: 16,
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: theme.colors.surface, borderWidth: 1.5, borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.dark, borderColor: theme.colors.dark,
  },
  filterText: {
    fontSize: 13, fontWeight: '600', color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  filterTextActive: { color: '#FFF' },
  list: { paddingTop: 4 },
  listEmpty: { flex: 1 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, gap: 12,
  },
  emptyTitle: {
    fontSize: 18, fontWeight: '700', color: theme.colors.textLight,
    fontFamily: 'Poppins_700Bold',
  },
  emptyDesc: {
    fontSize: 13, color: theme.colors.textMuted, textAlign: 'center',
    paddingHorizontal: 40, fontFamily: 'Poppins_400Regular', lineHeight: 20,
  },
});
