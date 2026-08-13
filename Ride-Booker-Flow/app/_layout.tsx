import "react-native-url-polyfill/auto";
import "react-native-get-random-values";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { BookingProvider, useBooking } from "@/contexts/BookingContext";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
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
  const { selectedVehicle } = useBooking();

  useEffect(() => {
    const unsub = subscribe("ride_accepted", (payload: any) => {
      console.log(`[Global] ride_accepted received, navigating to ${selectedVehicle === 'parcel' ? 'parcel-confirmed' : 'booking-confirmed'}`);
      
      if (selectedVehicle === "parcel" || payload?.type === "parcel") {
        router.push({
          pathname: "/parcel-confirmed",
          params: { payload: JSON.stringify(payload) },
        });
      } else {
        router.push({
          pathname: "/booking-confirmed",
          params: { payload: JSON.stringify(payload) },
        });
      }
    });
    return () => unsub();
  }, [subscribe, selectedVehicle]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="search" />
      <Stack.Screen name="ride-map" />
      <Stack.Screen name="book-ride" />
      <Stack.Screen name="confirm-pickup" />
      <Stack.Screen name="driver-search" />
      <Stack.Screen name="ride-options" />
      <Stack.Screen name="booking-confirmed" />
      <Stack.Screen name="parcel-locations" />
      <Stack.Screen name="review-delivery" />
      <Stack.Screen name="parcel-confirmed" />
      <Stack.Screen name="my-rides" />
      <Stack.Screen name="instant-ride" />
    </Stack>
  );
}

function SocketWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return <>{children}</>;
  
  const handleForceLogout = async () => {
    alert("You have been logged out because another app is active on this device.");
    await logout();
    router.replace('/login');
  };

  return (
    <SocketProvider 
      role="rider" 
      userId={user.id} 
      token={user.token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InJpZGVyLTAwMSIsInJvbGUiOiJyaWRlciJ9.pz5qZubhjBOCuM-BwbaImq21Hfm-4Iu_W4NF3JL2_ig"}
      onForceLogout={handleForceLogout}
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
              <BookingProvider>
                <SocketWrapper>
                  <RootLayoutNav />
                </SocketWrapper>
              </BookingProvider>
            </AuthProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
