import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
  StatusBar,
  Platform,
  Linking,
} from "react-native";
import { router } from "expo-router";
import * as Contacts from "expo-contacts";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

export default function ChooseRecipientScreen() {
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [searchText, setSearchText] = useState("");
  const [contacts, setContacts] = useState<any[]>([]);

  // Manual entry states for fallback
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        setHasPermission(status === "granted");

        if (status === "granted") {
          fetchContacts("");
        }
      } catch (error) {
        console.warn("Contacts permission error:", error);
        setHasPermission(false);
      }
    })();
  }, []);

  const fetchContacts = async (query: string) => {
    try {
      const options: Contacts.ContactQuery = {
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      };
      if (query) {
        options.name = query;
      }
      const { data } = await Contacts.getContactsAsync(options);
      setContacts(data || []);
    } catch (error) {
      console.warn("Error fetching contacts:", error);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    if (hasPermission) {
      fetchContacts(text);
    }
  };

  const handleSelectContact = (contact: any) => {
    const phone = contact.phoneNumbers?.[0]?.number;
    if (!phone) return; // Disallow selecting invalid contacts

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.push({
      pathname: "/ParcelReviewDeliveryScreen" as any,
      params: {
        recipientName: contact.name,
        recipientPhone: phone,
      },
    });
  };

  const handleManualAdd = () => {
    if (!manualName || !manualPhone) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
    router.push({
      pathname: "/ParcelReviewDeliveryScreen" as any,
      params: {
        recipientName: manualName,
        recipientPhone: manualPhone,
      },
    });
  };

  // --- 4. PERMISSION DENIED STATE ---
  if (hasPermission === false) {
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
          <Text style={styles.headerTitle}>Choose Recipient</Text>
        </View>

        <View style={styles.deniedContainer}>
          <Ionicons name="people-outline" size={54} color={Colors.grey} />
          <Text style={styles.deniedTitle}>
            Allow contacts access to find recipients
          </Text>
          <Pressable
            style={styles.settingsBtn}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        </View>

        <View style={styles.manualContainer}>
          <Text style={styles.manualTitle}>Or enter manually</Text>
          <TextInput
            style={styles.manualInput}
            placeholder="Recipient Name"
            placeholderTextColor={Colors.grey}
            value={manualName}
            onChangeText={setManualName}
          />
          <TextInput
            style={styles.manualInput}
            placeholder="Phone Number"
            placeholderTextColor={Colors.grey}
            value={manualPhone}
            onChangeText={setManualPhone}
            keyboardType="phone-pad"
          />
          <Pressable
            style={[
              styles.addManualBtn,
              (!manualName || !manualPhone) && styles.addManualBtnDisabled,
            ]}
            onPress={handleManualAdd}
            disabled={!manualName || !manualPhone}
          >
            <Text style={styles.addManualBtnText}>Add manually</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // --- 1 & 2. NORMAL PERMISSION GRANTED STATE ---
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
        <Text style={styles.headerTitle}>Choose Recipient</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={Colors.grey} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
            placeholderTextColor={Colors.grey}
            value={searchText}
            onChangeText={handleSearchChange}
          />
        </View>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item, index) => (item as any).id || `contact-${index}`}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: any }) => {
          const hasPhone = item.phoneNumbers && item.phoneNumbers.length > 0;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.contactRow,
                pressed && styles.contactRowPressed,
              ]}
              onPress={() => handleSelectContact(item)}
              disabled={!hasPhone}
            >
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitials}>
                  {item.name ? item.name.charAt(0).toUpperCase() : "?"}
                </Text>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.name || "Unknown"}</Text>
                {hasPhone ? (
                  <Text style={styles.contactPhone}>
                    {item.phoneNumbers![0].number}
                  </Text>
                ) : (
                  <Text style={styles.noPhoneText}>No phone number</Text>
                )}
              </View>

              {/* --- 3. INVALID BADGE --- */}
              {!hasPhone && (
                <View style={styles.invalidBadge}>
                  <Text style={styles.invalidBadgeText}>Invalid</Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightGrey,
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  contactRowPressed: {
    backgroundColor: Colors.lightGrey,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "30",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitials: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  contactPhone: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  noPhoneText: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.danger,
    marginTop: 2,
  },
  invalidBadge: {
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invalidBadgeText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.grey,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGrey,
    marginLeft: 72,
  },
  deniedContainer: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGrey,
  },
  deniedTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 20,
  },
  settingsBtn: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  settingsBtnText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.white,
  },
  manualContainer: {
    padding: 20,
  },
  manualTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 16,
  },
  manualInput: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    marginBottom: 12,
  },
  addManualBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  addManualBtnDisabled: {
    opacity: 0.5,
  },
  addManualBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
});
