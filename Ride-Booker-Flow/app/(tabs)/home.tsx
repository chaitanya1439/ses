import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Platform, Animated, Easing, Dimensions
} from "react-native";
import { router } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useBooking } from "@/contexts/BookingContext";
import { customMapStyle } from "@/constants/mapStyle";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const { height } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────
interface RecentSearch { id: string; name: string; address: string; }
interface ServiceItem {
  id: string; label: string; icon: string;
  iconSet: "MaterialCommunityIcons" | "Ionicons" | "Feather" | "FontAwesome5";
  promo?: string; route: string;
}

const SERVICES_ROW_1: ServiceItem[] = [
  { id: "auto", label: "Auto", icon: "rickshaw", iconSet: "MaterialCommunityIcons", route: "/book-ride" },
  { id: "bike", label: "Bike", icon: "motorbike", iconSet: "MaterialCommunityIcons", promo: "₹2", route: "/book-ride" },
  { id: "trip", label: "Cab", icon: "car-side", iconSet: "FontAwesome5", promo: "25% off", route: "/book-ride" },
  { id: "parcel", label: "Parcel", icon: "cube", iconSet: "Ionicons", route: "/parcel-locations" },
];

const SERVICES_ROW_2: ServiceItem[] = [
  { id: "rentals", label: "Rentals", icon: "car-clock", iconSet: "MaterialCommunityIcons", route: "/book-ride" },
  { id: "reserve", label: "Reserve", icon: "calendar", iconSet: "Ionicons", route: "/book-ride" },
  { id: "intercity", label: "Intercity", icon: "car-estate", iconSet: "MaterialCommunityIcons", route: "/book-ride" },
  { id: "store", label: "Explore", icon: "compass", iconSet: "Ionicons", route: "/all-services" },
];

type BottomTab = "home" | "services" | "activity" | "account";

function SkeletonBlock({ width, height, borderRadius = 8, style }: { width: number | string; height: number; borderRadius?: number; style?: object; }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, easing: Easing.ease, useNativeDriver: true }),
      Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, easing: Easing.ease, useNativeDriver: true }),
    ])).start();
  }, [shimmerAnim]);
  const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width: width as any, height, borderRadius, backgroundColor: "#E5E7EB", opacity }, style]} />;
}

function ServiceIcon({ item, size = 28 }: { item: ServiceItem; size?: number; }) {
  const color = Colors.dark;
  switch (item.iconSet) {
    case "MaterialCommunityIcons": return <MaterialCommunityIcons name={item.icon as any} size={size} color={color} />;
    case "Ionicons": return <Ionicons name={item.icon as any} size={size} color={color} />;
    case "Feather": return <Feather name={item.icon as any} size={size} color={color} />;
    case "FontAwesome5": return <FontAwesome5 name={item.icon as any} size={size - 2} color={color} />;
    default: return null;
  }
}

