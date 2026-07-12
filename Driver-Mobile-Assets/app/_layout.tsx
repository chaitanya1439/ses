import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RideProvider } from "@/context/RideContext";
import { SocketProvider } from "@/context/SocketContext";
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
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="permissions" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="active-ride" />
      <Stack.Screen name="subscription" />
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
    </Stack>
  );
}

function SocketWrapper({ children }: { children: React.ReactNode }) {
  const { driver } = useAuth();
  if (!driver) return <>{children}</>;
  return (
    <SocketProvider 
      role="driver" 
      userId={driver.id}
      token={driver.token}
      vehicleType={driver.vehicleType}
    >
      {children}
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
