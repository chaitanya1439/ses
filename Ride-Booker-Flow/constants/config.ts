import Constants from "expo-constants";

export const GOOGLE_MAPS_API_KEY = "AIzaSyCleomJ-Z8Dalf54g7ApfjzIsSP6_Z_ats";

function getExpoDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri?.split(":")[0];
}

function getPublicWebSocketUrl() {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  // Use local dev server only when explicitly running one on port 5000.
  // Default to production WebSocket for all environments.
  return "wss://real.shelteric.com";
}

export const PUBLIC_WEBSOCKET_URL = getPublicWebSocketUrl();
