import React, { useState, useRef, useCallback } from "react";
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
  Animated as RNAnimated,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useFareCalculator } from "@/hooks/useFareCalculator";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  PlacePrediction,
} from "@/lib/googleMaps";

export default function ParcelRideSelectScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    address?: string;
    lat?: string;
    lng?: string;
  }>();

  // Current Location Hook
  const {
    coords: pickupCoords,
    address: pickupAddress,
    isLoading: isLocLoading,
  } = useCurrentLocation();

  // Destination state
  const [dest, setDest] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(
    params.address && params.lat && params.lng
      ? {
          address: params.address,
          latitude: parseFloat(params.lat),
          longitude: parseFloat(params.lng),
        }
      : null,
  );

  // Autocomplete states
  const [searchText, setSearchText] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fare Calculation
  const {
    vehicles,
    directions,
    isLoading: isFareLoading,
  } = useFareCalculator(pickupCoords, dest);

  const parcelBike = vehicles.find((v) => v.id === "parcel-bike");

  const searchPlaces = useCallback(
    (text: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (text.length < 2) {
        setPredictions([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      debounceRef.current = setTimeout(async () => {
        const results = await fetchPlaceAutocomplete(
          text,
          pickupCoords || undefined,
        );
        setPredictions(results);
        setIsSearching(false);
      }, 400);
    },
    [pickupCoords],
  );

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    searchPlaces(text);
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPredictions([]);
    const details = await fetchPlaceDetails(prediction.placeId);
    if (details) {
      setDest({
        address: details.name || details.address,
        latitude: details.lat,
        longitude: details.lng,
      });
    }
  };

  // Maps / ETA logic
  const durationMin = directions
    ? Math.max(1, Math.round(directions.durationSeconds / 60))
    : 0;

  const mapRegion =
    pickupCoords && dest
      ? {
          latitude: (pickupCoords.latitude + dest.latitude) / 2,
          longitude: (pickupCoords.longitude + dest.longitude) / 2,
          latitudeDelta:
            Math.abs(pickupCoords.latitude - dest.latitude) * 1.8 + 0.01,
          longitudeDelta:
            Math.abs(pickupCoords.longitude - dest.longitude) * 1.8 + 0.01,
        }
      : pickupCoords
        ? {
            ...pickupCoords,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }
        : undefined;

  const now = new Date();
  const currentHours = now.getHours().toString().padStart(2, "0");
  const currentMinutes = now.getMinutes().toString().padStart(2, "0");
  const currentTime = `${currentHours}:${currentMinutes}`;
  const etaText =
    durationMin > 0 ? `${currentTime} · ${durationMin} min` : "Calculating...";

  // Render Search if destination is missing
  if (!dest) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "web" ? 20 : insets.top },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topBar}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.dark} />
          </Pressable>
          <Text style={styles.topTitle}>Where to send?</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search destination..."
              placeholderTextColor="#9CA3AF"
              value={searchText}
              onChangeText={handleSearchTextChange}
              autoFocus
            />
            {isSearching && (
              <ActivityIndicator size="small" color={Colors.primary} />
            )}
          </View>
        </View>

        <FlatList
          data={predictions}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultRow,
                pressed && { backgroundColor: "#F9FAFB" },
              ]}
              onPress={() => handlePlaceSelect(item)}
            >
              <View style={styles.resultIconBox}>
                <Ionicons name="location" size={20} color="#3B82F6" />
              </View>
              <View style={styles.resultTextBox}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.mainText}
                </Text>
                <Text style={styles.resultAddress} numberOfLines={1}>
                  {item.secondaryText}
                </Text>
              </View>
            </Pressable>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    );
  }

  // Render Map and Ride Selection
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Map Section */}
      <View style={styles.mapContainer}>
        {Platform.OS !== "web" && pickupCoords ? (
          <MapView userInterfaceStyle="light" style={StyleSheet.absoluteFill} initialRegion={mapRegion}>
            <Marker coordinate={pickupCoords}>
              <View style={styles.mapPopup}>
                <View style={styles.mapPopupDurationBox}>
                  <Text style={styles.mapPopupDurationText}>
                    {durationMin > 0 ? durationMin : "--"} MIN
                  </Text>
                </View>
                <Text style={styles.mapPopupAddressText} numberOfLines={1}>
                  {pickupAddress || "Loading..."} ›
                </Text>
              </View>
              <View style={styles.greenDotMarker} />
            </Marker>
            <Marker coordinate={dest}>
              <View style={styles.redDotMarker} />
            </Marker>
            {directions?.polyline && (
              <Polyline
                coordinates={directions.polyline}
                strokeColor={Colors.dark}
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.webMapPlaceholder]}>
            <MaterialCommunityIcons
              name="map"
              size={48}
              color={Colors.mediumGrey}
            />
          </View>
        )}

        <Pressable
          style={[styles.floatingBack, { top: insets.top + 8 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.dark} />
        </Pressable>
      </View>

      {/* Ride Selection Bottom Sheet */}
      <View style={styles.optionsContainer}>
        <View style={styles.dragHandle} />

        <Text style={styles.sectionTitle}>Choose delivery vehicle</Text>

        {/* Parcel Bike Card */}
        <Pressable style={styles.vehicleCard}>
          <View style={styles.vehicleIconWrapper}>
            <Ionicons name="cube-outline" size={32} color={Colors.dark} />
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>Parcel Bike</Text>
            <Text style={styles.vehicleEta}>{etaText}</Text>
          </View>
          <View style={styles.vehicleFareWrapper}>
            {isFareLoading || !parcelBike ? (
              <View style={styles.fareSkeleton} />
            ) : (
              <Text style={styles.vehicleFare}>
                ₹{parcelBike.fare.toFixed(2)}
              </Text>
            )}
          </View>
        </Pressable>

        {/* Footer actions */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.bookBtn,
              pressed && styles.pressedSurface,
            ]}
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              // Route to review delivery passing parameters if needed, or clear flow
              router.push("/review-delivery");
            }}
          >
            {isFareLoading || !parcelBike ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.bookBtnText}>
                Choose Parcel Bike • ₹{parcelBike.fare.toFixed(2)}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  listContent: {
    paddingBottom: 40,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  resultIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  resultTextBox: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  resultAddress: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginLeft: 64,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: Colors.lightGrey,
  },
  webMapPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBack: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapPopup: {
    backgroundColor: Colors.dark,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
    borderRadius: 8,
    marginBottom: 6,
    gap: 6,
    maxWidth: 200,
  },
  mapPopupDurationBox: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  mapPopupDurationText: {
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  mapPopupAddressText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
    paddingRight: 6,
  },
  greenDotMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    borderWidth: 3,
    borderColor: Colors.white,
    alignSelf: "center",
  },
  redDotMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    borderWidth: 3,
    borderColor: Colors.white,
    alignSelf: "center",
  },
  optionsContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: Colors.dark,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  vehicleIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  vehicleEta: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  vehicleFareWrapper: {
    alignItems: "flex-end",
  },
  vehicleFare: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  fareSkeleton: {
    width: 60,
    height: 24,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.mediumGrey,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  pressedSurface: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  bookBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
});
