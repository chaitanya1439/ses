import { useState, useEffect } from "react";
import {
  fetchDirectionsWithDetails,
  DirectionsResult,
} from "@/lib/googleMaps";

// ─── Vehicle definitions ─────────────────────────────────────────────
export interface VehicleOption {
  id: string;
  name: string;
  capacity: number;
  baseFare: number;
  perKm: number;
  perMin: number;
  icon: string;
  iconSet: "MaterialCommunityIcons" | "Ionicons" | "FontAwesome5";
  fare: number;
  eta: number; // minutes
  isFastest?: boolean;
  hasDiscount?: boolean;
  useCustomImage?: boolean;
}

const VEHICLE_CONFIG = [
  { id: "bike-saver", name: "Bike Saver", capacity: 1, baseFare: 20, perKm: 8, perMin: 0.8, icon: "motorbike", iconSet: "MaterialCommunityIcons" as const, isFastest: true },
  { id: "she-bike", name: "She Bike", capacity: 1, baseFare: 22, perKm: 9, perMin: 0.9, icon: "motorbike", iconSet: "MaterialCommunityIcons" as const, useCustomImage: true },
  { id: "parcel-bike", name: "Parcel Bike", capacity: 1, baseFare: 25, perKm: 10, perMin: 1, icon: "cube-outline", iconSet: "Ionicons" as const, useCustomImage: true },
  { id: "scooty", name: "Scooty", capacity: 1, baseFare: 18, perKm: 7, perMin: 0.8, icon: "scooter", iconSet: "MaterialCommunityIcons" as const, hasDiscount: true },
];

// ─── Hook ────────────────────────────────────────────────────────────
interface FareResult {
  vehicles: VehicleOption[];
  directions: DirectionsResult | null;
  isLoading: boolean;
  error: string | null;
}

interface Coords {
  latitude: number;
  longitude: number;
}

export function useFareCalculator(
  pickup: Coords | null,
  destination: Coords | null
): FareResult {
  const [state, setState] = useState<FareResult>({
    vehicles: [],
    directions: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!pickup || !destination) {
      setState({ vehicles: [], directions: null, isLoading: false, error: "Missing coordinates" });
      return;
    }

    let cancelled = false;

    (async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await fetchDirectionsWithDetails(pickup, destination);

      if (cancelled) return;

      if (!result) {
        setState({ vehicles: [], directions: null, isLoading: false, error: "Could not fetch route" });
        return;
      }

      const distKm = result.distanceMeters / 1000;
      const durationMin = result.durationSeconds / 60;

      const vehicles: VehicleOption[] = VEHICLE_CONFIG.map((v) => {
        const raw = v.baseFare + v.perKm * distKm + v.perMin * durationMin;
        const fare = Math.round(raw * 100) / 100;
        const eta = Math.max(1, Math.round(durationMin));

        return {
          id: v.id,
          name: v.name,
          capacity: v.capacity,
          baseFare: v.baseFare,
          perKm: v.perKm,
          perMin: v.perMin,
          icon: v.icon,
          iconSet: v.iconSet,
          fare,
          eta,
          isFastest: v.isFastest,
          hasDiscount: v.hasDiscount,
          useCustomImage: v.useCustomImage,
        };
      });

      setState({ vehicles, directions: result, isLoading: false, error: null });
    })();

    return () => {
      cancelled = true;
    };
  }, [pickup, destination]);

  return state;
}
