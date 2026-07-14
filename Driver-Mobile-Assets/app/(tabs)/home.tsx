import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Dimensions, Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRide, generateMockRide } from '@/context/RideContext';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { TopNavBar } from '@/components/TopNavBar';
import { EarningsBanner } from '@/components/EarningsBanner';
import { ProgressCard } from '@/components/ProgressCard';
import { GreetingSection } from '@/components/GreetingSection';
import { QuickActionIcons } from '@/components/QuickActionIcons';
import { OnlyForYouCard } from '@/components/OnlyForYouCard';
import { NightFareModal } from '@/components/NightFareModal';
import { GoToZoneSheet } from '@/components/GoToZoneSheet';

import { HomeMap } from '@/components/HomeMap';
import { SideDrawer } from '@/components/SideDrawer';
import { theme } from '@/constants/colors';

const { height: screenHeight } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    isOnDuty, setIsOnDuty,
    setIncomingRide, setShowRidePopup,
    todayEarnings, completedRides, loadRides,
  } = useRide();
  const { driver } = useAuth();
  const rideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showNightFare, setShowNightFare] = useState(false);
  const [showGoToZone, setShowGoToZone] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // === Location Tracking ===
  useLocationTracking({
    enabled: isOnDuty,
  });

  // === Push Notifications ===
  usePushNotifications({
    onNotificationReceived: (data) => {
      if (data.type === 'new_ride_request') {
        const ride = {
          id: `R${Date.now()}`,
          customer: {
            id: data.riderId || `C${Date.now()}`,
            name: data.riderName || 'Rider',
            rating: 4.8,
          },
          pickup: {
            address: data.pickupAddress || (data.pickupLocation as any)?.address || 'Pickup Location',
            lat: data.pickupLat || (data.pickupLocation as any)?.lat || 17.385,
            lng: data.pickupLng || (data.pickupLocation as any)?.lng || 78.4867,
          },
          drop: {
            address: data.dropAddress || (data.dropLocation as any)?.address || 'Dropoff Location',
            lat: data.dropLat || (data.dropLocation as any)?.lat || 17.426,
            lng: data.dropLng || (data.dropLocation as any)?.lng || 78.4601,
          },
          distance: data.distance ? `${data.distance} km` : '5.0 km',
          fare: data.fare ? Number(data.fare) : 150,
          type: data.vehicleType || 'Bike',
          riderId: data.riderId
        };
        setIncomingRide(ride as any);
        setShowRidePopup(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onNotificationTapped: (data) => {
      if (data.type === 'new_ride_request') {
        // If the user tapped the push notification, it means they want to accept it.
        // We should show the popup so they can see the details and accept.
        const ride = {
          id: `R${Date.now()}`,
          customer: {
            id: data.riderId || `C${Date.now()}`,
            name: data.riderName || 'Rider',
            rating: 4.8,
          },
          pickup: {
            address: data.pickupAddress || (data.pickupLocation as any)?.address || 'Pickup Location',
            lat: data.pickupLat || (data.pickupLocation as any)?.lat || 17.385,
            lng: data.pickupLng || (data.pickupLocation as any)?.lng || 78.4867,
          },
          drop: {
            address: data.dropAddress || (data.dropLocation as any)?.address || 'Dropoff Location',
            lat: data.dropLat || (data.dropLocation as any)?.lat || 17.426,
            lng: data.dropLng || (data.dropLocation as any)?.lng || 78.4601,
          },
          distance: data.distance ? `${data.distance} km` : '5.0 km',
          fare: data.fare ? Number(data.fare) : 150,
          type: data.vehicleType || 'Bike',
          riderId: data.riderId
        };
        setIncomingRide(ride as any);
        setShowRidePopup(true);
      }
    },
  });

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  // Show night fare modal when going on duty
  useEffect(() => {
    if (isOnDuty) {
      const timer = setTimeout(() => {
        setShowNightFare(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setShowNightFare(false);
    }
  }, [isOnDuty]);

  const { subscribe, sendMessage, isConnected } = useSocket();

  useEffect(() => {
    if (isConnected) {
      sendMessage('driver_status', { status: isOnDuty ? 'available' : 'offline' });
    }
  }, [isOnDuty, isConnected, sendMessage]);

  useEffect(() => {
    if (!isOnDuty) return;
    
    // Dynamically listen to actual incoming ride requests broadcast from Realtime-Server
    const unsub = subscribe('new_ride_request', (data) => {
      // Extract pickup/drop coordinates
      const pickupLat = data.pickupLat || data.pickupLocation?.lat || 17.385;
      const pickupLng = data.pickupLng || data.pickupLocation?.lng || 78.4867;
      const dropLat = data.dropLat || data.dropLocation?.lat || data.destinationLocation?.lat || 17.426;
      const dropLng = data.dropLng || data.dropLocation?.lng || data.destinationLocation?.lng || 78.4601;

      // Calculate distance if not provided
      let distanceStr = data.distance;
      if (!distanceStr && pickupLat && pickupLng && dropLat && dropLng) {
        const R = 6371;
        const dLat = ((dropLat - pickupLat) * Math.PI) / 180;
        const dLon = ((dropLng - pickupLng) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((pickupLat * Math.PI) / 180) * Math.cos((dropLat * Math.PI) / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceStr = `${dist.toFixed(1)} km`;
      } else if (distanceStr && !String(distanceStr).includes('km')) {
        distanceStr = `${distanceStr} km`;
      }

      const ride = {
        id: `R${Date.now()}`,
        customer: {
          id: data.riderId || `C${Date.now()}`,
          name: data.riderName || 'Rider',
          rating: 4.8,
        },
        pickup: {
          address: data.pickupAddress || data.pickupLocation?.address || 'Pickup Location',
          lat: pickupLat,
          lng: pickupLng,
        },
        drop: {
          address: data.dropAddress || data.dropLocation?.address || data.destinationLocation?.address || 'Dropoff Location',
          lat: dropLat,
          lng: dropLng,
        },
        distance: distanceStr || '5.0 km',
        fare: data.fare ? Number(data.fare) : 150,
        type: data.vehicle || data.vehicleType || 'Bike',
        riderId: data.riderId
      };
      setIncomingRide(ride as any);
      setShowRidePopup(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    });

    // Auto-dismiss ride popup when another driver accepts the same ride
    const unsubCancelled = subscribe('ride_request_cancelled', (data) => {
      if (data.reason === 'accepted_by_another') {
        setShowRidePopup(false);
        setIncomingRide(null);
      }
    });

    // Restore active trip state on reconnect (server pushes sync_state on auth)
    const unsubSync = subscribe('sync_state', (data) => {
      console.log('[Socket] Synced active trip state from server:', data);
      // If there's an active trip, navigate to the active ride screen
      if (data.status && data.status !== 'completed' && data.status !== 'cancelled') {
        router.push('/active-ride');
      }
    });

    return () => {
      unsub();
      unsubCancelled();
      unsubSync();
    };
  }, [isOnDuty, subscribe, setIncomingRide, setShowRidePopup]);

  const todayRides = completedRides.filter(r =>
    r.status === 'completed' && new Date(r.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const driverName = driver?.name?.split(' ')[0] || 'Driver';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* === TOP NAVIGATION BAR === */}
        <TopNavBar
          isOnDuty={isOnDuty}
          onToggle={setIsOnDuty}
          onMenuPress={() => setIsDrawerOpen(true)}
          onHeartPress={() => router.push('/go-to-area')}
          onBellPress={() => router.push('/notification')}
        />

        {/* === SECTION 1 — EARNINGS BANNER === */}
        <EarningsBanner amount={todayEarnings} />

        {/* === SECTION 2 — PROGRESS CARD === */}
        <ProgressCard
          completedOrders={todayRides}
          onKnowMore={() => router.push('/active-ride')}
        />

        {/* === SECTION 3 — GREETING or MAP === */}
        {isOnDuty ? (
          <View style={styles.mapSection}>
            <HomeMap />
            {/* Zone badge overlay */}
            <View style={styles.zoneBadge}>
              <MaterialCommunityIcons name="map-marker-radius" size={16} color="#FFF" />
              <Text style={styles.zoneBadgeText}>₹12/km Guaranteed Earn...</Text>
            </View>
            {/* Close map X button */}
            <Pressable style={styles.mapCloseBtn} onPress={() => setIsOnDuty(false)}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <GreetingSection driverName={driverName} />
        )}

        {/* === SECTION 4 — QUICK ACTION ICONS ROW === */}
        <QuickActionIcons
          onFunnyPress={() => router.push('/tutorial-funny')}
          onFilterPress={() => router.push('/tutorial-filter')}
          onGoToPress={() => router.push('/tutorial-goto')}
          onPlansPress={() => router.push('/tutorial-plans')}
        />

        {/* === SECTION 5 — "ONLY FOR YOU" PROMOTIONAL SECTION === */}
        <OnlyForYouCard />

        {/* === SECTION 6 — QUICK ACTIONS HEADING === */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick actions</Text>

          <View style={styles.quickActionsRow}>
            <Pressable
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/active-ride');
              }}
            >
              <MaterialCommunityIcons name="road-variant" size={28} color={theme.colors.primary} />
              <Text style={styles.quickActionValue}>{todayRides}</Text>
              <Text style={styles.quickActionLabel}>Completed</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/subscription');
              }}
            >
              <MaterialCommunityIcons name="crown" size={28} color={theme.colors.purple} />
              <Text style={[styles.quickActionValue, { color: theme.colors.purple }]}>Active</Text>
              <Text style={styles.quickActionLabel}>Recharge</Text>
            </Pressable>

            <Pressable
              style={styles.quickActionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/parcel-delivery');
              }}
            >
              <MaterialCommunityIcons name="package-variant" size={28} color={theme.colors.teal} />
              <Text style={[styles.quickActionValue, { color: theme.colors.teal }]}>40%</Text>
              <Text style={styles.quickActionLabel}>More Earnings</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* === MODALS === */}
      <NightFareModal
        visible={showNightFare}
        onStayOnDuty={() => setShowNightFare(false)}
        onGoOffDuty={() => {
          setShowNightFare(false);
          setIsOnDuty(false);
        }}
      />

      <GoToZoneSheet
        visible={showGoToZone}
        onClose={() => setShowGoToZone(false)}
      />


      <SideDrawer
        isVisible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Map section
  mapSection: {
    height: screenHeight * 0.35,
    position: 'relative',
    overflow: 'hidden',
  },
  zoneBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.teal,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...theme.shadows.card,
  },
  zoneBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  mapCloseBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.card,
  },

  // Quick actions section
  quickActionsSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 14,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    ...theme.shadows.sm,
  },
  quickActionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
  },
  quickActionLabel: {
    fontSize: 10,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
