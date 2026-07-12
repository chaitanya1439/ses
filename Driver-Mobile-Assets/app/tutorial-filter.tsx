import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StoryLayout } from '@/components/StoryLayout';

export default function FilterTutorialScreen() {
  const icon = (
    <View style={styles.topIcon}>
      <Ionicons name="settings" size={20} color="#6B7280" />
    </View>
  );

  return (
    <StoryLayout
      currentIndex={0}
      icon={icon}
      title="Filter"
      overlayTitle="Filter options"
      overlaySub="Customize your ride experience"
    >
      <View style={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.ordersCount}>0 Orders</Text>
          <View style={styles.onPill}>
            <Text style={styles.onText}>ON</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabRow}>
          <View style={styles.tabInactive}>
            <Text style={styles.tabTextInactive}>📍 Go To</Text>
          </View>
          <View style={styles.tabActive}>
            <Text style={styles.tabTextActive}>⚙️ Services</Text>
            <View style={styles.activeUnderline} />
          </View>
        </View>

        {/* Map Area */}
        <View style={styles.mapArea}>
          <View style={styles.yellowBadge}>
            <Text style={styles.badgeText}>ORDERS</Text>
            <Text style={styles.badgeText}>FILTER</Text>
          </View>
        </View>

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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
  },
  ordersCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
  onPill: {
    backgroundColor: '#22C55E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  onText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabInactive: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabTextInactive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold',
  },
  tabActive: {
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tabTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },
  activeUnderline: {
    position: 'absolute',
    bottom: -8,
    left: 8,
    right: 8,
    height: 3,
    backgroundColor: '#EF4444',
    borderRadius: 1.5,
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E0E7FF', // Light gray-blue
    justifyContent: 'center',
    alignItems: 'center',
  },
  yellowBadge: {
    backgroundColor: '#FFB300',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  badgeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    lineHeight: 28,
  },
  bottomNav: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
    fontFamily: 'Poppins_600SemiBold',
  },
  navItemActive: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
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
