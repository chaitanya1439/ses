import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  StatusBar,
  Platform,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/colors";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";
import { useFareCalculator } from "@/hooks/useFareCalculator";
import { useBooking } from "@/contexts/BookingContext";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  PlacePrediction,
} from "@/lib/googleMaps";

const DROPOFF_OPTIONS = [
  { id: "Meet at curb", label: "Meet at curb" },
  { id: "Meet at door", label: "Meet at door" },
  { id: "Leave at door", label: "Leave at door" },
];

export default function ParcelReviewDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    recipientName?: string;
    recipientPhone?: string;
  }>();

  // --- 1. SENDER INFO ---
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const { pickup, drop, selectedVehicle } = useBooking();

  const {
    coords: locCoords,
    address: locAddress,
    isLoading: isLocLoading,
  } = useCurrentLocation();

  const senderCoords = pickup?.lat && pickup?.lng ? { latitude: pickup.lat, longitude: pickup.lng } : locCoords;
  const senderAddress = pickup?.address || pickup?.name || locAddress;

  useEffect(() => {
    (async () => {
      try {
        const profileStr = await AsyncStorage.getItem("user_profile");
        if (profileStr) {
          const profile = JSON.parse(profileStr);
          if (profile.name) setSenderName(profile.name);
          if (profile.phone) setSenderPhone(profile.phone);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const [contactSheetVisible, setContactSheetVisible] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhone, setTempPhone] = useState("");

  const openContactSheet = () => {
    setTempName(senderName);
    setTempPhone(senderPhone);
    setContactSheetVisible(true);
  };

  const saveContact = () => {
    setSenderName(tempName);
    setSenderPhone(tempPhone);
    setContactSheetVisible(false);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  };

  // --- 2. RECIPIENT ADDRESS ---
  const [recipientAddress, setRecipientAddress] = useState(drop?.address || drop?.name || "");
  const [recipientLat, setRecipientLat] = useState<number | null>(drop?.lat || null);
  const [recipientLng, setRecipientLng] = useState<number | null>(drop?.lng || null);

  const [searchText, setSearchText] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          senderCoords || undefined,
        );
        setPredictions(results);
        setIsSearching(false);
      }, 400);
    },
    [senderCoords],
  );

  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    searchPlaces(text);
  };

  const handlePlaceSelect = async (prediction: PlacePrediction) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setPredictions([]);
    const details = await fetchPlaceDetails(prediction.placeId);
    if (details) {
      setRecipientAddress(details.name || details.address);
      setRecipientLat(details.lat);
      setRecipientLng(details.lng);
    }
  };

  // --- 3. FARE ---
  const { vehicles, isLoading: isFareLoading } = useFareCalculator(
    senderCoords,
    recipientLat && recipientLng
      ? { latitude: recipientLat, longitude: recipientLng }
      : null,
  );
  const parcelBike = vehicles.find((v) => v.id === "parcel-bike");
  const realFare = parcelBike?.fare ?? 0;

  // --- 4. DROPOFF OPTIONS ---
  const [dropoffOption, setDropoffOption] = useState("Meet at door");
  const [driverInstructions, setDriverInstructions] = useState("");

  // --- 5. ON CONFIRM ---
  const handleConfirm = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}

    const payload = {
      sender: {
        name: senderName,
        phone: senderPhone,
        address: senderAddress,
        lat: senderCoords?.latitude,
        lng: senderCoords?.longitude,
      },
      recipient: {
        name: params.recipientName || "Recipient",
        phone: params.recipientPhone || "",
        address: recipientAddress,
        lat: recipientLat,
        lng: recipientLng,
      },
      fare: realFare,
      dropoffOption,
      driverInstructions,
    };

    router.push({
      pathname: "/confirm-pickup" as any,
      params: { parcelDetails: JSON.stringify(payload) },
    });
  };

  // --- Render Google Places Autocomplete if recipient address not set ---
  if (!recipientLat || !recipientLng) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "web" ? 20 : insets.top },
        ]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.dark} />
          </Pressable>
          <Text style={styles.headerTitle}>Delivery Address</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color={Colors.grey} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipient address..."
              placeholderTextColor={Colors.grey}
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
                <Ionicons name="location" size={20} color={Colors.info} />
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

  // --- Render Review Delivery Screen ---
  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "web" ? 20 : insets.top },
      ]}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Delivery</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
      >
        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip details</Text>
          <View style={styles.routeCard}>
            {/* Sender */}
            <View style={styles.stopRow}>
              <View style={styles.stopIconBox}>
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={18}
                  color={Colors.white}
                />
              </View>
              <View style={styles.stopContent}>
                <Text style={styles.stopPerson}>
                  {senderName || "Add sender details"}
                </Text>
                <Text style={styles.stopAddr}>
                  {isLocLoading ? "Locating..." : senderAddress}
                </Text>
              </View>
              {(!senderName || !senderPhone) && (
                <Pressable style={styles.addBtn} onPress={openContactSheet}>
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.routeLine} />

            {/* Recipient */}
            <View style={styles.stopRow}>
              <View style={[styles.stopIconBox, styles.stopIconBoxSquare]}>
                <MaterialCommunityIcons
                  name="flag"
                  size={16}
                  color={Colors.white}
                />
              </View>
              <View style={styles.stopContent}>
                <Text style={styles.stopPerson}>
                  {params.recipientName || "Recipient"}
                </Text>
                <Text style={styles.stopAddr}>{recipientAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Dropoff Preference */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery preference</Text>
          <View style={styles.pickupOptions}>
            {DROPOFF_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.pickupChip,
                  dropoffOption === opt.id && styles.pickupChipActive,
                ]}
                onPress={() => {
                  setDropoffOption(opt.id);
                  try {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  } catch (e) {}
                }}
              >
                <Text
                  style={[
                    styles.pickupChipText,
                    dropoffOption === opt.id && styles.pickupChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Driver Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver instructions</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="e.g. Leave at reception, call when arrived..."
            placeholderTextColor={Colors.grey}
            value={driverInstructions}
            onChangeText={setDriverInstructions}
            multiline
          />
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={styles.confirmBtn}
          onPress={handleConfirm}
          disabled={isFareLoading || !realFare}
        >
          {isFareLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              Confirm delivery • ₹{realFare.toFixed(2)}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Contact Sheet Modal */}
      <Modal
        visible={contactSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactSheetVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setContactSheetVisible(false)}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Sender details</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Full name"
              placeholderTextColor={Colors.grey}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              style={styles.fieldInput}
              value={tempPhone}
              onChangeText={setTempPhone}
              placeholder="+91 XXXXXXXXXX"
              placeholderTextColor={Colors.grey}
              keyboardType="phone-pad"
            />
          </View>
          <Pressable
            style={[
              styles.saveBtn,
              (!tempName || !tempPhone) && { opacity: 0.5 },
            ]}
            onPress={saveContact}
            disabled={!tempName || !tempPhone}
          >
            <Text style={styles.saveBtnText}>Save Contact</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 12,
  },
  routeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    padding: 16,
    gap: 8,
  },
  stopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stopIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stopIconBoxSquare: { borderRadius: 6 },
  stopContent: { flex: 1, gap: 2 },
  stopPerson: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  stopAddr: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  addBtn: {
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
  },
  addBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: Colors.mediumGrey,
    marginLeft: 15,
    borderRadius: 1,
  },
  pickupOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pickupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.mediumGrey,
    backgroundColor: Colors.white,
  },
  pickupChipActive: { borderColor: Colors.dark, backgroundColor: Colors.dark },
  pickupChipText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  pickupChipTextActive: { color: Colors.white },
  instructionsInput: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    minHeight: 100,
    textAlignVertical: "top",
  },
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.mediumGrey,
    padding: 16,
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
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
    marginBottom: 20,
  },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12 },
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
  listContent: { paddingBottom: 40 },
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
  resultTextBox: { flex: 1 },
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
  separator: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 64 },
});
