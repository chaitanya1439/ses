import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

// 1. Setup & Focus: Hardcoded dummy coordinates in Hyderabad/Gachibowli region
const GACHIBOWLI_START: Coordinate = { latitude: 17.440081, longitude: 78.348916 };

const MOCK_COORDINATES: Coordinate[] = [
  GACHIBOWLI_START,
  { latitude: 17.441081, longitude: 78.348916 },
  { latitude: 17.442081, longitude: 78.349916 },
  { latitude: 17.443081, longitude: 78.351916 },
  { latitude: 17.444081, longitude: 78.353916 },
  { latitude: 17.445081, longitude: 78.355916 }, // Pickup spot
];

const PICKUP_LOCATION = MOCK_COORDINATES[MOCK_COORDINATES.length - 1];

// Helper: Calculate Great-Circle Distance
function calculateDistanceInMeters(coords: Coordinate[]): number {
  if (coords.length < 2) return 0;
  let totalDist = 0;
  const toRad = (val: number) => (val * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters

  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    const phi1 = toRad(start.latitude);
    const phi2 = toRad(end.latitude);
    const deltaPhi = toRad(end.latitude - start.latitude);
    const deltaLambda = toRad(end.longitude - start.longitude);

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDist += R * c;
  }
  return totalDist;
}

// Helper: Calculate true bearing (heading)
function getHeading(start: Coordinate, end: Coordinate): number {
  const toRad = (val: number) => (val * Math.PI) / 180;
  const toDeg = (val: number) => (val * 180) / Math.PI;

  const startLat = toRad(start.latitude);
  const startLng = toRad(start.longitude);
  const endLat = toRad(end.latitude);
  const endLng = toRad(end.longitude);

  const dLng = endLng - startLng;
  const y = Math.sin(dLng) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

export default function LiveTrackingScreen() {
  // 2. MapView Reference
  const mapRef = useRef<MapView>(null);

  // States
  const [route, setRoute] = useState<Coordinate[]>(MOCK_COORDINATES);
  const [currentVehicleLocation, setCurrentVehicleLocation] = useState<Coordinate>(MOCK_COORDINATES[0]);
  const [heading, setHeading] = useState<number>(0);
  const [remainingMeters, setRemainingMeters] = useState<number>(
    Math.round(calculateDistanceInMeters(MOCK_COORDINATES))
  );

  // 6. Simulation Logic
  useEffect(() => {
    let index = 0;

    const interval = setInterval(() => {
      // Simulate moving to the next coordinate until the end
      if (index < MOCK_COORDINATES.length - 1) {
        const currentCoord = MOCK_COORDINATES[index];
        const nextCoord = MOCK_COORDINATES[index + 1];

        // Increment position
        index++;

        // Calculate heading properly to rotate the marker
        const newHeading = getHeading(currentCoord, nextCoord);

        // Update active states
        setHeading(newHeading);
        setCurrentVehicleLocation(nextCoord);

        // Dynamically trim passed coordinates from the state array (Erasing line effect)
        const remainingRoute = MOCK_COORDINATES.slice(index);
        setRoute(remainingRoute);

        // Calculate and update the dynamic remaining distance
        setRemainingMeters(Math.round(calculateDistanceInMeters(remainingRoute)));

        // 7. Forced Auto-Focus to immediately lock onto moving marker and destination
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([nextCoord, PICKUP_LOCATION], {
            edgePadding: { top: 100, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }
      } else {
        clearInterval(interval);
      }
    }, 2500); // 2.5s tick rate for smoother simulation chunks

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <MapView userInterfaceStyle="light"
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        // Initial Region centers directly on Hyderabad coordinates right on load
        initialRegion={{
          latitude: GACHIBOWLI_START.latitude,
          longitude: GACHIBOWLI_START.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        {/* Draw the erasing polyline */}
        {route.length > 1 && (
          <Polyline 
             coordinates={route} 
             strokeColor="#1F1F1F" 
             strokeWidth={4.5} 
             lineCap="round" 
             lineJoin="round" 
          />
        )}

        {/* 3. Static standard Marker labeled 'Pickup' at end coordinate */}
        <Marker coordinate={PICKUP_LOCATION} title="Pickup" identifier="pickup">
            <View style={styles.pickupDestinationMarker}>
               <View style={styles.pickupInternalDot} />
            </View>
        </Marker>

        {/* 5. The Vehicle Marker Structure (MOST IMPORTANT FIX) */}
        <Marker coordinate={currentVehicleLocation} rotation={heading} flat={true}>
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* Floating Distance Label (MUST be visible with background color) */}
            <View
              style={{
                backgroundColor: 'black',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 10,
                marginBottom: 5,
              }}
            >
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                {`${remainingMeters} meters`}
              </Text>
            </View>
            
            {/* Vehicle Image */}
            {/* Note: I'm resolving the exact path structure you requested. Ensure the asset is genuinely stored at ./assets/auto-top-view.png relative to this component file, or change to a global alias like @/assets/... if needed */}
            <Image
              source={require('./assets/auto-top-view.png')}
              style={{ width: 40, height: 40 }}
              // A fallback is often useful here in dev: 
              // defaultSource={require('@/assets/images/she-bike-icon.png')}
            />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // fallback background 
  },
  pickupDestinationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  pickupInternalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  }
});
