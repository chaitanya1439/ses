import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, StatusBar, Image, BackHandler } from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useBooking } from '@/contexts/BookingContext';
import { fetchDirectionsPolyline } from '@/lib/googleMaps';
import { customMapStyle } from '@/constants/mapStyle';

export default function RateTripScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop } = useBooking();
  const [rating, setRating] = useState(0);
  const [tip, setTip] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const backAction = () => {
      router.replace('/home');
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    (async () => {
      if (pickup?.lat && pickup?.lng && drop?.lat && drop?.lng) {
        const coords = await fetchDirectionsPolyline(
          { latitude: pickup.lat, longitude: pickup.lng },
          { latitude: drop.lat, longitude: drop.lng }
        );
        setRouteCoords(coords);
        if (coords.length > 1 && mapRef.current) {
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 60, right: 40, bottom: 40, left: 40 },
              animated: true,
            });
          }, 500);
        }
      }
    })();
  }, [pickup, drop]);

  const handleStarPress = (r: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(r);
  };

  const handleTipSelect = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTip(amount);
  };

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Map Section */}
      <View style={styles.topSection}>
        <MapView userInterfaceStyle="light"
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          customMapStyle={customMapStyle}
          pitchEnabled={false}
          scrollEnabled={false}
          zoomEnabled={false}
          showsCompass={false}
          initialRegion={{
            latitude: pickup?.lat ?? 17.385,
            longitude: pickup?.lng ?? 78.4867,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {routeCoords.length > 1 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor={Colors.dark}
              strokeWidth={4}
            />
          )}
          {pickup?.lat && pickup?.lng && (
            <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}>
              <View style={styles.startDot} />
            </Marker>
          )}
          {drop?.lat && drop?.lng && (
            <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }}>
              <View style={styles.endDot} />
            </Marker>
          )}
        </MapView>
        
        {/* Gradient Overlay to blend with the sheet */}
        <View style={styles.mapOverlay} />
      </View>

      {/* Bottom Sheet Card */}
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        
        {/* Avatar Overflowing */}
        <View style={styles.avatarWrapper}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop' }} 
            style={styles.avatarImage} 
          />
        </View>

        <Text style={styles.title}>Rate your trip</Text>
        <Text style={styles.subtitle}>{new Date().toLocaleDateString('en-US', { weekday: 'long' })} to {drop?.name || 'Destination'}</Text>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Pressable key={star} onPress={() => handleStarPress(star)}>
              <Ionicons 
                name="star" 
                size={42} 
                color={star <= rating ? "#FFC107" : "#E5E7EB"} 
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.tipTitle}>Add a tip</Text>
        <Text style={styles.tipSubtitle}>Your trip was ₹56.00</Text>

        <View style={styles.tipRow}>
          {[10, 30, 50].map((amount) => (
            <Pressable 
              key={amount} 
              style={[styles.tipBtn, tip === amount && styles.tipBtnSelected]}
              onPress={() => handleTipSelect(amount)}
            >
              <Text style={[styles.tipBtnText, tip === amount && styles.tipBtnTextSelected]}>₹{amount}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.customTipBtn}>
          <Text style={styles.customTipText}>Enter Custom Amount</Text>
        </Pressable>

        <Pressable style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>Submit</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  topSection: {
    flex: 0.35,
    backgroundColor: Colors.lightGrey,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light overlay to make map subtle
  },
  startDot: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.dark, borderWidth: 2, borderColor: Colors.white,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  endDot: {
    width: 16, height: 16, borderRadius: 4, backgroundColor: Colors.danger, borderWidth: 2, borderColor: Colors.white,
    shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  sheet: {
    flex: 0.65,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.white,
    marginTop: -42, // overflowing half way up!
    marginBottom: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    backgroundColor: Colors.lightGrey,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#4B5563', // gray-600
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F3F4F6', // gray-100
    marginBottom: 28,
  },
  tipTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  tipSubtitle: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#6B7280', // gray-500
    marginBottom: 24,
  },
  tipRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  tipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 30, // pill-shaped
    borderWidth: 1,
    borderColor: '#E5E7EB', // gray-200
    backgroundColor: Colors.white,
  },
  tipBtnSelected: {
    backgroundColor: '#F9FAFB', // very light gray instead of black, keeping border dark
    borderColor: Colors.dark,
    borderWidth: 2,
    paddingVertical: 9,
    paddingHorizontal: 27,
  },
  tipBtnText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.dark,
  },
  tipBtnTextSelected: {
    color: Colors.dark,
  },
  customTipBtn: {
    marginBottom: 32,
  },
  customTipText: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#4B5563',
  },
  submitBtn: {
    width: '100%',
    height: 54,
    borderRadius: 12, // slightly squarer button
    backgroundColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
  },
});
