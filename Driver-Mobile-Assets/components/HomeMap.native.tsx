import React, { useState, useEffect, Component, type ReactNode } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '@/constants/colors';
import { useSocket } from '@/context/SocketContext';

const DEFAULT_REGION = {
  latitude: 17.385,
  longitude: 78.4867,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Safety wrapper to catch native Maps crashes
class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={[StyleSheet.absoluteFillObject, styles.mapFallback]}>
          <MaterialCommunityIcons name="map-marker-off" size={48} color={theme.colors.textMuted} />
          <Text style={styles.mapFallbackText}>Map unavailable</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function HomeMapInner() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { sendThrottledMessage } = useSocket();

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      try {
        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          throw new Error("Current location is unavailable");
        }

        // Get initial location
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        sendThrottledMessage('location_update', {
          location: { lat: current.coords.latitude, lng: current.coords.longitude }
        }, 0);

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
          (loc) => {
            setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            // 🚀 Realtime Integration: Stream hardware GPS directly to Node.js backend
            sendThrottledMessage('location_update', {
              location: { lat: loc.coords.latitude, lng: loc.coords.longitude }
            }, 3000);
          },
        );
      } catch (err) {
        console.warn("Location unavailable:", err);
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, [sendThrottledMessage]);

  const region = location
    ? { ...location, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : DEFAULT_REGION;

  return (
    <MapView userInterfaceStyle="light"
      style={StyleSheet.absoluteFillObject}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      showsUserLocation={false}
      region={region}
      mapType="standard"
      showsMyLocationButton={false}
      showsCompass={false}
    >
      {location && (
        <Marker coordinate={location} title="You are here" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.driverMarker}>
            <MaterialCommunityIcons name="motorbike" size={18} color="#FFF" />
          </View>
        </Marker>
      )}
    </MapView>
  );
}

export function HomeMap() {
  return (
    <MapErrorBoundary>
      <HomeMapInner />
    </MapErrorBoundary>
  );
}

const styles = StyleSheet.create({
  driverMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  mapFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    gap: 8,
  },
  mapFallbackText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
});
