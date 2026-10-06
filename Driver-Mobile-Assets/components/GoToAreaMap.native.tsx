import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  polygonCoords: { latitude: number; longitude: number }[];
}

export function GoToAreaMap({ polygonCoords }: Props) {
  const renderHeartPin = (scale: number = 1) => (
    <View style={[styles.mapPin, { transform: [{ scale }] }]}>
      <MaterialCommunityIcons name="map-marker-path" size={28} color="#E53935" style={{ position: 'absolute' }} />
      <MaterialCommunityIcons name="heart" size={12} color="#FFFFFF" style={{ position: 'absolute', top: 5 }} />
    </View>
  );

  return (
    <MapView
      userInterfaceStyle="light"
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
    >
      {/* Teal Zone Polygon */}
      <Polygon
        coordinates={polygonCoords}
        fillColor="rgba(20, 184, 166, 0.2)"
        strokeColor="#14B8A6"
        strokeWidth={2}
      />

      {/* Scattered Map Pins */}
      <Marker coordinate={{ latitude: 17.388, longitude: 78.482 }}>
        {renderHeartPin(0.9)}
      </Marker>
      <Marker coordinate={{ latitude: 17.395, longitude: 78.491 }}>
        {renderHeartPin(1.1)}
      </Marker>
      <Marker coordinate={{ latitude: 17.375, longitude: 78.478 }}>
        {renderHeartPin(1.0)}
      </Marker>
      <Marker coordinate={{ latitude: 17.382, longitude: 78.498 }}>
        {renderHeartPin(0.85)}
      </Marker>
    </MapView>
  );
}

const styles = StyleSheet.create({
  mapPin: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
