import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView, StatusBar,
  Platform, Animated, Easing, Image
} from "react-native";
import { router } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";
import { useFareCalculator, VehicleOption } from "@/hooks/useFareCalculator";
import { customMapStyle } from "@/constants/mapStyle";
import { LinearGradient } from "expo-linear-gradient";
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from "@gorhom/bottom-sheet";

// ─── Skeleton shimmer ────────────────────────────────────────────────
function Shimmer({ w, h, r = 6, style }: { w: number | string; h: number; r?: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 800, easing: Easing.ease, useNativeDriver: true }),
    ])).start();
  }, [anim]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.4] });
  return <Animated.View style={[{ width: w as any, height: h, borderRadius: r, backgroundColor: "#D1D5DB", opacity }, style]} />;
}

function SkeletonCards() {
  return (
    <View style={{ gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={s.skeletonCard}>
          <Shimmer w={64} h={64} r={20} />
          <View style={{ flex: 1, gap: 8, marginLeft: 16 }}>
            <Shimmer w="70%" h={16} />
            <Shimmer w="40%" h={12} />
          </View>
          <Shimmer w={60} h={24} r={12} />
        </View>
      ))}
    </View>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────
function ProgressBar() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: false })).start();
  }, [anim]);
  const left = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "80%"] });
  return (
    <View style={s.progressTrack}>
      <Animated.View style={[s.progressFill, { left, width: "20%" }]} />
    </View>
  );
}

// ─── Vehicle icon ────────────────────────────────────────────────────
function VehicleIcon({ item, size = 32 }: { item: VehicleOption; size?: number }) {
  if (item.useCustomImage) {
    const imageSource =
      item.id === "auto"
        ? require("@/assets/images/auto-logo.png")
        : item.id === "parcel-bike"
        ? require("@/assets/images/parcel-icon.png")
        : item.id === "bike-saver"
        ? require("@/assets/images/bike-saver.png")
        : item.id === "scooty"
        ? require("@/assets/images/scooty.png")
        : require("@/assets/images/she-bike-icon.png");
    return (
      <Image 
        source={imageSource}
        style={{ width: size + 16, height: size + 16 }}
        resizeMode="contain"
      />
    );
  }

  const c = "#111827";
  if (item.iconSet === "MaterialCommunityIcons") return <MaterialCommunityIcons name={item.icon as any} size={size} color={c} />;
  return <Ionicons name={item.icon as any} size={size} color={c} />;
}

