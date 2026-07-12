import Constants from 'expo-constants';

export const DEFAULT_GOOGLE_MAPS_API_KEY =
  'AIzaSyBXBSZzen8-bLZ_KJURq1sHyc872ubOkDM';

export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? DEFAULT_GOOGLE_MAPS_API_KEY;

function getExpoDevHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri?.split(':')[0];
}

function getSocketUrl(): string {
  if (process.env.EXPO_PUBLIC_SOCKET_URL) {
    return process.env.EXPO_PUBLIC_SOCKET_URL;
  }

  return 'wss://real.shelteric.com';
}

export const SOCKET_URL = getSocketUrl();

export function getPublicApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (process.env.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
  }

  return 'http://localhost:5000';
}
