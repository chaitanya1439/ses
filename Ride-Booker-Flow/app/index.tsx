import React, { useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Image,
} from "react-native";
import { router } from "expo-router";
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
  const { isAuthenticated, isLoading, user } = useAuth();
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
          // Check if profile is complete (has name)
          if (!user?.name || user.name.trim() === '') {
            router.replace("/update-profile" as any);
          } else {
            router.replace("/home");
          }
        } else {
          router.replace("/login");
        }
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isLoading, opacity, scale, user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.primary} />
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={{ width: 150, height: 150, resizeMode: 'contain' }} 
        />
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
  },
});