function PromoBadge({ text }: { text: string }) {
  return (
    <View style={styles.promoBadge}>
      <Text style={styles.promoBadgeText}>{text}</Text>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { setPickup } = useBooking();
  const location = useCurrentLocation();

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BottomTab>("home");

  // Pulse animation for marker
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("recent_searches");
        if (raw) setRecentSearches(JSON.parse(raw).slice(0, 3));
      } catch { /* ignore */ } 
      finally { setTimeout(() => setIsLoading(false), 800); }
    })();
  }, []);

  useEffect(() => {
    if (location.coords && location.address) {
      setPickup({ name: "Current Location", address: location.address, lat: location.coords.latitude, lng: location.coords.longitude });
    }
  }, [location.coords, location.address, setPickup]);

  const handleSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/search" as any,
      params: {
        pickupAddress: location.address || "",
        pickupLat: location.coords?.latitude?.toString() || "",
        pickupLng: location.coords?.longitude?.toString() || "",
      },
    });
  };

  const handleTabPress = (tab: BottomTab) => {
    setActiveTab(tab);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (tab) {
      case "services": router.push("/all-services"); break;
      case "activity": router.push("/my-rides"); break;
      case "account": router.push("/(tabs)/profile"); break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background Map */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS !== "web" ? (
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: location.coords?.latitude ?? 17.385,
              longitude: location.coords?.longitude ?? 78.4867,
              latitudeDelta: 0.015, longitudeDelta: 0.015,
            }}
            customMapStyle={customMapStyle}
            showsUserLocation={false}
            showsCompass={false}
          >
            {location.coords && (
              <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}>
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <Animated.View style={[styles.userDot, { position: "absolute", opacity: 0.2, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }] }]} />
                  <View style={styles.userDot} />
                </View>
              </Marker>
            )}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.lightGrey, alignItems: 'center', justifyContent: 'center' }]}>
             <MaterialCommunityIcons name="map" size={48} color={Colors.grey} />
          </View>
        )}
      </View>

      {/* Top Bar (Over Map) */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'web' ? 24 : insets.top + 16 }]} pointerEvents="box-none">
        <Pressable style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color={Colors.dark} />
        </Pressable>
      </View>

      {/* Scrollable Bottom Sheet Overlay */}
      <BottomSheet
        snapPoints={["50%", "90%"]}
        index={0}
        handleIndicatorStyle={{ backgroundColor: Colors.border, width: 40, height: 4 }}
        backgroundStyle={{ backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.greetingTitle}>Where to?</Text>

          {/* Search Bar */}
          <Pressable style={({ pressed }) => [styles.searchBar, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]} onPress={handleSearch}>
            <View style={styles.searchLeft}>
              <Ionicons name="search" size={22} color={Colors.dark} />
              <Text style={styles.searchPlaceholder}>Enter destination</Text>
            </View>
            <View style={styles.nowPill}>
              <Ionicons name="time" size={16} color={Colors.dark} />
              <Text style={styles.nowText}>Now</Text>
              <Ionicons name="chevron-down" size={14} color={Colors.dark} />
            </View>
          </Pressable>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentList}>
              {recentSearches.map((item) => (
                <Pressable key={item.id} style={styles.recentItem} onPress={handleSearch}>
                  <View style={styles.recentIcon}>
                    <MaterialCommunityIcons name="history" size={20} color={Colors.grey} />
                  </View>
                  <View style={styles.recentTextWrap}>
                    <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.recentAddress} numberOfLines={1}>{item.address}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          {/* Services Grid */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggestions</Text>
            <Pressable onPress={() => router.push("/all-services")}>
               <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          
          <View style={styles.servicesGrid}>
            <View style={styles.servicesRow}>
              {SERVICES_ROW_1.map((srv) => (
                <Pressable key={srv.id} style={styles.serviceItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(srv.route as any); }}>
                  <View style={styles.serviceIconWrap}>
                    <ServiceIcon item={srv} />
                    {srv.promo && <PromoBadge text={srv.promo} />}
                  </View>
                  <Text style={styles.serviceLabel}>{srv.label}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.servicesRow}>
              {SERVICES_ROW_2.map((srv) => (
                <Pressable key={srv.id} style={styles.serviceItem} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push(srv.route as any); }}>
                  <View style={styles.serviceIconWrap}>
                    <ServiceIcon item={srv} size={24} />
                    {srv.promo && <PromoBadge text={srv.promo} />}
                  </View>
                  <Text style={styles.serviceLabel}>{srv.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

        </BottomSheetScrollView>
      </BottomSheet>

      {/* Floating Bottom Nav */}
      <View style={[styles.bottomNavOuter, { paddingBottom: Platform.OS === "web" ? 16 : Math.max(insets.bottom, 8) }]}>
        <View style={styles.bottomNavBar}>
          <Pressable style={styles.bottomNavItem} onPress={() => handleTabPress("home")}>
            <Ionicons name={activeTab === "home" ? "home" : "home-outline"} size={24} color={activeTab === "home" ? Colors.white : Colors.grey} />
            <Text style={[styles.bottomNavLabel, activeTab === "home" && styles.bottomNavLabelActive]}>Home</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => handleTabPress("services")}>
            <Ionicons name={activeTab === "services" ? "grid" : "grid-outline"} size={22} color={activeTab === "services" ? Colors.white : Colors.grey} />
            <Text style={[styles.bottomNavLabel, activeTab === "services" && styles.bottomNavLabelActive]}>Services</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => handleTabPress("activity")}>
            <Ionicons name={activeTab === "activity" ? "receipt" : "receipt-outline"} size={22} color={activeTab === "activity" ? Colors.white : Colors.grey} />
            <Text style={[styles.bottomNavLabel, activeTab === "activity" && styles.bottomNavLabelActive]}>Activity</Text>
          </Pressable>
          <Pressable style={styles.bottomNavItem} onPress={() => handleTabPress("account")}>
            <Ionicons name={activeTab === "account" ? "person" : "person-outline"} size={24} color={activeTab === "account" ? Colors.white : Colors.grey} />
            <Text style={[styles.bottomNavLabel, activeTab === "account" && styles.bottomNavLabelActive]}>Account</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  userDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.info, borderWidth: 3, borderColor: Colors.white, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  topBar: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  bottomSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 40, minHeight: height * 0.6, shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 },
  handleBarWrap: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  greetingTitle: { fontSize: 28, fontFamily: "Poppins_700Bold", color: Colors.dark, marginBottom: 20 },
  searchBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.lightGrey, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 24 },
  searchLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchPlaceholder: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.darkSecondary },
  nowPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  nowText: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  recentList: { marginBottom: 24 },
  recentItem: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.lightGrey },
  recentIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.lightGrey, alignItems: "center", justifyContent: "center" },
  recentTextWrap: { flex: 1 },
  recentName: { fontSize: 15, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  recentAddress: { fontSize: 13, fontFamily: "Poppins_400Regular", color: Colors.grey, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontFamily: "Poppins_700Bold", color: Colors.dark },
  seeAllText: { fontSize: 14, fontFamily: "Poppins_600SemiBold", color: Colors.info },
  servicesGrid: { gap: 16 },
  servicesRow: { flexDirection: "row", justifyContent: "space-between" },
  serviceItem: { alignItems: "center", width: "23%" },
  serviceIconWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: Colors.lightGrey, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  serviceLabel: { fontSize: 13, fontFamily: "Poppins_600SemiBold", color: Colors.darkSecondary },
  promoBadge: { position: "absolute", top: -6, right: -6, backgroundColor: Colors.success, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1.5, borderColor: Colors.white },
  promoBadgeText: { fontSize: 9, fontFamily: "Poppins_700Bold", color: Colors.white },
  bottomNavOuter: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 20, backgroundColor: "transparent" },
  bottomNavBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", backgroundColor: Colors.dark, borderRadius: 32, paddingVertical: 14, paddingHorizontal: 12, shadowColor: Colors.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 20 },
  bottomNavItem: { alignItems: "center", justifyContent: "center", gap: 4, paddingHorizontal: 16 },
  bottomNavLabel: { fontSize: 11, fontFamily: "Poppins_500Medium", color: Colors.grey },
  bottomNavLabelActive: { color: Colors.white, fontFamily: "Poppins_600SemiBold" },
});
