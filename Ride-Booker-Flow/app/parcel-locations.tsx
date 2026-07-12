import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { recentLocations } from "@/constants/mockData";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  PlacePrediction,
} from "@/lib/googleMaps";

export default function ParcelLocationsScreen() {
  const insets = useSafeAreaInsets();
  const [pickupText, setPickupText] = useState("Tirumala Enclave, Alwal");
  const [dropText, setDropText] = useState("");
  const [activeField, setActiveField] = useState<"pickup" | "drop">("drop");

  // Google Places Autocomplete state
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleTextChange = (text: string, field: "pickup" | "drop") => {
    if (field === "pickup") {
      setPickupText(text);
    } else {
      setDropText(text);
    }
    searchPlaces(text);
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const details = await fetchPlaceDetails(prediction.placeId);
    const displayName = details?.name ?? prediction.mainText;

    if (activeField === "pickup") {
      setPickupText(displayName);
    } else {
      setDropText(displayName);
      setPredictions([]);
      router.push("/review-delivery");
    }
    setPredictions([]);
  };

  const handleRecentLocationSelect = (loc: (typeof recentLocations)[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeField === "pickup") {
      setPickupText(loc.name);
    } else {
      setDropText(loc.name);
      router.push("/review-delivery");
    }
  };

  const canProceed = pickupText.trim().length > 0 && dropText.trim().length > 0;
  const showPredictions = predictions.length > 0 || isSearching;
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
        },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Parcel Delivery</Text>
      </View>

      {/* Location Card */}
      <View style={styles.locationCard}>
        {/* Pickup */}
        <Pressable
          style={styles.locationRow}
          onPress={() => setActiveField("pickup")}
        >
          <View style={styles.dotContainer}>
            <View style={[styles.dot, styles.dotGreen]} />
          </View>
          <TextInput
            style={[
              styles.locationInput,
              activeField === "pickup" && styles.inputActive,
            ]}
            value={pickupText}
            onChangeText={(text) => handleTextChange(text, "pickup")}
            placeholder="Parcel pickup address"
            placeholderTextColor={Colors.grey}
            onFocus={() => setActiveField("pickup")}
          />
          {pickupText.length > 0 && (
            <Pressable onPress={() => setPickupText("")}>
              <Ionicons name="close-circle" size={18} color={Colors.grey} />
            </Pressable>
          )}
        </Pressable>

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
            style={[
              styles.locationInput,
              activeField === "drop" && styles.inputActive,
            ]}
            value={dropText}
            onChangeText={(text) => handleTextChange(text, "drop")}
            placeholder="Parcel delivery address"
            placeholderTextColor={Colors.grey}
            autoFocus={activeField === "drop"}
            onFocus={() => setActiveField("drop")}
          />
          {dropText.length > 0 && (
            <Pressable onPress={() => setDropText("")}>
              <Ionicons name="close-circle" size={18} color={Colors.grey} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn}>
          <MaterialCommunityIcons name="map-marker" size={16} color={Colors.dark} />
          <Text style={styles.actionBtnText}>Select on map</Text>
        </Pressable>
        <Pressable style={[styles.actionBtn, styles.actionBtnDark]}>
          <Ionicons name="add" size={16} color={Colors.white} />
          <Text style={[styles.actionBtnText, { color: Colors.white }]}>
            Add stops
          </Text>
        </Pressable>
      </View>

      {/* Recent Label */}
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

      {/* Results */}
      {showPredictions ? (
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.placeId}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.locationItem}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <FlatList
          data={recentLocations}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={styles.locationItem}
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
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Proceed Button (if both filled) */}
      {canProceed && (
        <View style={[styles.proceedContainer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={styles.proceedBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/review-delivery");
            }}
          >
            <Text style={styles.proceedBtnText}>Review Delivery</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.dark} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  locationCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.mediumGrey,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
  },
  dotGreen: {
    backgroundColor: Colors.success,
  },
  dotOrange: {
    backgroundColor: "#F97316",
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
  inputActive: {
    color: Colors.dark,
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
  proceedContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.mediumGrey,
    backgroundColor: Colors.white,
  },
  proceedBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  proceedBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
});
