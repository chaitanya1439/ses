import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withSequence(
      withTiming(1.1, { duration: 400, easing: Easing.out(Easing.back(1.5)) }),
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1.0, { duration: 800 })
        ),
        -1,
        true
      )
    );

    const timer = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/login");
        }
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, opacity, scale]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons name="map-marker" size={64} color={Colors.dark} />
          <View style={styles.bikeOverlay}>
            <MaterialCommunityIcons name="motorbike" size={22} color={Colors.primary} />
          </View>
        </View>
        <Text style={styles.appName}>RideGo</Text>
        <Text style={styles.tagline}>Your ride, your way</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    backgroundColor: Colors.dark,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bikeOverlay: {
    position: "absolute",
    bottom: 10,
    right: 6,
  },
  appName: {
    fontSize: 40,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    letterSpacing: -1,
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    opacity: 0.7,
    letterSpacing: 0.5,
  },
});
