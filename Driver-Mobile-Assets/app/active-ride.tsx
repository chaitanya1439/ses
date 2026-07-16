import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, Platform, Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRide } from '@/context/RideContext';
import { useSocket } from '@/context/SocketContext';
import ChatModal from '@/components/ChatModal';
import { openGoogleMapsNavigation } from '@/utils/maps';
import { RideMap } from '@/components/RideMap';
import { theme } from '@/constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput, KeyboardAvoidingView } from 'react-native';
import * as Location from 'expo-location';
import { ioTClient } from '@/lib/aws-iot';
import { useAuth } from '@/context/AuthContext';

const { height: screenHeight } = Dimensions.get('window');

const STEP_CONFIG = {
  navigate: {
    label: 'Navigate to Pickup',
    icon: 'navigate',
    gradient: ['#F59E0B', '#D97706'], // Vibrant Yellow/Orange
    textColor: '#FFF',
  },
  arrived: {
    label: 'Start Ride',
    icon: 'play',
    gradient: ['#10B981', '#059669'], // Emerald Green
    textColor: '#FFF',
  },
  started: {
    label: 'Complete Ride',
    icon: 'flag',
    gradient: ['#4F46E5', '#4338CA'], // Indigo
    textColor: '#FFF',
  },
  completed: {
    label: 'Ride Completed',
    icon: 'checkmark-circle',
    gradient: ['#10B981', '#059669'],
    textColor: '#FFF',
  },
};

