import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  StatusBar,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { recentLocations, savedRiders } from "@/constants/mockData";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  PlacePrediction,
} from "@/lib/googleMaps";

export default function BookRideScreen() {
  const insets = useSafeAreaInsets();
  const { pickup, drop, setPickup, setDrop, bookingFor, setBookingFor } =
    useBooking();
  const location = useCurrentLocation();
  const [pickupText, setPickupText] = useState(pickup?.name ?? location?.address ?? "");
  const [dropText, setDropText] = useState(drop?.name ?? "");
  const [activeField, setActiveField] = useState<"pickup" | "drop">("drop");
  const [riderSheetVisible, setRiderSheetVisible] = useState(false);
  const [selectedRider, setSelectedRider] = useState(savedRiders[0]);
  const pickupRef = useRef<TextInput>(null);
  const dropRef = useRef<TextInput>(null);

  // Google Places Autocomplete state
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autocomplete search
  const searchPlaces = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setPredictions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchPlaceAutocomplete(text);
      setPredictions(results);
      setIsSearching(false);
    }, 400);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handlePickupTextChange = (text: string) => {
    setPickupText(text);
    setActiveField("pickup");
    searchPlaces(text);
  };

  const handleDropTextChange = (text: string) => {
    setDropText(text);
    setActiveField("drop");
    searchPlaces(text);
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPredictions([]);

    const details = await fetchPlaceDetails(prediction.placeId);

    if (activeField === "pickup") {
      // Selecting a pickup location
      setPickupText(prediction.mainText);
      if (details) {
        setPickup({
          name: details.name,
          address: details.address,
          lat: details.lat,
          lng: details.lng,
        });
      } else {
        setPickup({
          name: prediction.mainText,
          address: prediction.secondaryText,
        });
      }
      // Move focus to drop if it's empty
      if (!dropText) {
        setActiveField("drop");
        dropRef.current?.focus();
      }
    } else {
      // Selecting a drop location
      setDropText(prediction.mainText);
      if (details) {
        setDrop({
          name: details.name,
          address: details.address,
          lat: details.lat,
          lng: details.lng,
        });
      } else {
        setDrop({
          name: prediction.mainText,
          address: prediction.secondaryText,
        });
      }

      // Auto-set pickup if empty
      if (!pickup && !pickupText) {
        const address = location?.address || "Current Location";
        setPickup({
          name: address,
          address: "Current Location",
        });
        setPickupText(address);
      }
      router.push("/confirm-pickup");
    }
  };

  const handleRecentLocationSelect = (
    loc: (typeof recentLocations)[0],
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeField === "pickup") {
      setPickupText(loc.name);
      setPickup({ name: loc.name, address: loc.address });
      if (!dropText) {
        setActiveField("drop");
        dropRef.current?.focus();
      }
    } else {
      setDrop({ name: loc.name, address: loc.address });
      setDropText(loc.name);
      if (!pickup && !pickupText) {
        const address = location?.address || "Current Location";
        setPickup({
          name: address,
          address: "Current Location",
        });
        setPickupText(address);
      }
      router.push("/confirm-pickup");
    }
  };

  // Show predictions if available, otherwise show recent locations
  const showPredictions = predictions.length > 0 || isSearching;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop:
            Platform.OS === "web" ? 67 : insets.top,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            pressed && styles.pressedSurface,
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Where to?</Text>
        <Pressable
          style={({ pressed }) => [
            styles.forMeBtn,
            pressed && styles.pressedSurface,
          ]}
          onPress={() => setRiderSheetVisible(true)}
        >
          <Ionicons name="person-outline" size={16} color={Colors.dark} />
          <Text style={styles.forMeText}>{bookingFor}</Text>
          <Ionicons name="chevron-down" size={14} color={Colors.grey} />
        </Pressable>
      </View>

      {/* Location Card */}
      <View style={styles.locationCard}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={styles.dotContainer}>
            <View style={[styles.dot, styles.dotGreen]} />
          </View>
          <TextInput
            ref={pickupRef}
            style={styles.locationInput}
            value={pickupText}
            onChangeText={handlePickupTextChange}
            placeholder="Pickup location"
            placeholderTextColor={Colors.grey}
            onFocus={() => setActiveField("pickup")}
          />
          {pickupText.length > 0 && (
            <Pressable
              onPress={() => {
                setPickupText("");
                setPickup(null);
                setPredictions([]);
              }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.grey} />
            </Pressable>
          )}
        </View>

        {/* Dashed separator */}
        <View style={styles.dashedLine}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.dashSegment} />
          ))}
        </View>

        {/* Drop */}
        <View style={styles.locationRow}>
          <View style={styles.dotContainer}>
            <View style={[styles.dot, styles.dotOrange]} />
          </View>
          <TextInput
            ref={dropRef}
            style={styles.locationInput}
            value={dropText}
            onChangeText={handleDropTextChange}
            placeholder="Where to?"
            placeholderTextColor={Colors.grey}
            autoFocus={activeField === "drop"}
            onFocus={() => setActiveField("drop")}
          />
          {dropText.length > 0 && (
            <Pressable
              onPress={() => {
                setDropText("");
                setDrop(null);
                setPredictions([]);
              }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.grey} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Active field indicator */}
      <View style={styles.fieldIndicator}>
        <Ionicons
          name={activeField === "pickup" ? "location" : "navigate"}
          size={14}
          color={activeField === "pickup" ? Colors.success : "#F97316"}
        />
        <Text style={styles.fieldIndicatorText}>
          {activeField === "pickup" ? "Searching pickup" : "Searching drop-off"}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn}>
          <MaterialCommunityIcons
            name="map-marker"
            size={16}
            color={Colors.dark}
          />
          <Text style={styles.actionBtnText}>Select on map</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnDark]}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={[styles.actionBtnText, { color: Colors.white }]}>
            Add stops
          </Text>
        </Pressable>
      </View>

      {/* Section Label */}
      <View style={styles.recentLabel}>
        <Ionicons
          name={showPredictions ? "location-outline" : "time-outline"}
          size={16}
          color={Colors.grey}
        />
        <Text style={styles.recentLabelText}>
          {showPredictions ? "Suggestions" : "Recent locations"}
        </Text>
        {isSearching && (
          <ActivityIndicator
            size="small"
            color={Colors.primary}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      {/* Google Places Autocomplete Results */}
      {showPredictions ? (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.placeId}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.locationItem,
                pressed && styles.locationItemPressed,
              ]}
              onPress={() => handlePlaceSelect(item)}
            >
              <View style={styles.locationIconBox}>
                <Ionicons name="location" size={20} color={Colors.info} />
              </View>
              <View style={styles.locationItemText}>
                <Text style={styles.locationName}>{item.mainText}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {item.secondaryText}
                </Text>
              </View>
              <Ionicons
                name="arrow-forward-outline"
                size={16}
                color={Colors.grey}
              />
            </Pressable>
          )}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
          ListEmptyComponent={
            isSearching ? null : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={32}
                  color={Colors.mediumGrey}
                />
                <Text style={styles.emptyText}>No locations found</Text>
              </View>
            )
          }
        />
      ) : (
        /* Recent Locations */
        <FlatList
          data={recentLocations}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.locationItem,
                pressed && styles.locationItemPressed,
              ]}
              onPress={() => handleRecentLocationSelect(item)}
            >
              <View style={styles.locationIconBox}>
                <Ionicons name="time-outline" size={20} color={Colors.grey} />
              </View>
              <View style={styles.locationItemText}>
                <Text style={styles.locationName}>{item.name}</Text>
                <Text style={styles.locationAddress} numberOfLines={1}>
                  {item.address}
                </Text>
              </View>
              <Ionicons
                name={item.saved ? "heart" : "heart-outline"}
                size={18}
                color={item.saved ? Colors.danger : Colors.grey}
              />
            </Pressable>
          )}
          ItemSeparatorComponent={() => (
            <View style={styles.separator} />
          )}
        />
      )}

      {/* Rider Selector Sheet */}
      <Modal
        visible={riderSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRiderSheetVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setRiderSheetVisible(false)}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Booking ride for</Text>

          {savedRiders.map((rider) => (
            <Pressable
              key={rider.id}
              style={styles.riderOption}
              onPress={() => {
                setSelectedRider(rider);
                setBookingFor(rider.name);
              }}
            >
              <View style={styles.riderAvatar}>
                <Ionicons name="person-outline" size={22} color={Colors.grey} />
              </View>
              <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{rider.name}</Text>
                <Text style={styles.riderPhone}>{rider.phone}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  selectedRider.id === rider.id && styles.radioSelected,
                ]}
              >
                {selectedRider.id === rider.id && (
                  <View style={styles.radioDot} />
                )}
              </View>
            </Pressable>
          ))}

          <Pressable style={styles.addRiderBtn}>
            <Ionicons name="person-add-outline" size={18} color={Colors.info} />
            <Text style={styles.addRiderText}>Add new rider</Text>
          </Pressable>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={Colors.grey}
            />
            <Text style={styles.infoBoxText}>
              Contact name won&apos;t be shared with the captain
            </Text>
          </View>

          <Pressable
            style={styles.doneBtn}
            onPress={() => setRiderSheetVisible(false)}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  forMeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  forMeText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  locationCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary + "44",
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 36,
  },
  dotContainer: {
    width: 16,
    alignItems: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  dotGreen: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  dotOrange: {
    backgroundColor: "#F97316",
    borderColor: "#F97316",
  },
  dashedLine: {
    marginLeft: 8,
    marginVertical: 4,
    gap: 3,
  },
  dashSegment: {
    width: 2,
    height: 4,
    backgroundColor: Colors.mediumGrey,
    borderRadius: 1,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
    padding: 0,
  },
  fieldIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  fieldIndicatorText: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.dark,
  },
  actionBtnDark: {
    backgroundColor: Colors.dark,
    borderColor: Colors.dark,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  recentLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  recentLabelText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.grey,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  locationItemPressed: {
    backgroundColor: Colors.surfaceMuted,
  },
  locationIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  locationItemText: {
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  locationAddress: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginLeft: 64,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  // Sheet
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.mediumGrey,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 16,
  },
  riderOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  riderPhone: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.mediumGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: Colors.success,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  addRiderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  addRiderText: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.info,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: Colors.lightGrey,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  doneBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  pressedSurface: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