// ═════════════════════════════════════════════════════════════════════
export default function RideMapScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop, setSelectedVehicle, setFare, setRouteDetails } = useBooking();
  const [selectedId, setSelectedId] = useState("bike-saver");
  const mapRef = useRef<MapView>(null);

  const pickupCoords = useMemo(() => (pickup?.lat && pickup?.lng ? { latitude: pickup.lat, longitude: pickup.lng } : null), [pickup]);
  const destCoords = useMemo(() => (drop?.lat && drop?.lng ? { latitude: drop.lat, longitude: drop.lng } : null), [drop]);

  const { vehicles, directions, isLoading } = useFareCalculator(pickupCoords, destCoords);
  const selected = vehicles.find((v) => v.id === selectedId) ?? vehicles[0];

  const nearbyVehicles = useMemo(() => {
    if (!pickupCoords || !selected) return [];
    // Generate 4-6 random markers around pickupCoords to simulate nearby vehicles
    const count = 4 + Math.floor(Math.random() * 3);
    return Array.from({ length: count }).map((_, i) => ({
      id: `${selected.id}-${i}`,
      latitude: pickupCoords.latitude + (Math.random() - 0.5) * 0.012,
      longitude: pickupCoords.longitude + (Math.random() - 0.5) * 0.012,
      rotation: Math.random() * 360,
    }));
  }, [pickupCoords, selected]);

  useEffect(() => {
    if (!directions?.polyline?.length || !mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(directions.polyline, {
        edgePadding: { top: 120, right: 60, bottom: 420, left: 60 },
        animated: true,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [directions]);

  const etaTime = useMemo(() => {
    if (!selected) return "";
    const now = new Date();
    now.setMinutes(now.getMinutes() + selected.eta);
    return now.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
  }, [selected]);

  const handleChoose = () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedVehicle(selected.id);
    setFare(selected.fare);
    if (directions) {
      setRouteDetails({ distanceMeters: directions.distanceMeters, durationSeconds: directions.durationSeconds });
    }
    if (selected.id === "parcel-bike" || selected.id === "parcel") {
      router.push("/review-delivery" as any);
    } else {
      router.push("/confirm-pickup");
    }
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ═══ MAP ═══════════════════════════════════════════════════ */}
      <View style={s.mapWrap}>
        {Platform.OS !== "web" ? (
          <MapView userInterfaceStyle="light"
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: pickupCoords?.latitude ?? 17.385,
              longitude: pickupCoords?.longitude ?? 78.4867,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            customMapStyle={customMapStyle}
            showsCompass={false}
          >
            {directions?.polyline && pickupCoords && destCoords && (
              <Polyline coordinates={[pickupCoords, ...directions.polyline, destCoords]} strokeWidth={5} strokeColor="#4F46E5" />
            )}
            
            {pickupCoords && (
              <Marker coordinate={pickupCoords} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
                <View style={s.markerPickup}>
                  <View style={s.markerPickupInner} />
                </View>
              </Marker>
            )}

            {pickupCoords && (
              <Marker coordinate={pickupCoords} anchor={{ x: 0.5, y: 1.2 }} style={{ zIndex: 20 }}>
                <Pressable style={s.tooltipContainer} onPress={() => router.push("/search" as any)}>
                  <View style={s.tooltipBox}>
                    <Text style={s.tooltipText} numberOfLines={1}>{pickup?.name || "Pickup"}</Text>
                  </View>
                  <View style={s.tooltipArrow} />
                </Pressable>
              </Marker>
            )}
            
            {destCoords && (
              <Marker coordinate={destCoords} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
                <View style={s.markerDrop}>
                   <Ionicons name="location" size={16} color="#FFF" />
                </View>
              </Marker>
            )}

            {destCoords && (
              <Marker coordinate={destCoords} anchor={{ x: 0.5, y: 1.2 }} style={{ zIndex: 20 }}>
                <Pressable style={s.tooltipContainer} onPress={() => router.push("/search" as any)}>
                  <View style={s.tooltipBoxDest}>
                    <Text style={s.tooltipTextDest} numberOfLines={1}>{drop?.name || "Destination"}</Text>
                  </View>
                  <View style={s.tooltipArrowDest} />
                </Pressable>
              </Marker>
            )}

            {nearbyVehicles.map(v => (
              <Marker key={v.id} coordinate={v} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 5 }}>
                <View style={[s.vehicleMarker, { transform: [{ rotate: `${v.rotation}deg` }] }]}>
                  <VehicleIcon item={selected} size={20} />
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, s.webPlaceholder]}>
            <MaterialCommunityIcons name="map" size={64} color="#D1D5DB" />
            <Text style={s.webText}>Map view is mobile only</Text>
          </View>
        )}

        <View style={[s.topControls, { top: insets.top + 16 }]}>
          <Pressable style={({ pressed }) => [s.floatingBtn, pressed && { opacity: 0.7 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
        </View>
      </View>

      {/* ═══ BOTTOM SHEET ═════════════════════════════════════════ */}
      <BottomSheet
        snapPoints={["50%", "90%"]}
        index={0}
        handleIndicatorStyle={{ backgroundColor: "#E5E7EB", width: 40, height: 5 }}
        backgroundStyle={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 20 }}
      >
        <BottomSheetView style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 24) }}>
        {isLoading ? (
          <>
            <Text style={s.sheetTitle}>Finding rides for you...</Text>
            <ProgressBar />
            <View style={{ height: 20 }} />
            <SkeletonCards />
          </>
        ) : (
          <>
            <Text style={s.sheetTitle}>Choose a ride</Text>

            <BottomSheetScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, marginTop: 12 }}>
              {vehicles.map((v) => {
                const isSelected = v.id === selectedId;
                return (
                  <Pressable
                    key={v.id}
                    style={[s.vehicleCard, isSelected && s.vehicleCardSelected]}
                    onPress={() => { setSelectedId(v.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  >
                    <View style={[s.vehicleIconBox, isSelected && s.vehicleIconBoxSelected]}>
                      <VehicleIcon item={v} />
                    </View>
                    <View style={s.vehicleInfo}>
                      <View style={s.vehicleNameRow}>
                        <Text style={s.vehicleName}>{v.name}</Text>
                        {v.capacity > 1 && (
                          <View style={s.capacityBadge}>
                            <Ionicons name="person" size={10} color="#6B7280" />
                            <Text style={s.capacityText}>{v.capacity}</Text>
                          </View>
                        )}
                        {v.isFastest && (
                          <View style={s.fastBadge}>
                            <Ionicons name="flash" size={10} color="#4F46E5" />
                            <Text style={s.fastBadgeText}>Fastest</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.vehicleEta}>{etaTime} • {v.eta} min away</Text>
                    </View>
                    <View style={s.fareCol}>
                      {v.hasDiscount && <View style={s.discountTag}><Text style={s.discountText}>SAVE</Text></View>}
                      <Text style={s.fareText}>₹{v.fare.toFixed(0)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </BottomSheetScrollView>

            <View style={s.promoBanner}>
              <LinearGradient colors={['#FDF4FF', '#FCE7F3']} style={StyleSheet.absoluteFill} />
              <MaterialCommunityIcons name="star-shooting" size={24} color="#DB2777" />
              <Text style={s.promoText} numberOfLines={1}>Earn 10% back on every ride with Pro.</Text>
              <Ionicons name="chevron-forward" size={20} color="#DB2777" />
            </View>

            <Pressable style={s.paymentRow}>
              <View style={s.cashIcon}>
                <Ionicons name="cash" size={20} color="#10B981" />
              </View>
              <Text style={s.paymentText}>Cash Payment</Text>
              <Text style={s.paymentChange}>Change</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>

            <View style={s.ctaRow}>
              <Pressable style={s.ctaBtn} onPress={handleChoose}>
                <LinearGradient colors={['#4F46E5', '#4338CA']} style={s.ctaGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Text style={s.ctaBtnText}>Confirm {selected?.name ?? "Ride"}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </LinearGradient>
              </Pressable>
              <Pressable style={s.scheduleBtn}>
                <Ionicons name="time" size={24} color="#111827" />
              </Pressable>
            </View>
          </>
        )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  mapWrap: { flex: 1, backgroundColor: "#F3F4F6" },
  webPlaceholder: { alignItems: "center", justifyContent: "center", gap: 16 },
  webText: { fontSize: 16, fontFamily: "Poppins_500Medium", color: "#9CA3AF" },
  
  topControls: { position: "absolute", left: 24, right: 24, flexDirection: "row" },
  floatingBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 6 },
  
  // Custom Map Markers
  markerPickup: { width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(79, 70, 229, 0.2)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFFFFF" },
  markerPickupInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#4F46E5" },
  markerDrop: { width: 28, height: 28, borderRadius: 8, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, borderWidth: 2, borderColor: "#FFFFFF" },
  vehicleMarker: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3, borderWidth: 1, borderColor: "#F3F4F6" },
  
  tooltipContainer: { alignItems: "center", paddingBottom: 6 },
  tooltipBox: { backgroundColor: "#FFFFFF", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 6, maxWidth: 180 },
  tooltipArrow: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#FFFFFF" },
  tooltipText: { color: "#111827", fontSize: 13, fontFamily: "Poppins_600SemiBold", textAlign: "center" },
  
  tooltipBoxDest: { backgroundColor: "#111827", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6, maxWidth: 180 },
  tooltipArrowDest: { width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 8, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: "#111827" },
  tooltipTextDest: { color: "#FFFFFF", fontSize: 13, fontFamily: "Poppins_600SemiBold", textAlign: "center" },

  // Bottom Sheet
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 12, shadowColor: "#000", shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 20 },
  sheetHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", color: "#111827", marginBottom: 12 },

  // Progress Bar
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#EEF2FF", overflow: "hidden", marginBottom: 12 },
  progressFill: { position: "absolute", top: 0, bottom: 0, borderRadius: 3, backgroundColor: "#4F46E5" },

  // Skeleton
  skeletonCard: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },

  // Vehicle Cards
  vehicleCard: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, borderRadius: 24, marginBottom: 12, borderWidth: 1.5, borderColor: "transparent", backgroundColor: "#FFFFFF", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.02, shadowRadius: 8 },
  vehicleCardSelected: { borderColor: "#4F46E5", backgroundColor: "#F8FAFC", shadowOpacity: 0.06 },
  vehicleIconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginRight: 16 },
  vehicleIconBoxSelected: { backgroundColor: "#EEF2FF" },
  vehicleInfo: { flex: 1 },
  vehicleNameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 },
  vehicleName: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#111827" },
  capacityBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#E5E7EB", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  capacityText: { fontSize: 11, fontFamily: "Poppins_600SemiBold", color: "#4B5563" },
  fastBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF2FF", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  fastBadgeText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: "#4F46E5" },
  vehicleEta: { fontSize: 13, fontFamily: "Poppins_500Medium", color: "#6B7280" },
  fareCol: { alignItems: "flex-end" },
  fareText: { fontSize: 20, fontFamily: "Poppins_700Bold", color: "#111827" },
  discountTag: { backgroundColor: "#EF4444", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  discountText: { fontSize: 10, fontFamily: "Poppins_700Bold", color: "#FFFFFF" },

  // Promo
  promoBanner: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 16, marginTop: 12, overflow: "hidden", borderWidth: 1, borderColor: "#FBCFE8" },
  promoText: { flex: 1, fontSize: 14, fontFamily: "Poppins_600SemiBold", color: "#BE185D", zIndex: 1 },

  // Payment
  paymentRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 18, borderTopWidth: 1, borderTopColor: "#F3F4F6", marginTop: 16 },
  cashIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center" },
  paymentText: { flex: 1, fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#111827" },
  paymentChange: { fontSize: 14, fontFamily: "Poppins_500Medium", color: "#4F46E5", marginRight: 4 },

  // CTA
  ctaRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  ctaBtn: { flex: 1, borderRadius: 20, overflow: "hidden", shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  ctaGradient: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  ctaBtnText: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#FFFFFF" },
  scheduleBtn: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
});
