import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, Dimensions, Platform
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRide } from '@/context/RideContext';
import { theme } from '@/constants/colors';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '@/context/SocketContext';
import { fetchDirectionsPolyline } from '@/lib/googleMaps';

const { height } = Dimensions.get('window');
const COUNTDOWN_SECONDS = 15;

export function RideRequestPopup() {
  const { incomingRide, showRidePopup, acceptRide, rejectRide } = useRide();
  const { sendMessage } = useSocket();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof Animated.timing> | null>(null);
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<{latitude: number; longitude: number}[]>([]);

  const hideAndReject = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => rejectRide());
  }, [rejectRide, slideAnim]);

  useEffect(() => {
    if (showRidePopup) {
      setSeconds(COUNTDOWN_SECONDS);
      countdownAnim.setValue(1);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
      }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      countdownRef.current = Animated.timing(countdownAnim, {
        toValue: 0,
        duration: COUNTDOWN_SECONDS * 1000,
        useNativeDriver: false,
      });
      countdownRef.current.start();

      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            hideAndReject();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) countdownRef.current.stop();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdownAnim, hideAndReject, showRidePopup, slideAnim]);

  // Fetch road-following polyline for the map
  useEffect(() => {
    if (!incomingRide || !showRidePopup) return;
    (async () => {
      const coords = await fetchDirectionsPolyline(
        { latitude: incomingRide.pickup.lat, longitude: incomingRide.pickup.lng },
        { latitude: incomingRide.drop.lat, longitude: incomingRide.drop.lng }
      );
      if (coords && coords.length > 1) {
        setRouteCoords(coords);
        // Fit map to show entire route
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
            animated: true,
          });
        }, 300);
      } else {
        // Fallback: straight line
        setRouteCoords([
          { latitude: incomingRide.pickup.lat, longitude: incomingRide.pickup.lng },
          { latitude: incomingRide.drop.lat, longitude: incomingRide.drop.lng },
        ]);
      }
    })();
  }, [incomingRide, showRidePopup]);

  const handleAccept = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) countdownRef.current.stop();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!incomingRide) return;
    const riderId = (incomingRide as any).riderId || incomingRide.customer?.id;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const rideWithOtp = { ...incomingRide, otp } as any;
    acceptRide(rideWithOtp);
    
    // Notify the realtime server that the driver accepted the ride
    sendMessage('ride_accept', {
      riderId,
      payload: {
        pickupLocation: incomingRide.pickup,
        dropLocation: incomingRide.drop,
        fare: incomingRide.fare,
        vehicleType: incomingRide.type,
        otp,
      },
    });

    Animated.timing(slideAnim, {
      toValue: height,
      duration: 200,
      useNativeDriver: true,
    }).start(() => router.push('/active-ride'));
  };

  const handleReject = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (countdownRef.current) countdownRef.current.stop();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Notify the server that the driver explicitly rejected
    if (incomingRide) {
      const riderId = (incomingRide as any).riderId || incomingRide.customer?.id;
      sendMessage('ride_reject', { riderId });
    }
    
    hideAndReject();
  };

  if (!incomingRide || !showRidePopup) return null;

  const progressWidth = countdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(incomingRide.customer.rating));

  return (
    <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999, elevation: 9999 }]}>
      <View style={styles.modalContainer}>
        {/* Dark overlay */}
        <Pressable style={styles.overlay} onPress={handleReject} />

        {/* Bottom sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.handle} />

          {/* Mini Map inside Request Layout */}
          <View style={styles.miniMapContainer}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={{
                latitude: (incomingRide.pickup.lat + incomingRide.drop.lat) / 2,
                longitude: (incomingRide.pickup.lng + incomingRide.drop.lng) / 2,
                latitudeDelta: Math.abs(incomingRide.pickup.lat - incomingRide.drop.lat) * 1.8 + 0.01,
                longitudeDelta: Math.abs(incomingRide.pickup.lng - incomingRide.drop.lng) * 1.8 + 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker coordinate={{ latitude: incomingRide.pickup.lat, longitude: incomingRide.pickup.lng }} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
                <View style={styles.pickupDot} />
              </Marker>
              <Marker coordinate={{ latitude: incomingRide.pickup.lat, longitude: incomingRide.pickup.lng }} anchor={{ x: 0.5, y: 0 }} style={{ zIndex: 20 }}>
                <View style={styles.markerLabel}>
                  <Text style={styles.markerLabelText} numberOfLines={1}>{incomingRide.pickup.address.split(',')[0]}</Text>
                </View>
              </Marker>
              
              <Marker coordinate={{ latitude: incomingRide.drop.lat, longitude: incomingRide.drop.lng }} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 10 }}>
                <View style={styles.dropSquare} />
              </Marker>
              <Marker coordinate={{ latitude: incomingRide.drop.lat, longitude: incomingRide.drop.lng }} anchor={{ x: 0.5, y: 0 }} style={{ zIndex: 20 }}>
                <View style={[styles.markerLabel, { backgroundColor: theme.colors.dark }]}>
                  <Text style={[styles.markerLabelText, { color: '#FFF' }]} numberOfLines={1}>{incomingRide.drop.address.split(',')[0]}</Text>
                </View>
              </Marker>
              {routeCoords.length > 1 && (
                <Polyline
                  coordinates={routeCoords}
                  strokeColor={theme.colors.dark}
                  strokeWidth={4}
                />
              )}
            </MapView>
          </View>

          {/* Locations & Price directly under the Map */}
          <View style={styles.locationPriceRow}>
            <View style={styles.locationCol}>
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: theme.colors.success }]} />
                <Text style={styles.locationText} numberOfLines={1}>{incomingRide.pickup.address}</Text>
              </View>
              <View style={styles.locationDivider} />
              <View style={styles.locationRow}>
                <View style={[styles.dot, { backgroundColor: theme.colors.danger }]} />
                <Text style={styles.locationText} numberOfLines={1}>{incomingRide.drop.address}</Text>
              </View>
            </View>
            <View style={styles.priceCol}>
              <Text style={styles.fareLabel}>Fare</Text>
              <Text style={styles.fareAmount}>₹{incomingRide.fare}</Text>
            </View>
          </View>

          <View style={styles.timerBar}>
            <Animated.View style={[styles.timerFill, { width: progressWidth }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.rideTypeChip}>
              <MaterialCommunityIcons name="motorbike" size={14} color={theme.colors.dark} />
              <Text style={styles.rideTypeText}>{incomingRide.type}</Text>
            </View>
            <View style={styles.distanceChip}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.colors.textLight} />
              <Text style={styles.distanceText}>{incomingRide.distance}</Text>
            </View>
            <View style={{ flex: 1 }} />
            <View style={styles.countdown}>
              <Text style={styles.countdownText}>{seconds}s</Text>
            </View>
          </View>

          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account" size={24} color={theme.colors.dark} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{incomingRide.customer.name}</Text>
              <View style={styles.starsRow}>
                {stars.map((filled, i) => (
                  <Ionicons key={i} name={filled ? 'star' : 'star-outline'} size={11} color={theme.colors.primary} />
                ))}
                <Text style={styles.ratingText}>{incomingRide.customer.rating}</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) => [styles.rejectBtn, { opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={handleReject}
            >
              <Ionicons name="close" size={22} color={theme.colors.danger} />
              <Text style={styles.rejectText}>Reject</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.acceptBtn, { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
              onPress={handleAccept}
            >
              <Ionicons name="checkmark" size={22} color="#FFF" />
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 12,
    ...theme.shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  timerBar: {
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginBottom: 10,
    marginTop: 10,
    overflow: 'hidden',
  },
  timerFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 2,
  },
  miniMapContainer: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: theme.colors.surfaceAlt,
    ...theme.shadows.card,
  },
  pickupMarkerLabeled: {
    alignItems: 'center',
  },
  pickupDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: theme.colors.success,
    borderWidth: 2, borderColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  dropMarkerLabeled: {
    alignItems: 'center',
  },
  dropSquare: {
    width: 12, height: 12, backgroundColor: theme.colors.dark,
    borderWidth: 2, borderColor: '#FFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
  markerLabel: {
    marginTop: 4,
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    maxWidth: 120,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3,
    elevation: 3,
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.dark,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  rideTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '22',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  rideTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.dark,
    fontFamily: 'Poppins_600SemiBold',
  },
  fareBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.success,
    fontFamily: 'Poppins_700Bold',
  },
  fareLabel: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
    marginBottom: -4,
  },
  countdown: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  ratingText: {
    fontSize: 11,
    color: theme.colors.textLight,
    marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  distanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    fontSize: 12,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  locationPriceRow: {
    flexDirection: 'row',
    marginTop: 14,
    marginBottom: 6,
    alignItems: 'center',
  },
  locationCol: {
    flex: 1,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  priceCol: {
    paddingLeft: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationDivider: {
    height: 12,
    width: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
    marginLeft: 3,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: theme.colors.danger,
  },
  rejectText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.danger,
    fontFamily: 'Poppins_700Bold',
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: theme.colors.success,
  },
  acceptText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
  },
});
