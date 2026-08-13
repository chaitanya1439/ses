import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { SvgXml } from 'react-native-svg';

const bikeXml = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g filter="url(#shadow)">
    <rect x="18" y="28" width="4" height="8" rx="2" fill="#333333" />
    <rect x="18" y="4" width="4" height="8" rx="2" fill="#333333" />
    <rect x="16" y="8" width="8" height="24" rx="3" fill="#F59E0B" />
    <rect x="17" y="18" width="6" height="10" rx="2" fill="#111827" />
    <path d="M14 12 L26 12" stroke="#111827" stroke-width="2" stroke-linecap="round" />
  </g>
  <defs>
    <filter id="shadow" x="0" y="0" width="40" height="40" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3" />
    </filter>
  </defs>
</svg>`;

// -------------------------------------------------------------
// HELPER FUNCTIONS
// -------------------------------------------------------------
const toRad = (value: number) => (value * Math.PI) / 180;
const toDeg = (value: number) => (value * 180) / Math.PI;

// Calculate bearing between two points
function getBearing(start: { latitude: number; longitude: number }, end: { latitude: number; longitude: number }) {
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

// Calculate total remaining distance in meters
function getDistance(coords: { latitude: number; longitude: number }[]) {
  if (coords.length < 2) return 0;
  let totalDist = 0;
  const R = 6371e3; // Earth radius in metres
  
  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    const phi1 = toRad(start.latitude);
    const phi2 = toRad(end.latitude);
    const deltaPhi = toRad(end.latitude - start.latitude);
    const deltaLambda = toRad(end.longitude - start.longitude);

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) *
      Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    totalDist += R * c;
  }
  return totalDist;
}

// -------------------------------------------------------------
// MOCK DATA
// -------------------------------------------------------------
const MOCK_ROUTE = [
  { latitude: 17.3850, longitude: 78.4860 },
  { latitude: 17.3855, longitude: 78.4862 },
  { latitude: 17.3860, longitude: 78.4865 },
  { latitude: 17.3870, longitude: 78.4869 },
  { latitude: 17.3885, longitude: 78.4875 },
  { latitude: 17.3895, longitude: 78.4880 },
  { latitude: 17.3905, longitude: 78.4885 },
  { latitude: 17.3910, longitude: 78.4875 }, // Pickup Spot
];

// -------------------------------------------------------------
// COMPONENT
// -------------------------------------------------------------
export default function LiveTrackingMap() {
  const mapRef = useRef<MapView>(null);
  const [routeIndex, setRouteIndex] = useState(0);
  const [vehicleLocation, setVehicleLocation] = useState(MOCK_ROUTE[0]);
  const [bearing, setBearing] = useState(0);

  const pickupSpot = MOCK_ROUTE[MOCK_ROUTE.length - 1];
  
  // Calculate remaining route for polyline trimming
  const remainingRoute = MOCK_ROUTE.slice(routeIndex);

  // Total distance in remaining route
  const totalDistanceMeters = getDistance(remainingRoute);
  
  // ETA calculation (rough estimate: e.g. 1 min per 300 meters)
  const etaMinutes = Math.max(1, Math.ceil(totalDistanceMeters / 300));
  
  // 1. Live Marker Movement: simulated via setInterval
  useEffect(() => {
    const interval = setInterval(() => {
      setRouteIndex((prevIndex) => {
        if (prevIndex < MOCK_ROUTE.length - 1) {
          const nextIndex = prevIndex + 1;
          const currentCoord = MOCK_ROUTE[prevIndex];
          const nextCoord = MOCK_ROUTE[nextIndex];
          
          // Calculate heading towards next coordinate
          setBearing(getBearing(currentCoord, nextCoord));
          setVehicleLocation(nextCoord);
          
          return nextIndex;
        } else {
          // Reached destination, stop interval
          clearInterval(interval);
          return prevIndex;
        }
      });
    }, 2500); // Trigger move every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  // 5. Dynamic Camera Auto-Zoom (fitToCoordinates)
  useEffect(() => {
    if (mapRef.current && remainingRoute.length > 0) {
      // Fit to current vehicle location + static pickup point
      const coordsToFit = [vehicleLocation, pickupSpot];
      mapRef.current.fitToCoordinates(coordsToFit, {
        edgePadding: { top: 180, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }
  }, [remainingRoute.length, vehicleLocation, pickupSpot]); // runs whenever the vehicle location updates

  return (
    <View style={styles.container}>
      {/* 4. ETA Display Above Map */}
      <View style={styles.etaContainer}>
        <Text style={styles.etaTitle}>Driver is on the way</Text>
        <Text style={styles.etaText}>Pick-up in {etaMinutes} min</Text>
      </View>

      <MapView userInterfaceStyle="light"
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: MOCK_ROUTE[0].latitude,
          longitude: MOCK_ROUTE[0].longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
      >
        {/* 2. Polyline Trimming */}
        {remainingRoute.length > 1 && (
          <Polyline
            coordinates={remainingRoute}
            strokeColor={Colors?.dark || '#1F1F1F'}
            strokeWidth={4.5}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Static Pickup Spot Marker */}
        <Marker coordinate={pickupSpot} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pickupMarker}>
            <View style={styles.pickupDot} />
          </View>
        </Marker>

        {/* 1. Rotated Vehicle Marker */}
        <Marker
          coordinate={vehicleLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={true} // flat=true rotates the marker with bearing on the map
          rotation={bearing}
          style={{ zIndex: 10 }}
        >
          <View style={styles.vehicleMarkerContainer}>
            <SvgXml xml={bikeXml} width="40" height="40" />
          </View>
        </Marker>
        
        {/* 3. Dynamic Floating Distance Label */}
        {/* Attached to the same vehicleLocation, but without rotation so text remains readable */}
        <Marker 
          coordinate={vehicleLocation} 
          anchor={{ x: 0.5, y: 1.5 }} // offset below the car
          tracksViewChanges={true} // ensure re-render as state updates
        >
            <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>{Math.round(totalDistanceMeters)} meters</Text>
                <View style={styles.distanceBadgeArrow} />
            </View>
        </Marker>

      </MapView>

      {/* Simulated PIN section reference at bottom */}
      <View style={styles.pinSection}>
         <Text style={styles.pinText}>PIN: 4982</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  etaContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
  },
  etaTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  etaText: {
    fontSize: 22,
    color: '#000',
    fontWeight: 'bold',
  },
  pickupMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EBEBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  vehicleMarkerContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    // Rotate 90deg offset might be needed if the 'car-top-view' icon doesn't natively point North.
    // By default usually top-view points up (North). 
  },
  distanceBadge: {
    backgroundColor: '#1F1F1F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
    marginBottom: 4, 
  },
  distanceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  distanceBadgeArrow: {
    position: 'absolute',
    top: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 5,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#1F1F1F',
  },
  pinSection: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 20,
    alignSelf: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 10,
  },
  pinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  }
});
