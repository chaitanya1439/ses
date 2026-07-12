import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import React from "react";

/**
 * Tab layout – the HomeScreen implements its own floating pill-shaped
 * bottom navigation bar, so we hide the default Expo Router tab bar
 * on the home tab.  Other tabs keep their default headers hidden.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="parcel" />
      <Tabs.Screen name="travel" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
