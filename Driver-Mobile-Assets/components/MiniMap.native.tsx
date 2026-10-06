import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  pickupAddress,
  driverLocation,
  routeCoords,
  mapRef
}: Props) {
  return (
    <MapView
      userInterfaceStyle="light"
      ref={mapRef}
      style={StyleSheet.absoluteFillObject}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: (pickupLat + dropLat) / 2,
        longitude: (pickupLng + dropLng) / 2,
        latitudeDelta: Math.abs(pickupLat - dropLat) * 1.8 + 0.01,
        longitudeDelta: Math.abs(pickupLng - dropLng) * 1.8 + 0.01,
      }}
      scrollEnabled={false}
      zoomEnabled={false}
      pitchEnabled={false}
      rotateEnabled={false}
    >
      <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
        <View style={styles.dropSquare} />
      </Marker>
      <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} anchor={{ x: 0.5, y: 0 }} style={{ zIndex: 20 }}>
        <View style={[styles.markerLabel, { backgroundColor: theme.colors.dark }]}>
          <Text style={[styles.markerLabelText, { color: '#FFF' }]} numberOfLines={1}>{pickupAddress}</Text>
        </View>
      </Marker>

      {driverLocation && (
        <>
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
            <View style={styles.pickupDot} />
          </Marker>
          <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} anchor={{ x: 0.5, y: 0 }} style={{ zIndex: 20 }}>
            <View style={styles.markerLabel}>
              <Text style={styles.markerLabelText} numberOfLines={1}>My Location</Text>
            </View>
          </Marker>
        </>
      )}

      {routeCoords.length > 1 && (
        <Polyline
          coordinates={routeCoords}
          strokeColor={theme.colors.dark}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  dropSquare: {
    width: 14,
    height: 14,
    backgroundColor: theme.colors.dark,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  pickupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  markerLabel: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  markerLabelText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#374151',
  },
});
