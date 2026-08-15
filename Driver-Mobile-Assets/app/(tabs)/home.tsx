import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useRide } from '@/context/RideContext';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { TopNavBar } from '@/components/TopNavBar';
import { EarningsBanner } from '@/components/EarningsBanner';
import { ProgressCard } from '@/components/ProgressCard';
import { GreetingSection } from '@/components/GreetingSection';
import { QuickActionIcons } from '@/components/QuickActionIcons';
import { NightFareModal } from '@/components/NightFareModal';
import { GoToZoneSheet } from '@/components/GoToZoneSheet';

import { HomeMap } from '@/components/HomeMap';
import { SideDrawer } from '@/components/SideDrawer';
import { theme } from '@/constants/colors';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';


export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    isOnDuty, setIsOnDuty,
    setIncomingRide, setShowRidePopup,
    todayEarnings, setTodayEarnings, completedRides, loadRides,
    syncRide,
    activeRide,
  } = useRide();
  const { driver } = useAuth();

  const [showNightFare, setShowNightFare] = useState(false);
  const [showGoToZone, setShowGoToZone] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    if (!driver?.subscriptionExpiryDate) return;
    
    const updateTime = () => {
      const now = new Date();
      const expiry = new Date(driver.subscriptionExpiryDate!);
      const diff = expiry.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeftStr('Expired');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeftStr(`${hours}h ${mins}m left`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [driver?.subscriptionExpiryDate]);

  // BottomSheet snap points
  const snapPoints = React.useMemo(() => ['30%', '85%'], []);

  // === Location Tracking ===
  useLocationTracking({
    enabled: isOnDuty,
  });

  // === Push Notifications ===
  usePushNotifications({
    onNotificationReceived: (data) => {
      if (data.type === 'new_ride_request') {
        const reqType = (data.vehicleType || 'Bike').toLowerCase();
        const driverVType = (driver?.vehicleType || 'bike').toLowerCase();
        const isDriverAuto = driverVType.includes('auto');
        const isRequestAuto = reqType.includes('auto');
        
        if (isDriverAuto !== isRequestAuto) {
          console.log('[Push] Ignored ride request due to vehicle type mismatch');
          return;
        }

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
          riderId: data.riderId,
          otp: data.otp || '1234'
        };
        setIncomingRide(ride as any);
        setShowRidePopup(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    onNotificationTapped: (data) => {
      if (data.type === 'new_ride_request') {
        const reqType = (data.vehicleType || 'Bike').toLowerCase();
        const driverVType = (driver?.vehicleType || 'bike').toLowerCase();
        const isDriverAuto = driverVType.includes('auto');
        const isRequestAuto = reqType.includes('auto');
        
        if (isDriverAuto !== isRequestAuto) return;

        // If the user tapped the push notification, it means they want to accept it.
        // We should show the popup so they can see the details and accept.
        const ride = {
          id: `R${Date.now()}`,
          customer: {
            id: data.riderId || `C${Date.now()}`,
            name: data.riderName || 'Rider',
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
          riderId: data.riderId,
          otp: data.otp || '1234'
        };
        setIncomingRide(ride as any);
        setShowRidePopup(true);
      }
    },
  });

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  useEffect(() => {
    if (!driver?.id) return;
    
    const fetchDriverStats = async () => {
      try {
        const { getPublicApiBaseUrl } = require('@/constants/config');
        const res = await fetch(`${getPublicApiBaseUrl()}/api/driver/stats/${driver.id}`);
        if (res.ok) {
          const stats = await res.json();
          setTodayEarnings(stats.todayEarnings);
          // Update driver subscription locally for UI
          if (driver) {
             driver.subscriptionStatus = stats.subscriptionStatus;
             driver.subscriptionExpiryDate = stats.subscriptionExpiry;
          }
        }
      } catch (e) {
        console.error('Failed to fetch driver stats:', e);
      }
    };

    fetchDriverStats();
  }, [driver?.id, setTodayEarnings]);

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
    const unsub = subscribe('new_ride_request', (data) => {
      if (!isOnDuty) {
        console.log('[Home] Ignored incoming ride request because driver is offline');
        return;
      }

      const reqType = (data.vehicle || data.vehicleType || 'Bike').toLowerCase();
      const driverVType = (driver?.vehicleType || 'bike').toLowerCase();
      const isDriverAuto = driverVType.includes('auto');
      const isRequestAuto = reqType.includes('auto');
      
      if (isDriverAuto !== isRequestAuto) {
        console.log('[Socket] Ignored incoming ride request due to vehicle type mismatch');
        return;
      }
      
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
        riderId: data.riderId,
        otp: data.otp || '1234'
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
      
      const payload = data.payload || data;
      if (payload && payload.status && payload.status !== 'completed' && payload.status !== 'cancelled') {
        const ride = {
          id: `R${Date.now()}`,
          customer: {
            id: payload.riderId || `C${Date.now()}`,
            name: payload.riderName || 'Rider',
            phone: payload.riderPhone || '',
          },
          pickup: {
            address: payload.pickupLocation?.address || 'Pickup Location',
            lat: payload.pickupLocation?.lat || 17.385,
            lng: payload.pickupLocation?.lng || 78.4867,
          },
          drop: {
            address: payload.dropLocation?.address || 'Dropoff Location',
            lat: payload.dropLocation?.lat || 17.426,
            lng: payload.dropLocation?.lng || 78.4601,
          },
          distance: '5.0 km', // Default since not in sync payload
          fare: payload.fare ? Number(payload.fare) : 150,
          type: payload.vehicleType || 'Bike',
          riderId: payload.riderId,
          otp: payload.otp || '1234'
        };
        
        let step = 'navigate';
        if (payload.status === 'arrived') step = 'arrived';
        if (payload.status === 'started') step = 'started';
        
        syncRide(ride as any, step as any);
        router.push('/active-ride');
      }
    });

    return () => {
      unsub();
      unsubCancelled();
      unsubSync();
    };
  }, [isOnDuty, subscribe, setIncomingRide, setShowRidePopup, syncRide]);

  const todayRides = completedRides.filter((r: any) =>
    r.status === 'completed' && new Date(r.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const driverName = driver?.name?.split(' ')[0] || 'Driver';

  const handleToggleDuty = (newStatus: boolean) => {
    if (newStatus) {
      const expiry = driver?.subscriptionExpiryDate;
      const earningLimit = driver?.subscriptionEarningLimit;
      const now = new Date();
      
      if (!expiry || new Date(expiry) < now) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert('Your subscription has expired. Please recharge to go online and receive rides.');
        router.push('/subscription-plans' as any);
        return;
      }

      if (earningLimit && todayEarnings >= earningLimit) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        alert(`You have reached your earning limit (₹${earningLimit}). Please upgrade your plan to continue earning.`);
        router.push('/subscription-plans' as any);
        return;
      }
    }
    setIsOnDuty(newStatus);
  };

  return (
    <View style={styles.container}>
      {/* === BACKGROUND LAYER (MAP OR GREETING) === */}
      <View style={StyleSheet.absoluteFillObject}>
        {isOnDuty ? (
          <View style={styles.fullScreenBg}>
            <HomeMap />
            {/* Zone badge overlay */}
            <View style={[styles.zoneBadge, { top: insets.top + 70 }]}>
              <MaterialCommunityIcons name="map-marker-radius" size={16} color="#FFF" />
              <Text style={styles.zoneBadgeText}>₹12/km Guaranteed Earn...</Text>
            </View>
            {/* Close map X button */}
            <Pressable style={[styles.mapCloseBtn, { top: insets.top + 70, bottom: 'auto' }]} onPress={() => handleToggleDuty(false)}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </Pressable>
          </View>
        ) : (
          <View style={[styles.fullScreenBg, { paddingTop: insets.top + 70 }]}>
            <GreetingSection driverName={driverName} />
          </View>
        )}
      </View>

      {/* === FIXED TOP NAVIGATION BAR === */}
      <View style={styles.fixedTopBar}>
        <TopNavBar
          isOnDuty={isOnDuty}
          onToggle={handleToggleDuty}
          onMenuPress={() => setIsDrawerOpen(true)}
          onHeartPress={() => router.push('/go-to-area')}
          onBellPress={() => router.push('/notification')}
        />
        {activeRide && (
          <Pressable 
            style={[styles.activeTripBanner, { marginHorizontal: 16, marginTop: 8 }]} 
            onPress={() => router.push('/active-ride')}
          >
            <View style={styles.activeTripContent}>
              <Ionicons name="car-sport" size={24} color="#FFF" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.activeTripTitle}>Ongoing Ride</Text>
                <Text style={styles.activeTripSub}>Tap to return to your active ride</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FFF" />
            </View>
          </Pressable>
        )}
      </View>

      {/* === PULL-UP BOTTOM SHEET === */}
      <BottomSheet snapPoints={snapPoints} index={0}>
        <BottomSheetScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          bounces
        >
          {/* === SECTION 1 — EARNINGS BANNER === */}
          <EarningsBanner amount={todayEarnings} />

          {/* === SECTION 2 — PROGRESS CARD === */}
          <ProgressCard
            completedOrders={todayRides}
            onKnowMore={() => router.push('/active-ride')}
          />

          {/* === SECTION 3 — EARNING PLAN PROMO === */}
          {(() => {
            const expiry = driver?.subscriptionExpiryDate;
            const earningLimit = driver?.subscriptionEarningLimit || 0;
            const now = new Date();
            const isActive = expiry && new Date(expiry) > now;
            
            if (isActive) {
              const progressPercentage = earningLimit > 0 ? Math.min(100, (todayEarnings / earningLimit) * 100) : 0;
              
              return (
                <Pressable 
                  style={[styles.promoCard, { marginTop: 16, backgroundColor: '#1E4620', flexDirection: 'column', alignItems: 'stretch' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push('/subscription-plans' as any);
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.promoTitle}>Active: {driver?.subscriptionPlanId ? driver.subscriptionPlanId.charAt(0).toUpperCase() + driver.subscriptionPlanId.slice(1) : 'Premium'} Plan</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#81C784" />
                        <Text style={{ color: '#81C784', fontSize: 13, fontFamily: 'Poppins_600SemiBold' }}>
                          {timeLeftStr}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.planBadge, { backgroundColor: '#2E7D32', width: 48, height: 48 }]}>
                      <MaterialCommunityIcons name="check-decagram" size={24} color="#FFF" />
                    </View>
                  </View>

                  <View style={{ marginTop: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Poppins_600SemiBold' }}>Today&apos;s Limit</Text>
                      <Text style={{ color: '#FFF', fontSize: 12, fontFamily: 'Poppins_700Bold' }}>₹{todayEarnings} / ₹{earningLimit}</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: '#2E7D32', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ height: '100%', width: `${progressPercentage}%`, backgroundColor: progressPercentage >= 100 ? '#F44336' : '#81C784', borderRadius: 3 }} />
                    </View>
                  </View>
                </Pressable>
              );
            }

            return (
              <Pressable 
                style={[styles.promoCard, { marginTop: 16 }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/subscription-plans' as any);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.promoTitle}>Choose your earning plan</Text>
                  <View style={styles.promoBtn}>
                    <Text style={styles.promoBtnText}>View All Plans →</Text>
                  </View>
                </View>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeSmall}>MY</Text>
                  <Text style={styles.planBadgeLarge}>PLAN</Text>
                  <Text style={styles.planBadgeRupee}>₹₹</Text>
                </View>
              </Pressable>
            );
          })()}

          {/* === SECTION 4 — QUICK ACTION ICONS ROW === */}
          <QuickActionIcons
            onFunnyPress={() => router.push('/tutorial-funny')}
            onFilterPress={() => router.push('/tutorial-filter')}
            onGoToPress={() => router.push('/tutorial-goto')}
            onPlansPress={() => router.push('/tutorial-plans')}
          />

          {/* === SECTION 5 — QUICK ACTIONS HEADING === */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.quickActionsTitle}>Quick actions</Text>

            <View style={styles.quickActionsRow}>
              <Pressable
                style={styles.quickActionCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/performance' as any);
                }}
              >
                <MaterialCommunityIcons name="chart-line" size={28} color={theme.colors.success} />
                <Text style={styles.quickActionValue}>98%</Text>
                <Text style={styles.quickActionLabel}>Performance</Text>
              </Pressable>

              <Pressable
                style={styles.quickActionCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/rider-search' as any);
                }}
              >
                <MaterialCommunityIcons name="car-sports" size={28} color="#FF9800" />
                <Text style={[styles.quickActionValue, { color: '#FF9800' }]}>Rider</Text>
                <Text style={styles.quickActionLabel}>Book Ride</Text>
              </Pressable>

              <Pressable
                style={styles.quickActionCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/subscription' as any);
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

              <Pressable
                style={styles.quickActionCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/driver-scanner' as any);
                }}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={28} color={theme.colors.primary} />
                <Text style={[styles.quickActionValue, { color: theme.colors.primary }]}>Scan QR</Text>
                <Text style={styles.quickActionLabel}>Tatkal Ride</Text>
              </Pressable>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

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

      {/* QR Scanner FAB */}
      <View style={styles.fabContainer}>
        <Pressable 
          style={styles.scannerFab} 
          onPress={() => {
            import('expo-haptics').then(Haptics => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
            router.push('/driver-scanner' as any);
          }}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={28} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    zIndex: 20,
  },
  scannerFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fixedTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fullScreenBg: {
    flex: 1,
    position: 'relative',
    backgroundColor: theme.colors.surfaceAlt,
  },
  // Map section overlay buttons
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
  activeTripBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    padding: 12,
    ...theme.shadows.card,
  },
  activeTripContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTripTitle: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: "#FFF",
  },
  activeTripSub: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "rgba(255, 255, 255, 0.8)",
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
  /* Promo Card (Offline Ad) */
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 10,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  promoBtn: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  planBadge: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#4A6CF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  planBadgeSmall: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  planBadgeLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFB800',
    fontFamily: 'Poppins_700Bold',
    marginTop: -2,
  },
  planBadgeRupee: {
    fontSize: 10,
    color: '#FFB800',
    fontFamily: 'Poppins_700Bold',
  },
});
