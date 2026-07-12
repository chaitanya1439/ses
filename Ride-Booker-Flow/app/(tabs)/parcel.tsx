import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface ActionCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  route: string;
}

const actions: ActionCard[] = [
  {
    id: "send",
    title: "Send a Parcel",
    subtitle: "Door to door delivery",
    icon: "package-variant-closed",
    color: Colors.primary,
    bgColor: "#FEF3C7",
    route: "/parcel-locations",
  },
  {
    id: "receive",
    title: "Receive a Parcel",
    subtitle: "Someone sending you?",
    icon: "package-down",
    color: Colors.info,
    bgColor: "#EFF6FF",
    route: "/parcel-locations",
  },
];

export default function ParcelScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "web" ? 67 + 16 : insets.top + 20,
          },
        ]}
      >
        <Text style={styles.title}>Send Parcel</Text>
        <Text style={styles.subtitle}>Fast, reliable delivery</Text>
      </View>

      <View style={styles.illustration}>
        <View style={styles.illustrationCircle}>
          <MaterialCommunityIcons
            name="truck-delivery-outline"
            size={80}
            color={Colors.primary}
          />
        </View>
        <View style={styles.illustrationBadge}>
          <Ionicons name="flash" size={16} color={Colors.dark} />
          <Text style={styles.illustrationBadgeText}>Express Delivery</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionLabel}>Choose an option</Text>
        <View style={styles.cards}>
          {actions.map((action) => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.actionCard,
                { backgroundColor: action.bgColor },
                pressed && styles.pressedSurface,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push(action.route as any);
              }}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + "22" }]}>
                <MaterialCommunityIcons
                  name={action.icon as any}
                  size={36}
                  color={action.color}
                />
              </View>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.grey} />
            </Pressable>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
          <Text style={styles.infoText}>
            Parcels are delivered safely by verified delivery partners
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  illustration: {
    alignItems: "center",
    paddingVertical: 32,
  },
  illustrationCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: -16,
  },
  illustrationBadgeText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: Colors.grey,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cards: {
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.04)",
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  pressedSurface: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.info + "22",
    padding: 14,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: Colors.dark,
    lineHeight: 18,
  },
});
