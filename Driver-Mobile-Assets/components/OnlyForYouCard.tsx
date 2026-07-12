import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/constants/colors';

export function OnlyForYouCard() {
  return (
    <View style={styles.section}>
      {/* Section header */}
      <Text style={styles.sectionHeader}>🌊 Only for you 🌊</Text>

      {/* Dark promo card */}
      <View style={styles.card}>
        {/* Left content */}
        <View style={styles.leftContent}>
          <Text style={styles.myPlanHeader}>₹ MY ₹</Text>
          <Text style={styles.planTitle}>PLAN</Text>
          <Text style={styles.planSubtext}>New earning plans</Text>

          {/* Option pills */}
          <View style={styles.optionsContainer}>
            <View style={styles.optionPill}>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>1</Text>
              </View>
              <Text style={styles.optionText}>Earn ₹9/km</Text>
            </View>

            <View style={[styles.optionPill, styles.highlightedPill]}>
              <View style={[styles.optionNumber, styles.highlightedNumber]}>
                <Text style={[styles.optionNumberText, styles.highlightedNumberText]}>2</Text>
              </View>
              <Text style={[styles.optionText, styles.highlightedText]}>₹5/Ride Fixed commission</Text>
            </View>

            <View style={styles.optionPill}>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>3</Text>
              </View>
              <Text style={styles.optionText}>16% Commission</Text>
            </View>
          </View>
        </View>

        {/* Right character illustration */}
        <View style={styles.characterWrapper}>
          <Image
            source={require('@/assets/images/excited_character.png')}
            style={styles.character}
            contentFit="contain"
          />
        </View>

        {/* Floating ₹ decorations */}
        <Text style={[styles.floatingRupee, { top: 12, right: 50 }]}>₹</Text>
        <Text style={[styles.floatingRupee, { bottom: 30, right: 20, fontSize: 14 }]}>₹</Text>
        <Text style={[styles.floatingRupee, { top: 40, left: 10, fontSize: 10 }]}>₹</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  card: {
    backgroundColor: theme.colors.planCardBg,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 220,
  },
  leftContent: {
    flex: 1,
    zIndex: 2,
  },
  myPlanHeader: {
    fontSize: 12,
    color: theme.colors.planYellow,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 0,
  },
  planTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: theme.colors.planYellow,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 48,
    marginBottom: 2,
  },
  planSubtext: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 14,
    opacity: 0.9,
  },
  optionsContainer: {
    gap: 6,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  highlightedPill: {
    backgroundColor: '#E3F2FD',
  },
  optionNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightedNumber: {
    backgroundColor: theme.colors.teal,
  },
  optionNumberText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  highlightedNumberText: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  highlightedText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  characterWrapper: {
    position: 'absolute',
    right: -10,
    bottom: 0,
    width: 130,
    height: 180,
    zIndex: 1,
  },
  character: {
    width: '100%',
    height: '100%',
  },
  floatingRupee: {
    position: 'absolute',
    fontSize: 18,
    color: theme.colors.planYellow,
    opacity: 0.4,
    fontWeight: '700',
    zIndex: 0,
  },
});
