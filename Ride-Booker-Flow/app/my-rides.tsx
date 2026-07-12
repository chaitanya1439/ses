import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  StatusBar,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { mockRides } from "@/constants/mockData";

type Filter = "all" | "completed" | "cancelled";

export default function MyRidesScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = mockRides.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

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
        <Text style={styles.headerTitle}>My Rides</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "completed", "cancelled"] as Filter[]).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => {
              setFilter(f);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Ride List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.vehicleIcon}>
                <MaterialCommunityIcons
                  name={
                    item.vehicle === "Bike"
                      ? "motorbike"
                      : item.vehicle === "Scooty"
                      ? "scooter"
                      : item.vehicle === "Auto"
                      ? "rickshaw"
                      : "car"
                  }
                  size={24}
                  color={Colors.dark}
                />
              </View>
              <View style={styles.rideMeta}>
                <Text style={styles.rideVehicle}>{item.vehicle}</Text>
                <Text style={styles.rideDateTime}>
                  {item.date} · {item.time}
                </Text>
              </View>
              <View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === "completed"
                      ? styles.statusCompleted
                      : styles.statusCancelled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === "completed"
                        ? styles.statusTextCompleted
                        : styles.statusTextCancelled,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.routeSection}>
              <View style={styles.routeItem}>
                <View style={[styles.routeDot, styles.dotGreen]} />
                <Text style={styles.routeAddr} numberOfLines={1}>
                  {item.pickup}
                </Text>
              </View>
              <View style={styles.routeConnector} />
              <View style={styles.routeItem}>
                <View style={[styles.routeDot, styles.dotOrange]} />
                <Text style={styles.routeAddr} numberOfLines={1}>
                  {item.drop}
                </Text>
              </View>
            </View>

            <View style={styles.rideFooter}>
              <Text style={styles.fareBold}>₹{item.fare}</Text>
              {item.status === "completed" && (
                <Pressable
                  style={styles.rebookBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/book-ride");
                  }}
                >
                  <Ionicons name="refresh" size={14} color={Colors.dark} />
                  <Text style={styles.rebookBtnText}>Rebook</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="car-off"
              size={48}
              color={Colors.mediumGrey}
            />
            <Text style={styles.emptyTitle}>No rides found</Text>
            <Text style={styles.emptySubtitle}>
              Your ride history will appear here
            </Text>
          </View>
        }
      />
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
    backgroundColor: Colors.white,
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGrey,
  },
  filterTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightGrey,
  },
  filterTabActive: {
    backgroundColor: Colors.dark,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.grey,
  },
  filterTextActive: {
    color: Colors.white,
    fontFamily: "Poppins_700Bold",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  rideCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    padding: 16,
    gap: 12,
  },
  rideHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.lightGrey,
    alignItems: "center",
    justifyContent: "center",
  },
  rideMeta: {
    flex: 1,
  },
  rideVehicle: {
    fontSize: 15,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  rideDateTime: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: Colors.success + "18",
  },
  statusCancelled: {
    backgroundColor: Colors.danger + "18",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    textTransform: "capitalize",
  },
  statusTextCompleted: {
    color: Colors.success,
  },
  statusTextCancelled: {
    color: Colors.danger,
  },
  routeSection: {
    backgroundColor: Colors.lightGrey,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: Colors.success,
  },
  dotOrange: {
    backgroundColor: "#F97316",
  },
  routeAddr: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  routeConnector: {
    width: 2,
    height: 10,
    backgroundColor: Colors.mediumGrey,
    marginLeft: 3,
    borderRadius: 1,
  },
  rideFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fareBold: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  rebookBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rebookBtnText: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
});
