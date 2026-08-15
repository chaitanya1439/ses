import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RideProvider } from "@/context/RideContext";
import { SocketProvider, useSocket } from "@/context/SocketContext";
import { RiderModeProvider } from "@/context/RiderModeContext";
import { RideRequestPopup } from "@/components/RideRequestPopup";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { subscribe } = useSocket();

  useEffect(() => {
    const unsub = subscribe("ride_accepted", (payload: any) => {
      console.log(`[Rider Mode] ride_accepted received, navigating to rider-booking-confirmed`);
      router.push({
        pathname: "/rider-booking-confirmed" as any,
        params: { payload: JSON.stringify(payload) },
      });
    });
    return () => unsub();
  }, [subscribe]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="active-ride" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="registration-fee" />
      <Stack.Screen name="parcel-delivery" />
      <Stack.Screen name="driver-id-card" />
      <Stack.Screen name="profile-info" />
      <Stack.Screen name="performance" />
      <Stack.Screen name="driving-license" />
      <Stack.Screen name="demand-planner" />
      <Stack.Screen name="service-manager" />
      <Stack.Screen name="refer-earn" />
      <Stack.Screen name="earnings-overview" />
      <Stack.Screen name="all-orders" />
      <Stack.Screen name="driver-rewards" />
      <Stack.Screen name="rate-card" />
      <Stack.Screen name="subscription-plans" />
      <Stack.Screen name="subscription-confirm" />
      <Stack.Screen name="insurances" />
      <Stack.Screen name="accidental-insurance" />
      <Stack.Screen name="tutorial-filter" />
      <Stack.Screen name="tutorial-funny" />
      <Stack.Screen name="tutorial-goto" />
      <Stack.Screen name="tutorial-plans" />
      <Stack.Screen name="notification" />
      <Stack.Screen name="go-to-area" />
      <Stack.Screen name="driver-scanner" />
      <Stack.Screen name="rider-booking-confirmed" />
    </Stack>
  );
}

function SocketWrapper({ children }: { children: React.ReactNode }) {
  const { driver, logout } = useAuth();
  if (!driver) return <>{children}</>;
  
  const handleForceLogout = async () => {
    // Disabled for now as requested by user
    // alert("You have been logged out because another app is active on this device.");
    // await logout();
    // router.replace('/login');
  };

  return (
    <SocketProvider 
      role="driver" 
      userId={driver.id}
      token={driver.token}
      vehicleType={driver.vehicleType}
      onForceLogout={handleForceLogout}
    >
      <RiderModeProvider>
        {children}
      </RiderModeProvider>
    </SocketProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <AuthProvider>
              <RideProvider>
                <SocketWrapper>
                  <RootLayoutNav />
                  <RideRequestPopup />
                </SocketWrapper>
              </RideProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
