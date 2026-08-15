import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const { isAuthenticated, isLoading, driver } = useAuth();
  const insets = useSafeAreaInsets();
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      if (!isLoading) {
        if (isAuthenticated) {
          // Check if driver profile is complete (has name set)
          if (!driver?.name || driver.name.trim() === '') {
            router.replace('/onboarding');
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          router.replace('/login');
        }
      }
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isLoading, isAuthenticated, logoOpacity, logoScale, driver]);

  return (
    <LinearGradient
      colors={[theme.colors.dark, theme.colors.darkCard, theme.colors.darkDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top + 67, paddingBottom: insets.bottom + 34 }]}
    >
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
        <Image 
          source={require('@/assets/images/logo.png')} 
          style={{ width: 140, height: 140, resizeMode: 'contain' }} 
        />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
