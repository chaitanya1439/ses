import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker, Polygon } from 'react-native-maps';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SavedArea {
  id: string;
  name: string;
  isActive: boolean;
}

const INITIAL_AREAS: SavedArea[] = [
  { id: '1', name: 'Banjara Hills, Hyderabad', isActive: false },
  { id: '2', name: 'Jubilee Hills, Hyderabad', isActive: false },
  { id: '3', name: 'Madhapur, Hyderabad', isActive: false },
  { id: '4', name: 'Gachibowli, Hyderabad', isActive: false },
];

export default function GoToAreaScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? insets.top + 67 : insets.top;
  const bottomPad = Math.max(insets.bottom, 16);

  const [areas, setAreas] = useState<SavedArea[]>(INITIAL_AREAS);

  const toggleArea = (id: string) => {
    Haptics.selectionAsync();
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a))
    );
  };

  const deleteArea = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAreas((prev) => prev.filter((a) => a.id !== id));
  };

  // Custom heart pin renderer for map (now a component for Marker)
  const renderHeartPin = (scale: number = 1) => (
    <View style={[styles.mapPin, { transform: [{ scale }] }]}>
      <MaterialCommunityIcons name="map-marker-path" size={28} color="#E53935" style={{ position: 'absolute' }} />
      <MaterialCommunityIcons name="heart" size={12} color="#FFFFFF" style={{ position: 'absolute', top: 5 }} />
    </View>
  );

  // Example rough coordinates for the teal polygon in Hyderabad
  const polygonCoords = [
    { latitude: 17.387, longitude: 78.485 },
    { latitude: 17.395, longitude: 78.488 },
    { latitude: 17.392, longitude: 78.495 },
    { latitude: 17.382, longitude: 78.492 },
  ];

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* ─── TOP BAR ─── */}
      <View style={styles.topBar}>
        <Pressable
          hitSlop={12}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.topBarTitle}>Go to Area</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad + 80 }]}
      >
        {/* ─── MAP SECTION ─── */}
        <View style={[styles.mapSection, { alignItems: 'stretch', justifyContent: 'flex-start' }]}>
          <MapView userInterfaceStyle="light"
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: 17.3850,
              longitude: 78.4867,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={false}
          >
            {/* Teal Zone Polygon */}
            <Polygon
              coordinates={polygonCoords}
              fillColor="rgba(20, 184, 166, 0.2)"
              strokeColor="#14B8A6"
              strokeWidth={2}
            />

            {/* Scattered Map Pins */}
            <Marker coordinate={{ latitude: 17.388, longitude: 78.482 }}>
              {renderHeartPin(0.9)}
            </Marker>
            <Marker coordinate={{ latitude: 17.395, longitude: 78.491 }}>
              {renderHeartPin(1.1)}
            </Marker>
            <Marker coordinate={{ latitude: 17.375, longitude: 78.478 }}>
              {renderHeartPin(1.0)}
            </Marker>
            <Marker coordinate={{ latitude: 17.382, longitude: 78.498 }}>
              {renderHeartPin(0.85)}
            </Marker>
          </MapView>
          
          {/* Badge overlays the map (absolute positioning) */}
          <View style={styles.absoluteBadgeContainer}>
            <View style={styles.tealBadge}>
              <Text style={styles.tealBadgeText}>₹12/km Guaranteed Earn...</Text>
            </View>
          </View>
        </View>

        {/* ─── INFO BANNER ─── */}
        <View style={styles.infoBanner}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoText}>
              Get orders to your{'\n'}home or anywhere{'\n'}you want to go
            </Text>
            <Pressable>
              <Text style={styles.knowMoreLink}>ⓘ Know more</Text>
            </Pressable>
          </View>
          <View style={styles.infoRight}>
            <View style={styles.largePinWrap}>
              <MaterialCommunityIcons name="map-marker" size={64} color="#E53935" />
              <MaterialCommunityIcons name="heart" size={24} color="#FFFFFF" style={styles.largePinHeart} />
            </View>
          </View>
        </View>

        {/* ─── SAVED AREAS LIST ─── */}
        <Text style={styles.sectionLabel}>
          Saved drop areas (Switch ON up to 3 areas)
        </Text>

        <View style={styles.cardsContainer}>
          {areas.map((area) => (
            <View key={area.id} style={styles.areaCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.areaName} numberOfLines={1}>
                  {area.name}
                </Text>
                <Switch
                  value={area.isActive}
                  onValueChange={() => toggleArea(area.id)}
                  trackColor={{ false: '#E0E0E0', true: '#4ADE80' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E0E0E0"
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              </View>
              <Pressable
                style={styles.cardBottomRow}
                onPress={() => deleteArea(area.id)}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          ))}
          {areas.length === 0 && (
            <Text style={styles.emptyText}>No saved areas yet.</Text>
          )}
        </View>
      </ScrollView>

      {/* ─── FIXED BOTTOM BUTTON ─── */}
      <View style={[styles.bottomFixed, { paddingBottom: bottomPad }]}>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
        >
          <Text style={styles.addBtnText}>Add new area</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { marginRight: 12 },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  /* -- Map Section -- */
  mapSection: {
    height: SCREEN_HEIGHT * 0.35,
    backgroundColor: '#EBE5D9', // Beige/cream road map base
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteBadgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  tealBadge: {
    backgroundColor: '#14B8A6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  tealBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  mapPin: {
    width: 28,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* -- Info Banner -- */
  infoBanner: {
    backgroundColor: '#FFE4E4', // Light pink
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  infoLeft: {
    flex: 0.65,
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    lineHeight: 22,
  },
  knowMoreLink: {
    fontSize: 13,
    color: '#2563EB', // Blue link
    fontFamily: 'Poppins_500Medium',
  },
  infoRight: {
    flex: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largePinWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  largePinHeart: {
    position: 'absolute',
    top: 12,
  },

  /* -- Saved Areas -- */
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
    marginBottom: 12,
  },
  cardsContainer: {
    gap: 12,
  },
  areaCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  areaName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#374151', // Dark gray
    fontFamily: 'Poppins_700Bold',
    marginRight: 10,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 20,
  },

  /* -- Bottom Fixed Button -- */
  bottomFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1A1A2E',
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    fontFamily: 'Poppins_700Bold',
  },
});
