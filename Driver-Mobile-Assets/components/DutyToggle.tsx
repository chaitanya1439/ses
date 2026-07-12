import React, { useRef, useEffect } from 'react';
import { Text, Pressable, Animated, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';

interface Props {
  isOnDuty: boolean;
  onToggle: (val: boolean) => void;
}

export function DutyToggle({ isOnDuty, onToggle }: Props) {
  const translateX = useRef(new Animated.Value(isOnDuty ? 1 : 0)).current;
  const bgAnim = useRef(new Animated.Value(isOnDuty ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, { toValue: isOnDuty ? 1 : 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.timing(bgAnim, { toValue: isOnDuty ? 1 : 0, duration: 200, useNativeDriver: false }),
    ]).start();
  }, [bgAnim, isOnDuty, translateX]);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggle(!isOnDuty);
  };

  const thumbTranslate = translateX.interpolate({ inputRange: [0, 1], outputRange: [2, 26] });
  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#9CA3AF', theme.colors.success] });

  return (
    <Pressable onPress={handleToggle} style={styles.wrapper}>
      <Text style={[styles.label, { color: isOnDuty ? theme.colors.success : theme.colors.textLight }]}>
        {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
      </Text>
      <Animated.View style={[styles.track, { backgroundColor: bgColor }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: thumbTranslate }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Poppins_700Bold',
  },
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    ...theme.shadows.sm,
  },
});
