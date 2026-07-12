import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, StatusBar,
  Platform, Animated, Easing,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRequestRide } from "@/hooks/useRequestRide";
import {
  fetchNearbyPlaces, NearbyPlace,
  fetchReverseGeocode,
} from "@/lib/googleMaps";
import { customMapStyle } from "@/constants/mapStyle";

// ─── Types ───────────────────────────────────────────────────────────
interface PickupSpot extends NearbyPlace {
  previouslyUsed: boolean;
}

const HISTORY_KEY = "pickup_spots_history";
const MAX_HISTORY = 10;

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

function SkeletonSpots() {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
          <Shimmer w={40} h={40} r={20} />
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer w="55%" h={14} />
            <Shimmer w="80%" h={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
export default function ConfirmPickupScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop, setPickup, selectedVehicle, fare, routeDetails } = useBooking();
  const params = useLocalSearchParams<{ parcelDetails?: string }>();
  const { sendMessage } = useSocket();
  const { user } = useAuth();
  const { requestRide } = useRequestRide({ 
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyLTAwMSIsInJvbGUiOiJyaWRlciJ9.pz5qZubhjBOCuM-BwbaImq21Hfm-4Iu_W4NF3JL2_ig" 
  });
  const mapRef = useRef<MapView>(null);

  const [spots, setSpots] = useState<PickupSpot[]>([]);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reverseAddress, setReverseAddress] = useState("");

  // Pulse animation for selected marker
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const [pickupLat, setPickupLat] = useState(pickup?.lat ?? 17.385);
  const [pickupLng, setPickupLng] = useState(pickup?.lng ?? 78.4867);
  const [isMapMoving, setIsMapMoving] = useState(false);

  // ─── Step 1 & 2: Fetch nearby spots + check history ───────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);

      // Fetch history from AsyncStorage
      let history: string[] = [];
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (raw) history = JSON.parse(raw);
      } catch { /* ignore */ }

      // Fetch nearby places from Google
      const places = await fetchNearbyPlaces(pickupLat, pickupLng, 5);

      if (cancelled) return;

      if (places.length > 0) {
        // Map to PickupSpot with previouslyUsed flag
        const mapped: PickupSpot[] = places.map((p) => ({
          ...p,
          previouslyUsed: history.includes(p.id),
        }));

        // Sort: previously used first
        mapped.sort((a, b) => (a.previouslyUsed === b.previouslyUsed ? 0 : a.previouslyUsed ? -1 : 1));

        setSpots(mapped);
        setSelectedSpotId(mapped[0].id);
      } else {
        // Fallback: user's current GPS address
        const addr = await fetchReverseGeocode(pickupLat, pickupLng);
        const fallback: PickupSpot = {
          id: "current-location",
          name: "Current location",
          address: addr ?? `${pickupLat.toFixed(4)}, ${pickupLng.toFixed(4)}`,
          lat: pickupLat,
          lng: pickupLng,
          previouslyUsed: false,
        };
        setSpots([fallback]);
        setSelectedSpotId(fallback.id);
      }

      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [pickupLat, pickupLng]);

  // ─── Reverse geocode for subtitle ──────────────────────────────────
  useEffect(() => {
    (async () => {
      const addr = await fetchReverseGeocode(pickupLat, pickupLng);
      if (addr) setReverseAddress(addr);
    })();
  }, [pickupLat, pickupLng]);

  // ─── Fit map ───────────────────────────────────────────────────────
  const hasInitialFit = useRef(false);
  useEffect(() => {
    if (spots.length === 0 || !mapRef.current || hasInitialFit.current) return;
    const coords = spots.map((s) => ({ latitude: s.lat, longitude: s.lng }));
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 100, right: 60, bottom: 360, left: 60 },
        animated: true,
      });
      hasInitialFit.current = true;
    }, 400);
    return () => clearTimeout(timer);
  }, [spots]);

  const selectedSpot = useMemo(
    () => spots.find((s) => s.id === selectedSpotId) ?? spots[0],
    [spots, selectedSpotId]
  );

  // ─── Recenter ──────────────────────────────────────────────────────
  const handleRecenter = () => {
    const lat = pickup?.lat ?? 17.385;
    const lng = pickup?.lng ?? 78.4867;
    setSelectedSpotId(null);
    setPickupLat(lat);
    setPickupLng(lng);
    mapRef.current?.animateToRegion({
      latitude: lat, longitude: lng,
      latitudeDelta: 0.004, longitudeDelta: 0.004,
    }, 400);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Step 6: Confirm ──────────────────────────────────────────────
  const handleConfirm = async () => {
    let finalLat = pickupLat;
    let finalLng = pickupLng;
    let finalName = reverseAddress || "Selected Location";
    let finalAddress = reverseAddress || "";

    const selected = spots.find((s) => s.id === selectedSpotId);
    if (selected) {
      finalLat = selected.lat;
      finalLng = selected.lng;
      finalName = selected.name;
      finalAddress = selected.address;
      
      // Save to history
      try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        let history: string[] = raw ? JSON.parse(raw) : [];
        history = history.filter((id) => id !== selected.id);
        history.unshift(selected.id);
        history = history.slice(0, MAX_HISTORY);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch { /* ignore */ }
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // 2. Update booking context
    setPickup({
      name: finalName,
      address: finalAddress,
      lat: finalLat,
      lng: finalLng,
    });

    // 3. Prepare standard ride payload with dynamic fare
    const distanceKm = routeDetails ? (routeDetails.distanceMeters / 1000).toFixed(1) : '5.0';
    const dynamicFare = fare > 0 ? fare : 56;
    const ridePayload = {
      riderId: user?.id || "rider-001",
      pickupLocation: { lat: finalLat, lng: finalLng },
      dropLocation: drop && drop.lat != null && drop.lng != null ? { lat: drop.lat, lng: drop.lng } : undefined,
      fare: dynamicFare,
      vehicleType: selectedVehicle,
      pickupAddress: finalName || finalAddress,
      dropAddress: drop?.name || drop?.address,
      riderName: user?.name,
      distance: distanceKm,
      ...(params.parcelDetails ? { parcelDetails: JSON.parse(params.parcelDetails) } : {})
    };

    // 4. Emit WebSocket for instant delivery to online drivers
    sendMessage("ride_request", { payload: ridePayload });

    // 5. Also send via HTTP (triggers push notifications for backgrounded drivers)
    await requestRide(ridePayload);

    // 4. Navigate
    router.push("/driver-search" as any);
  };

  // ═════════════════════════════════════════════════════════════════
  return (
    <View style={st.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ═══ MAP ═══════════════════════════════════════════════════ */}
      <View style={st.mapWrap}>
        {Platform.OS !== "web" ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: pickupLat, longitude: pickupLng,
              latitudeDelta: 0.006, longitudeDelta: 0.006,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsPointsOfInterest={false}
            customMapStyle={customMapStyle}
            showsCompass={false}
            onRegionChange={() => setIsMapMoving(true)}
            onRegionChangeComplete={async (region, details) => {
              setIsMapMoving(false);
              setPickupLat(region.latitude);
              setPickupLng(region.longitude);
              
              if (details?.isGesture) {
                setSelectedSpotId(null);
              }
              
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${region.latitude}&lon=${region.longitude}&format=json`);
                const data = await res.json();
                if (data && data.display_name) {
                  const parts = data.display_name.split(",");
                  setReverseAddress(parts.slice(0, 3).join(","));
                }
              } catch (e) { }
            }}
          >
            {spots.map((spot) => {
              const isSelected = spot.id === selectedSpotId;
              return (
                <Marker
                  key={spot.id}
                  coordinate={{ latitude: spot.lat, longitude: spot.lng }}
                  onPress={() => {
                    setSelectedSpotId(spot.id);
                    setPickupLat(spot.lat);
                    setPickupLng(spot.lng);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Center the map onto the spot so the fixed pin matches it!
                    mapRef.current?.animateToRegion({
                      latitude: spot.lat, longitude: spot.lng,
                      latitudeDelta: 0.003, longitudeDelta: 0.003,
                    }, 400);
                  }}
                  style={{ zIndex: 1 }}
                >
                  <View style={st.markerDotOutline}>
                    <View style={st.markerDotInner} />
                  </View>
                </Marker>
              );
            })}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, st.webPlaceholder]}>
            <MaterialCommunityIcons name="map" size={64} color={Colors.mediumGrey} />
            <Text style={st.webText}>Map view (mobile only)</Text>
          </View>
        )}

        {/* ═══ FIXED CENTER MARKER ═══ */}
        <View style={st.centerMarkerContainer} pointerEvents="none">
          <Animated.View style={[st.tooltip, isMapMoving && { transform: [{ translateY: -10 }], shadowOpacity: 0.4 }]}>
            <Text style={st.tooltipText}>Pickup</Text>
            <View style={st.tooltipDot} />
          </Animated.View>
          <View style={st.centerMarkerLine} />
          <View style={st.centerMarkerDot} />
        </View>



        {/* Top Search Bar */}
        <View style={[st.topSearchWrap, { top: insets.top + 12 }]}>
          <Pressable style={st.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark} />
          </Pressable>
          <Pressable 
            style={st.topSearchInput}
            onPress={() => router.push("/search" as any)}
          >
            <View style={st.searchDot} />
            <Text style={st.topSearchText} numberOfLines={1}>
              {reverseAddress || "Search pickup location"}
            </Text>
          </Pressable>
        </View>

        <Pressable style={[st.fab, st.fabDark, { top: insets.top + 12, right: 16 }]}>
          <MaterialCommunityIcons name="layers-outline" size={20} color="#FFF" />
        </Pressable>

        <Pressable style={[st.fab, { bottom: 16, right: 16 }]} onPress={handleRecenter}>
          <MaterialCommunityIcons name="crosshairs-gps" size={22} color="#3B82F6" />
        </Pressable>

        <Pressable style={[st.fab, { bottom: 16, right: 72 }]}>
          <MaterialCommunityIcons name="plus" size={18} color={Colors.dark} />
          <MaterialCommunityIcons name="crosshairs" size={14} color={Colors.dark} style={{ position: "absolute", bottom: 8, right: 8 }} />
        </Pressable>
      </View>

      {/* ═══ BOTTOM SHEET ═════════════════════════════════════════ */}
      <View style={[st.sheet, { paddingBottom: Platform.OS === "web" ? 24 : Math.max(insets.bottom, 16) }]}>
        {/* Header */}
        <View style={st.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={st.sheetTitle}>Confirm pickup spot</Text>
            {reverseAddress ? (
              <Text style={st.sheetSubtitle} numberOfLines={1}>{reverseAddress}</Text>
            ) : null}
          </View>
          <Pressable style={st.searchBtn} onPress={() => router.push("/search" as any)}>
            <Ionicons name="search" size={20} color={Colors.dark} />
          </Pressable>
        </View>

        {/* Spot list */}
        {isLoading ? (
          <SkeletonSpots />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 220, marginTop: 8 }}>
            {spots.map((spot) => {
              const isSelected = spot.id === selectedSpotId;
              return (
                <Pressable
                  key={spot.id}
                  style={[st.spotCard, isSelected && st.spotCardSelected]}
                  onPress={() => {
                    setSelectedSpotId(spot.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Animate map to spot
                    mapRef.current?.animateToRegion({
                      latitude: spot.lat, longitude: spot.lng,
                      latitudeDelta: 0.003, longitudeDelta: 0.003,
                    }, 400);
                  }}
                >
                  <View style={st.spotIconBox}>
                    <MaterialCommunityIcons name="map-marker" size={20} color={isSelected ? "#FFF" : "#6B7280"} />
                  </View>
                  <View style={st.spotTextBox}>
                    <View style={st.spotNameRow}>
                      <Text style={st.spotName} numberOfLines={1}>{spot.name}</Text>
                      {spot.previouslyUsed && (
                        <View style={st.prevBadge}>
                          <Text style={st.prevBadgeText}>Previously used</Text>
                        </View>
                      )}
                    </View>
                    <Text style={st.spotAddress} numberOfLines={1}>{spot.address}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* CTA */}
        <Pressable
          style={[st.ctaBtn, isLoading && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={isLoading}
        >
          <Text style={st.ctaBtnText}>Confirm pickup</Text>
        </Pressable>
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
  fabDark: { backgroundColor: Colors.dark },

  // Top Search Bar
  topSearchWrap: {
    position: "absolute", left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 12, zIndex: 10,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  topSearchInput: {
    flex: 1, height: 44, backgroundColor: Colors.white, borderRadius: 22,
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, gap: 10,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4,
  },
  searchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark },
  topSearchText: { flex: 1, fontSize: 14, fontFamily: "Poppins_500Medium", color: Colors.dark },

  // Center Fixed Marker
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -60 }], // adjust to point exactly at center
    alignItems: 'center',
    width: 80,
  },
  centerMarkerLine: {
    width: 2, height: 16, backgroundColor: Colors.dark,
  },
  centerMarkerDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.dark,
  },

  // Markers
  markerWrap: { alignItems: "center", justifyContent: "center" },
  tooltip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.dark, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  tooltipText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.white },
  tooltipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#3B82F6" },
  markerDotOutline: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.white, borderWidth: 4, borderColor: Colors.dark,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  markerDotInner: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "transparent",
  },

  // Sheet
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 24,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10,
  },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  sheetTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", color: Colors.dark },
  sheetSubtitle: { fontSize: 14, fontFamily: "Poppins_500Medium", color: Colors.grey, marginTop: 4 },
  searchBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceMuted,
    alignItems: "center", justifyContent: "center",
  },

  // Spot cards
  spotCard: {
    flexDirection: "row", alignItems: "center", gap: 16,
    paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 16, marginBottom: 8,
    borderWidth: 1.5, borderColor: "transparent",
    backgroundColor: Colors.white,
  },
  spotCardSelected: { borderColor: Colors.dark, backgroundColor: Colors.surfaceMuted },
  spotIconBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surfaceMuted,
    alignItems: "center", justifyContent: "center",
  },
  spotTextBox: { flex: 1 },
  spotNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  spotName: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  prevBadge: {
    backgroundColor: Colors.info + "15", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  prevBadgeText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: Colors.info },
  spotAddress: { fontSize: 13, fontFamily: "Poppins_500Medium", color: Colors.grey, marginTop: 4 },

  // CTA
  ctaBtn: {
    backgroundColor: Colors.dark, borderRadius: 16, height: 60,
    alignItems: "center", justifyContent: "center", marginTop: 16,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  ctaBtnText: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.white },
});
