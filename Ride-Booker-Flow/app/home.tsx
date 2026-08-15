import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, StatusBar, Platform, Animated, Easing, Dimensions, Image, Modal } from "react-native";
import { router } from "expo-router";
import MapView, { Marker, AnimatedRegion, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { BikeIcon, AutoIcon } from "@/components/VehicleIcons";
import { customMapStyle } from "@/constants/mapStyle";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const { height } = Dimensions.get("window");

// ─── Types ───────────────────────────────────────────────────────────
interface RecentSearch { id: string; name: string; address: string; lat?: number; lng?: number; }
interface ServiceItem {
  id: string; label: string; icon?: string;
  iconSet?: "MaterialCommunityIcons" | "Ionicons" | "Feather" | "FontAwesome5";
  customImage?: any;
  promo?: string; route: string;
}

const SERVICES_ROW_1: ServiceItem[] = [
  { id: "bike", label: "Bike", customImage: require("@/assets/images/bike-saver.png"), promo: "₹2", route: "/book-ride" },
  { id: "tatkal", label: "Tatkal", icon: "qrcode-scan", iconSet: "MaterialCommunityIcons", route: "/tatkal-ride/customer-qr" },
  { id: "parcel", label: "Parcel", icon: "cube", iconSet: "Ionicons", route: "/parcel-locations" },
  { id: "she-bike", label: "She Bike", customImage: require("@/assets/images/she-bike-icon.png"), route: "/book-ride" },
];


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
  if (item.customImage) {
    return <Image source={item.customImage} style={{ width: size, height: size, borderRadius: 8 }} resizeMode="contain" />;
  }
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
  const { setPickup, setDrop, activeTrip } = useBooking();
  const location = useCurrentLocation();

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesExpanded, setIsServicesExpanded] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
    
  const { subscribe } = useSocket();
  const [nearbyDrivers, setNearbyDrivers] = useState<Record<string, any>>({});
  const driverAnimations = useRef<Record<string, AnimatedRegion>>({});

  useEffect(() => {
    const unsubscribe = subscribe('driver_location', (payload) => {
      const { driverId, location } = payload;
      const { latitude, longitude, heading, vehicleType } = location;

      setNearbyDrivers((prev) => ({
        ...prev,
        [driverId]: { driverId, latitude, longitude, heading, vehicleType, lastUpdatedAt: Date.now() }
      }));

      if (driverAnimations.current[driverId]) {
        (driverAnimations.current[driverId].timing as any)({
          latitude,
          longitude,
          duration: 2500,
          useNativeDriver: false
        }).start();
      } else {
        driverAnimations.current[driverId] = new AnimatedRegion({
          latitude,
          longitude,
          latitudeDelta: 0,
          longitudeDelta: 0
        });
      }
    });

    // Handle offline event
    const unsubOffline = subscribe('driver_offline', (payload) => {
      const { driverId } = payload;
      setNearbyDrivers((prev) => {
        const updated = { ...prev };
        delete updated[driverId];
        delete driverAnimations.current[driverId];
        return updated;
      });
    });

    return () => {
      unsubscribe();
      unsubOffline();
    };
  }, [subscribe]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNearbyDrivers((prev) => {
        let changed = false;
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (now - updated[id].lastUpdatedAt > 25000) {
            delete updated[id];
            delete driverAnimations.current[id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      setPickup({ name: location.address, address: "Current Location", lat: location.coords.latitude, lng: location.coords.longitude });
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

  const handleRecentSelect = (item: RecentSearch) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (location.coords && location.address) {
      setPickup({ name: location.address, address: "Current Location", lat: location.coords.latitude, lng: location.coords.longitude });
    }
    setDrop({ name: item.name, address: item.address, lat: item.lat, lng: item.lng });
    router.push("/ride-map" as any);
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Background Map */}
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS !== "web" ? (
          <MapView userInterfaceStyle="light"
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: location.coords?.latitude ?? 17.385,
              longitude: location.coords?.longitude ?? 78.4867,
              latitudeDelta: 0.015, longitudeDelta: 0.015,
            }}
            customMapStyle={customMapStyle}
            showsUserLocation={true}
            showsCompass={false}
          >
            {location.coords && (
              <Marker coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={{ alignItems: "center", justifyContent: "center" }}>
                  <Animated.View style={[styles.userDot, { position: "absolute", opacity: 0.2, transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }] }]} />
                  <View style={styles.userDot} />
                </View>
              </Marker>
            )}

            {/* Render Nearby Drivers */}
            {Object.values(nearbyDrivers).map((driver) => {
              const animRegion = driverAnimations.current[driver.driverId];
              if (!animRegion) return null;
              
              return (
                <Marker.Animated
                  key={driver.driverId}
                  coordinate={animRegion as any}
                  rotation={driver.heading || 0}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  {driver.vehicleType === 'moto' ? <BikeIcon width={32} height={32} /> : <AutoIcon width={32} height={32} />}
                </Marker.Animated>
              );
            })}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.lightGrey, alignItems: 'center', justifyContent: 'center' }]}>
             <MaterialCommunityIcons name="map" size={48} color={Colors.grey} />
          </View>
        )}
      </View>

      {/* Top Bar (Over Map) */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'web' ? 24 : insets.top + 16 }]} pointerEvents="box-none">
        <Pressable style={styles.menuBtn} onPress={() => setIsMenuOpen(true)}>
          <Ionicons name="menu" size={24} color={Colors.dark} />
        </Pressable>
        
        {activeTrip && activeTrip.status !== "completed" && activeTrip.status !== "cancelled_by_rider" && activeTrip.status !== "cancelled_by_driver" && (
          <Pressable 
            style={styles.activeTripBanner} 
            onPress={() => {
              const isParcel = activeTrip.vehicleType === "parcel" || activeTrip.type === "parcel";
              router.push({
                pathname: isParcel ? "/parcel-confirmed" : "/booking-confirmed",
                params: { payload: JSON.stringify(activeTrip) }
              });
            }}
          >
            <View style={styles.activeTripContent}>
              <Ionicons name="car-sport" size={24} color={Colors.white} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.activeTripTitle}>Ongoing Trip</Text>
                <Text style={styles.activeTripSub}>Tap to view trip details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.white} />
            </View>
          </Pressable>
        )}
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
                <Pressable key={item.id} style={styles.recentItem} onPress={() => handleRecentSelect(item)}>
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
          </View>

        </BottomSheetScrollView>
      </BottomSheet>


      {/* Side Menu Modal */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade">
        <View style={styles.menuOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsMenuOpen(false)} />
          <View style={styles.menuContent}>
            {/* Profile Header */}
            <View style={styles.menuProfileHeader}>
              <View style={styles.menuAvatar}>
                <Ionicons name="person" size={40} color={Colors.white} />
              </View>
              <View>
                <Text style={styles.menuUserName}>{user?.name ?? "Rider"}</Text>
                <Text style={styles.menuUserPhone}>{user?.phone ?? ""}</Text>
              </View>
            </View>
            
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              
              {/* Activity */}
              <Pressable style={styles.menuItemRow} onPress={() => { setIsMenuOpen(false); router.push("/my-rides" as any); }}>
                <Ionicons name="receipt-outline" size={24} color={Colors.dark} />
                <Text style={styles.menuItemText}>My Rides</Text>
              </Pressable>

              {/* Profile */}
              <Pressable style={styles.menuItemRow} onPress={() => { setIsMenuOpen(false); router.push("/profile" as any); }}>
                <Ionicons name="person-outline" size={24} color={Colors.dark} />
                <Text style={styles.menuItemText}>Profile</Text>
              </Pressable>

              {/* Services Folder */}
              <Pressable style={styles.menuItemRow} onPress={() => setIsServicesExpanded(!isServicesExpanded)}>
                <Ionicons name="grid-outline" size={24} color={Colors.dark} />
                <Text style={styles.menuItemText}>Services</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Ionicons name={isServicesExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.grey} />
                </View>
              </Pressable>
              
              {isServicesExpanded && (
                <View style={styles.servicesFolder}>
                  {SERVICES_ROW_1.map(srv => (
                    <Pressable key={srv.id} style={styles.folderServiceItem} onPress={() => {
                      setIsMenuOpen(false);
                      router.push(srv.route as any);
                    }}>
                      <ServiceIcon item={srv} size={20} />
                      <Text style={styles.folderServiceText}>{srv.label}</Text>
                    </Pressable>
                  ))}
                  <Pressable style={styles.folderServiceItem} onPress={() => { setIsMenuOpen(false); router.push("/all-services" as any); }}>
                    <Ionicons name="apps-outline" size={20} color={Colors.dark} />
                    <Text style={styles.folderServiceText}>All Services</Text>
                  </Pressable>
                </View>
              )}

              {/* Logout */}
              <Pressable style={styles.menuItemRow} onPress={async () => {
                setIsMenuOpen(false);
                await logout();
                router.replace("/login" as any);
              }}>
                <Ionicons name="log-out-outline" size={24} color={Colors.danger} />
                <Text style={[styles.menuItemText, { color: Colors.danger }]}>Log Out</Text>
              </Pressable>
            </ScrollView>
            
            {/* Footer */}
            <View style={[styles.menuFooter, { paddingBottom: insets.bottom + 20 }]}>
               <Text style={styles.menuAppVersion}>RideGo v1.0.0</Text>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({

  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row' },
  menuContent: { width: width * 0.75, backgroundColor: Colors.white, height: '100%', shadowColor: Colors.black, shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  menuProfileHeader: { backgroundColor: Colors.dark, paddingTop: 60, paddingBottom: 30, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  menuAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  menuUserName: { fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.white },
  menuUserPhone: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.lightGrey },
  menuScroll: { flex: 1, paddingTop: 10 },
  menuItemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, gap: 16 },
  menuItemText: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  servicesFolder: { backgroundColor: Colors.lightGrey, paddingVertical: 8, marginHorizontal: 16, borderRadius: 16, marginBottom: 10 },
  folderServiceItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12, gap: 16 },
  folderServiceText: { fontSize: 14, fontFamily: "Poppins_500Medium", color: Colors.darkSecondary },
  menuFooter: { paddingHorizontal: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: Colors.border },
  menuAppVersion: { fontSize: 12, fontFamily: "Poppins_400Regular", color: Colors.grey },

  container: { flex: 1, backgroundColor: Colors.white },
  userDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: Colors.info, borderWidth: 3, borderColor: Colors.white, shadowColor: Colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  topBar: { paddingHorizontal: 20, flexDirection: 'row', zIndex: 10, alignItems: 'flex-start' },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: "center", justifyContent: "center", shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, marginRight: 16 },
  activeTripBanner: { flex: 1, backgroundColor: Colors.dark, borderRadius: 16, padding: 12, shadowColor: Colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 },
  activeTripContent: { flexDirection: 'row', alignItems: 'center' },
  activeTripTitle: { fontSize: 14, fontFamily: "Poppins_700Bold", color: Colors.white },
  activeTripSub: { fontSize: 11, fontFamily: "Poppins_500Medium", color: Colors.lightGrey },
  bottomSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingBottom: 40, minHeight: height * 0.6, shadowColor: Colors.black, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 },
  handleBarWrap: { width: '100%', alignItems: 'center', paddingVertical: 12 },
  handleBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  greetingTitle: { fontSize: 28, fontFamily: "Poppins_700Bold", color: Colors.dark, marginBottom: 20 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 },
  searchBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.lightGrey, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20, marginBottom: 24 },
  qrButton: { width: 56, height: 56, backgroundColor: Colors.lightGrey, borderRadius: 16, alignItems: "center", justifyContent: "center" },
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
