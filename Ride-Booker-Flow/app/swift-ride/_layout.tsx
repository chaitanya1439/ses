import { Stack } from "expo-router";

export default function SwiftRideLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer-qr" />
    </Stack>
  );
}
