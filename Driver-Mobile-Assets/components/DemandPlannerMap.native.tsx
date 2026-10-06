import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Heatmap, PROVIDER_GOOGLE } from 'react-native-maps';

interface Props {
  heatmapPoints: { latitude: number; longitude: number; weight: number }[];
}

export function DemandPlannerMap({ heatmapPoints }: Props) {
  return (
    <MapView
      userInterfaceStyle="light"
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFillObject}
      initialRegion={{
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }}
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
    >
      <Marker coordinate={{ latitude: 17.3850, longitude: 78.4867 }}>
        <View style={styles.blueDot}>
          <View style={styles.blueDotInner} />
        </View>
      </Marker>

      {heatmapPoints.length > 0 && (
        <Heatmap
          points={heatmapPoints}
          radius={40}
          opacity={0.7}
          gradient={{
            colors: ["#00000000", "#00e400", "#ffff00", "#ff7e00", "#ff0000"],
            startPoints: [0, 0.25, 0.5, 0.75, 1],
            colorMapSize: 256
          }}
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  blueDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  blueDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
});
