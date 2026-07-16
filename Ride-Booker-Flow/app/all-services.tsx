import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";

interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  iconSet?: "MaterialCommunityIcons" | "Ionicons";
  customImage?: any;
  color: string;
  route: string;
}

const allServices: ServiceItem[] = [
  {
    id: "parcel",
    title: "Parcel",
    subtitle: "Send anything, anywhere",
    icon: "package-variant-closed",
    iconSet: "MaterialCommunityIcons",
    color: "#FEF3C7",
    route: "/(tabs)/parcel",
  },
  {
    id: "she-bike",
    title: "She Bike",
    subtitle: "Safe rides for women",
    customImage: require("@/assets/images/she-bike-icon.png"),
    color: "#FCE7F3",
    route: "/book-ride",
  },
  {
    id: "bike",
    title: "Bike",
    subtitle: "Quick bike rides",
    icon: "motorbike",
    iconSet: "MaterialCommunityIcons",
    color: "#E0F2FE",
    route: "/book-ride",
  },
];

export default function AllServicesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop:
              Platform.OS === "web" ? 20 : insets.top + 8,
          },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>All Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>Choose a service</Text>

        <View style={styles.servicesGrid}>
          {allServices.map((service) => (
            <Pressable
              key={service.id}
              style={[styles.serviceCard, { backgroundColor: service.color }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(service.route as any);
              }}
            >
              <View style={styles.serviceIconBox}>
                {service.customImage ? (
                  <Image
                    source={service.customImage}
                    style={{ width: 40, height: 40, borderRadius: 10 }}
                    resizeMode="contain"
                  />
                ) : service.iconSet === "MaterialCommunityIcons" ? (
                  <MaterialCommunityIcons
                    name={service.icon as any}
                    size={32}
                    color={Colors.dark}
                  />
                ) : (
                  <Ionicons
                    name={service.icon as any}
                    size={30}
                    color={Colors.dark}
                  />
                )}
              </View>
              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
            </Pressable>
          ))}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGrey,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 16,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  serviceCard: {
    width: "47%",
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  serviceIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceTitle: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  serviceSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
});
