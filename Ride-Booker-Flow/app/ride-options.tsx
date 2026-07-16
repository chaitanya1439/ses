import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  StatusBar,
  Modal,
  Platform,
  Animated as RNAnimated,
  Image,
} from "react-native";
import { router } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { useRequestRide } from "@/hooks/useRequestRide";
import { vehicleOptions } from "@/constants/mockData";
import { fetchDirectionsWithDetails } from "@/lib/googleMaps";
import { customMapStyle } from "@/constants/mapStyle";
import { BikeIcon, ScootyIcon, SheBikeIcon, ParcelIcon } from "@/components/VehicleIcons";

export default function RideOptionsScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop, selectedVehicle, setSelectedVehicle, setFare, setRouteDetails } = useBooking();
  const { user } = useAuth();
  const { requestRide } = useRequestRide({ 
    token: user?.token ?? "" 
  });
  const { sendThrottledMessage } = useSocket();
  const [upsellVisible, setUpsellVisible] = useState(false);
  const [upsellTimer, setUpsellTimer] = useState(10);
  const upsellRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const upsellInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const upsellOpacity = useRef(new RNAnimated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeDetailsLocal, setRouteDetailsLocal] = useState<{ distanceMeters: number; durationSeconds: number } | null>(null);

  const pickupCoord = useMemo(
    () => ({
      latitude: pickup?.lat ?? 17.385,
      longitude: pickup?.lng ?? 78.4867,
    }),
    [pickup?.lat, pickup?.lng],
  );
  const dropCoord = useMemo(
    () => ({
      latitude: drop?.lat ?? 17.426,
      longitude: drop?.lng ?? 78.4601,
    }),
    [drop?.lat, drop?.lng],
  );

  const mapRegion = {
    latitude: (pickupCoord.latitude + dropCoord.latitude) / 2,
    longitude: (pickupCoord.longitude + dropCoord.longitude) / 2,
    latitudeDelta:
      Math.abs(pickupCoord.latitude - dropCoord.latitude) * 1.8 + 0.01,
    longitudeDelta:
      Math.abs(pickupCoord.longitude - dropCoord.longitude) * 1.8 + 0.01,
  };

  const dynamicVehicleOptions = useMemo(() => {
    if (!routeDetailsLocal) return vehicleOptions;
    const distanceKm = routeDetailsLocal.distanceMeters / 1000;
    const durationMin = Math.ceil(routeDetailsLocal.durationSeconds / 60);

    return vehicleOptions.map(v => {
      let baseFare = 0;
      let perKm = 0;
      let perMin = 0;

      if (v.id === 'bike' || v.id === 'she-bike') { baseFare = 20; perKm = 8; perMin = 1; }
      else if (v.id === 'scooty') { baseFare = 25; perKm = 9; perMin = 1.2; }
      else if (v.id === 'auto') { baseFare = 30; perKm = 12; perMin = 1.5; }
      else if (v.id === 'parcel') { baseFare = 40; perKm = 15; perMin = 0; }

      const fare = Math.round(baseFare + (distanceKm * perKm) + (durationMin * perMin));
      
      const dropTime = new Date(Date.now() + durationMin * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
      const etaMin = Math.floor(Math.random() * 3) + 2; // Random 2-4 mins for driver ETA

      return {
        ...v,
        fare,
        dropTime,
        eta: `${etaMin} mins away`,
      };
    });
  }, [routeDetailsLocal]);

  const selectedOption = dynamicVehicleOptions.find((v) => v.id === selectedVehicle);

  // Pulse animation for markers
  const pulseAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Fetch road-following polyline and details
  useEffect(() => {
    (async () => {
      const details = await fetchDirectionsWithDetails(pickupCoord, dropCoord);
      if (details) {
        // Guarantee the polyline directly connects the exact marker dots without gaps
        const fullRoute = [pickupCoord, ...details.polyline, dropCoord];
        setRouteCoords(fullRoute);
        setRouteDetailsLocal({ distanceMeters: details.distanceMeters, durationSeconds: details.durationSeconds });
        // Also store in BookingContext for downstream screens
        setRouteDetails({ distanceMeters: details.distanceMeters, durationSeconds: details.durationSeconds });
        
        // Fit map to show the full route
        if (mapRef.current && details.polyline.length > 1) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(details.polyline, {
              edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
              animated: true,
            });
          }, 500);
        }
      } else {
        // Fallback if API fails
        setRouteCoords([pickupCoord, dropCoord]);
      }
    })();
  }, [dropCoord, pickupCoord]);

  const showUpsell = () => {
    setUpsellVisible(true);
    setUpsellTimer(10);
    RNAnimated.timing(upsellOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    upsellInterval.current = setInterval(() => {
      setUpsellTimer((t) => {
        if (t <= 1) {
          dismissUpsell();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const dismissUpsell = () => {
    if (upsellInterval.current) clearInterval(upsellInterval.current);
    RNAnimated.timing(upsellOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setUpsellVisible(false);
    });
  };

  const handleBook = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Store fare in BookingContext for downstream screens
    if (selectedOption?.fare) {
      setFare(selectedOption.fare);
    }
    if (selectedVehicle === "bike" || selectedVehicle === "bike-saver") {
      showUpsell();
    } else if (selectedVehicle === "parcel") {
      router.push("/review-delivery" as any);
    } else {
      // We just route to confirm-pickup. The actual request happens there.
      router.push("/confirm-pickup" as any);
    }
  };

  const handleContinueBike = async () => {
    dismissUpsell();
    if (selectedOption?.fare) setFare(selectedOption.fare);
    router.push("/confirm-pickup" as any);
  };

  const handleTryScooty = async () => {
    setSelectedVehicle("scooty");
    dismissUpsell();
    const scootyFare = dynamicVehicleOptions.find(v => v.id === "scooty")?.fare ?? 56;
    setFare(scootyFare);
    router.push("/confirm-pickup" as any);
  };

  useEffect(() => {
    const currentUpsellTimeout = upsellRef.current;
    return () => {
      if (currentUpsellTimeout) clearTimeout(currentUpsellTimeout);
      if (upsellInterval.current) clearInterval(upsellInterval.current);
    };
  }, []);

  const [dummyVehicles, setDummyVehicles] = useState<{id: string; latitude: number; longitude: number}[]>([]);

  useEffect(() => {
    // Determine vehicle count based on type
    const count = selectedVehicle === 'auto' ? 4 : selectedVehicle === 'car' ? 3 : 6;
    
    // Generate initial spots around pickup
    const initial = Array.from({ length: count }).map((_, i) => ({
      id: `dummy-${selectedVehicle}-${i}`,
      latitude: pickupCoord.latitude + (Math.random() - 0.5) * 0.015,
      longitude: pickupCoord.longitude + (Math.random() - 0.5) * 0.015,
    }));
    setDummyVehicles(initial);

    // Make them slowly drift
    const interval = setInterval(() => {
      setDummyVehicles(prev => prev.map(v => ({
        ...v,
        latitude: v.latitude + (Math.random() - 0.5) * 0.0006,
        longitude: v.longitude + (Math.random() - 0.5) * 0.0006,
      })));
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedVehicle, pickupCoord.latitude, pickupCoord.longitude]);

  const renderVehicleIcon = (size = 18, color = Colors.dark) => {
    if (selectedVehicle === "scooty") return <ScootyIcon width={size} height={size} />;
    if (selectedVehicle === "she-bike") return <SheBikeIcon width={size} height={size} />;
    if (selectedVehicle === "parcel") return <ParcelIcon width={size} height={size} />;
    return <BikeIcon width={size} height={size} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map (40% height) */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: pickupCoord.latitude,
              longitude: pickupCoord.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            customMapStyle={customMapStyle}
            showsCompass={false}
          >
            {routeCoords.length > 0 && (
              <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor={Colors.dark} />
            )}
            
            {/* Pickup Marker Dot */}
            <Marker coordinate={pickupCoord} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 19 }}>
              <View style={styles.groundDotPickup} />
            </Marker>
            
            {/* Pickup Marker Label */}
            <Marker coordinate={pickupCoord} anchor={{ x: 0.5, y: 1 }} style={{ zIndex: 20 }}>
              <Pressable style={styles.labelOnlyWrapper} onPress={() => router.push("/search" as any)}>
                <View style={styles.labelContainer}>
                  <Text style={styles.labelText} numberOfLines={1}>{pickup?.name || "Pickup"}</Text>
                </View>
                <View style={styles.triangleDown} />
                <View style={{ height: 10 }} /> {/* Spacer to align triangle tip right above the ground dot */}
              </Pressable>
            </Marker>
            
            {/* Drop Marker Dot */}
            <Marker coordinate={dropCoord} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 9 }}>
              <View style={styles.groundSquareDrop}>
                <View style={styles.groundSquareDropInner} />
              </View>
            </Marker>

            {/* Drop Marker Label */}
            <Marker coordinate={dropCoord} anchor={{ x: 0.5, y: 1 }} style={{ zIndex: 10 }}>
              <Pressable style={styles.labelOnlyWrapper} onPress={() => router.push("/search" as any)}>
                <View style={styles.labelContainerDrop}>
                  <Text style={styles.labelTextDrop} numberOfLines={1}>{drop?.name || "Destination"}</Text>
                </View>
                <View style={styles.triangleDownDrop} />
                <View style={{ height: 10 }} /> {/* Spacer to align triangle tip right above the ground dot */}
              </Pressable>
            </Marker>

            {/* Drifting Real-time Vehicles */}
            {dummyVehicles.map((v) => (
              <Marker key={v.id} coordinate={v} zIndex={5}>
                <View style={[styles.driverMarkerUber, { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.dark }]}>
                  {renderVehicleIcon(20, Colors.dark)}
                </View>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webMapPlaceholder]}>
            <MaterialCommunityIcons name="map" size={48} color={Colors.mediumGrey} />
          </View>
        )}

        <Pressable
          style={[styles.floatingBack, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      {/* Vehicle Options */}
      <View style={styles.optionsContainer}>
        <FlatList
          data={dynamicVehicleOptions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <VehicleRow
              item={item}
              isSelected={selectedVehicle === item.id}
              onSelect={() => {
                setSelectedVehicle(item.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.vehicleSeparator} />}
        />

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.footerActions}>
            <Pressable style={styles.footerBtn}>
              <Ionicons name="card-outline" size={18} color={Colors.dark} />
              <Text style={styles.footerBtnText}>Cash</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.grey} />
            </Pressable>
            <View style={styles.footerDivider} />
            <Pressable style={styles.footerBtn}>
              <MaterialCommunityIcons
                name="tag-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={[styles.footerBtnText, { color: Colors.primary }]}>
                Offers
              </Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.bookBtn,
              pressed && styles.pressedSurface,
            ]}
            onPress={handleBook}
          >
            <Text style={styles.bookBtnText}>
              Book {selectedOption?.name ?? "Ride"}
            </Text>
            <Text style={styles.bookBtnFare}>
              ₹{selectedOption?.fare ?? 48}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Upsell Modal */}
      <Modal visible={upsellVisible} transparent animationType="none">
        <Pressable style={styles.overlay} onPress={dismissUpsell} />
        <RNAnimated.View
          style={[styles.upsellSheet, { opacity: upsellOpacity, paddingBottom: insets.bottom + 16 }]}
        >
          <View style={styles.upsellIllustration}>
            <MaterialCommunityIcons name="scooter" size={60} color={Colors.info} />
          </View>
          <Text style={styles.upsellTitle}>
            Need extra comfort and space?
          </Text>
          <Text style={styles.upsellSubtitle}>Try Scooty!</Text>
          <View style={styles.upsellDash} />
          <View style={styles.upsellBtns}>
            <Pressable
              style={styles.continueBikeBtn}
              onPress={handleContinueBike}
            >
              <Text style={styles.continueBikeBtnText}>
                Continue with Bike • ₹48
              </Text>
            </Pressable>
            <Pressable style={styles.tryScootyBtn} onPress={handleTryScooty}>
              <MaterialCommunityIcons name="scooter" size={18} color={Colors.dark} />
              <Text style={styles.tryScootyBtnText}>Try Scooty at ₹56</Text>
            </Pressable>
          </View>
          <Text style={styles.upsellTimer}>Auto-dismiss in {upsellTimer}s</Text>
        </RNAnimated.View>
      </Modal>
    </View>
  );
}

