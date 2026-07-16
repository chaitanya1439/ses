import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Animated,
  Easing,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";
import { LinearGradient } from "expo-linear-gradient";
import { fetchPlaceAutocomplete, fetchPlaceDetails, PlacePrediction } from "@/lib/googleMaps";

interface RecentSearch {
  id: string;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  distance?: string;
}

const RECENT_KEY = "recent_searches";
const MAX_RECENT = 5;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ pickupAddress?: string; pickupLat?: string; pickupLng?: string }>();
  const { setPickup, setDrop } = useBooking();

  const [pickupText, setPickupText] = useState(params.pickupAddress || "");
  const [destText, setDestText] = useState("");
  const [activeField, setActiveField] = useState<"pickup" | "dest">("dest");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  const destRef = useRef<TextInput>(null);
  const pickupRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(RECENT_KEY);
        if (raw) setRecentSearches(JSON.parse(raw).slice(0, MAX_RECENT));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (params.pickupAddress) setPickupText(params.pickupAddress);
  }, [params.pickupAddress]);

  useEffect(() => {
    const timer = setTimeout(() => destRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const searchPlaces = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const loc = params.pickupLat && params.pickupLng
        ? { latitude: parseFloat(params.pickupLat), longitude: parseFloat(params.pickupLng) }
        : undefined;
      const results = await fetchPlaceAutocomplete(text, loc);
      setPredictions(results);
      setIsSearching(false);
    }, 400);
  }, [params.pickupLat, params.pickupLng]);

  const handlePickupChange = (text: string) => {
    setPickupText(text);
    setActiveField("pickup");
    searchPlaces(text);
  };

  const handleDestChange = (text: string) => {
    setDestText(text);
    setActiveField("dest");
    searchPlaces(text);
  };

  const saveToRecent = async (item: RecentSearch) => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      let list: RecentSearch[] = raw ? JSON.parse(raw) : [];
      list = list.filter((r) => r.id !== item.id);
      list.unshift(item);
      list = list.slice(0, MAX_RECENT);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(list));
      setRecentSearches(list);
    } catch {}
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPredictions([]);

    const details = await fetchPlaceDetails(prediction.placeId);
    const placeName = details?.name ?? prediction.mainText;
    const placeAddress = details?.address ?? prediction.secondaryText;
    const lat = details?.lat;
    const lng = details?.lng;

    if (activeField === "pickup") {
      setPickupText(placeName);
      if (details) setPickup({ name: placeName, address: placeAddress, lat, lng });
      setActiveField("dest");
      destRef.current?.focus();
    } else {
      setDestText(placeName);
      if (details) setDrop({ name: placeName, address: placeAddress, lat, lng });

      await saveToRecent({ id: prediction.placeId, name: placeName, address: placeAddress, lat, lng });

      const pickupLat = params.pickupLat ? parseFloat(params.pickupLat) : undefined;
      const pickupLng = params.pickupLng ? parseFloat(params.pickupLng) : undefined;
      if (!pickupText) {
        setPickup({ name: "Current Location", address: "Detected location", lat: pickupLat, lng: pickupLng });
      }
      router.push("/ride-map" as any);
    }
  };

  const handleRecentSelect = (item: RecentSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeField === "pickup") {
      setPickupText(item.name);
      setPickup({ name: item.name, address: item.address, lat: item.lat, lng: item.lng });
      setActiveField("dest");
      destRef.current?.focus();
    } else {
      setDestText(item.name);
      setDrop({ name: item.name, address: item.address, lat: item.lat, lng: item.lng });
      const pickupLat = params.pickupLat ? parseFloat(params.pickupLat) : undefined;
      const pickupLng = params.pickupLng ? parseFloat(params.pickupLng) : undefined;
      if (!pickupText) {
        setPickup({ name: "Current Location", address: "Detected location", lat: pickupLat, lng: pickupLng });
      }
      router.push("/ride-map" as any);
    }
  };

  const showPredictions = predictions.length > 0 || isSearching;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Dynamic Background Gradient */}
      <LinearGradient colors={['#F0FDF4', '#FFFFFF']} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['rgba(255, 255, 255, 0)', 'rgba(238, 242, 255, 0.4)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={{ paddingTop: Platform.OS === "web" ? 20 : insets.top, flex: 1 }}>
        
        {/* Header */}
        <Animated.View style={[styles.topBar, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </Pressable>
          <Text style={styles.topTitle}>Where to?</Text>
          <View style={{ width: 44 }} />
        </Animated.View>

        {/* Input Card */}
        <Animated.View style={[styles.locationCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.locationInner}>
            <View style={styles.indicatorCol}>
              <View style={styles.pickupDot} />
              <View style={styles.dottedLine}>
                {[0, 1, 2].map((i) => <View key={i} style={styles.dottedSegment} />)}
              </View>
              <View style={styles.destSquare}>
                <View style={styles.destSquareInner} />
              </View>
            </View>

            <View style={styles.inputCol}>
              <View style={[styles.inputWrapper, activeField === "pickup" && styles.inputWrapperActive]}>
                <TextInput
                  ref={pickupRef}
                  style={styles.inputField}
                  value={pickupText}
                  onChangeText={handlePickupChange}
                  placeholder="Current Location"
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => setActiveField("pickup")}
                  returnKeyType="next"
                  onSubmitEditing={() => destRef.current?.focus()}
                />
              </View>
              <View style={styles.inputSpacer} />
              <View style={[styles.inputWrapper, activeField === "dest" && styles.inputWrapperActive]}>
                <TextInput
                  ref={destRef}
                  style={[styles.inputField, { fontSize: 18, fontFamily: "Poppins_600SemiBold" }]}
                  value={destText}
                  onChangeText={handleDestChange}
                  placeholder="Destination"
                  placeholderTextColor="#9CA3AF"
                  onFocus={() => setActiveField("dest")}
                  returnKeyType="search"
                />
              </View>
            </View>
            
            <Pressable style={styles.swapBtn} hitSlop={10}>
              <Ionicons name="swap-vertical" size={22} color="#6B7280" />
            </Pressable>
          </View>
        </Animated.View>

        {/* List Content */}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {showPredictions ? (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item.placeId}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                  <Pressable style={({ pressed }) => [styles.resultRow, pressed && styles.rowPressed]} onPress={() => handlePlaceSelect(item)}>
                    <LinearGradient colors={['#EEF2FF', '#E0E7FF']} style={styles.resultIconBox}>
                      <Ionicons name="location" size={20} color="#4F46E5" />
                    </LinearGradient>
                    <View style={styles.resultTextBox}>
                      <Text style={styles.resultName} numberOfLines={1}>{item.mainText}</Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>{item.secondaryText}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
              ListEmptyComponent={
                isSearching ? (
                  <View style={styles.loadingBox}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Finding best locations...</Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={recentSearches.length > 0 ? <Text style={styles.sectionTitle}>Recent</Text> : null}
              renderItem={({ item }) => (
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                  <Pressable style={({ pressed }) => [styles.recentRow, pressed && styles.rowPressed]} onPress={() => handleRecentSelect(item)}>
                    <View style={styles.recentIconBox}>
                      <Ionicons name="time" size={20} color="#6B7280" />
                    </View>
                    <View style={styles.recentTextBox}>
                      <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.recentAddress} numberOfLines={1}>{item.address}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              )}
              ListFooterComponent={
                <Animated.View style={[styles.bottomOptions, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Around you</Text>
                  
                  <Pressable style={({ pressed }) => [styles.bottomOptionRow, pressed && styles.rowPressed]} onPress={() => router.push("/confirm-pickup")}>
                    <LinearGradient colors={['#F3E8FF', '#E9D5FF']} style={styles.bottomOptionIcon}>
                      <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#9333EA" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bottomOptionText}>Set location on map</Text>
                      <Text style={styles.bottomOptionSub}>Pinpoint exact location</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </Pressable>

                  <Pressable style={({ pressed }) => [styles.bottomOptionRow, pressed && styles.rowPressed]}>
                    <LinearGradient colors={['#FEF3C7', '#FDE68A']} style={styles.bottomOptionIcon}>
                      <Ionicons name="star" size={20} color="#D97706" />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bottomOptionText}>Saved places</Text>
                      <Text style={styles.bottomOptionSub}>Access your favorites quickly</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </Pressable>
                </Animated.View>
              }
            />
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16, marginTop: 10 },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  topTitle: { fontSize: 24, fontFamily: "Poppins_700Bold", color: "#111827" },
  
  locationCard: { marginHorizontal: 20, backgroundColor: "#FFFFFF", borderRadius: 28, padding: 20, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.06, shadowRadius: 24, elevation: 8, borderWidth: 1, borderColor: "rgba(0,0,0,0.03)" },
  locationInner: { flexDirection: "row", alignItems: "center", gap: 16 },
  
  indicatorCol: { width: 24, alignItems: "center", justifyContent: 'center' },
  pickupDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#111827", shadowColor: "#111827", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  dottedLine: { alignItems: "center", justifyContent: "center", gap: 6, marginVertical: 8 },
  dottedSegment: { width: 2, height: 4, backgroundColor: '#D1D5DB', borderRadius: 1 },
  destSquare: { width: 14, height: 14, borderRadius: 4, backgroundColor: '#4F46E5', alignItems: "center", justifyContent: "center", shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4 },
  destSquareInner: { width: 6, height: 6, borderRadius: 2, backgroundColor: "#FFFFFF" },
  
  inputCol: { flex: 1 },
  inputWrapper: { paddingVertical: 8 },
  inputWrapperActive: { opacity: 1 },
  inputSpacer: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 4 },
  inputField: { fontSize: 16, fontFamily: "Poppins_500Medium", color: "#111827", padding: 0 },
  
  swapBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F9FAFB', alignItems: "center", justifyContent: "center" },
  
  listContent: { paddingBottom: 40, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: "#111827", marginBottom: 12, marginTop: 8 },
  rowPressed: { backgroundColor: '#F9FAFB', borderRadius: 20, transform: [{ scale: 0.98 }] },
  
  resultRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12, gap: 16, marginBottom: 8 },
  resultIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
  resultTextBox: { flex: 1 },
  resultName: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#111827" },
  resultAddress: { fontSize: 13, fontFamily: "Poppins_400Regular", color: '#6B7280', marginTop: 2 },
  
  loadingBox: { alignItems: "center", padding: 40, gap: 16 },
  loadingText: { fontSize: 15, fontFamily: "Poppins_500Medium", color: '#6B7280' },
  
  recentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 12, gap: 16, marginBottom: 8 },
  recentIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: "center", justifyContent: "center" },
  recentTextBox: { flex: 1 },
  recentName: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#111827" },
  recentAddress: { fontSize: 13, fontFamily: "Poppins_400Regular", color: '#6B7280', marginTop: 2 },
  
  bottomOptions: { marginTop: 12 },
  bottomOptionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, paddingHorizontal: 12, gap: 16, marginBottom: 8, backgroundColor: "#FFFFFF", borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  bottomOptionIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  bottomOptionText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: "#111827" },
  bottomOptionSub: { fontSize: 12, fontFamily: "Poppins_400Regular", color: "#6B7280", marginTop: 2 },
});
