import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StoryLayout } from '@/components/StoryLayout';

export default function GoToTutorialScreen() {
  const icon = (
    <View style={styles.topIcon}>
      <MaterialCommunityIcons name="heart-pulse" size={24} color="#EC4899" />
    </View>
  );

  return (
    <StoryLayout
      currentIndex={2}
      icon={icon}
      title="Go To"
      overlayTitle="Find high demand zones"
      overlaySub="Navigate to earn more ₹/km"
    >
      <View style={styles.content}>
        {/* Fake Map Area */}
        <View style={styles.mapArea}>
          {/* Mock Polygon Zone */}
          <View style={styles.zonePolygon}>
            <View style={styles.zoneBadge}>
              <Text style={styles.zoneBadgeText}>₹12/km Guaranteed Earn...</Text>
            </View>
          </View>
          {/* Current Location Dot */}
          <View style={styles.myLocationDot}>
            <View style={styles.myLocationDotInner} />
          </View>
          {/* My Location Pill */}
          <View style={styles.myLocationBtn}>
            <Text style={styles.myLocationBtnText}>📍 My Location</Text>
          </View>
        </View>

        {/* Slide-up Bottom Sheet Mockup */}
        <View style={styles.bottomSheet}>
          <Text style={styles.sheetTitle}>Explore Nearby Areas</Text>
          <View style={styles.grid}>
            {[
              { label: 'Mall', icon: 'shopping', color: '#DBEAFE' },
              { label: 'Petrol Bunk', icon: 'gas-station', color: '#FCE7F3' },
              { label: 'ATM', icon: 'cash', color: '#FEF3C7' },
              { label: 'Bus Stop', icon: 'bus-stop', color: '#D1FAE5' },
              { label: 'Restaurant', icon: 'silverware', color: '#FFEDD5' },
              { label: 'Hospital', icon: 'hospital', color: '#E0E7FF' },
            ].map((item, idx) => (
              <View key={idx} style={styles.gridItem}>
                <View style={[styles.gridIconWrap, { backgroundColor: item.color }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color="#1A1A2E" />
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </View>
            ))}
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
  mapArea: {
    flex: 1,
    backgroundColor: '#E5E5E5', // generic map background
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zonePolygon: {
    position: 'absolute',
    top: 20,
    width: '80%',
    height: 120,
    backgroundColor: 'rgba(20, 184, 166, 0.2)', // transparent teal
    borderWidth: 2,
    borderColor: '#14B8A6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneBadge: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  zoneBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  myLocationDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myLocationDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6', // Blue dot
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  myLocationBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A2E',
    fontFamily: 'Poppins_600SemiBold',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    marginTop: -20, // Overlaps map slightly
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '30%',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  gridIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 10,
    color: '#4B5563',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
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
