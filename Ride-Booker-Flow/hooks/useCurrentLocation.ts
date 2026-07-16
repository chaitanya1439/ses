import { useState, useEffect } from "react";
import * as Location from "expo-location";
import {
  fetchReverseGeocode,
} from "@/lib/googleMaps";

interface LocationState {
  address: string;
  coords: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
}

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({
    address: "",
    coords: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: "Location permission denied",
              address: "Enable location for pickup",
            }));
          }
          return;
        }

        const enabled = await Location.hasServicesEnabledAsync();
        if (!enabled) {
          throw new Error("Current location is unavailable. Make sure that location services are enabled");
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          coords,
          isLoading: false,
        }));

        // Reverse geocode for human-readable address
        try {
          const geo = await fetchReverseGeocode(
            coords.latitude,
            coords.longitude
          );
          if (!cancelled && geo) {
            let finalAddress = geo;
            const parts = geo.split(",").map(p => p.trim()).filter(p => {
              const lowerP = p.toLowerCase();
              return !lowerP.includes("unnamed road") && 
                     !lowerP.includes("sri sai nagar") &&
                     !p.match(/^[A-Z0-9]{4}\+[A-Z0-9]{2,}/);
            });
            
            if (parts.length > 0) {
              finalAddress = parts[0]; // Show only the primary place name
            } else {
              finalAddress = "Current Location";
            }

            setState((prev) => ({
              ...prev,
              address: finalAddress,
            }));
          }
        } catch {
          // Fallback to expo reverse geocode
          try {
            const [result] = await Location.reverseGeocodeAsync(coords);
            if (!cancelled && result) {
              const parts = [
                result.name,
                result.street,
                result.city,
              ].filter(Boolean).filter(p => {
                if (typeof p !== 'string') return false;
                const lowerP = p.toLowerCase();
                return !lowerP.includes("unnamed road") && !lowerP.includes("sri sai nagar");
              });
              setState((prev) => ({
                ...prev,
                address: parts[0] || "Current Location",
              }));
            }
          } catch {
            if (!cancelled) {
              setState((prev) => ({
                ...prev,
                address: "Current Location",
              }));
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            address: "Unable to get location",
            coords: null,
            isLoading: false,
            error: err instanceof Error ? err.message : "Location error",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
