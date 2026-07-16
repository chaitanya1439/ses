import React, { useEffect, useState, useRef, useCallback } from "react";
import { ioTClient } from "@/lib/aws-iot";
import { useAuth } from "@/contexts/AuthContext";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  Animated as RNAnimated,
} from "react-native";
import { router } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { mockDriver } from "@/constants/mockData";
import { fetchDirectionsPolyline } from "@/lib/googleMaps";

type Phase = "searching" | "toPickup" | "delivering" | "delivered";

// Default coordinates (Hyderabad area)
const PICKUP_COORD = { latitude: 17.4425, longitude: 78.4975 };
const DROP_COORD = { latitude: 17.4260, longitude: 78.4602 };
const DRIVER_START = { latitude: 17.4515, longitude: 78.5020 };

const MOVE_INTERVAL_MS = 120; // how often the vehicle moves
const SEARCH_DURATION_MS = 4000; // how long the "searching" phase lasts

export default function ParcelConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [phase, setPhase] = useState<Phase>("searching");
  const [toPickupRoute, setToPickupRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [deliveryRoute, setDeliveryRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const [vehiclePos, setVehiclePos] = useState(DRIVER_START);
  const [trailCoords, setTrailCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  const { token, user } = useAuth();

  // Animation refs
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;
  const sheetAnim = useRef(new RNAnimated.Value(0)).current;
  const moveInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Status text for each phase
  const statusConfig: Record<Phase, { title: string; subtitle: string; color: string; icon: string }> = {
    searching: { title: "Finding a driver...", subtitle: "Matching you with the nearest rider", color: Colors.primary, icon: "search" },
    toPickup: { title: "Driver en route to pickup", subtitle: `${mockDriver.name} is heading to collect your parcel`, color: Colors.info, icon: "bicycle" },
    delivering: { title: "Parcel on the way!", subtitle: `${mockDriver.name} is delivering your parcel`, color: Colors.success, icon: "cube" },
    delivered: { title: "Delivered!", subtitle: "Your parcel has been delivered successfully", color: Colors.success, icon: "checkmark-circle" },
  };

  // Fetch both routes on mount
  useEffect(() => {
    (async () => {
      const [routeA, routeB] = await Promise.all([
        fetchDirectionsPolyline(DRIVER_START, PICKUP_COORD),
        fetchDirectionsPolyline(PICKUP_COORD, DROP_COORD),
      ]);
      setToPickupRoute(routeA);
      setDeliveryRoute(routeB);

      // Fit map to show all points
      const allCoords = [...routeA, ...routeB];
      if (mapRef.current && allCoords.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { top: 100, right: 60, bottom: 280, left: 60 },
            animated: true,
          });
        }, 600);
      }
    })();
  }, []);

  // Pulse animation during searching
  useEffect(() => {
    if (phase === "searching") {
      const pulse = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          RNAnimated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase, pulseAnim]);

  // Sheet slide-up
  useEffect(() => {
    RNAnimated.spring(sheetAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 14,
      stiffness: 120,
    }).start();
  }, [sheetAnim]);

  // Phase transitions: searching → toPickup → delivering → delivered
  useEffect(() => {
    if (phase === "searching") {
      const timer = setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase("toPickup");
        setTrailCoords([]);
      }, SEARCH_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // AWS IoT Core Live GPS Tracking
  useEffect(() => {
    if (!token || !user?.id) return;

    ioTClient.connect(token).then(() => {
      // Subscribe to this specific parcel's tracking topic (using user ID)
      const topic = `ridego/rides/${user.id}/location`;
      
      ioTClient.subscribe(topic, (payload) => {
        if (payload.latitude && payload.longitude) {
          const newPos = { latitude: payload.latitude, longitude: payload.longitude };
          setVehiclePos(newPos);
          setTrailCoords((prev) => [...prev, newPos]);
        }
      });
    }).catch(console.error);

    return () => {
      if (user?.id) {
        ioTClient.unsubscribe(`ridego/rides/${user.id}/location`);
      }
    };
  }, [token, user]);

  const config = statusConfig[phase];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: (PICKUP_COORD.latitude + DROP_COORD.latitude) / 2,
              longitude: (PICKUP_COORD.longitude + DROP_COORD.longitude) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            {/* Pickup marker */}
            <Marker coordinate={PICKUP_COORD}>
              <View style={styles.pickupMarker}>
                <MaterialCommunityIcons name="package-variant-closed" size={16} color={Colors.white} />
              </View>
            </Marker>

            {/* Drop marker */}
            <Marker coordinate={DROP_COORD}>
              <View style={styles.dropMarker}>
                <MaterialCommunityIcons name="flag" size={14} color={Colors.white} />
              </View>
            </Marker>

            {/* Planned route polylines (dashed, subtle) */}
            {toPickupRoute.length > 1 && (
              <Polyline
                coordinates={toPickupRoute}
                strokeColor={Colors.info + "60"}
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            )}
            {deliveryRoute.length > 1 && (
              <Polyline
                coordinates={deliveryRoute}
                strokeColor={Colors.success + "60"}
                strokeWidth={3}
                lineDashPattern={[8, 6]}
              />
            )}

            {/* Travelled trail (solid) */}
            {trailCoords.length > 1 && (
              <Polyline
                coordinates={trailCoords}
                strokeColor={phase === "toPickup" ? Colors.info : Colors.success}
                strokeWidth={4}
              />
            )}

            {/* Vehicle marker */}
            {phase !== "searching" && phase !== "delivered" && (
              <Marker coordinate={vehiclePos} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.vehicleMarker}>
                  <MaterialCommunityIcons name="motorbike" size={20} color={Colors.white} />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webMapPlaceholder]}>
            <MaterialCommunityIcons name="map" size={64} color={Colors.mediumGrey} />
            <Text style={styles.webMapText}>Map view (mobile only)</Text>
          </View>
        )}

        {/* Back button */}
        <Pressable
          style={[styles.floatingBtn, { top: insets.top + 12, left: 16 }]}
          onPress={() => router.replace("/(tabs)/home")}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.dark} />
        </Pressable>

        {/* Tracking ID badge */}
        <View style={[styles.trackingBadge, { top: insets.top + 12 }]}>
          <MaterialCommunityIcons name="barcode" size={16} color={Colors.primary} />
          <Text style={styles.trackingBadgeText}>#PKL2847</Text>
        </View>
      </View>

      {/* Bottom Sheet */}
      <RNAnimated.View
        style={[
          styles.bottomSheet,
          { paddingBottom: insets.bottom + 16 },
          {
            transform: [
              {
                translateY: sheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Phase indicator */}
        <View style={styles.phaseRow}>
          {(["searching", "toPickup", "delivering", "delivered"] as Phase[]).map((p, i) => (
            <View key={p} style={styles.phaseStep}>
              <View
                style={[
                  styles.phaseDot,
                  {
                    backgroundColor:
                      (["searching", "toPickup", "delivering", "delivered"] as Phase[]).indexOf(phase) >= i
                        ? config.color
                        : Colors.mediumGrey,
                  },
                ]}
              />
              {i < 3 && (
                <View
                  style={[
                    styles.phaseConnector,
                    {
                      backgroundColor:
                        (["searching", "toPickup", "delivering", "delivered"] as Phase[]).indexOf(phase) > i
                          ? config.color
                          : Colors.mediumGrey,
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Status */}
        <View style={styles.statusRow}>
          {phase === "searching" ? (
            <RNAnimated.View style={[styles.statusIcon, { backgroundColor: config.color + "22", transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name={config.icon as any} size={22} color={config.color} />
            </RNAnimated.View>
          ) : (
            <View style={[styles.statusIcon, { backgroundColor: config.color + "22" }]}>
              <Ionicons name={config.icon as any} size={22} color={config.color} />
            </View>
          )}
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>{config.title}</Text>
            <Text style={styles.statusSubtitle}>{config.subtitle}</Text>
          </View>
        </View>

        {/* Driver card (visible after searching) */}
        {phase !== "searching" && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <MaterialCommunityIcons name="account" size={28} color={Colors.grey} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{mockDriver.name}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={12} color={Colors.primary} />
                <Text style={styles.driverRating}>{mockDriver.rating}</Text>
                <Text style={styles.driverPlate}>· {mockDriver.plateNumber}</Text>
              </View>
            </View>
            <View style={styles.otpBox}>
              <Text style={styles.otpLabel}>OTP</Text>
              <Text style={styles.otpValue}>{mockDriver.otp}</Text>
            </View>
          </View>
        )}

        {/* Route summary */}
        <View style={styles.routeSummary}>
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
            <Text style={styles.routeAddr} numberOfLines={1}>Tirumala Enclave, Alwal</Text>
          </View>
          <View style={styles.routeConnector} />
          <View style={styles.routePoint}>
            <View style={[styles.routeDot, { backgroundColor: "#F97316" }]} />
            <Text style={styles.routeAddr} numberOfLines={1}>Prasanth Residency, Arunodaya Colony</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {phase !== "delivered" ? (
            <>
              <Pressable style={styles.callBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Ionicons name="call" size={20} color={Colors.success} />
              </Pressable>
              <Pressable style={styles.chatBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                <Ionicons name="chatbubble-ellipses" size={20} color={Colors.info} />
              </Pressable>
              <Pressable style={styles.sosActionBtn}>
                <Text style={styles.sosText}>SOS</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={styles.homeBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace("/(tabs)/home");
              }}
            >
              <Text style={styles.homeBtnText}>Back to Home</Text>
            </Pressable>
          )}
        </View>
      </RNAnimated.View>
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
    gap: 12,
  },
  webMapText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  floatingBtn: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  trackingBadge: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  trackingBadgeText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    letterSpacing: 0.5,
  },
  pickupMarker: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  dropMarker: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F97316",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  vehicleMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.info,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  phaseStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  phaseConnector: {
    width: 40,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  statusSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.lightGrey,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.mediumGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  driverMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  driverRating: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  driverPlate: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  otpBox: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  otpLabel: {
    fontSize: 9,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    letterSpacing: 1,
  },
  otpValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
    letterSpacing: 3,
  },
  routeSummary: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeConnector: {
    width: 2,
    height: 10,
    backgroundColor: Colors.mediumGrey,
    marginLeft: 3,
    borderRadius: 1,
  },
  routeAddr: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  callBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.success + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.info + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  sosActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.danger + "18",
    borderWidth: 2,
    borderColor: Colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: Colors.danger,
  },
  homeBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  homeBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
});
