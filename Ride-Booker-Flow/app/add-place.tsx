import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { fetchPlaceAutocomplete, fetchPlaceDetails, PlacePrediction } from "@/lib/googleMaps";

export default function AddPlaceScreen() {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [label, setLabel] = useState("");
  
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

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    searchPlaces(text);
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    setPredictions([]);
    const details = await fetchPlaceDetails(prediction.placeId);
    
    if (details) {
      setSelectedPlace({
        address: details.address || prediction.secondaryText,
        lat: details.lat,
        lng: details.lng,
      });
      // Suggest a label based on the main text
      setLabel(details.name || prediction.mainText);
    }
  };

  const savePlace = async () => {
    if (!selectedPlace || !label.trim()) return;

    try {
      const raw = await AsyncStorage.getItem("@saved_places_list");
      const currentList = raw ? JSON.parse(raw) : [];
      
      // Basic icon mapping based on label
      let icon = "location-outline";
      const l = label.toLowerCase();
      if (l.includes("home")) icon = "home-outline";
      else if (l.includes("work") || l.includes("office")) icon = "briefcase-outline";
      else if (l.includes("gym")) icon = "barbell-outline";
      else if (l.includes("school") || l.includes("college")) icon = "school-outline";
      else if (l.includes("airport")) icon = "airplane-outline";
      else if (l.includes("train") || l.includes("station")) icon = "train-outline";

      const newPlace = {
        id: Date.now().toString(),
        label: label.trim(),
        address: selectedPlace.address,
        lat: selectedPlace.lat,
        lng: selectedPlace.lng,
        icon,
      };

      currentList.push(newPlace);
      await AsyncStorage.setItem("@saved_places_list", JSON.stringify(currentList));
      router.back();
    } catch (e) {
      console.error("Failed to save place", e);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Saved Place</Text>
        <View style={{ width: 44 }} />
      </View>

      {!selectedPlace ? (
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.grey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a place"
              value={searchText}
              onChangeText={handleSearchChange}
              autoFocus
            />
            {isSearching && <ActivityIndicator size="small" color={Colors.primary} />}
          </View>
          
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.placeId}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={styles.resultRow} onPress={() => handlePlaceSelect(item)}>
                <View style={styles.resultIconBox}>
                  <Ionicons name="location" size={20} color={Colors.grey} />
                </View>
                <View style={styles.resultTextBox}>
                  <Text style={styles.resultMainText} numberOfLines={1}>{item.mainText}</Text>
                  <Text style={styles.resultSubText} numberOfLines={1}>{item.secondaryText}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      ) : (
        <View style={styles.saveSection}>
          <Text style={styles.sectionLabel}>Name this place</Text>
          <TextInput
            style={styles.labelInput}
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Home, Work, Gym"
            autoFocus
          />
          
          <View style={styles.addressPreview}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.addressPreviewText}>{selectedPlace.address}</Text>
          </View>

          <View style={{ flex: 1 }} />

          <Pressable 
            style={[styles.saveBtn, !label.trim() && styles.saveBtnDisabled]} 
            onPress={savePlace}
            disabled={!label.trim()}
          >
            <Text style={styles.saveBtnText}>Save Place</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  
  searchSection: { flex: 1, padding: 16 },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultTextBox: { flex: 1 },
  resultMainText: { fontSize: 16, fontFamily: "Poppins_500Medium", color: Colors.dark },
  resultSubText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.grey },

  saveSection: { flex: 1, padding: 24 },
  sectionLabel: { fontSize: 14, fontFamily: "Poppins_500Medium", color: Colors.grey, marginBottom: 8 },
  labelInput: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingVertical: 8,
    marginBottom: 24,
  },
  addressPreview: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.lightGrey,
    padding: 16,
    borderRadius: 12,
  },
  addressPreviewText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.darkSecondary,
    lineHeight: 20,
  },
  saveBtn: {
    backgroundColor: Colors.dark,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.border,
  },
  saveBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
});
