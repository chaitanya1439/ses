import React from "react";
import { View, Text } from "react-native";

const MapView = React.forwardRef((props, ref) => (
  <View
    ref={ref}
    style={[{ backgroundColor: "#e5e5e5", alignItems: "center", justifyContent: "center" }, props.style]}
  >
    <Text style={{ color: "#999", fontSize: 12 }}>Map (mobile only)</Text>
  </View>
));
MapView.displayName = "MapView";

const Marker = () => null;
const Polyline = () => null;
const Circle = () => null;
const Callout = () => null;
const Polygon = () => null;
const Overlay = () => null;
const PROVIDER_GOOGLE = "google";
const PROVIDER_DEFAULT = null;
const AnimatedMapView = MapView;
const MAP_TYPES = {};

export default MapView;
export {
  MapView,
  Marker,
  Polyline,
  Circle,
  Callout,
  Polygon,
  Overlay,
  PROVIDER_GOOGLE,
  PROVIDER_DEFAULT,
  AnimatedMapView,
  MAP_TYPES,
};
