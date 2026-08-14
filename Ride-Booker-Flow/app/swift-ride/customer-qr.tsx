import React, { useEffect, useRef, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Animated,
  Easing,
  Platform,
  Share,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as Brightness from "expo-brightness";
import QRCode from "react-native-qrcode-svg";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";
import { useSocket } from "@/contexts/SocketContext";
import { LinearGradient } from "expo-linear-gradient";

// ─── Generate 4-digit unique code ────────────────────────────────────
function generateFallbackCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// ─── Countdown timer component ───────────────────────────────────────
function CountdownTimer({ seconds, onExpired }: { seconds: number; onExpired: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onExpired();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining, onExpired]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <View style={s.timerRow}>
      <Ionicons name="time-outline" size={16} color={Colors.grey} />
      <Text style={s.timerText}>
        Expires in {mins}:{secs.toString().padStart(2, "0")}
      </Text>
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
export default function CustomerQRScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { pickup, drop, selectedVehicle, fare } = useBooking();
  const { subscribe, isConnected } = useSocket();
  const params = useLocalSearchParams();

  // ── Generate unique booking payload & code ──
  const bookingId = useMemo(
    () => params.bookingId as string || `BK-${Date.now().toString(36).toUpperCase()}`,
    [params.bookingId]
  );
  const fallbackCode = useMemo(() => {
    return (params.fallbackCode as string) || generateFallbackCode();
  }, [params.fallbackCode]);

  const qrPayload = useMemo(
    () =>
      JSON.stringify({
        type: "swift_ride",
        bookingId,
        riderId: user?.id || "anonymous",
        code: fallbackCode,
        pickup: pickup
          ? { lat: pickup.lat, lng: pickup.lng, label: pickup.address }
          : null,
        drop: drop
          ? { lat: drop.lat, lng: drop.lng, label: drop.address }
          : null,
        vehicle: selectedVehicle || "auto",
        fare: fare || null,
        ts: Date.now(),
      }),
    [bookingId, fallbackCode, user?.id, pickup, drop, selectedVehicle, fare]
  );

  // ── Brightness: crank to max on mount, restore on unmount ──
  const originalBrightness = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const current = await Brightness.getBrightnessAsync();
        if (mounted) originalBrightness.current = current;
        await Brightness.setBrightnessAsync(1); // Max brightness
      } catch (e) {
        console.warn("[Brightness] Could not set brightness:", e);
      }
    })();

    return () => {
      mounted = false;
      if (originalBrightness.current !== null) {
        Brightness.setBrightnessAsync(originalBrightness.current).catch(() => {});
      }
    };
  }, []);

  // ── Listen for ride_started event from driver scan ──
  const [rideStarted, setRideStarted] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsub = subscribe("swift_ride_started", (payload: any) => {
      if (payload?.bookingId === bookingId || payload?.code === fallbackCode) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRideStarted(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // Navigate to booking confirmed after brief success display
          setTimeout(() => {
            router.replace({
              pathname: "/booking-confirmed",
              params: { payload: JSON.stringify(payload) },
            });
          }, 1500);
        });
      }
    });
    return () => unsub();
  }, [subscribe, bookingId, fallbackCode, fadeAnim]);

  // ── QR code expired? ──
  const [expired, setExpired] = useState(false);
  const handleExpired = useCallback(() => setExpired(true), []);
  const handleRegenerate = useCallback(() => {
    setExpired(false);
    // In real production, you'd generate a new bookingId/code + notify server
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Shimmer animation for card ──
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const borderOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  // ── Ride started success overlay ──
  if (rideStarted) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <Animated.View style={[s.successOverlay, { opacity: fadeAnim }]}>
          <View style={s.successIconCircle}>
            <Ionicons name="checkmark" size={48} color={Colors.white} />
          </View>
          <Text style={s.successTitle}>Ride Started!</Text>
          <Text style={s.successSubtitle}>
            Your driver has verified the QR code
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* ── Header ── */}
      <View style={s.header}>
        <Pressable
          style={s.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
        <Text style={s.headerTitle}>Show QR to Driver</Text>
        <View style={s.connectionBadge}>
          <View style={[s.connectionDot, { backgroundColor: isConnected ? Colors.success : Colors.danger }]} />
          <Text style={[s.connectionText, { color: isConnected ? Colors.success : Colors.danger }]}>
            {isConnected ? "Live" : "Offline"}
          </Text>
        </View>
      </View>

      {/* ── Instruction ── */}
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={s.instructionRow}>
        <MaterialCommunityIcons name="qrcode-scan" size={20} color={Colors.accent} />
        <Text style={s.instructionText}>
          Let the driver scan this QR code to start your Swift ride
        </Text>
      </View>

      {/* ── QR Card ── */}
      <View style={s.qrCardOuter}>
        <View style={s.qrCard}>
          {expired ? (
            <View style={s.expiredOverlay}>
              <Ionicons name="time-outline" size={48} color={Colors.grey} />
              <Text style={s.expiredText}>QR Code Expired</Text>
              <Pressable style={s.regenerateBtn} onPress={handleRegenerate}>
                <Ionicons name="refresh" size={18} color={Colors.white} />
                <Text style={s.regenerateBtnText}>Generate New</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <QRCode
                value={qrPayload}
                size={220}
                color={Colors.dark}
                backgroundColor={Colors.white}
                ecl="M"
              />
              <CountdownTimer seconds={300} onExpired={handleExpired} />
            </>
          )}
        </View>
      </View>

      {/* ── Fallback Code ── */}
      <View style={s.fallbackCard}>
        <View style={s.fallbackHeader}>
          <MaterialCommunityIcons name="shield-key-outline" size={20} color={Colors.accent} />
          <Text style={s.fallbackLabel}>Manual Verification Code</Text>
        </View>
        <View style={s.codeRow}>
          {fallbackCode.split("").map((digit, i) => (
            <View key={i} style={s.codeDigitBox}>
              <Text style={s.codeDigit}>{digit}</Text>
            </View>
          ))}
        </View>
        <Text style={s.fallbackHint}>
          If the driver can't scan the QR, share this code verbally
        </Text>
      </View>

      {/* ── Trip Summary ── */}
      <View style={s.tripSummary}>
        <View style={s.tripRow}>
          <View style={s.tripDot} />
          <Text style={s.tripAddress} numberOfLines={1}>
            {pickup?.address || "Pickup location"}
          </Text>
        </View>
        <View style={s.tripDivider} />
        <Pressable 
          style={[s.tripRow, { paddingVertical: 4 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/search?returnTo=true" as any);
          }}
        >
          <View style={[s.tripDot, { backgroundColor: Colors.dark }]} />
          <Text style={[s.tripAddress, !drop && { color: Colors.grey }]} numberOfLines={1}>
            {drop?.address || "Enter drop location (optional)"}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.grey} />
        </Pressable>
        {fare ? (
          <View style={s.fareRow}>
            <Text style={s.fareLabel}>Estimated Fare</Text>
            <Text style={s.fareValue}>₹{fare}</Text>
          </View>
        ) : null}
      </View>

      {/* ── Bottom info ── */}
      <View style={[s.bottomInfo, { paddingBottom: insets.bottom + 16 }]}>
        <Ionicons name="information-circle-outline" size={16} color={Colors.grey} />
        <Text style={s.bottomInfoText}>
          Screen brightness has been set to maximum for easy scanning
        </Text>
      </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    textAlign: "center",
    marginRight: 44,
  },
  connectionBadge: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connectionText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
  },

  // Instruction
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: Colors.accent + "0D",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.accent + "1A",
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.darkSecondary,
    lineHeight: 20,
  },

  // QR Card
  qrCardOuter: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  qrCard: {
    width: 268,
    height: 268,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },

  // Timer
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  timerText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },

  // Expired
  expiredOverlay: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  expiredText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.grey,
  },
  regenerateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },

  // Fallback Code
  fallbackCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  fallbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  fallbackLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  codeDigitBox: {
    width: 56,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + "08",
    borderWidth: 2,
    borderColor: Colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  codeDigit: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    letterSpacing: 2,
  },
  fallbackHint: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    textAlign: "center",
  },

  // Trip Summary
  tripSummary: {
    marginHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tripDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.accent + "40",
  },
  tripDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginVertical: 4,
  },
  tripAddress: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.darkSecondary,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  fareLabel: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },
  fareValue: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },

  // Bottom info
  bottomInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: "auto",
    paddingHorizontal: 20,
  },
  bottomInfoText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },

  // Success Overlay
  successOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
});
