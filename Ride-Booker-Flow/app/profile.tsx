import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import {
  Ionicons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Colors } from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  id: string;
  label: string;
  iconSet: "Ionicons" | "MaterialCommunityIcons" | "Feather";
  icon: string;
  color: string;
  route?: string;
  action?: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [stats, setStats] = React.useState({ rides: 0, saved: 0, parcels: 0 });

  React.useEffect(() => {
    if (user?.id) {
      fetch(`https://real.shelteric.com/api/rider/stats/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.stats) {
            setStats(data.stats);
          }
        })
        .catch(console.error);
    }
  }, [user?.id]);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      id: "rides",
      label: "My Rides",
      iconSet: "MaterialCommunityIcons",
      icon: "car-outline",
      color: Colors.info,
      route: "/my-rides",
    },
    {
      id: "payments",
      label: "Payments & Wallet",
      iconSet: "Ionicons",
      icon: "card-outline",
      color: Colors.success,
    },
    {
      id: "offers",
      label: "Offers & Coupons",
      iconSet: "MaterialCommunityIcons",
      icon: "ticket-percent-outline",
      color: Colors.primary,
    },
    {
      id: "saved",
      label: "Saved Addresses",
      iconSet: "Ionicons",
      icon: "heart-outline",
      color: Colors.danger,
    },
    {
      id: "refer",
      label: "Refer & Earn",
      iconSet: "MaterialCommunityIcons",
      icon: "account-multiple-plus-outline",
      color: "#8B5CF6",
    },
    {
      id: "settings",
      label: "Settings",
      iconSet: "Feather",
      icon: "settings",
      color: Colors.grey,
    },
    {
      id: "help",
      label: "Help & Support",
      iconSet: "Ionicons",
      icon: "help-circle-outline",
      color: Colors.info,
    },
    {
      id: "logout",
      label: "Log Out",
      iconSet: "Ionicons",
      icon: "log-out-outline",
      color: Colors.danger,
      action: handleLogout,
      danger: true,
    },
  ];

  const renderIcon = (item: MenuItem, size = 22) => {
    if (item.iconSet === "MaterialCommunityIcons") {
      return (
        <MaterialCommunityIcons
          name={item.icon as any}
          size={size}
          color={item.color}
        />
      );
    } else if (item.iconSet === "Feather") {
      return <Feather name={item.icon as any} size={size} color={item.color} />;
    }
    return (
      <Ionicons name={item.icon as any} size={size} color={item.color} />
    );
  };

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
        {/* Top Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.lightGrey, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark} />
          </Pressable>
          <Text style={{ fontSize: 20, fontFamily: "Poppins_700Bold", color: Colors.dark }}>Profile</Text>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={52} color={Colors.grey} />
            </View>
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={Colors.dark} />
            </View>
          </View>
          <Text style={styles.userName}>{user?.name ?? "Rider"}</Text>
          <Text style={styles.userPhone}>{user?.phone ?? ""}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color={Colors.primary} />
            <Text style={styles.ratingText}>{user?.rating?.toFixed(1) ?? "5.0"}</Text>
            <Text style={styles.ratingLabel}>Rating</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.rides}</Text>
            <Text style={styles.statLabel}>Rides</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{stats.saved}</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.parcels}</Text>
            <Text style={styles.statLabel}>Parcels</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.id}>
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && styles.menuItemPressed,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (item.action) {
                    item.action();
                  } else if (item.route) {
                    router.push(item.route as any);
                  }
                }}
              >
                <View
                  style={[
                    styles.menuIconBox,
                    { backgroundColor: item.color + "18" },
                  ]}
                >
                  {renderIcon(item)}
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.danger && { color: Colors.danger },
                  ]}
                >
                  {item.label}
                </Text>
                {!item.danger && (
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.mediumGrey}
                  />
                )}
              </Pressable>
              {index < menuItems.length - 1 && (
                <View style={styles.menuDivider} />
              )}
            </View>
          ))}
        </View>

        <Text style={styles.version}>RideGo v1.0.0</Text>
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
  profileHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginBottom: 10,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.lightGrey,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: Colors.dark,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.mediumGrey,
    marginVertical: 4,
  },
  menuCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.mediumGrey,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuItemPressed: {
    backgroundColor: Colors.lightGrey,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Poppins_500Medium",
    color: Colors.dark,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.mediumGrey,
    marginLeft: 66,
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: Colors.grey,
    marginBottom: 20,
  },
});
