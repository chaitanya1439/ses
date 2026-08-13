import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons, Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

const destinations = [
  {
    id: "1",
    name: "Jubilee Hills",
    city: "Hyderabad",
    icon: "city",
    color: "#FEF3C7",
  },
  {
    id: "2",
    name: "Banjara Hills",
    city: "Hyderabad",
    icon: "tree-outline",
    color: "#F0FDF4",
  },
  {
    id: "3",
    name: "HITEC City",
    city: "Hyderabad",
    icon: "office-building",
    color: "#EFF6FF",
  },
  {
    id: "4",
    name: "Gachibowli",
    city: "Hyderabad",
    icon: "stadium",
    color: "#FDF4FF",
  },
];

export default function TravelScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop:
              Platform.OS === "web" ? 67 + 20 : insets.top + 20,
            paddingBottom: 120,
          },
        ]}
      >
        <Text style={styles.title}>Plan Your Trip</Text>
        <Text style={styles.subtitle}>Schedule a ride for later</Text>

        <View style={styles.scheduleCard}>
          <View style={styles.scheduleIcon}>
            <Feather name="calendar" size={24} color={Colors.primary} />
          </View>
          <View style={styles.scheduleText}>
            <Text style={styles.scheduleTitle}>Schedule a Ride</Text>
            <Text style={styles.scheduleSub}>
              Book in advance, up to 7 days ahead
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.scheduleCta,
              pressed && styles.pressedSurface,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/book-ride");
            }}
          >
            <Text style={styles.scheduleCtaText}>Book</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Popular Destinations</Text>
        <View style={styles.destinationsGrid}>
          {destinations.map((dest) => (
            <Pressable
              key={dest.id}
              style={({ pressed }) => [
                styles.destinationCard,
                { backgroundColor: dest.color },
                pressed && styles.pressedSurface,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/book-ride");
              }}
            >
              <MaterialCommunityIcons
                name={dest.icon as any}
                size={28}
                color={Colors.dark}
              />
              <Text style={styles.destName}>{dest.name}</Text>
              <Text style={styles.destCity}>{dest.city}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={22} color={Colors.primary} />
          <Text style={styles.tipText}>
            Book in advance to get the best fares and guaranteed availability
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginBottom: 24,
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  scheduleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  scheduleText: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  scheduleSub: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  scheduleCta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  scheduleCtaText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  sectionLabel: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 14,
  },
  destinationsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  destinationCard: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    minHeight: 124,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.04)",
  },
  pressedSurface: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  destName: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  destCity: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary + "33",
    padding: 14,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    lineHeight: 18,
  },
});
