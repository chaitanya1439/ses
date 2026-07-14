import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
  Image,
  Animated as RNAnimated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";
import { useSocket } from "@/contexts/SocketContext";
import ChatModal from "@/components/ChatModal";
import ShareTripModal from "@/components/ShareTripModal";
import { mockDriver, vehicleOptions } from "@/constants/mockData";
import { fetchDirectionsPolyline } from "@/lib/googleMaps";
import { customMapStyle } from "@/constants/mapStyle";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BikeIcon, AutoIcon } from "@/components/VehicleIcons";

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STEPS = ["Driver arriving", "Ride started", "Reached destination"];
const ANIMATION_SPEED = 0.008; // 0–1 progress per frame between two coords
const CAMERA_UPDATE_INTERVAL = 10; // update camera every N frames

// ─── Dummy route (Hyderabad) for instant testing without Directions API ──────
const DUMMY_ROUTE: { latitude: number; longitude: number }[] = [
  { latitude: 17.3800, longitude: 78.4867 },
  { latitude: 17.3812, longitude: 78.4870 },
  { latitude: 17.3825, longitude: 78.4875 },
  { latitude: 17.3838, longitude: 78.4880 },
  { latitude: 17.3845, longitude: 78.4890 },
  { latitude: 17.3850, longitude: 78.4878 },
  { latitude: 17.3855, longitude: 78.4865 },
  { latitude: 17.3862, longitude: 78.4858 },
  { latitude: 17.3870, longitude: 78.4855 },
  { latitude: 17.3880, longitude: 78.4860 },
  { latitude: 17.3890, longitude: 78.4867 },
  { latitude: 17.3900, longitude: 78.4870 },
];

// ─── Utility: bearing between two GPS points (degrees) ──────────────────────

