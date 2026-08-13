import re

with open("app/booking-confirmed.tsx", "r") as f:
    code = f.read()

# 1. Imports
code = code.replace(
    'import { MaterialCommunityIcons } from "@expo/vector-icons";',
    'import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";\nimport { TouchableOpacity } from "react-native";'
)

# 2. State and Refs
code = code.replace(
    '  const lastEtaFetchRef = useRef(0); // timestamp of last Distance Matrix API call\n  const [chatVisible, setChatVisible] = useState(false);\n  const [shareVisible, setShareVisible] = useState(false);',
    '  const lastEtaFetchRef = useRef(0); // timestamp of last Distance Matrix API call\n  const lastRerouteTimeRef = useRef(0);\n  const [chatVisible, setChatVisible] = useState(false);\n  const [shareVisible, setShareVisible] = useState(false);\n  const [isMapCentered, setIsMapCentered] = useState(true);'
)

# 3. centerMap
code = code.replace(
    '  // Initial fetch of the static route to draw the full blue/black lines',
    '''  const centerMap = useCallback(() => {
    if (!mapRef.current) return;
    const dest = currentStep === 0 ? pickupCoord : dropCoord;
    mapRef.current.fitToCoordinates([driverCoord, dest], {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
    setIsMapCentered(true);
  }, [driverCoord, pickupCoord, dropCoord, currentStep]);

  // Initial fetch of the static route to draw the full blue/black lines'''
)

# 4. AnimateLiveLocation logic
# We need to replace the step loop which contains the path erasing logic with the new logic
old_animate_block = """    let startTime: number | null = null;
    const DURATION = 1000; // 1 second animation

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / DURATION, 1);

      // Ease out quad
      const easeProgress = progress * (2 - progress);

      const currentLat = startLat + (endLat - startLat) * easeProgress;
      const currentLng = startLng + (endLng - startLng) * easeProgress;

      driverCoordRef.current = { latitude: currentLat, longitude: currentLng };
      setDriverCoord({ latitude: currentLat, longitude: currentLng });
      
      if (newLoc.heading != null) {
        setDriverHeading(newLoc.heading);
      } else {
        setDriverHeading(getBearing({ latitude: startLat, longitude: startLng }, { latitude: endLat, longitude: endLng }));
      }

      // Dynamic camera tracking
      // if (mapRef.current) {
      //   const dest = currentStepRef.current === 0 ? pickupCoord : dropCoord;
      //   mapRef.current.fitToCoordinates(
      //     [
      //       { latitude: currentLat, longitude: currentLng },
      //       dest
      //     ],
      //     {
      //       edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      //       animated: true,
      //     }
      //   );
      // }

      // --- Path Erasing Logic (optimized: checks 15 points max) ---
      const activePolylineSetter = currentStepRef.current === 0 ? setDriverToPickupCoords : setPickupToDropCoords;
      activePolylineSetter(prevPoly => {
        if (!prevPoly || prevPoly.length < 2) return prevPoly;
        
        let minIndex = 0;
        let minDist = Infinity;
        for (let i = 0; i < Math.min(prevPoly.length, 15); i++) {
          const pt = prevPoly[i];
          const dist = Math.hypot(pt.latitude - currentLat, pt.longitude - currentLng);
          if (dist < minDist) {
            minDist = dist;
            minIndex = i;
          }
        }
        
        const newPolyline = [{ latitude: currentLat, longitude: currentLng }, ...prevPoly.slice(minIndex + 1)];
        return newPolyline.length > 1 ? newPolyline : prevPoly;
      });

      if (progress < 1) {
        liveAnimIdRef.current = requestAnimationFrame(step);
      }
    };"""

new_animate_block = """    let startTime: number | null = null;
    const DURATION = 4000; // 4 seconds animation

    const activePolylineSetter = currentStepRef.current === 0 ? setDriverToPickupCoords : setPickupToDropCoords;
    activePolylineSetter(prevPoly => {
      if (!prevPoly || prevPoly.length < 2) return prevPoly;
      let minIndex = 0;
      let minDist = Infinity;
      for (let i = 0; i < Math.min(prevPoly.length, 15); i++) {
        const pt = prevPoly[i];
        const dist = Math.hypot(pt.latitude - newLoc.lat, pt.longitude - newLoc.lng);
        if (dist < minDist) {
          minDist = dist;
          minIndex = i;
        }
      }
      
      if (minDist > 0.00015) {
        const now = Date.now();
        if (now - lastRerouteTimeRef.current > 5000) {
          lastRerouteTimeRef.current = now;
          const dest = currentStepRef.current === 0 ? pickupCoord : dropCoord;
          fetchDirectionsPolyline({ latitude: newLoc.lat, longitude: newLoc.lng }, dest).then(newRoute => {
            if (newRoute && newRoute.length > 0) {
              activePolylineSetter(newRoute);
            }
          });
        }
      }
      const newPolyline = [{ latitude: newLoc.lat, longitude: newLoc.lng }, ...prevPoly.slice(minIndex + 1)];
      return newPolyline.length > 1 ? newPolyline : prevPoly;
    });

    const calculatedHeading = getBearing({ latitude: startLat, longitude: startLng }, { latitude: endLat, longitude: endLng });
    if (newLoc.heading != null && newLoc.heading > 0) {
      setDriverHeading(newLoc.heading);
    } else if (Math.abs(endLat - startLat) > 0.00001 || Math.abs(endLng - startLng) > 0.00001) {
      setDriverHeading(calculatedHeading);
    }

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / DURATION, 1);
      const easeProgress = progress * (2 - progress);
      const currentLat = startLat + (endLat - startLat) * easeProgress;
      const currentLng = startLng + (endLng - startLng) * easeProgress;

      driverCoordRef.current = { latitude: currentLat, longitude: currentLng };
      setDriverCoord({ latitude: currentLat, longitude: currentLng });

      if (progress < 1) {
        liveAnimIdRef.current = requestAnimationFrame(step);
      }
    };"""

code = code.replace(old_animate_block, new_animate_block)

# 5. UI Updates
code = code.replace('            showsUserLocation\n          >', '            showsUserLocation\n            onPanDrag={() => setIsMapCentered(false)}\n          >')

old_marker_block = """            {/* Live driver marker with rotation */}
            {isConfirmed && (
              <Marker coordinate={driverCoord} zIndex={30} flat rotation={driverHeading} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={styles.liveDriverMarkerWrap}>
                  <BikeIcon width={36} height={36} />
                </View>
              </Marker>
            )}

            {/* Driver → Pickup polyline */}
            {isConfirmed && !isOtpVerified && driverToPickupCoords.length > 1 && (
              <Polyline coordinates={driverToPickupCoords} strokeColor={Colors.info} strokeWidth={5} />
            )}

            {/* Pickup → Drop polyline */}
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
                    <BikeIcon width={36} height={36} />
                  </View>
                </View>
              </Marker>
            )}

            {/* Driver → Pickup polyline */}
            {isConfirmed && !isOtpVerified && driverToPickupCoords.length > 1 && (
              <Polyline coordinates={[driverCoord, ...driverToPickupCoords.slice(1)]} strokeColor={Colors.info} strokeWidth={5} />
            )}

            {/* Pickup → Drop polyline */}
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

code = code.replace(old_marker_block, new_marker_block)

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

with open("app/booking-confirmed.tsx", "w") as f:
    f.write(code)

print("Done")
