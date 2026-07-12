import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  Image,
  Animated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/constants/colors";
import { useSocket } from "@/contexts/SocketContext";
import { fetchDirectionsPolyline } from "@/lib/googleMaps";

export default function ParcelTrackingScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<any>();

  let payload: any = null;
  if (params.data) {
    try {
      payload = JSON.parse(params.data as string);
    } catch (e) {
      // ignore
    }
  }

  // 1. ADDRESSES — dynamic from route params
  const sender = payload?.sender || {
    address: params.senderAddress || "Pick-up location",
    lat: params.senderLat ? parseFloat(params.senderLat as string) : 17.385,
    lng: params.senderLng ? parseFloat(params.senderLng as string) : 78.4867,
  };

  const recipient = payload?.recipient || {
    address: params.recipientAddress || "Drop-off location",
    lat: params.recipientLat
      ? parseFloat(params.recipientLat as string)
      : 17.426,
    lng: params.recipientLng
      ? parseFloat(params.recipientLng as string)
      : 78.4601,
  };

  const fare = payload?.fare || params.fare || 0;
  const dropoffOption =
    payload?.dropoffOption || params.dropoffOption || "Meet at door";

  const { subscribe } = useSocket();
  const [driver, setDriver] = useState<any>(null);
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const mapRef = useRef<MapView>(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const etaIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 2. MAP — dynamic locations (Polyline fetching)
  useEffect(() => {
    (async () => {
      const coords = await fetchDirectionsPolyline(
        { latitude: sender.lat, longitude: sender.lng },
        { latitude: recipient.lat, longitude: recipient.lng },
      );
      setRouteCoords(coords);
      if (mapRef.current && coords.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }, 500);
      }
    })();
  }, [sender.lat, sender.lng, recipient.lat, recipient.lng]);

  // WebSocket subscriptions
  useEffect(() => {
    const unsubMatched = subscribe("DRIVER_MATCHED", (data) => {
      if (data.driver) {
        setDriver(data.driver);
        setDriverCoords({
          latitude: data.driver.lat,
          longitude: data.driver.lng,
        });
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start();
      }
    });

    const unsubLoc = subscribe("DRIVER_LOCATION", (data) => {
      if (data.lat && data.lng) {
        setDriverCoords({ latitude: data.lat, longitude: data.lng });
      }
    });

    const unsubEta = subscribe("ETA_UPDATE", (data) => {
      if (typeof data.minutes === "number") {
        setEtaMinutes(data.minutes);

        if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);

        // Start countdown timer locally once ETA received
        let currentEta = data.minutes;
        etaIntervalRef.current = setInterval(() => {
          currentEta -= 1;
          if (currentEta >= 0) {
            setEtaMinutes(currentEta);
          } else {
            if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
          }
        }, 60000); // decrement every 60 seconds
      }
    });

    return () => {
      unsubMatched();
      unsubLoc();
      unsubEta();
      if (etaIntervalRef.current) clearInterval(etaIntervalRef.current);
    };
  }, [subscribe, slideAnim]);

  const mapRegion = {
    latitude: (sender.lat + recipient.lat) / 2,
    longitude: (sender.lng + recipient.lng) / 2,
    latitudeDelta: Math.abs(sender.lat - recipient.lat) * 1.5 + 0.01,
    longitudeDelta: Math.abs(sender.lng - recipient.lng) * 1.5 + 0.01,
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={mapRegion}
          >
            {/* Sender Pin */}
            <Marker
              coordinate={{ latitude: sender.lat, longitude: sender.lng }}
            >
              <View style={styles.pickupMarker}>
                <View style={styles.pickupMarkerInner} />
              </View>
            </Marker>

            {/* Recipient Pin */}
            <Marker
              coordinate={{ latitude: recipient.lat, longitude: recipient.lng }}
            >
              <View style={styles.dropMarker}>
                <MaterialCommunityIcons
                  name="flag"
                  size={16}
                  color={Colors.white}
                />
              </View>
            </Marker>

            {/* Real-time Driver Marker */}
            {driverCoords && (
              <Marker coordinate={driverCoords}>
                <View style={styles.driverMarker}>
                  <MaterialCommunityIcons
                    name="bike"
                    size={22}
                    color={Colors.white}
                  />
                </View>
              </Marker>
            )}

            {/* Route Polyline */}
            {routeCoords.length > 1 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={Colors.dark}
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webMapPlaceholder]}>
            <MaterialCommunityIcons
              name="map"
              size={48}
              color={Colors.mediumGrey}
            />
          </View>
        )}
      </View>

      <Pressable
        style={[styles.floatingBack, { top: insets.top + 8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.dark} />
      </Pressable>

      {/* 5. ETA Top Banner */}
      {etaMinutes !== null && (
        <View style={[styles.etaBanner, { top: insets.top + 8 }]}>
          <Text style={styles.etaText}>Pick-up in {etaMinutes} min</Text>
        </View>
      )}

      {/* 3. DELIVERY DETAILS CARD */}
      <View
        style={[styles.sheetContainer, { paddingBottom: insets.bottom + 16 }]}
      >
        <View style={styles.sheetHandle} />

        <View style={styles.detailsHeader}>
          <Text style={styles.deliveryTitle} numberOfLines={1}>
            Pick-up at {sender.address}
          </Text>
          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dropoffOption}</Text>
            </View>
            <View style={[styles.badge, styles.cashBadge]}>
              <Ionicons name="cash-outline" size={14} color={Colors.success} />
              <Text style={styles.cashBadgeText}>Cash</Text>
            </View>
          </View>

          {/* Dynamic Meet Driver Text */}
          {driver && (
            <Text style={styles.meetDriverText}>
              Meet {driver.name} at the curb...
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* 4. DRIVER CARD */}
        {driver ? (
          <Animated.View style={[styles.driverCard, { opacity: slideAnim }]}>
            <View style={styles.driverRow}>
              <Image
                source={{ uri: driver.photoUrl || "https://i.pravatar.cc/150" }}
                style={styles.driverAvatar}
              />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.ratingText}>{driver.rating}</Text>
                </View>
                {driver.languages && (
                  <Text style={styles.driverLangs}>
                    Knows {driver.languages}
                  </Text>
                )}
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.plateText}>{driver.plate}</Text>
                <Text style={styles.vehicleText}>{driver.vehicle}</Text>
              </View>
            </View>

            <View style={styles.driverActions}>
              <Pressable style={styles.actionBtn}>
                <Ionicons name="call" size={20} color={Colors.dark} />
              </Pressable>
              <Pressable style={styles.actionBtn}>
                <Ionicons name="chatbubble" size={20} color={Colors.dark} />
              </Pressable>

              {/* 6. FARE */}
              <View style={styles.fareBox}>
                <Text style={styles.fareLabel}>Total Fare</Text>
                <Text style={styles.fareAmount}>
                  ₹{typeof fare === "number" ? fare.toFixed(2) : fare}
                </Text>
              </View>
            </View>
          </Animated.View>
        ) : (
          <View style={styles.driverSkeleton}>
            <View style={styles.skeletonAvatar} />
            <View style={styles.skeletonCol}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: 100 }]} />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.lightGrey,
  },
  webMapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBack: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  etaBanner: {
    position: "absolute",
    alignSelf: "center",
    backgroundColor: Colors.dark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  etaText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  pickupMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  pickupMarkerInner: {
    flex: 1,
    backgroundColor: Colors.success,
    borderRadius: 10,
  },
  dropMarker: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  detailsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  deliveryTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  badge: {
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  cashBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.success + "15",
  },
  cashBadgeText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.success,
  },
  meetDriverText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  driverCard: {
    paddingHorizontal: 20,
  },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.lightGrey,
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.grey,
  },
  driverLangs: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  vehicleInfo: {
    alignItems: "flex-end",
    backgroundColor: Colors.lightGrey,
    padding: 8,
    borderRadius: 8,
  },
  plateText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  vehicleText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  driverActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  fareBox: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  fareLabel: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  fareAmount: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  driverSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    opacity: 0.5,
  },
  skeletonAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#E5E7EB",
    marginRight: 12,
  },
  skeletonCol: {
    flex: 1,
    gap: 8,
  },
  skeletonLine: {
    height: 14,
    width: 140,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
});
