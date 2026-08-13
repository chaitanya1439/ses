import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform, Text } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const { isAuthenticated, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const logoScale = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const timeout = setTimeout(() => {
      if (!isLoading) {
        router.replace(isAuthenticated ? '/(tabs)/home' : '/login');
      }
    }, 2200);

    return () => clearTimeout(timeout);
  }, [isLoading, isAuthenticated, logoOpacity, logoScale, taglineOpacity, textOpacity]);

  return (
    <LinearGradient
      colors={[theme.colors.dark, theme.colors.darkCard, theme.colors.darkDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, Platform.OS === 'web' && { paddingTop: insets.top + 67, paddingBottom: insets.bottom + 34 }]}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="steering" size={72} color={theme.colors.primary} />
          </View>
          <View style={styles.glowRing} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity }}>
          <MaskedView
            style={{ height: 60, width: 220 }}
            maskElement={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.appName, { color: 'black' }]}>
                  M! tr!p pilot
                </Text>
              </View>
            }
          >
            <LinearGradient
              colors={['#FF9933', '#FFFFFF', '#138808']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </MaskedView>
        </Animated.View>

        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Earn More. Drive Free.
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { opacity: taglineOpacity, bottom: insets.bottom + 24 }]}>
        Powered by RideDriver
      </Animated.Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,184,0,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,184,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.1)',
  },
  appName: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    fontFamily: 'Poppins_700Bold',
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.primary,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Poppins_400Regular',
  },
});
