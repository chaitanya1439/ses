import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

interface Props {
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

export function RideMap({ pickupAddress, dropAddress }: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="map-marker-path" size={52} color={theme.colors.primary} />
      <Text style={styles.label}>{pickupAddress}</Text>
      <MaterialCommunityIcons name="arrow-down" size={20} color={theme.colors.textLight} />
      <Text style={styles.label}>{dropAddress}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 20,
  },
  label: {
    fontSize: 13,
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
});
