import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, StatusBar, Platform,
  Animated, Easing, Image,
} from "react-native";
import { router } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { PUBLIC_WEBSOCKET_URL } from "@/constants/config";
import { useBooking } from "@/contexts/BookingContext";
import { useSocket } from "@/contexts/SocketContext";
import { customMapStyle } from "@/constants/mapStyle";
import { fetchDirectionsPolyline, LatLng } from "@/lib/googleMaps";

// ─── Types ───────────────────────────────────────────────────────────
interface DriverInfo {
  name: string;
  rating: number;
  vehicle: string;
  plate: string;
  photoUrl: string;
  lat: number;
  lng: number;
  languages: string[];
}

type ScreenState = "finding" | "confirming" | "matched";

// ─── Shimmer ─────────────────────────────────────────────────────────
function Shimmer({ w, h, r = 6 }: { w: number | string; h: number; r?: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.ease, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 900, easing: Easing.ease, useNativeDriver: true }),
    ])).start();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });
  return <Animated.View style={{ width: w as any, height: h, borderRadius: r, backgroundColor: "#E5E7EB", opacity }} />;
}

// ─── Pulsing indicator ───────────────────────────────────────────────
function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.6, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ])).start();
  }, [scale, opacity]);
  return (
    <View style={st.pulseWrap}>
      <Animated.View style={[st.pulseRing, { transform: [{ scale }], opacity }]} />
      <View style={st.pulseDot} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
export default function DriverSearchScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop, selectedVehicle } = useBooking();
  const { subscribe } = useSocket();
  const mapRef = useRef<MapView>(null);

  const [state, setState] = useState<ScreenState>("finding");
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [driverLat, setDriverLat] = useState(0);
  const [driverLng, setDriverLng] = useState(0);
  const [etaMinutes, setEtaMinutes] = useState(0);

  const pickupLat = pickup?.lat ?? 17.385;
  const pickupLng = pickup?.lng ?? 78.4867;
  const dropLat = drop?.lat;
  const dropLng = drop?.lng;

  // ─── Fetch route polyline ─────────────────────────────────────────
  const [routePolyline, setRoutePolyline] = useState<LatLng[]>([]);
  useEffect(() => {
    if (pickupLat && pickupLng && dropLat && dropLng) {
      fetchDirectionsPolyline(
        { latitude: pickupLat, longitude: pickupLng },
        { latitude: dropLat, longitude: dropLng }
      ).then((coords) => {
        if (coords) setRoutePolyline(coords);
      });
    }
  }, [pickupLat, pickupLng, dropLat, dropLng]);

  // ─── Drifting Dummy Vehicles ──────────────────────────────────────
  const [dummyVehicles, setDummyVehicles] = useState<{id: string; latitude: number; longitude: number}[]>([]);

  useEffect(() => {
    if (state !== "finding") return;
    const count = selectedVehicle === 'auto' ? 4 : selectedVehicle === 'car' ? 3 : 6;
    const initial = Array.from({ length: count }).map((_, i) => ({
      id: `search-dummy-${selectedVehicle}-${i}`,
      latitude: pickupLat + (Math.random() - 0.5) * 0.015,
      longitude: pickupLng + (Math.random() - 0.5) * 0.015,
    }));
    setDummyVehicles(initial);

    const interval = setInterval(() => {
      setDummyVehicles(prev => prev.map(v => ({
        ...v,
        latitude: v.latitude + (Math.random() - 0.5) * 0.0008,
        longitude: v.longitude + (Math.random() - 0.5) * 0.0008,
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, [state, selectedVehicle, pickupLat, pickupLng]);

  // ─── Transition purely based on websockets ──────────────────────────

  // ─── WebSocket subscriptions ──────────────────────────────────────
  useEffect(() => {
    // Listen for a driver accepting the ride (server emits 'ride_accepted')
    const unsub1 = subscribe("ride_accepted", (payload: any) => {
      const d: DriverInfo = {
        name: payload.driverName ?? payload.driverId ?? "Driver",
        rating: payload.rating ?? 4.9,
        vehicle: payload.vehicle ?? "Honda Shine",
        plate: payload.plate ?? "TG10E7584",
        photoUrl: payload.photoUrl ?? "",
        lat: payload.driverLat ?? pickupLat + 0.003,
        lng: payload.driverLng ?? pickupLng + 0.002,
        languages: payload.languages ?? ["English", "Hindi"],
      };
      setDriver(d);
      setDriverLat(d.lat);
      setDriverLng(d.lng);
      setEtaMinutes(payload.eta ?? 5);
      setState("matched");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Auto-navigate to booking-confirmed once matched (instant transition)
      router.replace({
        pathname: "/booking-confirmed",
        params: { payload: JSON.stringify(payload) }
      });
    });

    // Live driver location updates (server emits 'driver_location')
    const unsub2 = subscribe("driver_location", (payload: any) => {
      if (payload.location?.lat != null) setDriverLat(payload.location.lat);
      if (payload.location?.lng != null) setDriverLng(payload.location.lng);
    });

    // Trip status changes (server emits 'trip_status_changed')
    const unsub3 = subscribe("trip_status_changed", (payload: any) => {
      if (payload.status === 'arrived') {
        setEtaMinutes(0);
      }
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [subscribe, pickupLat, pickupLng]);

  // ─── Fit map when driver matched ──────────────────────────────────
  useEffect(() => {
    if (state !== "matched" || !mapRef.current) return;
    const coords = [
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: driverLat, longitude: driverLng },
      ...(dropLat && dropLng ? [{ latitude: dropLat, longitude: dropLng }] : []),
    ];
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 120, right: 60, bottom: 400, left: 60 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [state, driverLat, driverLng, pickupLat, pickupLng]);

  const vehicleIconName = useMemo(() => {
    if (selectedVehicle === "auto") return "rickshaw";
    return "motorbike";
  }, [selectedVehicle]);

  // ═════════════════════════════════════════════════════════════════
  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ═══ MAP ═══════════════════════════════════════════════════ */}
      <View style={st.mapWrap}>
        {Platform.OS !== "web" ? (
          <MapView userInterfaceStyle="light"
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: pickupLat, longitude: pickupLng,
              latitudeDelta: 0.008, longitudeDelta: 0.008,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            customMapStyle={customMapStyle}
            showsCompass={false}
          >
            {/* Route polyline (Solid thick black) */}
            {routePolyline.length > 0 && (
              <Polyline coordinates={routePolyline} strokeWidth={4} strokeColor={Colors.dark} />
            )}

            {/* Pickup marker (Uber style) */}
            <Marker coordinate={{ latitude: pickupLat, longitude: pickupLng }} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 20 }}>
              <View style={st.uberMarkerWrapper}>
                <View style={st.uberTooltipAbsolute}>
                  <Text style={st.uberTooltipText} numberOfLines={1}>{pickup?.name || "Pickup"}</Text>
                </View>
                <View style={st.uberPickupDot} />
              </View>
            </Marker>

            {/* Drop marker (Uber style) */}
            {dropLat && dropLng && (
              <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
                <View style={st.uberMarkerWrapper}>
                  <View style={st.uberTooltipAbsolute}>
                    <Text style={st.uberTooltipText} numberOfLines={1}>{drop?.name || "Destination"}</Text>
                  </View>
                  <View style={st.uberDropSquare}>
                    <View style={st.uberDropInnerSquare} />
                  </View>
                </View>
              </Marker>
            )}

            {/* Driver marker (live) */}
            {state === "matched" && driverLat !== 0 && (
              <Marker
                coordinate={{ latitude: driverLat, longitude: driverLng }}
                anchor={{ x: 0.5, y: 0.5 }}
                style={{ zIndex: 100 }}
              >
                <View style={st.driverMarker}>
                  <MaterialCommunityIcons name={vehicleIconName as any} size={20} color={Colors.white} />
                </View>
              </Marker>
            )}

            {/* Drifting Dummy Vehicles while finding */}
            {state === "finding" && dummyVehicles.map((v) => (
              <Marker key={v.id} coordinate={v} zIndex={5}>
                <View style={[st.driverMarkerUber, { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.dark }]}>
                  {selectedVehicle === "she-bike" || selectedVehicle === "parcel" ? (
                    <Image 
                      source={
                        selectedVehicle === "parcel" 
                          ? require("@/assets/images/parcel-icon.png") 
                          : require("@/assets/images/she-bike-icon.png")
                      } 
                      style={{ width: 22, height: 22 }} 
                      resizeMode="contain" 
                    />
                  ) : (
                    <MaterialCommunityIcons name={vehicleIconName as any} size={20} color={Colors.dark} />
                  )}
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, st.webPlaceholder]}>
            <MaterialCommunityIcons name="map" size={64} color={Colors.mediumGrey} />
            <Text style={st.webText}>Map view (mobile only)</Text>
          </View>
        )}

        {/* Back button */}
        <Pressable style={[st.fab, { top: insets.top + 12, left: 16 }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
      </View>

      {/* ═══ BOTTOM SHEET ═════════════════════════════════════════ */}
      <View style={[st.sheet, { paddingBottom: Platform.OS === "web" ? 24 : Math.max(insets.bottom, 16) }]}>

        {/* ─── STATE 1: Finding pickup ────────────────────────── */}
        {state === "finding" && (
          <View style={st.stateCenter}>
            <PulsingDot />
            <Text style={st.stateTitle}>Finding pickup nearby</Text>
            <Text style={st.stateSub}>Looking for drivers around you…</Text>
          </View>
        )}

        {/* ─── STATE 2: Confirming ride ───────────────────────── */}
        {state === "confirming" && (
          <View>
            <Text style={st.stateTitle}>Confirming your ride</Text>
            <View style={st.skeletonCard}>
              <Shimmer w={56} h={56} r={28} />
              <View style={{ flex: 1, gap: 8, marginLeft: 14 }}>
                <Shimmer w="50%" h={16} />
                <Shimmer w="70%" h={12} />
                <Shimmer w="40%" h={12} />
              </View>
              <Shimmer w={60} h={32} r={16} />
            </View>
          </View>
        )}

        {/* ─── STATE 3: Driver matched ────────────────────────── */}
        {state === "matched" && driver && (
          <View>
            {/* ETA */}
            <Text style={st.etaTitle}>Pick-up in {etaMinutes} min</Text>

            {/* Delivery details card */}
            <View style={st.detailsCard}>
              <Text style={st.detailsLabel}>Delivery details</Text>
              <Text style={st.detailsAddress} numberOfLines={1}>
                Pick-up at {pickup?.address ?? "your location"}
              </Text>
              <View style={st.badgeRow}>
                <View style={st.greyBadge}>
                  <Text style={st.greyBadgeText}>Meet at curb</Text>
                </View>
                <View style={st.cashBadge}>
                  <MaterialCommunityIcons name="cash" size={14} color="#22C55E" />
                  <Text style={st.cashBadgeText}>Cash</Text>
                </View>
              </View>
              <View style={st.editRow}>
                <Pressable style={st.editBtn}>
                  <Ionicons name="pencil" size={14} color="#6B7280" />
                  <Text style={st.editBtnText}>Edit pick-up instructi...</Text>
                </Pressable>
                <Pressable style={st.moreBtn}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            {/* Driver card */}
            <View style={st.driverCard}>
              <View style={st.driverTopRow}>
                {/* Photo + rating */}
                <View style={st.driverPhotoWrap}>
                  {driver.photoUrl ? (
                    <Image source={{ uri: driver.photoUrl }} style={st.driverPhoto} />
                  ) : (
                    <View style={[st.driverPhoto, st.driverPhotoPlaceholder]}>
                      <Ionicons name="person" size={28} color="#9CA3AF" />
                    </View>
                  )}
                  <View style={st.ratingBadge}>
                    <Ionicons name="star" size={10} color="#FFB800" />
                    <Text style={st.ratingText}>{driver.rating.toFixed(2)}</Text>
                  </View>
                </View>
                {/* Vehicle icon */}
                <View style={st.vehicleImgBox}>
                  <MaterialCommunityIcons name={vehicleIconName as any} size={36} color={Colors.dark} />
                </View>
                {/* Driver info right */}
                <View style={st.driverInfoRight}>
                  <Text style={st.plateLarge}>{driver.plate}</Text>
                  <Text style={st.vehicleName}>{driver.vehicle}</Text>
                  <Text style={st.langText}>
                    Knows {driver.languages.join(" & ")}
                  </Text>
                </View>
              </View>
              {/* Driver name */}
              <Text style={st.driverName}>{driver.name.toUpperCase()}</Text>

              {/* Action buttons */}
              <View style={st.actionRow}>
                <Pressable
                  style={st.msgBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: "/chat" as any,
                      params: { 
                        driverId: driver.name,
                        socketUrl: PUBLIC_WEBSOCKET_URL
                      },
                    });
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.white} />
                  <Text style={st.msgBtnText}>Send a message</Text>
                </Pressable>
                <Pressable style={st.iconBtn}>
                  <Ionicons name="call-outline" size={20} color={Colors.dark} />
                </Pressable>
                <Pressable style={st.iconBtn}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={Colors.dark} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },

  // Map
  mapWrap: { flex: 1, backgroundColor: Colors.lightGrey },
  webPlaceholder: { alignItems: "center", justifyContent: "center", gap: 12 },
  webText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.grey },
  fab: {
    position: "absolute", width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.white, alignItems: "center", justifyContent: "center",
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  pickupMarker: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.dark,
    borderWidth: 4, borderColor: Colors.white,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  driverMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: Colors.white,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  // Uber Style Markers
  uberMarkerWrapper: { width: 16, height: 16, alignItems: "center", justifyContent: "center", overflow: "visible" },
  uberPickupDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.dark, borderWidth: 2, borderColor: Colors.white, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  uberDropSquare: { width: 14, height: 14, backgroundColor: Colors.dark, alignItems: "center", justifyContent: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  uberDropInnerSquare: { width: 6, height: 6, backgroundColor: Colors.white },
  
  uberTooltipAbsolute: {
    position: "absolute",
    bottom: 24,
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    maxWidth: 150,
    alignItems: "center",
  },
  uberTooltipText: {
    color: Colors.dark,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },

  // Sheet
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 24,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },

  // Pulse
  pulseWrap: { alignItems: "center", justifyContent: "center", marginBottom: 20, height: 60 },
  pulseRing: {
    position: "absolute", width: 56, height: 56, borderRadius: 28,
    borderWidth: 3, borderColor: Colors.info,
  },
  pulseDot: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.info,
  },

  // State text
  stateCenter: { alignItems: "center", paddingVertical: 16 },
  stateTitle: { fontSize: 22, fontFamily: "Poppins_700Bold", color: Colors.dark, textAlign: "center", marginBottom: 6 },
  stateSub: { fontSize: 14, fontFamily: "Poppins_500Medium", color: Colors.grey, textAlign: "center" },

  // Skeleton
  skeletonCard: {
    flexDirection: "row", alignItems: "center", marginTop: 20,
    backgroundColor: Colors.surfaceMuted, borderRadius: 20, padding: 20,
  },

  // ETA
  etaTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", color: Colors.dark, textAlign: "center", marginBottom: 16 },

  // Delivery details
  detailsCard: {
    backgroundColor: Colors.surfaceMuted, borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  detailsLabel: { fontSize: 12, fontFamily: "Poppins_600SemiBold", color: Colors.grey, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  detailsAddress: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.dark, marginBottom: 12 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  greyBadge: { backgroundColor: Colors.lightGrey, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  greyBadgeText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.darkSecondary },
  cashBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.success + "15", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  cashBadgeText: { fontSize: 13, fontFamily: "Poppins_700Bold", color: Colors.success },
  editRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.border },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtnText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.grey },
  moreBtn: { padding: 6, backgroundColor: Colors.lightGrey, borderRadius: 12 },

  // Driver card
  driverCard: {
    backgroundColor: Colors.white, borderRadius: 24, borderWidth: 1.5, borderColor: Colors.dark,
    padding: 20,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 4,
  },
  driverTopRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  driverPhotoWrap: { position: "relative" },
  driverPhoto: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.lightGrey },
  driverPhotoPlaceholder: { alignItems: "center", justifyContent: "center" },
  ratingBadge: {
    position: "absolute", bottom: -6, left: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  ratingText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: Colors.dark },
  vehicleImgBox: {
    width: 56, height: 48, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surfaceMuted, borderRadius: 12,
  },
  driverInfoRight: { flex: 1, alignItems: "flex-end" },
  plateLarge: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.dark },
  vehicleName: { fontSize: 13, fontFamily: "Poppins_500Medium", color: Colors.grey, marginTop: 2 },
  langText: { fontSize: 12, fontFamily: "Poppins_500Medium", color: Colors.grey, marginTop: 2 },
  driverName: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.dark, marginTop: 16, letterSpacing: 1 },

  driverMarkerUber: {
    width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center",
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  // Action buttons
  actionRow: { flexDirection: "row", gap: 12, marginTop: 16 },
  msgBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Colors.dark, borderRadius: 16, height: 56,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  msgBtnText: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.white },
  iconBtn: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.surfaceMuted,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border,
  },
});
