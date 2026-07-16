import { Tabs, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";



function ClassicTabLayout() {
  const insets = useSafeAreaInsets();
  // Ensure at least 8px padding below the tabs, plus the system nav inset
  const bottomPadding = Math.max(insets.bottom, 8);
  const tabContentHeight = 48; // fixed height for the tab content area
  const totalHeight = tabContentHeight + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          fontFamily: 'Poppins_600SemiBold',
          marginTop: -2,
        },
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: totalHeight,
          paddingBottom: bottomPadding,
        },
        tabBarItemStyle: {
          height: tabContentHeight,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      {/* HOME TAB */}
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* ORDERS TAB */}
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={22}
              color={color}
            />
          ),
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          href: null,
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cash" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          href: null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  const { driver } = useAuth();
  
  // Wait for driver state to be initialized
  if (!driver) return null;
  
  if (!driver.isVerified) {
    return <Redirect href={"/onboarding" as any} />;
  }

  return <ClassicTabLayout />;
}
