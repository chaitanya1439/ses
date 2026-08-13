with open("app/parcel-confirmed.tsx", "r") as f:
    code = f.read()

# Add centerMap function before animateLiveLocation
centerMap_func = """  const centerMap = useCallback(() => {
    if (!mapRef.current) return;
    const dest = currentStep === 0 ? pickupCoord : dropCoord;
    mapRef.current.fitToCoordinates([driverCoord, dest], {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
    setIsMapCentered(true);
  }, [driverCoord, pickupCoord, dropCoord, currentStep]);

  // Smooth animation for REAL GPS updates"""

code = code.replace("  // Smooth animation for REAL GPS updates", centerMap_func)

# Add missing styles to the end of the stylesheet
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
});
"""

code = code.replace("});\n", styles_to_add)

with open("app/parcel-confirmed.tsx", "w") as f:
    f.write(code)

print("Fixed parcel 2")
