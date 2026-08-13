import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, StatusBar, Platform, ScrollView, Alert } from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useBooking } from "@/contexts/BookingContext";

interface SavedPlace {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  icon: string;
}

export default function SavedPlacesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ field?: "pickup" | "dest" }>();
  const { setPickup, setDrop } = useBooking();
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  const loadPlaces = async () => {
    try {
      const raw = await AsyncStorage.getItem("@saved_places_list");
      if (raw) {
        setSavedPlaces(JSON.parse(raw));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadPlaces();
    }, [])
  );

  const handleDelete = (id: string) => {
    Alert.alert("Delete Place", "Are you sure you want to remove this saved place?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const newList = savedPlaces.filter(p => p.id !== id);
          setSavedPlaces(newList);
          await AsyncStorage.setItem("@saved_places_list", JSON.stringify(newList));
        }
      }
    ]);
  };

  const handleSelect = (place: SavedPlace) => {
    if (params.field === "pickup") {
      setPickup({ name: place.label, address: place.address, lat: place.lat, lng: place.lng });
    } else {
      setDrop({ name: place.label, address: place.address, lat: place.lat, lng: place.lng });
    }
    // Navigate back to the confirm-pickup screen or search
    router.back();
    // Sometimes router.back goes to Search, then they have to go back again, 
    // but in this flow, they select a place so we just pop back.
    // Ideally we pop back twice, but router.dismissAll is not available in expo-router easily.
    // If they want to skip search, they can go to `/confirm-pickup` directly
    if (params.field) {
       setTimeout(() => {
         router.push("/confirm-pickup" as any);
       }, 50);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 20 : insets.top }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Saved Places</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
        {savedPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={Colors.grey} />
            <Text style={styles.emptyText}>No saved places yet.</Text>
            <Text style={styles.emptySubText}>Add your favorite locations for quick access.</Text>
          </View>
        ) : (
          savedPlaces.map((place) => (
            <Pressable key={place.id} style={styles.placeItem} onPress={() => handleSelect(place)}>
              <View style={styles.iconBox}>
                <Ionicons name={place.icon as any} size={24} color={Colors.primary} />
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeLabel}>{place.label}</Text>
                <Text style={styles.placeAddress} numberOfLines={2}>{place.address}</Text>
              </View>
              <Pressable onPress={() => handleDelete(place.id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger || "#EF4444"} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={styles.addBtn} onPress={() => router.push("/add-place" as any)}>
          <Ionicons name="add" size={24} color={Colors.white} />
          <Text style={styles.addBtnText}>Add New Place</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceMuted, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.dark },
  content: { flex: 1, padding: 16 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyText: { fontSize: 18, fontFamily: "Poppins_600SemiBold", color: Colors.dark, marginTop: 16 },
  emptySubText: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.grey, textAlign: "center", marginTop: 8, paddingHorizontal: 32 },
  placeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3E8FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  placeInfo: { flex: 1, marginRight: 8 },
  placeLabel: { fontSize: 16, fontFamily: "Poppins_600SemiBold", color: Colors.dark, marginBottom: 4 },
  placeAddress: { fontSize: 14, fontFamily: "Poppins_400Regular", color: Colors.darkSecondary },
  deleteBtn: {
    padding: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addBtn: {
    backgroundColor: Colors.dark,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
});
