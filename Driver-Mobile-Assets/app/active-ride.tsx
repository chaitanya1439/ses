import React, { useState } from 'react';
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
import { TextInput, KeyboardAvoidingView } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

const STEP_CONFIG = {
  navigate: {
    label: 'Navigate to Pickup',
    icon: 'navigate',
    color: theme.colors.primary,
    textColor: theme.colors.dark,
  },
  arrived: {
    label: 'Start Ride',
    icon: 'play',
    color: theme.colors.success,
    textColor: '#FFF',
  },
  started: {
    label: 'Complete Ride',
    icon: 'flag',
    color: theme.colors.danger,
    textColor: '#FFF',
  },
  completed: {
    label: 'Ride Completed',
    icon: 'checkmark-circle',
    color: theme.colors.success,
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

  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;

  // The riderId from the real-time ride request (for server communication)
  const riderId = (activeRide as any)?.riderId || activeRide?.customer?.id;

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

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={styles.rideStatusBadge}>
          <View style={[styles.statusDot, { backgroundColor: activeRideStep === 'started' ? theme.colors.success : theme.colors.primary }]} />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <MaterialCommunityIcons name="account" size={28} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{activeRide.customer.name}</Text>
            <View style={styles.starsRow}>
              {stars.map((filled, i) => (
                <Ionicons key={i} name={filled ? 'star' : 'star-outline'} size={12} color={theme.colors.primary} />
              ))}
              <Text style={styles.ratingText}>{activeRide.customer.rating}</Text>
            </View>
          </View>
          <Pressable style={styles.callBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
            <Ionicons name="call" size={20} color="#FFF" />
          </Pressable>
          <Pressable style={styles.msgBtn} onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setChatVisible(true);
          }}>
            <Ionicons name="chatbubble" size={20} color={theme.colors.dark} />
          </Pressable>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: theme.colors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationText}>{pickup.address}</Text>
            </View>
          </View>
          <View style={styles.locationConnector} />
          <View style={styles.locationRow}>
            <View style={[styles.locationDot, { backgroundColor: theme.colors.danger }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationLabel}>Drop</Text>
              <Text style={styles.locationText}>{drop.address}</Text>
            </View>
            <View style={styles.fareTag}>
              <Text style={styles.fareTagText}>₹{activeRide.fare}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoChip}>
            <MaterialCommunityIcons name="map-marker-distance" size={16} color={theme.colors.textLight} />
            <Text style={styles.infoChipText}>{activeRide.distance}</Text>
          </View>
          <View style={styles.infoChip}>
            <MaterialCommunityIcons name="motorbike" size={16} color={theme.colors.textLight} />
            <Text style={styles.infoChipText}>{activeRide.type}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { flex: 1, backgroundColor: stepConfig.color, opacity: pressed || completing ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handlePrimaryAction}
            disabled={completing}
          >
            <Ionicons name={stepConfig.icon as any} size={22} color={stepConfig.textColor} />
            <Text style={[styles.actionBtnText, { color: stepConfig.textColor }]}>
              {completing ? 'Completing...' : stepConfig.label}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { width: 56, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: 'transparent', opacity: pressed || completing ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handleCancelRide}
            disabled={completing}
          >
            <Ionicons name="close" size={24} color={theme.colors.danger} />
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
  container: { flex: 1, backgroundColor: theme.colors.surface },
  mapWrapper: { height: screenHeight * 0.45, backgroundColor: '#E8F0F8' },
  backBtn: {
    position: 'absolute', top: 16, left: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center', alignItems: 'center',
    ...theme.shadows.card,
  },
  rideStatusBadge: {
    position: 'absolute', top: 16, left: 72, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    ...theme.shadows.card,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontSize: 13, fontWeight: '600', color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  bottomCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, gap: 14,
    ...theme.shadows.lg,
  },
  sheetHandle: {
    width: 40, height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.colors.primary + '18',
    justifyContent: 'center', alignItems: 'center',
  },
  customerName: {
    fontSize: 16, fontWeight: '700', color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  ratingText: {
    fontSize: 12, color: theme.colors.textLight, marginLeft: 4,
    fontFamily: 'Poppins_400Regular',
  },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.success,
    justifyContent: 'center', alignItems: 'center',
  },
  msgBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  locationCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16, padding: 16,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationDot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  locationConnector: {
    width: 2, height: 14, backgroundColor: theme.colors.border,
    marginLeft: 5, marginVertical: 5,
  },
  locationLabel: {
    fontSize: 10, color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular',
  },
  locationText: {
    fontSize: 13, fontWeight: '600', color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  fareTag: {
    backgroundColor: theme.colors.success + '18',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
  },
  fareTagText: {
    fontSize: 16, fontWeight: '700', color: theme.colors.success,
    fontFamily: 'Poppins_700Bold',
  },
  infoRow: { flexDirection: 'row', gap: 10 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  infoChipText: {
    fontSize: 13, color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
  },
  actionBtn: {
    borderRadius: 16, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    ...theme.shadows.card,
  },
  actionBtnText: {
    fontSize: 17, fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  noRideContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14,
  },
  noRideTitle: {
    fontSize: 22, fontWeight: '700', color: theme.colors.textLight,
    fontFamily: 'Poppins_700Bold',
  },
  noRideDesc: {
    fontSize: 14, color: theme.colors.textMuted,
    fontFamily: 'Poppins_400Regular', textAlign: 'center', paddingHorizontal: 40,
  },
  goHomeBtn: {
    backgroundColor: theme.colors.primary, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 8,
  },
  goHomeBtnText: {
    fontSize: 16, fontWeight: '700', color: theme.colors.dark,
    fontFamily: 'Poppins_700Bold',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  otpModalContainer: {
    width: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  otpModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  otpModalDesc: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 20,
  },
  otpInput: {
    width: 120,
    height: 56,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 10,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
  },
  otpActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    width: '100%',
  },
  cancelOtpBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cancelOtpText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  verifyOtpBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
  },
  verifyOtpText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
