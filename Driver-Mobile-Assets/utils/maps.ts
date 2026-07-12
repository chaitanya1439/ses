import { Linking, Platform } from 'react-native';

export const openGoogleMapsNavigation = (destLat: number, destLng: number, destName?: string) => {
  const googleMapsUrl = Platform.OS === 'ios'
    ? `comgooglemaps://?daddr=${destLat},${destLng}&directionsmode=driving`
    : `google.navigation:q=${destLat},${destLng}`;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${destName ? `&destination_place_id=${encodeURIComponent(destName)}` : ''}&travelmode=driving`;

  Linking.canOpenURL(googleMapsUrl)
    .then(supported => {
      Linking.openURL(supported ? googleMapsUrl : webUrl);
    })
    .catch(() => {
      Linking.openURL(webUrl);
    });
};
