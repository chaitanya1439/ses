import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { HomeMap } from '@/components/HomeMap';

import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

export default function RiderModeScreen() {
  const insets = useSafeAreaInsets();
  const { sendThrottledMessage } = useSocket();
  const { driver } = useAuth();
  const [pickup, setPickup] = useState('Current Location');
  const [dropoff, setDropoff] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<'Auto' | 'Bike'>('Auto');

  const handleBookRide = () => {
    if (!dropoff) {
      Alert.alert('Missing Dropoff', 'Please enter a dropoff location.');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSearching(true);
    
    // Send actual ride request
    const fare = selectedVehicle === 'Auto' ? 45 : 25;
    sendThrottledMessage('ride_request', {
      pickupLocation: { lat: 17.4482, lng: 78.3914 }, // Mock coordinates for now
      pickupAddress: pickup,
      dropAddress: dropoff,
      vehicle: selectedVehicle.toLowerCase(),
      fare: fare,
      distance: 3.2,
      riderName: driver?.name || 'Driver (Rider Mode)',
    });

    setTimeout(() => {
      setIsSearching(false);
      Alert.alert('Ride Requested!', `Searching for a nearby ${selectedVehicle} Captain...`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      <View style={StyleSheet.absoluteFillObject}>
         <HomeMap />
      </View>

      {/* Header Overlay */}
      <View style={[styles.header, { paddingTop: insets.top || 40 }]}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>Book a Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Bottom Sheet for Booking */}
      <KeyboardAvoidingView 
        style={styles.bottomSheetContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        pointerEvents="box-none"
      >
        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.sheetTitle}>Where to?</Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.iconColumn}>
              <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.line} />
              <View style={[styles.square, { backgroundColor: '#E11D48' }]} />
            </View>
            
            <View style={styles.fieldsColumn}>
              <View style={styles.fieldBox}>
                <TextInput
                  style={styles.input}
                  value={pickup}
                  onChangeText={setPickup}
                  placeholder="Pickup Location"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              <View style={[styles.fieldBox, { marginTop: 12 }]}>
                <TextInput
                  style={styles.input}
                  value={dropoff}
                  onChangeText={setDropoff}
                  placeholder="Enter dropoff location"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </View>
            </View>
          </View>

          {/* Ride Options (Static Mock) */}
          {dropoff.length > 2 && (
            <View style={styles.rideOptionsContainer}>
              <Pressable 
                style={[styles.rideOptionActive, selectedVehicle !== 'Auto' && { backgroundColor: 'transparent', borderColor: '#E5E7EB', borderWidth: 1 }]}
                onPress={() => setSelectedVehicle('Auto')}
              >
                <Image source={require('@/assets/images/auto-logo.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
                <View style={styles.rideOptionInfo}>
                  <Text style={styles.rideOptionName}>Auto</Text>
                  <Text style={styles.rideOptionTime}>3 min away</Text>
                </View>
                <Text style={styles.rideOptionPrice}>₹45</Text>
              </Pressable>
              
              <Pressable 
                style={[styles.rideOptionActive, { marginTop: 12 }, selectedVehicle !== 'Bike' && { backgroundColor: 'transparent', borderColor: '#E5E7EB', borderWidth: 1 }]}
                onPress={() => setSelectedVehicle('Bike')}
              >
                <Image source={require('@/assets/images/bike-saver.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
                <View style={styles.rideOptionInfo}>
                  <Text style={styles.rideOptionName}>Bike</Text>
                  <Text style={styles.rideOptionTime}>1 min away</Text>
                </View>
                <Text style={styles.rideOptionPrice}>₹25</Text>
              </Pressable>
            </View>
          )}

          <Pressable 
            style={[styles.bookBtn, isSearching && styles.bookBtnSearching]} 
            onPress={handleBookRide}
            disabled={isSearching}
          >
            <Text style={styles.bookBtnText}>
              {isSearching ? 'Finding Captain...' : `Book ${selectedVehicle}`}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A2E',
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A2E',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  iconColumn: {
    width: 24,
    alignItems: 'center',
    marginTop: 18,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    width: 2,
    height: 38,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  square: {
    width: 10,
    height: 10,
  },
  fieldsColumn: {
    flex: 1,
    marginLeft: 12,
  },
  fieldBox: {
    height: 52,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
    color: '#1A1A2E',
  },
  rideOptionsContainer: {
    marginBottom: 24,
  },
  rideOptionActive: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '10',
  },
  rideOptionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  rideOptionName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A2E',
  },
  rideOptionTime: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6B7280',
    marginTop: 2,
  },
  rideOptionPrice: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1A1A2E',
  },
  bookBtn: {
    backgroundColor: '#1A1A2E',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnSearching: {
    backgroundColor: '#4B5563',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
});
