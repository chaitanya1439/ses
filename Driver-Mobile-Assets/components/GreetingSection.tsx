import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/constants/colors';

interface Props {
  driverName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function GreetingSection({ driverName }: Props) {
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [sparkleAnim]);

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.1, 0.8],
  });

  return (
    <View style={styles.container}>
      {/* Sparkle dots */}
      <View style={styles.sparkleRow}>
        {[...Array(5)].map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.sparkle,
              {
                opacity: sparkleOpacity,
                transform: [{ scale: sparkleScale }],
                backgroundColor: i % 2 === 0 ? theme.colors.planYellow : theme.colors.primary,
                left: 80 + i * 42,
                top: i % 2 === 0 ? 10 : 22,
              },
            ]}
          />
        ))}
      </View>

      {/* Illustration */}
      <View style={styles.illustrationWrapper}>
        <View style={styles.illustrationBg} />
        <Image
          source={require('@/assets/images/hand_phone_illustration.png')}
          style={styles.illustration}
          contentFit="contain"
        />
      </View>

      {/* Greeting text */}
      <Text style={styles.hi}>Hi {driverName}</Text>
      <Text style={styles.greeting}>{getGreeting()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  sparkleRow: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    height: 40,
  },
  sparkle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  illustrationWrapper: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  illustrationBg: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E3F2FD',
  },
  illustration: {
    width: 140,
    height: 140,
  },
  hi: {
    fontSize: 16,
    color: theme.colors.textLight,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
  },
});
