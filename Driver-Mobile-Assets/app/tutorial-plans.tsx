import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StoryLayout } from '@/components/StoryLayout';

export default function PlansTutorialScreen() {
  const icon = (
    <View style={styles.topIcon}>
      <MaterialCommunityIcons name="currency-inr" size={24} color="#FFD700" />
    </View>
  );

  return (
    <StoryLayout
      currentIndex={3}
      icon={icon}
      title="Plans"
      overlayTitle="Choose your earning plan"
      overlaySub="Pick the plan that earns you most"
    >
      <View style={styles.content}>
        {/* Dark Background wrapper inside phone */}
        <View style={styles.promoWrap}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.smallPromoText}>₹ MY ₹</Text>
            <Text style={styles.hugePromoText}>PLAN</Text>
            <Text style={styles.whiteSub}>New earning plans</Text>
          </View>

          {/* Plan Pill 1 */}
          <View style={styles.darkPill}>
            <Text style={styles.darkPillText}>Earn ₹15/km</Text>
          </View>
          
          {/* Plan Pill 2 - Highlighted */}
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>₹5/Ride Fixed</Text>
          </View>

          {/* Character illustration mock area */}
          <View style={styles.illusArea}>
            <MaterialCommunityIcons name="account-star" size={100} color="#FFD700" />
            <MaterialCommunityIcons name="cash" size={32} color="#22C55E" style={styles.floatingCash1} />
            <MaterialCommunityIcons name="cash" size={24} color="#22C55E" style={styles.floatingCash2} />
          </View>
        </View>

        {/* Bottom Nav Spacer */}
        <View style={styles.bottomNavSpace} />
        
        {/* Bottom Nav */}
        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <Text style={styles.navTextInactive}>🏠 Home</Text>
          </View>
          <View style={styles.navItemActive}>
            <Text style={styles.navTextActive}>⬇ Orders</Text>
          </View>
        </View>
      </View>
    </StoryLayout>
  );
}

const styles = StyleSheet.create({
  topIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Dark screen bg
    justifyContent: 'space-between',
  },
  promoWrap: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  smallPromoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    marginBottom: -4,
  },
  hugePromoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 2,
  },
  whiteSub: {
    fontSize: 14,
    color: '#D1D5DB',
    fontFamily: 'Poppins_400Regular',
  },

  darkPill: {
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  darkPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
  activePill: {
    backgroundColor: '#3B82F6', // Light Blue selected
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  activePillText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },

  illusArea: {
    marginTop: 20,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCash1: {
    position: 'absolute',
    top: 0,
    left: -30,
    transform: [{ rotate: '-15deg' }],
  },
  floatingCash2: {
    position: 'absolute',
    bottom: 20,
    right: -20,
    transform: [{ rotate: '25deg' }],
  },

  bottomNavSpace: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
    backgroundColor: '#1E1E1E',
    gap: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  navTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Poppins_600SemiBold',
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 20,
    paddingVertical: 10,
  },
  navTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Poppins_600SemiBold',
  },
});
