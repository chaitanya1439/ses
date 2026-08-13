with open("app/parcel-confirmed.tsx", "r") as f:
    code = f.read()

bad_snippet = """      <View style={styles.mapContainer}>
        {Platform.OS !== "web" ? (
                    <Text style={styles.uberLabelTimeUnit}>MIN</Text>"""

good_snippet = """      <View style={styles.mapContainer}>
        {Platform.OS !== "web" ? (
          <>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={mapRegion}
              pitchEnabled={false}
              customMapStyle={customMapStyle}
              showsCompass={false}
              showsUserLocation
              onPanDrag={() => setIsMapCentered(false)}
            >
            {/* Pickup marker */}
            <Marker coordinate={pickupCoord} anchor={{ x: 0.5, y: 0.5 }} style={{ zIndex: 20 }}>
              <View style={styles.uberMarkerWrapper}>
                <View style={styles.uberPickupDot} />
                <View style={styles.uberPickupLabelAbsolute}>
                  <View style={styles.uberLabelTime}>
                    <Text style={styles.uberLabelTimeValue}>5</Text>
                    <Text style={styles.uberLabelTimeUnit}>MIN</Text>"""

if bad_snippet in code:
    code = code.replace(bad_snippet, good_snippet)
else:
    print("bad_snippet not found!")

with open("app/parcel-confirmed.tsx", "w") as f:
    f.write(code)

print("Patch applied.")
