import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface Props {
  currentIndex: number;
  icon: React.ReactNode;
  title: string;
  overlayTitle?: string;
  overlaySub?: string;
  children: React.ReactNode;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PHONE_WIDTH = SCREEN_WIDTH * 0.75;
const PHONE_HEIGHT = PHONE_WIDTH * 1.9; // Approximate phone aspect ratio

export function StoryLayout({
  currentIndex,
  icon,
  title,
  overlayTitle,
  overlaySub,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 20);

  // Define routing order
  const ROUTES = [
    '/tutorial-filter',
    '/tutorial-funny',
    '/tutorial-goto',
    '/tutorial-plans',
  ];

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < 3) {
      router.replace(ROUTES[currentIndex + 1] as any);
    } else {
      router.back();
    }
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex > 0) {
      router.replace(ROUTES[currentIndex - 1] as any);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.dismissAll();
  };

  return (
    <View style={styles.root}>
      {/* Tap zones for story navigation */}
      <Pressable style={styles.leftTapZone} onPress={handlePrev} />
      <Pressable style={styles.rightTapZone} onPress={handleNext} />

      {/* ─── PROGRESS BARS ─── */}
      <View style={[styles.progressContainer, { top: topPad }]}>
        {[0, 1, 2, 3].map((idx) => (
          <View key={idx} style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: idx <= currentIndex ? '100%' : '0%' },
              ]}
            />
          </View>
        ))}
      </View>

      {/* ─── TOP BAR ─── */}
      <View style={[styles.topBar, { top: topPad + 16 }]}>
        <View style={styles.topBarLeft}>
          {icon}
          <Text style={styles.topBarTitle}>{title}</Text>
        </View>
        <View style={styles.topBarRight}>
          <Pressable
            hitSlop={12}
            onPress={() => Haptics.selectionAsync()}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-redo-outline" size={24} color="#FFFFFF" />
          </Pressable>
          <Pressable hitSlop={12} onPress={handleClose} style={styles.iconBtn}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* ─── CENTER PHONE MOCKUP ─── */}
      <View style={styles.phoneContainer}>
        <View style={styles.phoneMockup}>
          {/* Fake Status Bar */}
          <View style={styles.fakeStatusBar}>
            <Text style={styles.fakeTime}>10:45</Text>
            <View style={styles.fakeIcons}>
              <Ionicons name="cellular" size={12} color="#1A1A2E" />
              <Ionicons name="wifi" size={14} color="#1A1A2E" />
              <Ionicons name="battery-full" size={14} color="#1A1A2E" />
            </View>
          </View>

          {/* Screen Content */}
          <View style={styles.phoneContent}>{children}</View>
        </View>
      </View>

      {/* ─── TEXT OVERLAY ─── */}
      {(overlayTitle || overlaySub) && (
        <View style={[styles.textOverlay, { bottom: insets.bottom + 40 }]}>
          {overlayTitle && <Text style={styles.overlayTitle}>{overlayTitle}</Text>}
          {overlaySub && <Text style={styles.overlaySub}>{overlaySub}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#3A3A3A',
  },

  /* Tap Zones for Story Navigation */
  leftTapZone: {
    position: 'absolute',
    top: 100,
    bottom: 0,
    left: 0,
    width: '30%',
    zIndex: 10,
  },
  rightTapZone: {
    position: 'absolute',
    top: 100,
    bottom: 0,
    right: 0,
    width: '70%',
    zIndex: 10,
  },

  /* Progress Bars */
  progressContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 20,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  /* Top Bar */
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBtn: {
    zIndex: 30, // Higher than tap zones
  },

  /* Phone Mockup */
  phoneContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneMockup: {
    width: PHONE_WIDTH,
    height: PHONE_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    borderWidth: 6,
    borderColor: '#000000',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 24,
  },
  fakeStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    zIndex: 5,
  },
  fakeTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },
  fakeIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* Text Overlay */
  textOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 20,
  },
  overlayTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  overlaySub: {
    fontSize: 14,
    color: '#D1D5DB',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
});
