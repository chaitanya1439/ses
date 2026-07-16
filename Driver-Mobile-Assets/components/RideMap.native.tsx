import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '@/constants/colors';
import { useSocket } from '@/context/SocketContext';
import { GOOGLE_MAPS_API_KEY } from '@/constants/config';

interface Props {
  pickupAddress: string;
  dropAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropLat: number;
  dropLng: number;
}

// Decode Google Maps encoded polyline string into array of coordinates
function decodePolyline(encoded: string): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
): Promise<{ latitude: number; longitude: number }[]> {
  if (!GOOGLE_MAPS_API_KEY) {
    return [
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng },
    ];
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const points: { latitude: number; longitude: number }[] = [];
      data.routes[0].legs[0].steps.forEach((step: any) => {
        points.push(...decodePolyline(step.polyline.points));
      });
      return points;
    }
  } catch (e) {
    console.warn('Failed to fetch directions:', e);
  }
  // Fallback to straight line
  return [
    { latitude: originLat, longitude: originLng },
    { latitude: destLat, longitude: destLng },
  ];
}

export function RideMap({ pickupLat, pickupLng, dropLat, dropLng }: Props) {
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [driverToPickupRoute, setDriverToPickupRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [pickupToDropRoute, setPickupToDropRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const { sendThrottledMessage } = useSocket();

  // Track driver location
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
        
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setDriverLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });
        sendThrottledMessage('location_update', {
          location: { lat: current.coords.latitude, lng: current.coords.longitude }
        }, 0);

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 5000 },
          (loc) => {
            setDriverLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            // 🚀 Stream hardware GPS to the server during active rides
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

  // Fetch pickup → drop route
  useEffect(() => {
    fetchRoute(pickupLat, pickupLng, dropLat, dropLng).then(points => {
      // Pad with exact marker coords so line visually touches the pins
      const pickup = { latitude: pickupLat, longitude: pickupLng };
      const drop = { latitude: dropLat, longitude: dropLng };
      setPickupToDropRoute([pickup, ...points, drop]);
    });
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  // Fetch driver → pickup route when driver location is available
  useEffect(() => {
    if (driverLocation) {
      fetchRoute(driverLocation.latitude, driverLocation.longitude, pickupLat, pickupLng).then(points => {
        const origin = { latitude: driverLocation.latitude, longitude: driverLocation.longitude };
        const dest = { latitude: pickupLat, longitude: pickupLng };
        setDriverToPickupRoute([origin, ...points, dest]);
      });
    }
  }, [driverLocation, pickupLat, pickupLng]);

  // Calculate region to fit all points
  const allLats = [pickupLat, dropLat, ...(driverLocation ? [driverLocation.latitude] : [])];
  const allLngs = [pickupLng, dropLng, ...(driverLocation ? [driverLocation.longitude] : [])];
  const minLat = Math.min(...allLats);
  const maxLat = Math.max(...allLats);
  const minLng = Math.min(...allLngs);
  const maxLng = Math.max(...allLngs);
  const midLat = (minLat + maxLat) / 2;
  const midLng = (minLng + maxLng) / 2;
  const latDelta = (maxLat - minLat) * 1.6 + 0.02;
  const lngDelta = (maxLng - minLng) * 1.6 + 0.02;

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: lngDelta }}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
    >
      {/* Driver → Pickup route (dashed blue) */}
      {driverToPickupRoute.length > 0 && (
        <Polyline
          coordinates={driverToPickupRoute}
          strokeColor={theme.colors.darkDeep}
          strokeWidth={4}
          lineDashPattern={[8, 6]}
        />
      )}

      {/* Pickup → Drop route (solid primary) */}
      {pickupToDropRoute.length > 0 && (
        <Polyline
          coordinates={pickupToDropRoute}
          strokeColor={theme.colors.primary}
          strokeWidth={5}
        />
      )}

      {/* Driver bike marker */}
      {driverLocation && (
        <Marker coordinate={driverLocation} title="Your location" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.driverMarker}>
            <MaterialCommunityIcons name="motorbike" size={16} color="#FFF" />
          </View>
        </Marker>
      )}

      {/* Pickup marker */}
      <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} title="Pickup">
        <View style={styles.pickupMarker}>
          <Ionicons name="location" size={16} color="#FFF" />
        </View>
      </Marker>

      {/* Drop marker */}
      <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Drop">
        <View style={styles.dropMarker}>
          <Ionicons name="flag" size={16} color="#FFF" />
        </View>
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.dark,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  pickupMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.success,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
  dropMarker: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: theme.colors.danger,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#FFF',
  },
});
