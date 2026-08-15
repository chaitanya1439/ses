import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';
import { CompletedRide } from '@/context/RideContext';

interface Props {
  ride: CompletedRide;
}

export function OrderCard({ ride }: Props) {
  const isCompleted = ride.status === 'completed';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.rideId}>{(ride as any).customerName || (ride as any).riderName || 'Ride'}</Text>
        <View style={[styles.badge, { backgroundColor: isCompleted ? theme.colors.successLight : theme.colors.dangerLight }]}>
          <Text style={[styles.badgeText, { color: isCompleted ? theme.colors.success : theme.colors.danger }]}>
            {isCompleted ? 'Completed' : 'Cancelled'}
          </Text>
        </View>
      </View>
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
          <Text style={styles.routeText} numberOfLines={1}>{ride.pickup}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
          <Text style={styles.routeText} numberOfLines={1}>{ride.drop}</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={13} color={theme.colors.textMuted} />
          <Text style={styles.timeText}>{ride.date}</Text>
        </View>
        <Text style={styles.fare}>₹{ride.fare}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  rideId: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  route: {
    marginBottom: 12,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    fontSize: 13,
    color: theme.colors.text,
    flex: 1,
    fontFamily: 'Poppins_400Regular',
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border,
    marginLeft: 4,
    marginVertical: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  fare: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
});
