import React, { useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const BUTTON_HEIGHT = 64;
const KNOB_SIZE = 56;

interface SwipeButtonProps {
  onSwipeSuccess: () => void;
  title?: string;
}

export default function SwipeButton({ onSwipeSuccess, title = 'Slide to confirm' }: SwipeButtonProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [completed, setCompleted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  // Use refs so PanResponder always reads the latest values
  const containerWidthRef = useRef(0);
  const completedRef = useRef(false);
  const onSwipeSuccessRef = useRef(onSwipeSuccess);
  onSwipeSuccessRef.current = onSwipeSuccess;

  const panResponder = useMemo(
    () => PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dx) > 5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (e, gesture) => {
        if (completedRef.current || containerWidthRef.current === 0) return;
        const SWIPE_THRESHOLD = containerWidthRef.current - KNOB_SIZE - 8;
        if (gesture.dx > 0 && gesture.dx < SWIPE_THRESHOLD) {
          pan.setValue({ x: gesture.dx, y: 0 });
        } else if (gesture.dx >= SWIPE_THRESHOLD) {
          pan.setValue({ x: SWIPE_THRESHOLD, y: 0 });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (completedRef.current || containerWidthRef.current === 0) return;
        const SWIPE_THRESHOLD = containerWidthRef.current - KNOB_SIZE - 8;
        if (gesture.dx >= SWIPE_THRESHOLD * 0.8) {
          Animated.timing(pan, {
            toValue: { x: SWIPE_THRESHOLD, y: 0 },
            duration: 150,
            useNativeDriver: false,
          }).start(() => {
            completedRef.current = true;
            setCompleted(true);
            onSwipeSuccessRef.current();
            // Reset after a delay
            setTimeout(() => {
              completedRef.current = false;
              setCompleted(false);
              pan.setValue({ x: 0, y: 0 });
            }, 1000);
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    }),
    [pan],
  );

  return (
    <View 
      style={styles.container}
      onLayout={(e: LayoutChangeEvent) => {
        const width = e.nativeEvent.layout.width;
        containerWidthRef.current = width;
        setContainerWidth(width);
      }}
    >
      <LinearGradient
        colors={['#10B981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      <Text style={styles.title}>{completed ? 'Confirmed' : title}</Text>
      
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.knob,
            { transform: [{ translateX: pan.x }] }
          ]}
          {...panResponder.panHandlers}
        >
          <Ionicons name="chevron-forward" size={28} color="#059669" />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.15,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#059669',
  },
  knob: {
    position: 'absolute',
    left: 4,
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