export default function ActiveRideScreen() {
  const insets = useSafeAreaInsets();
  const { activeRide, activeRideStep, advanceRideStep, completeRide } = useRide();
  const { sendThrottledMessage } = useSocket();
  const [completing, setCompleting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const { driver } = useAuth();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  // The riderId from the real-time ride request (for server communication)
  const riderId = (activeRide as any)?.riderId || activeRide?.customer?.id;

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startTracking = async () => {
      if (!activeRide || !driver?.token) return;

      try {
        await ioTClient.connect(driver.token);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 2000,
          },
          (loc) => {
            if (activeRide) {
              const payload = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                heading: loc.coords.heading,
                speed: loc.coords.speed,
                timestamp: Date.now(),
              };
              ioTClient.publish(`ridego/rides/${riderId}/location`, payload);
            }
          }
        );
      } catch (err) {
        console.error('Tracking Error:', err);
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [activeRide, driver, riderId]);

  if (!activeRide) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <View style={styles.noRideContainer}>
          <MaterialCommunityIcons name="motorbike-off" size={64} color={theme.colors.textMuted} />
          <Text style={styles.noRideTitle}>No Active Ride</Text>
          <Text style={styles.noRideDesc}>Accept a ride request from the home screen to start</Text>
          <Pressable style={styles.goHomeBtn} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.goHomeBtnText}>Go Home</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const { pickup, drop } = activeRide;

  const handlePrimaryAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (activeRideStep === 'navigate') {
      openGoogleMapsNavigation(pickup.lat, pickup.lng, pickup.address);
      advanceRideStep();
      // Notify rider that driver is navigating to them
      sendThrottledMessage('trip_status_update', { riderId, status: 'navigating' }, 0);
    } else if (activeRideStep === 'arrived') {
      // Show OTP Modal instead of instantly starting
      setShowOtpModal(true);
    } else if (activeRideStep === 'started') {
      setCompleting(true);
      setTimeout(() => {
        completeRide();
        // Notify rider that trip is completed and free up the driver on the server
        sendThrottledMessage('trip_status_update', { riderId, status: 'completed' }, 0);
        router.replace('/(tabs)/home');
      }, 500);
    }
  };

  const handleVerifyOtp = () => {
    // In a real app, this should match the payload.otp. For now, assume 1234.
    const expectedOtp = (activeRide as any)?.otp || "1234";
    if (otpInput === expectedOtp) {
      setShowOtpModal(false);
      advanceRideStep();
      sendThrottledMessage('trip_status_update', { riderId, status: 'started' }, 0);
    } else {
      setOtpError('Invalid OTP. Please ask the rider.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCancelRide = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    sendThrottledMessage('ride_cancel', { riderId, reason: 'cancelled_by_driver' }, 0);
    completeRide();
    router.replace('/(tabs)/home');
  };

  const stepConfig = STEP_CONFIG[activeRideStep];
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(activeRide.customer.rating));
  const statusLabel = activeRideStep === 'navigate' ? 'Going to Pickup' : activeRideStep === 'arrived' ? 'At Pickup' : 'Ride in Progress';

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.mapWrapper}>
        <RideMap
          pickupAddress={pickup.address}
          dropAddress={drop.address}
          pickupLat={pickup.lat}
          pickupLng={pickup.lng}
          dropLat={drop.lat}
          dropLng={drop.lng}
        />

        {/* Top Controls Overlay */}
        <View style={styles.topControls}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <View style={styles.rideStatusBadge}>
            <View style={[styles.statusDot, { backgroundColor: activeRideStep === 'started' ? '#10B981' : '#F59E0B' }]} />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.sheetHandle} />

        {/* Rider Profile Section */}
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarText}>{activeRide.customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{activeRide.customer.name}</Text>
            <View style={styles.starsRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{activeRide.customer.rating} <Text style={{color: '#9CA3AF'}}>• Rider</Text></Text>
            </View>
          </View>
          <View style={styles.contactActions}>
            <Pressable style={[styles.contactBtn, { backgroundColor: '#ECFDF5' }]} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="call" size={20} color="#10B981" />
            </Pressable>
            <Pressable style={[styles.contactBtn, { backgroundColor: '#EFF6FF' }]} onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setChatVisible(true);
            }}>
              <Ionicons name="chatbubble-ellipses" size={20} color="#3B82F6" />
            </Pressable>
          </View>
        </View>

        {/* Trip Details Section */}
        <View style={styles.tripDetailsCard}>
          <View style={styles.timelineContainer}>
            <View style={[styles.timelineDot, { backgroundColor: '#10B981' }]} />
            <View style={styles.timelineLine} />
            <View style={[styles.timelineSquare, { backgroundColor: '#EF4444' }]} />
          </View>
          
          <View style={styles.locationsContainer}>
            <View style={styles.locationBlock}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationText} numberOfLines={2}>{pickup.address}</Text>
            </View>
            <View style={styles.locationDivider} />
            <View style={styles.locationBlock}>
              <Text style={styles.locationLabel}>Dropoff</Text>
              <Text style={styles.locationText} numberOfLines={2}>{drop.address}</Text>
            </View>
          </View>

          <View style={styles.tripMetaCol}>
            <View style={styles.fareBadge}>
              <Text style={styles.fareCurrency}>₹</Text>
              <Text style={styles.fareAmount}>{activeRide.fare}</Text>
            </View>
            <View style={styles.infoChip}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color="#6B7280" />
              <Text style={styles.infoChipText}>{activeRide.distance}</Text>
            </View>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.actionContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryActionWrap,
              { opacity: pressed || completing ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handlePrimaryAction}
            disabled={completing}
          >
            <LinearGradient 
              colors={(stepConfig.gradient as unknown as readonly [string, string, ...string[]]) || ['#4F46E5', '#4338CA']} 
              start={{x: 0, y: 0}} end={{x: 1, y: 1}}
              style={styles.primaryActionBtn}
            >
              <Ionicons name={stepConfig.icon as any} size={24} color="#FFF" />
              <Text style={styles.primaryActionText}>
                {completing ? 'Processing...' : stepConfig.label}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed || completing ? 0.8 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
            onPress={handleCancelRide}
            disabled={completing}
          >
            <Ionicons name="close" size={26} color="#EF4444" />
          </Pressable>
        </View>
      </View>

      {showOtpModal && (
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.otpModalContainer}>
            <Text style={styles.otpModalTitle}>Enter OTP</Text>
            <Text style={styles.otpModalDesc}>Ask the rider for the 4-digit PIN to start the ride.</Text>
            
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              value={otpInput}
              onChangeText={(text) => {
                setOtpInput(text);
                setOtpError('');
              }}
              placeholder="0000"
              autoFocus
            />
            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <View style={styles.otpActionRow}>
              <Pressable style={styles.cancelOtpBtn} onPress={() => setShowOtpModal(false)}>
                <Text style={styles.cancelOtpText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.verifyOtpBtn} onPress={handleVerifyOtp}>
                <Text style={styles.verifyOtpText}>Verify & Start</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
      
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        targetId={activeRide?.customer?.id || 'rider'}
        driverName={activeRide?.customer?.name || 'Rider'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  mapWrapper: { flex: 1, backgroundColor: '#E8F0F8', position: 'relative' },
  
  // Top Controls Overlay
  topControls: {
    position: 'absolute', top: 16, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5,
  },
  rideStatusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#111827',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },

  // Bottom Sheet
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingHorizontal: 24, paddingTop: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 48, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  
  // Rider Profile
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  customerAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  avatarText: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#4B5563' },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#111827', marginBottom: 2 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, fontFamily: 'Poppins_500Medium', color: '#4B5563' },
  contactActions: { flexDirection: 'row', gap: 10 },
  contactBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  
  // Trip Details Card
  tripDetailsCard: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: '#F3F4F6',
    marginBottom: 24,
  },
  timelineContainer: { alignItems: 'center', width: 24, marginRight: 12, paddingVertical: 4 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#D1FAE5' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#E5E7EB', marginVertical: 4 },
  timelineSquare: { width: 12, height: 12, borderRadius: 3, borderWidth: 2, borderColor: '#FEE2E2' },
  locationsContainer: { flex: 1, paddingVertical: 2 },
  locationBlock: { flex: 1, justifyContent: 'center' },
  locationLabel: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  locationText: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: '#111827', marginTop: 2 },
  locationDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  
  tripMetaCol: { alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: '#E5E7EB' },
  fareBadge: { flexDirection: 'row', alignItems: 'flex-start' },
  fareCurrency: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: '#10B981', marginTop: 2 },
  fareAmount: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#111827' },
  infoChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  infoChipText: { fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#4B5563' },
  
  // Actions
  actionContainer: { flexDirection: 'row', gap: 12 },
  primaryActionWrap: { flex: 1, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
  primaryActionBtn: { height: 64, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  primaryActionText: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },
  cancelBtn: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },

  // No Ride State
  noRideContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  noRideTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#4B5563' },
  noRideDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 40 },
  goHomeBtn: { backgroundColor: '#111827', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16, marginTop: 12 },
  goHomeBtnText: { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#FFFFFF' },

  // Modals
  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  otpModalContainer: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 15 },
  otpModalTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: '#111827', marginBottom: 8 },
  otpModalDesc: { fontSize: 15, fontFamily: 'Poppins_400Regular', color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  otpInput: { width: '100%', height: 64, backgroundColor: '#F3F4F6', borderRadius: 16, fontSize: 32, fontFamily: 'Poppins_700Bold', textAlign: 'center', letterSpacing: 12, marginBottom: 12, color: '#111827' },
  errorText: { color: '#EF4444', fontSize: 13, fontFamily: 'Poppins_500Medium', marginBottom: 16 },
  otpActionRow: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  cancelOtpBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  cancelOtpText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#4B5563' },
  verifyOtpBtn: { flex: 1, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#10B981' },
  verifyOtpText: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: '#FFFFFF' },
});
