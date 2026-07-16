import React, { useState } from "react";
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
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useBooking } from "@/contexts/BookingContext";

type Mode = "sending" | "receiving";
type Pickup = "curb" | "door" | "leave";

const PICKUP_OPTIONS: { id: Pickup; label: string }[] = [
  { id: "curb", label: "Meet at curb" },
  { id: "door", label: "Meet at door" },
  { id: "leave", label: "Leave at door" },
];

export default function ReviewDeliveryScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("sending");
  const [contactSheetVisible, setContactSheetVisible] = useState(false);
  const [contactTarget, setContactTarget] = useState<"sender" | "recipient">(
    "recipient"
  );
  const [selectedPickup, setSelectedPickup] = useState<Pickup>("curb");
  const [scheduleMode, setScheduleMode] = useState<"now" | "later">("now");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");

  const openContactSheet = (target: "sender" | "recipient") => {
    setContactTarget(target);
    setContactName("");
    setContactPhone("");
    setContactSheetVisible(true);
  };

  const handleSaveContact = () => {
    if (contactTarget === "recipient") {
      setRecipientName(contactName);
    } else {
      setSenderName(contactName);
    }
    setContactSheetVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const displayName = user?.name ?? "You";
  const { pickup, drop, fare } = useBooking();
  const pickupAddr = pickup?.name || pickup?.address || "Pickup location";
  const dropAddr = drop?.name || drop?.address || "Drop location";

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
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
        {/* Mode Toggle */}
        <View style={styles.toggleContainer}>
          {(["sending", "receiving"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.toggleOption, mode === m && styles.toggleOptionActive]}
              onPress={() => {
                setMode(m);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  mode === m && styles.toggleTextActive,
                ]}
              >
                {m === "sending" ? "I'm sending" : "I'm receiving"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Trip Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip details</Text>

          <View style={styles.routeCard}>
            {/* Sender / Stop 1 */}
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
                  {mode === "sending" ? displayName : (senderName || "Add sender details")}
                </Text>
                <Text style={styles.stopAddr}>{pickupAddr}</Text>
                <Text style={styles.stopMeta}>
                  {PICKUP_OPTIONS.find((o) => o.id === selectedPickup)?.label} · Add instructions
                </Text>
              </View>
              {mode === "receiving" && (
                <Pressable
                  style={styles.addBtn}
                  onPress={() => openContactSheet("sender")}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.routeLine} />

            {/* Recipient / Stop 2 */}
            <View style={styles.stopRow}>
              <View style={[styles.stopIconBox, styles.stopIconBoxSquare]}>
                <MaterialCommunityIcons name="flag" size={16} color={Colors.white} />
              </View>
              <View style={styles.stopContent}>
                <Text style={styles.stopPerson}>
                  {mode === "receiving"
                    ? displayName
                    : recipientName || "Add recipient details"}
                </Text>
                <Text style={styles.stopAddr}>{dropAddr}</Text>
                <Text style={styles.stopMeta}>
                  {PICKUP_OPTIONS.find((o) => o.id === selectedPickup)?.label} · Add instructions
                </Text>
              </View>
              {mode === "sending" && (
                <Pressable
                  style={styles.addBtn}
                  onPress={() => openContactSheet("recipient")}
                >
                  <Text style={styles.addBtnText}>Add</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Pickup Preference */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Delivery preference</Text>
          </View>
          <View style={styles.pickupOptions}>
            {PICKUP_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.pickupChip,
                  selectedPickup === opt.id && styles.pickupChipActive,
                ]}
                onPress={() => {
                  setSelectedPickup(opt.id);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text
                  style={[
                    styles.pickupChipText,
                    selectedPickup === opt.id && styles.pickupChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Schedule */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Pickup time</Text>
            <Ionicons name="information-circle-outline" size={18} color={Colors.grey} />
          </View>
          <View style={styles.scheduleOptions}>
            <Pressable
              style={[
                styles.scheduleCard,
                scheduleMode === "now" && styles.scheduleCardSelected,
              ]}
              onPress={() => setScheduleMode("now")}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={22}
                color={scheduleMode === "now" ? Colors.primary : Colors.grey}
              />
              <View>
                <Text
                  style={[
                    styles.scheduleTitle,
                    scheduleMode === "now" && { color: Colors.dark },
                  ]}
                >
                  Parcel Bike
                </Text>
                <Text style={styles.scheduleSubtitle}>Pickup in 2 min</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.scheduleCard,
                scheduleMode === "later" && styles.scheduleCardSelected,
              ]}
              onPress={() => setScheduleMode("later")}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                size={22}
                color={scheduleMode === "later" ? Colors.primary : Colors.grey}
              />
              <View>
                <Text
                  style={[
                    styles.scheduleTitle,
                    scheduleMode === "later" && { color: Colors.dark },
                  ]}
                >
                  Schedule for later
                </Text>
                <Text style={styles.scheduleSubtitle}>Fare may change</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Peace of Mind */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add peace of mind?</Text>
          <View style={styles.insuranceCard}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={28}
              color={Colors.grey}
            />
            <View style={styles.insuranceText}>
              <Text style={styles.insuranceTitle}>Parcel Protection</Text>
              <Text style={styles.insuranceSub}>Coming soon</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Soon</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Confirm Button */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + 12 },
        ]}
      >
        <Pressable
          style={styles.confirmBtn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const parcelDetails = {
              mode,
              selectedPickup,
              senderName: mode === "sending" ? displayName : senderName,
              recipientName: mode === "receiving" ? displayName : recipientName,
              contactPhone,
            };
            router.push({
              pathname: "/confirm-pickup" as any,
              params: { parcelDetails: JSON.stringify(parcelDetails) },
            });
          }}
        >
          <Text style={styles.confirmBtnText}>Confirm delivery</Text>
          <Text style={styles.confirmBtnPrice}>₹{fare > 0 ? fare.toFixed(2) : 62.75}</Text>
        </Pressable>
      </View>

      {/* Contact Sheet */}
      <Modal
        visible={contactSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContactSheetVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setContactSheetVisible(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add contact details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={contactName}
              onChangeText={setContactName}
              placeholder="Full name"
              placeholderTextColor={Colors.grey}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone number</Text>
            <TextInput
              style={styles.fieldInput}
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder="+91 XXXXXXXXXX"
              placeholderTextColor={Colors.grey}
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            style={[
              styles.saveBtn,
              (!contactName || !contactPhone) && { opacity: 0.5 },
            ]}
            onPress={handleSaveContact}
            disabled={!contactName || !contactPhone}
          >
            <Text style={styles.saveBtnText}>Save Contact</Text>
          </Pressable>
        </View>
      </Modal>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleOptionActive: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },
  toggleTextActive: {
    color: Colors.dark,
    fontFamily: "Poppins_700Bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
  stopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stopIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stopIconBoxSquare: {
    borderRadius: 6,
  },
  stopContent: {
    flex: 1,
    gap: 2,
  },
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
  stopMeta: {
    fontSize: 12,
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
  pickupOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickupChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.mediumGrey,
    backgroundColor: Colors.white,
  },
  pickupChipActive: {
    borderColor: Colors.dark,
    backgroundColor: Colors.dark,
  },
  pickupChipText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  pickupChipTextActive: {
    color: Colors.white,
  },
  scheduleOptions: {
    flexDirection: "row",
    gap: 12,
  },
  scheduleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.mediumGrey,
    backgroundColor: Colors.white,
  },
  scheduleCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  scheduleTitle: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: Colors.grey,
  },
  scheduleSubtitle: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  insuranceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.lightGrey,
    borderRadius: 14,
    padding: 14,
    opacity: 0.7,
  },
  insuranceText: {
    flex: 1,
  },
  insuranceTitle: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  insuranceSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  comingSoonBadge: {
    backgroundColor: Colors.mediumGrey,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.grey,
  },
  bottomBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.mediumGrey,
    padding: 16,
  },
  confirmBtn: {
    backgroundColor: Colors.dark,
    borderRadius: 14,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  confirmBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.white,
  },
  confirmBtnPrice: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
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
  fieldGroup: {
    marginBottom: 16,
  },
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
});
