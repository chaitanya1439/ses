import Constants from "expo-constants";

export const GOOGLE_MAPS_API_KEY = "AIzaSyBXBSZzen8-bLZ_KJURq1sHyc872ubOkDM";

function getExpoDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri?.split(":")[0];
}

function getPublicWebSocketUrl() {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  return "wss://real.shelteric.com";
}

export const PUBLIC_WEBSOCKET_URL = getPublicWebSocketUrl();