function VehicleRow({
  item,
  isSelected,
  onSelect,
}: {
  item: (typeof vehicleOptions)[0];
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[styles.vehicleRow, isSelected && styles.vehicleRowSelected]}
      onPress={onSelect}
    >
      <View style={styles.vehicleIcon}>
        {item.id === "scooty" ? (
          <ScootyIcon width={40} height={40} />
        ) : item.id === "she-bike" ? (
          <SheBikeIcon width={40} height={40} />
        ) : item.id === "parcel" ? (
          <ParcelIcon width={40} height={40} />
        ) : (
          <BikeIcon width={40} height={40} />
        )}
      </View>
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleNameRow}>
          <Text style={styles.vehicleName}>{item.name}</Text>
          <View style={styles.capacityBadge}>
            <Ionicons name="person" size={12} color={Colors.grey} />
            <Text style={styles.capacityText}>{item.capacity}</Text>
          </View>
        </View>
        <Text style={styles.vehicleTagline}>{item.tagline}</Text>
        <Text style={styles.vehicleEta}>
          {item.eta} · Drop {item.dropTime}
        </Text>
      </View>
      <Text style={styles.vehicleFare}>₹{item.fare}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  mapContainer: {
    height: "45%",
    backgroundColor: Colors.lightGrey,
  },
  webMapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBack: {
    position: "absolute",
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  optionsContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.white,
  },
  vehicleRowSelected: {
    backgroundColor: Colors.info + "10",
    borderWidth: 2,
    borderColor: Colors.info,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehicleName: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  capacityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  capacityText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.darkSecondary,
  },
  vehicleTagline: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
    marginTop: 4,
  },
  vehicleEta: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  vehicleFare: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  vehicleSeparator: {
    height: 1,
    backgroundColor: "transparent", // Removing separator lines for a cleaner look with cards
  },
  footer: {
    padding: 20,
    gap: 16,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 10,
  },
  footerActions: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.lightGrey,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  footerDivider: {
    width: 2,
    backgroundColor: Colors.white,
  },
  footerBtnText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  bookBtn: {
    backgroundColor: Colors.dark, // changed to dark for a more premium look
    borderRadius: 16,
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  pressedSurface: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  bookBtnText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  bookBtnFare: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.lightGrey,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)", // darker overlay
  },
  upsellSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    alignItems: "center",
  },
  upsellIllustration: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: Colors.info + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  upsellTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    textAlign: "center",
  },
  upsellSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
    marginBottom: 20,
  },
  upsellDash: {
    width: "100%",
    height: 1,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  upsellBtns: {
    width: "100%",
    gap: 12,
  },
  continueBikeBtn: {
    borderWidth: 2,
    borderColor: Colors.dark,
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
  continueBikeBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  tryScootyBtn: {
    backgroundColor: Colors.dark,
    borderRadius: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tryScootyBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  upsellTimer: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
    marginTop: 16,
  },
  // Professional Floating Pin Markers
  labelOnlyWrapper: {
    alignItems: "center",
  },
  labelContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 180,
  },
  labelText: {
    color: Colors.dark,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  triangleDown: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.white,
  },
  groundDotPickup: {
    width: 14, 
    height: 14, 
    borderRadius: 7, 
    backgroundColor: Colors.success, 
    borderWidth: 2, 
    borderColor: Colors.white, 
    shadowColor: Colors.black, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 3,
    elevation: 3,
  },
  labelContainerDrop: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 180,
  },
  labelTextDrop: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textAlign: "center",
  },
  triangleDownDrop: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.dark,
  },
  groundSquareDrop: {
    width: 14, 
    height: 14, 
    backgroundColor: Colors.danger, 
    alignItems: "center", 
    justifyContent: "center", 
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.black, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.2, 
    shadowRadius: 3,
    elevation: 3,
  },
  groundSquareDropInner: {
    width: 4, 
    height: 4, 
    backgroundColor: Colors.white 
  },
  driverMarkerUber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
