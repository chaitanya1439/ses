import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Animated,
  Easing,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { theme } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useRide } from "@/context/RideContext";

// ─── Types ───────────────────────────────────────────────────────────
type ScreenState = "scanning" | "processing" | "success" | "error";

interface ScannedPayload {
  type: string;
  bookingId: string;
  riderId: string;
  code: string;
  pickup: { lat: number; lng: number; label: string } | null;
  drop: { lat: number; lng: number; label: string } | null;
  vehicle: string;
  fare: number | null;
  ts: number;
}

// ─── Corner brackets for scanner viewfinder ──────────────────────────
function ScannerCorners({ size = 240 }: { size?: number }) {
  const cornerLength = 32;
  const cornerWidth = 4;
  const color = "#FFFFFF";

  return (
    <View style={[cs.cornerContainer, { width: size, height: size }]}>
      {/* Top Left */}
      <View style={[cs.corner, cs.topLeft]}>
        <View style={[cs.horizontal, { width: cornerLength, height: cornerWidth, backgroundColor: color }]} />
        <View style={[cs.vertical, { width: cornerWidth, height: cornerLength, backgroundColor: color }]} />
      </View>
      {/* Top Right */}
      <View style={[cs.corner, cs.topRight]}>
        <View style={[cs.horizontal, { width: cornerLength, height: cornerWidth, backgroundColor: color }]} />
        <View style={[cs.vertical, { width: cornerWidth, height: cornerLength, backgroundColor: color }]} />
      </View>
      {/* Bottom Left */}
      <View style={[cs.corner, cs.bottomLeft]}>
        <View style={[cs.horizontal, { width: cornerLength, height: cornerWidth, backgroundColor: color }]} />
        <View style={[cs.vertical, { width: cornerWidth, height: cornerLength, backgroundColor: color }]} />
      </View>
      {/* Bottom Right */}
      <View style={[cs.corner, cs.bottomRight]}>
        <View style={[cs.horizontal, { width: cornerLength, height: cornerWidth, backgroundColor: color }]} />
        <View style={[cs.vertical, { width: cornerWidth, height: cornerLength, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const cs = StyleSheet.create({
  cornerContainer: { position: "absolute", alignSelf: "center" },
  corner: { position: "absolute" },
  horizontal: { position: "absolute" },
  vertical: { position: "absolute" },
  topLeft: { top: 0, left: 0 },
  topRight: { top: 0, right: 0, alignItems: "flex-end" },
  bottomLeft: { bottom: 0, left: 0, justifyContent: "flex-end" },
  bottomRight: { bottom: 0, right: 0, alignItems: "flex-end", justifyContent: "flex-end" },
});

// ─── Scanning line animation ─────────────────────────────────────────
function ScanLine({ size = 240 }: { size?: number }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: size - 4, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [translateY, size]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        width: size - 16,
        height: 2,
        backgroundColor: theme.colors.primary,
        opacity: 0.8,
        borderRadius: 1,
        alignSelf: "center",
        transform: [{ translateY }],
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
      }}
    />
  );
}

// ─── "Starting Ride..." loading overlay ──────────────────────────────
function ProcessingOverlay() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={s.processingOverlay}>
      <Animated.View style={[s.processingIconCircle, { transform: [{ scale: pulseAnim }] }]}>
        <MaterialCommunityIcons name="car-connected" size={44} color="#FFFFFF" />
      </Animated.View>
      <Text style={s.processingTitle}>Starting Ride...</Text>
      <Text style={s.processingSubtitle}>Connecting you with the rider</Text>
      <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 16 }} />
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════
export default function DriverScannerScreen() {
  const insets = useSafeAreaInsets();
  const { driver } = useAuth();
  const { sendMessage, subscribe, isConnected } = useSocket();
  const { syncRide } = useRide();

  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [screenState, setScreenState] = useState<ScreenState>("scanning");
  const [_scannedData, setScannedData] = useState<ScannedPayload | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState("");
  const inputRef = useRef<import("react-native").TextInput>(null);
  const [retryCount, setRetryCount] = useState(0);
  const scanLockRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 2000;

  // ── Request camera permission on mount ──
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // ── Trigger ride start with auto-retry ──
  const triggerRideStart = useCallback(
    (data: ScannedPayload) => {
      let attempts = 0;

      const attempt = () => {
        attempts++;
        setRetryCount(attempts);

        sendMessage("tatkal_ride_start", {
          bookingId: data.bookingId,
          riderId: data.riderId,
          driverId: driver?.id || "driver",
          driverName: driver?.name || "Driver",
          code: data.code,
          pickup: data.pickup,
          drop: data.drop,
          vehicle: data.vehicle,
          fare: data.fare,
        });

        // Set up retry if no confirmation within RETRY_DELAY
        if (attempts < MAX_RETRIES) {
          retryTimerRef.current = setTimeout(() => {
            if (screenState !== "success") {
              console.log(`[Scanner] Retry attempt ${attempts + 1}/${MAX_RETRIES}`);
              attempt();
            }
          }, RETRY_DELAY_MS);
        } else {
          setScreenState("error");
        }
      };

      attempt();
    },
    [sendMessage, driver?.id, driver?.name, screenState]
  );

  // ── Handle successful QR scan ──
  const handleBarCodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (scanLockRef.current || screenState !== "scanning") return;
      scanLockRef.current = true;

      try {
        const data: ScannedPayload = JSON.parse(result.data);

        if (data.type !== "tatkal_ride" || !data.bookingId) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          scanLockRef.current = false;
          return;
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setScannedData(data);
        setScreenState("processing");
        triggerRideStart(data);
      } catch (e) {
        console.warn("[Scanner] Invalid QR data:", e);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          scanLockRef.current = false;
        }, 1500);
      }
    },
    [screenState, triggerRideStart]
  );

  // ── Listen for ride confirmation from server ──
  useEffect(() => {
    const unsub = subscribe("tatkal_ride_confirmed", (payload: any) => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreenState("success");

      // Format payload for syncRide
      const ride = {
        id: `R${Date.now()}`,
        customer: {
          id: payload.riderId,
          name: payload.driverName || 'Rider', // backend sends driverName for both sometimes, but we just use Rider
          rating: 4.8,
        },
        pickup: {
          address: payload.pickup?.label || 'Pickup Location',
          lat: payload.pickup?.lat || 17.385,
          lng: payload.pickup?.lng || 78.4867,
        },
        drop: payload.drop?.lat ? {
          address: payload.drop.label || 'Dropoff Location',
          lat: payload.drop.lat,
          lng: payload.drop.lng,
        } : null,
        distance: '5.0 km',
        fare: payload.fare ? Number(payload.fare) : 150,
        type: payload.vehicle || 'Auto',
        riderId: payload.riderId,
        otp: payload.code || '1234'
      };

      // Sync the ride context before navigating
      syncRide(ride as any, 'started');

      // Navigate to active ride after brief success display
      setTimeout(() => {
        router.replace("/active-ride");
      }, 2000);
    });

    return () => {
      unsub();
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [subscribe]);

  // ── Manual code submission ──
  const handleManualSubmit = useCallback(() => {
    const code = manualCode.trim();
    if (code.length !== 4 || !/^\d{4}$/.test(code)) {
      setManualError("Please enter a valid 4-digit code");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setManualError("");
    setShowManualModal(false);
    setScreenState("processing");

    const manualPayload: ScannedPayload = {
      type: "tatkal_ride",
      bookingId: `MANUAL-${Date.now().toString(36).toUpperCase()}`,
      riderId: "manual-entry",
      code,
      pickup: null,
      drop: null,
      vehicle: "auto",
      fare: null,
      ts: Date.now(),
    };

    setScannedData(manualPayload);
    triggerRideStart(manualPayload);
  }, [manualCode, triggerRideStart]);

  // ── Reset scanner after error ──
  const handleRetry = useCallback(() => {
    scanLockRef.current = false;
    setScreenState("scanning");
    setScannedData(null);
    setRetryCount(0);
    setManualCode("");
    setManualError("");
  }, []);

  // ── Torch toggle ──
  const toggleTorch = useCallback(() => {
    setTorchOn((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // ── Permission not granted state ──
  if (!permission?.granted) {
    return (
      <View style={[s.container, s.centeredContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <View style={s.permissionCard}>
          <Ionicons name="camera-outline" size={48} color={theme.colors.primary} />
          <Text style={s.permissionTitle}>Camera Access Required</Text>
          <Text style={s.permissionSubtitle}>
            To scan rider QR codes, please grant camera permission
          </Text>
          <Pressable style={s.permissionBtn} onPress={requestPermission}>
            <Text style={s.permissionBtnText}>Grant Permission</Text>
          </Pressable>
          <Pressable
            style={s.manualEntryLink}
            onPress={() => setShowManualModal(true)}
          >
            <MaterialCommunityIcons name="keyboard-outline" size={18} color={theme.colors.primary} />
            <Text style={s.manualEntryLinkText}>Enter Code Manually</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ── Processing state ──
  if (screenState === "processing") {
    return (
      <View style={[s.container, s.centeredContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <ProcessingOverlay />
        {retryCount > 1 && (
          <Text style={s.retryText}>
            Syncing... attempt {retryCount}/{MAX_RETRIES}
          </Text>
        )}
      </View>
    );
  }

  // ── Success state ──
  if (screenState === "success") {
    return (
      <View style={[s.container, s.centeredContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <View style={s.successCircle}>
          <Ionicons name="checkmark" size={56} color="#FFFFFF" />
        </View>
        <Text style={s.successTitle}>Ride Started!</Text>
        <Text style={s.successSubtitle}>You are now connected with the rider</Text>
      </View>
    );
  }

  // ── Error state ──
  if (screenState === "error") {
    return (
      <View style={[s.container, s.centeredContent, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.surface} />
        <View style={s.errorCircle}>
          <Ionicons name="cloud-offline-outline" size={48} color="#FFFFFF" />
        </View>
        <Text style={s.errorTitle}>Connection Failed</Text>
        <Text style={s.errorSubtitle}>
          Unable to start the ride after {MAX_RETRIES} attempts. Check your network and try again.
        </Text>
        <Pressable style={s.retryBtn} onPress={handleRetry}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={s.retryBtnText}>Try Again</Text>
        </Pressable>
        <Pressable
          style={s.manualEntryLink}
          onPress={() => {
            handleRetry();
            setShowManualModal(true);
          }}
        >
          <MaterialCommunityIcons name="keyboard-outline" size={18} color={theme.colors.primary} />
          <Text style={s.manualEntryLinkText}>Enter Code Manually</Text>
        </Pressable>
      </View>
    );
  }

  // ── Scanning state (main UI) ──
  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Dark overlay with cutout effect */}
      <View style={s.overlayTop} />
      <View style={s.overlayRow}>
        <View style={s.overlaySide} />
        <View style={s.scanArea}>
          <ScannerCorners size={240} />
          <ScanLine size={240} />
        </View>
        <View style={s.overlaySide} />
      </View>
      <View style={s.overlayBottom} />

      {/* Header controls */}
      <View style={[s.scanHeader, { top: insets.top + 8 }]}>
        <Pressable
          style={s.scanHeaderBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.scanHeaderTitle}>Scan Rider QR</Text>
        <View style={s.scanHeaderRight}>
          <View style={[s.liveIndicator, { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }]}>
            <View style={[s.liveDot, { backgroundColor: isConnected ? "#4ade80" : "#f87171" }]} />
            <Text style={s.liveText}>{isConnected ? "Live" : "Offline"}</Text>
          </View>
        </View>
      </View>

      {/* Instruction text below scanner */}
      <View style={s.scanInstruction}>
        <Text style={s.scanInstructionText}>
          Point your camera at the rider&apos;s QR code
        </Text>
      </View>

      {/* Bottom controls */}
      <View style={[s.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
        {/* Torch button */}
        <Pressable
          style={[s.controlBtn, torchOn && s.controlBtnActive]}
          onPress={toggleTorch}
        >
          <Ionicons
            name={torchOn ? "flashlight" : "flashlight-outline"}
            size={24}
            color={torchOn ? theme.colors.dark : "#FFFFFF"}
          />
          <Text style={[s.controlBtnText, torchOn && s.controlBtnTextActive]}>
            {torchOn ? "Torch On" : "Torch"}
          </Text>
        </Pressable>

        {/* Manual entry button */}
        <Pressable
          style={s.manualBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowManualModal(true);
          }}
        >
          <MaterialCommunityIcons name="keyboard-outline" size={22} color={theme.colors.dark} />
          <Text style={s.manualBtnText}>Enter Code Manually</Text>
        </Pressable>
      </View>

      {/* ── Manual Code Entry Modal ── */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowManualModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalBackdrop}
        >
          <Pressable style={s.modalBackdropPress} onPress={() => setShowManualModal(false)} />
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Enter Verification Code</Text>
            <Text style={s.modalSubtitle}>
              Ask the rider for their 4-digit code shown below the QR
            </Text>

            <Pressable style={s.modalInputRow} onPress={() => inputRef.current?.focus()}>
              {[0, 1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={[
                    s.modalDigitBox,
                    manualCode.length === i && s.modalDigitBoxActive,
                    manualError ? s.modalDigitBoxError : null,
                  ]}
                >
                  <Text style={s.modalDigitText}>
                    {manualCode[i] || ""}
                  </Text>
                </View>
              ))}
            </Pressable>

            {/* Hidden TextInput to capture keyboard */}
            <TextInput
              ref={inputRef}
              style={s.hiddenInput}
              value={manualCode}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, "").slice(0, 4);
                setManualCode(cleaned);
                setManualError("");
              }}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              caretHidden
            />

            {manualError ? (
              <Text style={s.modalError}>{manualError}</Text>
            ) : null}

            <Pressable
              style={[s.modalSubmitBtn, manualCode.length < 4 && s.modalSubmitBtnDisabled]}
              onPress={handleManualSubmit}
              disabled={manualCode.length < 4}
            >
              <Text style={s.modalSubmitBtnText}>Start Ride</Text>
            </Pressable>

            <Pressable
              style={s.modalCancelBtn}
              onPress={() => {
                setShowManualModal(false);
                setManualCode("");
                setManualError("");
              }}
            >
              <Text style={s.modalCancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  centeredContent: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },

  // Camera overlay
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  overlayRow: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  scanArea: {
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  overlayBottom: {
    flex: 1.4,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  // Header
  scanHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  scanHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  scanHeaderRight: {
    width: 44,
    alignItems: "flex-end",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: "#FFFFFF",
  },

  // Scan instruction
  scanInstruction: {
    position: "absolute",
    bottom: "30%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scanInstructionText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: "#FFFFFF",
    opacity: 0.8,
    textAlign: "center",
  },

  // Bottom controls
  bottomControls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  controlBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: 72,
    height: 72,
    borderRadius: theme.radius.lg,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  controlBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  controlBtnText: {
    fontSize: 10,
    fontFamily: "Poppins_500Medium",
    color: "#FFFFFF",
  },
  controlBtnTextActive: {
    color: theme.colors.dark,
  },
  manualBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  manualBtnText: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },

  // Permission
  permissionCard: {
    alignItems: "center",
    gap: 16,
    marginHorizontal: 32,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 32,
    ...theme.shadows.lg,
  },
  permissionTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
    textAlign: "center",
  },
  permissionSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.textLight,
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  permissionBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },

  // Manual entry link
  manualEntryLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  manualEntryLinkText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: theme.colors.primary,
  },

  // Processing
  processingOverlay: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  processingIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.lg,
  },
  processingTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },
  processingSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.textLight,
  },
  retryText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: theme.colors.textLight,
    marginTop: 12,
  },

  // Success
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.success,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...theme.shadows.lg,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },
  successSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.textLight,
    marginTop: 8,
  },

  // Error
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    ...theme.shadows.lg,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.textLight,
    textAlign: "center",
    marginHorizontal: 32,
    lineHeight: 22,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 24,
  },
  retryBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },

  // Manual Code Modal
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdropPress: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
  },
  modalSheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: theme.colors.textLight,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  modalInputRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  modalDigitBox: {
    width: 60,
    height: 72,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  modalDigitBoxActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "10",
  },
  modalDigitBoxError: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerLight,
  },
  modalDigitText: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0.01,
    width: "100%",
    height: "100%",
    zIndex: -1,
  },
  modalError: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: theme.colors.danger,
    marginBottom: 8,
  },
  modalSubmitBtn: {
    width: "100%",
    height: 56,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  modalSubmitBtnDisabled: {
    opacity: 0.4,
  },
  modalSubmitBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.dark,
  },
  modalCancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: theme.colors.danger,
  },
});
