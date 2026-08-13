import re

with open("app/parcel-confirmed.tsx", "r") as f:
    code = f.read()

# 1. Imports
code = code.replace(
    'import { MaterialCommunityIcons } from "@expo/vector-icons";',
    'import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";\nimport { TouchableOpacity } from "react-native";'
)

# 2. State
code = code.replace(
    '  const [chatVisible, setChatVisible] = useState(false);\n  const [shareVisible, setShareVisible] = useState(false);',
    '  const [chatVisible, setChatVisible] = useState(false);\n  const [shareVisible, setShareVisible] = useState(false);\n  const [isMapCentered, setIsMapCentered] = useState(true);'
)

# 3. centerMap
code = code.replace(
    '  // Initial fetch of the static route',
    '''  const centerMap = useCallback(() => {
    if (!mapRef.current) return;
    const dest = currentStep === 0 ? pickupCoord : dropCoord;
    mapRef.current.fitToCoordinates([driverCoord, dest], {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
    setIsMapCentered(true);
  }, [driverCoord, pickupCoord, dropCoord, currentStep]);

  // Initial fetch of the static route'''
)

# 4. MapView panning
code = code.replace('            showsUserLocation\n          >', '            showsUserLocation\n            onPanDrag={() => setIsMapCentered(false)}\n          >')


# 5. Marker & Polyline
old_marker_block = """            {/* Live driver marker \u2014 stands vertically */}
            {isConfirmed && (
              <Marker coordinate={driverCoord} zIndex={30} anchor={{ x: 0.5, y: 0.5 }}>
                {renderVehicleIcon(40, Colors.dark)}
              </Marker>
            )}

            {/* Driver \u2192 Pickup polyline */}
            {isConfirmed && !isOtpVerified && driverToPickupCoords.length > 1 && (
              <Polyline coordinates={driverToPickupCoords} strokeColor={Colors.info} strokeWidth={5} />
            )}

            {/* Pickup \u2192 Drop polyline */}
            {isOtpVerified && pickupToDropCoords.length > 1 && (
              <Polyline coordinates={pickupToDropCoords} strokeColor={Colors.dark} strokeWidth={5} />
            )}
          </MapView>"""

new_marker_block = """            {/* Live driver marker with ETA Badge and rotated icon */}
            {isConfirmed && (
              <Marker coordinate={driverCoord} zIndex={30} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.driverMarkerContainer}>
                  {etaRemaining != null ? (
                    <View style={styles.etaBadge}>
                      <Text style={styles.etaBadgeText}>{etaRemaining}m</Text>
                    </View>
                  ) : null}
                  <View style={{ transform: [{ rotate: `${driverHeading}deg` }] }}>
                    {renderVehicleIcon(40, Colors.dark)}
                  </View>
                </View>
              </Marker>
            )}

            {/* Driver \u2192 Pickup polyline */}
            {isConfirmed && !isOtpVerified && driverToPickupCoords.length > 1 && (
              <Polyline coordinates={[driverCoord, ...driverToPickupCoords.slice(1)]} strokeColor={Colors.info} strokeWidth={5} />
            )}

            {/* Pickup \u2192 Drop polyline */}
            {isOtpVerified && pickupToDropCoords.length > 1 && (
              <Polyline coordinates={[driverCoord, ...pickupToDropCoords.slice(1)]} strokeColor={Colors.dark} strokeWidth={5} />
            )}
          </MapView>
          
          {/* Floating Recenter Button */}
          {!isMapCentered && (
            <TouchableOpacity style={styles.recenterButton} onPress={centerMap} activeOpacity={0.8}>
              <Ionicons name="locate" size={24} color={Colors.dark} />
            </TouchableOpacity>
          )}"""

if old_marker_block in code:
    code = code.replace(old_marker_block, new_marker_block)
else:
    print("Could not find old marker block!")

# 6. Styles
styles_to_add = """  driverMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaBadge: {
    backgroundColor: Colors.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  etaBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Poppins_700Bold',
  },
  recenterButton: {
    position: 'absolute',
    right: 20,
    bottom: 250,
    backgroundColor: Colors.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
"""

code = code.replace('  sheetContainer: {\n', styles_to_add + '  sheetContainer: {\n')

with open("app/parcel-confirmed.tsx", "w") as f:
    f.write(code)

print("Done")
