import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';

interface Props {
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
  pickupAddress: string;
  driverLocation?: { lat: number; lng: number } | null;
  routeCoords: { latitude: number; longitude: number }[];
  mapRef?: any;
}

export function MiniMap({
  pickupAddress,
}: Props) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="map-marker-path" size={40} color={theme.colors.primary} />
      <Text style={styles.label}>{pickupAddress}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});