function getBearing(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLon = toRad(to.longitude - from.longitude);
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// ─── Utility: generate scattered dummy vehicles around a point ───────────────

function generateDummyVehicles(
  centerLat: number,
  centerLng: number,
  count: number
) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `dummy-${i}`,
    latitude: centerLat + (Math.random() - 0.5) * 0.012,
    longitude: centerLng + (Math.random() - 0.5) * 0.012,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BookingConfirmedScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop, selectedVehicle, clearBooking } = useBooking();
  const { subscribe, sendMessage } = useSocket();

  const params = useLocalSearchParams();
  const initPayloadStr = params.payload as string;
  const initPayload = useMemo(() => initPayloadStr ? JSON.parse(initPayloadStr) : null, [initPayloadStr]);

  // UI state
  const [isConfirmed, setIsConfirmed] = useState(!!initPayload);
  const [currentStep, setCurrentStep] = useState(0);
  const [canCancel, setCanCancel] = useState(true);
  const [etaRemaining, setEtaRemaining] = useState(5);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [driverDetails, setDriverDetails] = useState<{
    id?: string;
    name: string;
    rating: number;
    plateNumber: string;
    otp: string;
    lat?: number;
    lng?: number;
  } | null>(
    initPayload ? {
      id: initPayload.driverId || initPayload.driverName || 'driver',
      name: initPayload.driverName || (initPayload.driverId ? `Driver #${initPayload.driverId.substring(0,4)}` : "Your Driver"),
      rating: initPayload.rating || 4.9,
      plateNumber: initPayload.plate || "TG 09 A 1234",
      otp: initPayload.otp || "1234",
      lat: initPayload.driverLat,
      lng: initPayload.driverLng,
    } : null
  );
  
  const progressAnim = useRef(new RNAnimated.Value(0)).current;
  const mapRef = useRef<MapView>(null);

  // Route polylines
  const [driverToPickupCoords, setDriverToPickupCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [pickupToDropCoords, setPickupToDropCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  // Live driver position & heading
  const [driverCoord, setDriverCoord] = useState({
    latitude: pickup?.lat ? pickup.lat - 0.005 : 17.38,
    longitude: pickup?.lng ?? 78.4867,
  });
  const [driverHeading, setDriverHeading] = useState(0);

  // Dummy vehicles for searching phase
  const [dummyVehicles, setDummyVehicles] = useState<
    { id: string; latitude: number; longitude: number }[]
  >([]);

  // Animation refs (mutable, avoid stale closures)
  const animIdRef = useRef<number | null>(null);
  const liveAnimIdRef = useRef<number | null>(null);
  const indexRef = useRef(0);
  const progressRef = useRef(0);
  const frameCountRef = useRef(0);
  const routeRef = useRef<{ latitude: number; longitude: number }[]>([]);
  const isOtpVerifiedRef = useRef(isOtpVerified);
  const currentStepRef = useRef(currentStep);
  const [chatVisible, setChatVisible] = useState(false);
  const [shareVisible, setShareVisible] = useState(false);

  useEffect(() => {
    isOtpVerifiedRef.current = isOtpVerified;
    currentStepRef.current = currentStep;
  }, [isOtpVerified, currentStep]);

  const vehicle = vehicleOptions.find((v) => v.id === selectedVehicle);

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
  const initialDriverCoord = useMemo(
    () => ({
      latitude: driverDetails?.lat ?? pickupCoord.latitude - 0.005,
      longitude: driverDetails?.lng ?? pickupCoord.longitude,
    }),
    [pickupCoord, driverDetails],
  );
  const mapRegion = {
    latitude: (pickupCoord.latitude + dropCoord.latitude) / 2,
    longitude: (pickupCoord.longitude + dropCoord.longitude) / 2,
    latitudeDelta:
      Math.abs(pickupCoord.latitude - dropCoord.latitude) * 2 + 0.01,
    longitudeDelta:
      Math.abs(pickupCoord.longitude - dropCoord.longitude) * 2 + 0.01,
  };

  // ─── Animation loop ─────────────────────────────────────────────────────────

  const animateMarker = useCallback(
    (points: { latitude: number; longitude: number }[]) => {
      if (!points || points.length < 2) return;

      routeRef.current = [...points];
      indexRef.current = 0;
      progressRef.current = 0;

      const tick = () => {
        const route = routeRef.current;
        const idx = indexRef.current;

        if (idx >= route.length - 1) return; // reached end

        progressRef.current += ANIMATION_SPEED;

        if (progressRef.current >= 1) {
          // Snap to completed segment, advance index
          progressRef.current = 0;
          indexRef.current += 1;

          // ── Polyline trimming: slice off the coordinate we just passed ──
          const trimmed = route.slice(indexRef.current);
          routeRef.current = trimmed;
          indexRef.current = 0; // reset index relative to trimmed array
          setDriverToPickupCoords(trimmed);

          if (trimmed.length < 2) return; // done
        }

        const from = routeRef.current[indexRef.current];
        const to = routeRef.current[indexRef.current + 1];
        if (!from || !to) return;

        const p = progressRef.current;
        const lat = from.latitude + (to.latitude - from.latitude) * p;
        const lng = from.longitude + (to.longitude - from.longitude) * p;

        setDriverCoord({ latitude: lat, longitude: lng });
        setDriverHeading(getBearing(from, to));

        // Prepend the interpolated driver position to the polyline so there's
        // no visual gap between the marker and the remaining route line.
        setDriverToPickupCoords([{ latitude: lat, longitude: lng }, ...routeRef.current.slice(1)]);

        // Removed dynamic camera tracking to prevent map jumping

        animIdRef.current = requestAnimationFrame(tick);
      };

      animIdRef.current = requestAnimationFrame(tick);
    },
    [dropCoord, pickupCoord],
  );

  // Smooth animation for REAL GPS updates
  const animateLiveLocation = useCallback((newLoc: { lat: number; lng: number; heading?: number }) => {
    setDriverCoord(prevCoord => {
      if (liveAnimIdRef.current) {
        cancelAnimationFrame(liveAnimIdRef.current);
      }

      const startLat = prevCoord.latitude;
      const startLng = prevCoord.longitude;
      const endLat = newLoc.lat;
      const endLng = newLoc.lng;

      let startTime: number | null = null;
      const DURATION = 1000; // 1 second animation

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / DURATION, 1);

        // Ease out quad
        const easeProgress = progress * (2 - progress);

        const currentLat = startLat + (endLat - startLat) * easeProgress;
        const currentLng = startLng + (endLng - startLng) * easeProgress;

        setDriverCoord({ latitude: currentLat, longitude: currentLng });
        
        if (newLoc.heading != null) {
          setDriverHeading(newLoc.heading);
        } else {
          setDriverHeading(getBearing({ latitude: startLat, longitude: startLng }, { latitude: endLat, longitude: endLng }));
        }

        // --- Path Erasing Logic ---
        const activePolylineSetter = currentStepRef.current === 0 ? setDriverToPickupCoords : setPickupToDropCoords;
        
        activePolylineSetter(prevPoly => {
          if (!prevPoly || prevPoly.length < 2) return prevPoly;
          
          // Find closest point to erase passed path
          let minIndex = 0;
          let minDist = Infinity;
          for (let i = 0; i < Math.min(prevPoly.length, 15); i++) {
            const pt = prevPoly[i];
            const dist = Math.hypot(pt.latitude - currentLat, pt.longitude - currentLng);
            if (dist < minDist) {
              minDist = dist;
              minIndex = i;
            }
          }
          
          // Trim polyline and prepend current animated location to connect it seamlessly
          const newPolyline = [{ latitude: currentLat, longitude: currentLng }, ...prevPoly.slice(minIndex + 1)];
          return newPolyline.length > 1 ? newPolyline : prevPoly;
        });

        // Removed dynamic camera tracking to prevent map jumping

        if (progress < 1) {
          liveAnimIdRef.current = requestAnimationFrame(step);
        }
      };

      liveAnimIdRef.current = requestAnimationFrame(step);

      // Return prevCoord to immediately satisfy the state update, actual animation happens in loop
      return prevCoord;
    });
  }, [dropCoord, pickupCoord]);

  // ─── Fetch routes & kick off animation ───────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Show scattered dummy vehicles while "searching"
      setDummyVehicles(
        generateDummyVehicles(pickupCoord.latitude, pickupCoord.longitude, 4)
      );

      // Fetch real routes from Google Directions API
      const [driverRoute, rideRoute] = await Promise.all([
        fetchDirectionsPolyline(initialDriverCoord, pickupCoord),
        fetchDirectionsPolyline(pickupCoord, dropCoord),
      ]);

      if (cancelled) return;

      // If we already received payload via params, we can skip waiting and just use the route!
      if (initPayload) {
        setDriverToPickupCoords(driverRoute.length > 2 ? driverRoute : DUMMY_ROUTE);
        setPickupToDropCoords(rideRoute);
        animateMarker(driverRoute.length > 2 ? driverRoute : DUMMY_ROUTE);
        return;
      }

      // Use API route or fall back to dummy route for testing
      const finalDriverRoute =
        driverRoute.length > 2 ? driverRoute : DUMMY_ROUTE;

      setDriverToPickupCoords(finalDriverRoute);
      setPickupToDropCoords(rideRoute);

      // Fit map to show full route
      const allCoords = [...finalDriverRoute, ...rideRoute];
      if (mapRef.current && allCoords.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { top: 80, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }, 500);
      }

      // 🚀 Realtime Integration: Wait for the Driver to accept the ride via WebSocket
      const unsubscribe = subscribe('ride_accepted', (payload) => {
        if (cancelled) return;
        console.log("Ride accepted by driver!", payload);
        setDriverDetails({
          id: payload.driverId || payload.driverName || 'driver',
          name: payload.driverName || (payload.driverId ? `Driver #${payload.driverId.substring(0,4)}` : "Your Driver"),
          rating: payload.rating || 4.9,
          plateNumber: payload.plate || "TG 09 A 1234",
          otp: payload.otp || "1234",
          lat: payload.driverLat,
          lng: payload.driverLng,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsConfirmed(true);
        animateMarker(finalDriverRoute);
      });

      // 🚀 Realtime Integration: Listen for live roaming drivers
      const unsubNearby = subscribe('nearby_drivers', (drivers) => {
        if (cancelled) return;
        if (Array.isArray(drivers) && drivers.length > 0) {
          setDummyVehicles(drivers.map((d: any) => ({
            id: d.id,
            latitude: d.lat,
            longitude: d.lng
          })));
        }
      });

      // 🚀 Realtime Integration: Live driver location tracking
      // When a driver is on their way to pickup, receive their GPS position in real-time
      const unsubDriverLoc = subscribe('driver_location', (payload) => {
        if (cancelled) return;
        if (payload.location?.lat != null && payload.location?.lng != null) {
          // If confirmed, stop the dummy animation and use live location
          if (!cancelled) {
            setIsConfirmed(true);
            if (animIdRef.current) {
              cancelAnimationFrame(animIdRef.current);
              animIdRef.current = null;
            }
            
            // Trigger smooth animation and path erase
            animateLiveLocation(payload.location);
          }
        }
      });

      // Cleanup subscription if unmounted
      return () => {
        unsubscribe();
        unsubNearby();
        unsubDriverLoc();
      };
    })();

    return () => {
      cancelled = true;
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    };
  }, [animateMarker, dropCoord, initialDriverCoord, pickupCoord, subscribe]);

  // ─── ETA countdown & step progression ────────────────────────────────────────

  useEffect(() => {
    if (!isConfirmed) return;

    const etaInterval = setInterval(() => {
      setEtaRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(etaInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const cancelTimer = setTimeout(() => setCanCancel(false), 15000);

    // 🚀 Realtime Integration: Listen for the Driver's physical actions
    const unsubscribeStatus = subscribe('trip_status_changed', (payload) => {
      console.log('Driver changed trip status:', payload);
      
      if (payload.status === 'arrived' || payload.status === 'started') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        if (selectedVehicle !== 'parcel') {
          setIsOtpVerified(true);
        }
        
        setCurrentStep(1);
        RNAnimated.timing(progressAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: false,
        }).start();
      } else if (payload.status === 'completed') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrentStep(2);
        RNAnimated.timing(progressAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start();
        
        // Give them a moment to see the completed state, then redirect
        setTimeout(() => {
          clearBooking();
          router.replace("/rate-trip" as any);
        }, 3000);
      } else if (payload.status === 'cancelled') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert("Ride was cancelled by the driver.");
        clearBooking();
        router.replace("/(tabs)/home");
      }
    });

    return () => {
      clearInterval(etaInterval);
      clearTimeout(cancelTimer);
      unsubscribeStatus();
    };
  }, [clearBooking, isConfirmed, progressAnim, subscribe]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCancel = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const riderId = initPayload?.riderId || "rider-001";
    sendMessage("ride_cancel", { riderId, reason: 'cancelled_by_rider' });
    clearBooking();
    router.replace("/(tabs)/home");
  };

  const renderVehicleIcon = (size = 20, color = Colors.white) => {
    if (vehicle?.id === 'auto') {
      return <AutoIcon width={size} height={size} />;
    }
    if (vehicle?.id === 'bike' || vehicle?.id === 'bike-boost' || vehicle?.id === 'bike-metro') {
      return <BikeIcon width={size} height={size} />;
    }
    if ((vehicle as any)?.useCustomImage) {
      return (
        <Image
          source={require("@/assets/images/she-bike-icon.png")}
          style={{ width: size, height: size, borderRadius: 4 }}
          resizeMode="contain"
        />
      );
    }
    return (
      <MaterialCommunityIcons
        name={vehicle?.iconName ?? "motorbike"}
        size={size}
        color={color}
      />
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* ── Map ── */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={mapRegion}
            pitchEnabled={false}
            customMapStyle={customMapStyle}
            showsCompass={false}
          >
            {/* Pickup marker */}
            <Marker coordinate={pickupCoord} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 20 }}>
              <View style={styles.uberMarkerWrapper}>
                <View style={styles.uberPickupDot} />
                <View style={styles.uberPickupLabelAbsolute}>
                  <View style={styles.uberLabelTime}>
                    <Text style={styles.uberLabelTimeValue}>5</Text>
                    <Text style={styles.uberLabelTimeUnit}>MIN</Text>
                  </View>
                  <View style={styles.uberLabelAddress}>
                    <Text style={styles.uberLabelTitle} numberOfLines={1}>{pickup?.name || "Pickup Location"}</Text>
                    <Text style={styles.uberLabelSubtitle} numberOfLines={1}>{pickup?.address || "Address"}</Text>
                  </View>
                </View>
              </View>
            </Marker>

            {/* Drop marker */}
            <Marker coordinate={dropCoord} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
              <View style={styles.uberMarkerWrapper}>
                <View style={styles.uberDropSquare}>
                  <View style={styles.uberDropInnerSquare} />
                </View>
                <View style={styles.uberDropLabelAbsolute}>
                  <View style={styles.uberLabelAddress}>
                    <Text style={styles.uberLabelTitle} numberOfLines={1}>{drop?.name || "Destination"}</Text>
                    <Text style={styles.uberLabelSubtitle} numberOfLines={1}>{drop?.address || "Address"}</Text>
                  </View>
                </View>
              </View>
            </Marker>

            {/* Dummy vehicles during search phase */}
            {!isConfirmed &&
              dummyVehicles.map((v) => (
                <Marker key={v.id} coordinate={v} zIndex={1}>
                  <View style={[styles.driverMarker, { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.mediumGrey }]}>
                    {renderVehicleIcon(18, Colors.dark)}
                  </View>
                </Marker>
              ))}

            {/* Live driver marker with rotation */}
            {isConfirmed && (
              <Marker coordinate={driverCoord} zIndex={30} flat rotation={driverHeading} anchor={{ x: 0.5, y: 0.5 }}>
                {renderVehicleIcon(40, Colors.dark)}
              </Marker>
            )}

            {/* Driver → Pickup polyline */}
            {isConfirmed && driverToPickupCoords.length > 1 && (
              <Polyline coordinates={driverToPickupCoords} strokeColor={Colors.info} strokeWidth={5} />
            )}

            {/* Pickup → Drop polyline */}
            {pickupToDropCoords.length > 1 && (
              <Polyline coordinates={pickupToDropCoords} strokeColor={Colors.dark} strokeWidth={5} />
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

        {/* ETA badge */}
        {isConfirmed && (
          <View style={[styles.etaBadge, { top: insets.top + 12 }]}>
            <Ionicons name="timer-outline" size={16} color={Colors.dark} />
            <Text style={styles.etaText}>
              {etaRemaining > 0
                ? `${etaRemaining} min${etaRemaining !== 1 ? "s" : ""} away`
                : "Driver arrived"}
            </Text>
          </View>
        )}
      </View>

      {/* ── Unified Bottom Sheet ── */}
      <BottomSheet
        snapPoints={isConfirmed ? ["45%", "65%", "90%"] : ["30%"]}
        index={0}
        handleIndicatorStyle={{ backgroundColor: Colors.mediumGrey, width: 40 }}
        backgroundStyle={styles.bottomSheetBackground}
      >
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20 }}>
          {!isConfirmed ? (
            <View style={styles.searchingContainer}>
              <View style={styles.searchingIconBox}>
                <MaterialCommunityIcons
                  name="radar"
                  size={32}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.searchingTitle}>
                Looking for nearby drivers...
              </Text>
              <Text style={styles.searchingSubtitle}>
                Contacting {vehicle?.name ?? "drivers"} near your pickup point.
                This usually takes just a few seconds.
              </Text>
              <Pressable style={styles.cancelRequestBtn} onPress={handleCancel}>
                <Text style={styles.cancelRequestText}>Cancel Request</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Status steps */}
              <View style={styles.statusContainer}>
                {STATUS_STEPS.map((step, index) => (
                  <View key={step} style={styles.statusStep}>
                    <View
                      style={[
                        styles.statusDot,
                        index <= currentStep && styles.statusDotActive,
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusLabel,
                        index === currentStep && styles.statusLabelActive,
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.progressTrack}>
                <RNAnimated.View
                  style={[
                    styles.progressFill,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0%", "100%"],
                      }),
                    },
                  ]}
                />
              </View>

              {/* Driver card */}
              <View style={styles.driverCardUber}>
                <View style={styles.driverTopRow}>
                  <View style={styles.driverPhotoWrap}>
                    <View style={[styles.driverPhoto, styles.driverPhotoPlaceholder]}>
                      <Ionicons name="person" size={28} color="#9CA3AF" />
                    </View>
                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={10} color="#FFB800" />
                      <Text style={styles.ratingText}>{driverDetails?.rating || 4.9}</Text>
                    </View>
                  </View>
                  <View style={styles.vehicleImgBox}>
                     {renderVehicleIcon(36, Colors.dark)}
                  </View>
                  <View style={styles.driverInfoRight}>
                    <Text style={styles.plateLarge}>{driverDetails?.plateNumber || "TG 09 A 1234"}</Text>
                    <Text style={styles.vehicleName}>{vehicle?.name ?? "Honda Shine"}</Text>
                  </View>
                </View>
                <Text style={styles.driverNameLarge}>{driverDetails?.name?.toUpperCase() || "YOUR DRIVER"}</Text>
                
                <View style={styles.otpBanner}>
                  <Text style={styles.otpBannerLabel}>PIN for this ride</Text>
                  <Text style={styles.otpBannerValue}>{driverDetails?.otp || "1234"}</Text>
                </View>
              </View>

              {!isOtpVerified && selectedVehicle === 'parcel' && (
                <Pressable 
                  style={[styles.cancelRequestBtn, { backgroundColor: Colors.primary, marginBottom: 16 }]} 
                  onPress={() => setIsOtpVerified(true)}
                >
                  <Text style={[styles.cancelRequestText, { color: Colors.white }]}>Verify OTP & Start Trip</Text>
                </Pressable>
              )}

              {/* Action buttons */}
              <View style={styles.actionRowUber}>
                <Pressable
                  style={styles.msgBtnUber}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setChatVisible(true);
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={18} color={Colors.white} />
                  <Text style={styles.msgBtnTextUber}>Message</Text>
                </Pressable>
                <Pressable style={styles.iconBtnUber}>
                  <Ionicons name="call-outline" size={20} color={Colors.dark} />
                </Pressable>
                <Pressable style={styles.iconBtnUberSos}>
                  <Ionicons name="shield-outline" size={20} color={Colors.white} />
                  <Text style={styles.sosTextUber}>SOS</Text>
                </Pressable>
              </View>
              
              {/* Share Trip Status Button */}
              {isConfirmed && currentStep < 2 && (
                <Pressable 
                  style={[styles.cancelBtn, { marginTop: 12, backgroundColor: Colors.surfaceMuted, borderColor: Colors.border, borderWidth: 1, borderRadius: 14 }]} 
                  onPress={() => setShareVisible(true)}
                >
                  <Text style={[styles.cancelBtnText, { color: Colors.dark }]}>Share trip status</Text>
                </Pressable>
              )}

              {canCancel && (
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelBtnText}>Cancel Ride</Text>
                </Pressable>
              )}
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      <ChatModal 
        visible={chatVisible} 
        onClose={() => setChatVisible(false)} 
        targetId={driverDetails?.id || 'driver'} 
        driverName={driverDetails?.name} 
      />

      {shareVisible && (
        <ShareTripModal 
          visible={shareVisible} 
          onClose={() => setShareVisible(false)} 
        />
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  greenDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  redDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  etaBadge: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  etaText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  bottomSheetBackground: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  searchingContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  searchingIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  searchingTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 8,
  },
  searchingSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  cancelRequestBtn: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelRequestText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statusStep: {
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.mediumGrey,
  },
  statusDotActive: {
    backgroundColor: Colors.primary,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    textAlign: "center",
  },
  statusLabelActive: {
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.mediumGrey,
    borderRadius: 2,
    marginBottom: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  // Uber Styles
  uberMarkerWrapper: { width: 16, height: 16, alignItems: "center", justifyContent: "center", overflow: "visible" },
  uberPickupDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.dark, borderWidth: 2, borderColor: Colors.white, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  uberDropSquare: { width: 14, height: 14, backgroundColor: Colors.dark, alignItems: "center", justifyContent: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  uberDropInnerSquare: { width: 6, height: 6, backgroundColor: Colors.white },
  uberPickupLabelAbsolute: {
    position: "absolute", left: 24, top: -14, flexDirection: "row",
    backgroundColor: Colors.white, borderRadius: 4,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  uberDropLabelAbsolute: {
    position: "absolute", right: 24, top: -14, flexDirection: "row",
    backgroundColor: Colors.white, borderRadius: 4,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 5,
  },
  uberLabelTime: {
    backgroundColor: Colors.dark, borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4, alignItems: "center", justifyContent: "center",
  },
  uberLabelTimeValue: { color: Colors.white, fontSize: 12, fontFamily: "Poppins_700Bold", lineHeight: 14 },
  uberLabelTimeUnit: { color: Colors.white, fontSize: 8, fontFamily: "Poppins_600SemiBold", lineHeight: 10 },
  uberLabelAddress: {
    paddingHorizontal: 10, paddingVertical: 4, justifyContent: "center", minWidth: 100, maxWidth: 160,
  },
  uberLabelTitle: { color: Colors.dark, fontSize: 13, fontFamily: "Poppins_600SemiBold", lineHeight: 16 },
  uberLabelSubtitle: { color: Colors.grey, fontSize: 10, fontFamily: "Poppins_400Regular", lineHeight: 12 },
  uberDriverMarker: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark,
    alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: Colors.white,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  driverCardUber: {
    backgroundColor: Colors.white, borderRadius: 24, borderWidth: 1, borderColor: Colors.border,
    padding: 20, marginBottom: 16,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
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
  },
  ratingText: { fontSize: 11, fontFamily: "Poppins_700Bold", color: Colors.dark },
  vehicleImgBox: {
    width: 56, height: 48, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surfaceMuted, borderRadius: 12,
  },
  driverInfoRight: { flex: 1, alignItems: "flex-end" },
  plateLarge: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.dark },
  vehicleName: { fontSize: 13, fontFamily: "Poppins_500Medium", color: Colors.grey, marginTop: 2 },
  driverNameLarge: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.dark, marginTop: 16, letterSpacing: 1 },
  otpBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.primary + "1A", borderRadius: 12, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: Colors.primary + "33",
  },
  otpBannerLabel: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.darkSecondary },
  otpBannerValue: { fontSize: 24, fontFamily: "Poppins_700Bold", color: Colors.dark, letterSpacing: 6 },
  
  actionRowUber: { flexDirection: "row", gap: 12, marginBottom: 16 },
  msgBtnUber: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    backgroundColor: Colors.dark, borderRadius: 16, height: 56,
  },
  msgBtnTextUber: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.white },
  iconBtnUber: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.surfaceMuted,
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border,
  },
  iconBtnUberSos: {
    flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.danger, borderRadius: 16, height: 56, paddingHorizontal: 16,
  },
  sosTextUber: { fontSize: 16, fontFamily: "Poppins_700Bold", color: Colors.white },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.danger,
  },
});
