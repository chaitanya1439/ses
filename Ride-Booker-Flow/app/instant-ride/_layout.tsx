import { Stack } from "expo-router";

export default function InstantRideLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="customer-qr" />
    </Stack>
  );
}
