import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

interface Props {
  completedOrders: number;
  onKnowMore?: () => void;
}

export function ProgressCard({ completedOrders, onKnowMore }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>Your Progress</Text>
        </View>
        <Pressable onPress={() => setCollapsed(!collapsed)} hitSlop={12}>
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={theme.colors.textMuted}
          />
        </Pressable>
      </View>

      {!collapsed && (
        <View style={styles.body}>
          <View style={styles.leftContent}>
            <Text style={styles.ordersText}>
              <Text style={styles.ordersBold}>{completedOrders}</Text>
              {' Completed Orders'}
            </Text>
            <Pressable style={styles.knowMoreBtn} onPress={onKnowMore}>
              <Text style={styles.knowMoreText}>Know more</Text>
              <Ionicons name="arrow-forward" size={14} color={theme.colors.text} />
            </Pressable>
          </View>
          <Image
            source={require('@/assets/images/driver_avatar.png')}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginTop: -4,
    ...theme.shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContent: {
    flex: 1,
    gap: 10,
  },
  ordersText: {
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: 'Poppins_400Regular',
  },
  ordersBold: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  knowMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  knowMoreText: {
    fontSize: 12,
    color: theme.colors.text,
    fontFamily: 'Poppins_400Regular',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginLeft: 12,
  },
});
