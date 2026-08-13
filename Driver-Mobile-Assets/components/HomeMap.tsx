import React from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import MapView, { Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';
import { useSocket } from '@/context/SocketContext';

export function HomeMap() {
  const { hotspots } = useSocket();

  if (Platform.OS === 'web') {
    return (
      <View style={styles.placeholderContainer}>
        <MaterialCommunityIcons name="map" size={48} color={theme.colors.primary} />
        <Text style={styles.text}>Map view available on mobile</Text>
        <Text style={styles.sub}>Scan the QR code in Expo Go to see live maps</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: 17.385,
          longitude: 78.4867,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {hotspots.map((hotspot, index) => (
          <Circle
            key={index}
            center={{
              latitude: hotspot.lat,
              longitude: hotspot.lng,
            }}
            radius={1000 * hotspot.intensity} // Adjust radius based on intensity
            strokeWidth={0}
            fillColor={`rgba(255, 0, 0, ${hotspot.surge * 0.2})`}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F8',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: '#E8F0F8',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
    fontFamily: 'Poppins_600SemiBold',
  },
  sub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
