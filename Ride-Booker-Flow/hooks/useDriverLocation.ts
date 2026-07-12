import { useEffect, useState, useRef, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  /** Epoch ms of the last update. */
  lastUpdated: number;
}

interface UseDriverLocationOptions {
  /** Whether to actively listen for driver location updates. */
  enabled: boolean;
}

interface UseDriverLocationReturn {
  /** The driver's current location (null if no updates received yet). */
  driverLocation: DriverLocation | null;
  /** Whether we are actively receiving location updates. */
  isReceiving: boolean;
  /** Seconds since the last location update (useful for stale-data indicators). */
  staleness: number;
  /** Reset the tracked location (e.g., when a ride ends). */
  clearLocation: () => void;
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * useDriverLocation
 *
 * Subscribes to the WebSocket `driver_location` events from the realtime-server
 * and maintains the driver's current position for map rendering.
 *
 * Usage:
 * ```tsx
 * const { driverLocation, staleness } = useDriverLocation({ enabled: hasActiveRide });
 *
 * // Render driver marker on the map
 * {driverLocation && (
 *   <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }} />
 * )}
 * ```
 */
export function useDriverLocation({
  enabled,
}: UseDriverLocationOptions): UseDriverLocationReturn {
  const { subscribe } = useSocket();

  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [staleness, setStaleness] = useState(0);

  const stalenessTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // ── Clear location state ────────────────────────────────────────────────────

  const clearLocation = useCallback(() => {
    setDriverLocation(null);
    setIsReceiving(false);
    setStaleness(0);
    lastUpdateTimeRef.current = 0;
  }, []);

  // ── Subscribe to driver_location events ─────────────────────────────────────

  useEffect(() => {
    if (!enabled) {
      // Stop staleness timer when not tracking
      if (stalenessTimerRef.current) {
        clearInterval(stalenessTimerRef.current);
        stalenessTimerRef.current = null;
      }
      return;
    }

    const unsubscribe = subscribe('driver_location', (payload: {
      driverId: string;
      location: { lat: number; lng: number; heading?: number; speed?: number };
    }) => {
      const now = Date.now();
      lastUpdateTimeRef.current = now;

      setDriverLocation({
        driverId: payload.driverId,
        lat: payload.location.lat,
        lng: payload.location.lng,
        heading: payload.location.heading,
        speed: payload.location.speed,
        lastUpdated: now,
      });

      setIsReceiving(true);
      setStaleness(0);
    });

    // Start a staleness timer to track how long since the last update
    stalenessTimerRef.current = setInterval(() => {
      if (lastUpdateTimeRef.current > 0) {
        const secondsSinceUpdate = Math.floor(
          (Date.now() - lastUpdateTimeRef.current) / 1000,
        );
        setStaleness(secondsSinceUpdate);

        // Consider the connection "stale" after 30 seconds without updates
        if (secondsSinceUpdate > 30) {
          setIsReceiving(false);
        }
      }
    }, 1_000);

    return () => {
      unsubscribe();
      if (stalenessTimerRef.current) {
        clearInterval(stalenessTimerRef.current);
        stalenessTimerRef.current = null;
      }
    };
  }, [enabled, subscribe]);

  return {
    driverLocation,
    isReceiving,
    staleness,
    clearLocation,
  };
}
