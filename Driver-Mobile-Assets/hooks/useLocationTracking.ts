import { useEffect, useRef, useCallback, useState } from 'react';
import * as ExpoLocation from 'expo-location';
import { useSocket } from '@/context/SocketContext';

// ─── Configuration ────────────────────────────────────────────────────────────

/** Minimum distance in meters before emitting a location update to the server. */
const MIN_DISTANCE_THRESHOLD_METERS = 50;

/** Location tracking interval (ms) — how frequently we sample GPS. */
const LOCATION_INTERVAL_MS = 5_000;

/** Throttle WebSocket emissions to prevent flooding the server. */
const THROTTLE_MS = 2_000;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LocationCoords {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
}

interface UseLocationTrackingOptions {
  /** Whether tracking is currently enabled (e.g., driver is on-duty). */
  enabled: boolean;
  /** Optional: the riderId to tag outbound location_update messages with. */
  riderId?: string;
  /** Minimum distance change in meters before emitting (default: 50m). */
  distanceThreshold?: number;
}

interface UseLocationTrackingReturn {
  /** Current GPS position. */
  currentLocation: LocationCoords | null;
  /** Whether location permissions have been granted. */
  hasPermission: boolean;
  /** Whether actively tracking location. */
  isTracking: boolean;
  /** Any error message from permission or tracking failures. */
  error: string | null;
  /** Manually request location permissions. */
  requestPermission: () => Promise<boolean>;
}

// ─── Haversine distance helper ────────────────────────────────────────────────

function getDistanceInMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371e3; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * useLocationTracking
 *
 * Tracks the driver's GPS location using expo-location and emits significant
 * changes (> threshold meters) through the active WebSocket connection.
 *
 * Usage:
 * ```tsx
 * const { currentLocation, isTracking } = useLocationTracking({
 *   enabled: isOnDuty,
 *   riderId: activeRide?.customerId,
 * });
 * ```
 */
export function useLocationTracking({
  enabled,
  riderId,
  distanceThreshold = MIN_DISTANCE_THRESHOLD_METERS,
}: UseLocationTrackingOptions): UseLocationTrackingReturn {
  const { sendThrottledMessage } = useSocket();

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastEmittedLocationRef = useRef<LocationCoords | null>(null);
  const watchSubscriptionRef = useRef<ExpoLocation.LocationSubscription | null>(null);

  // ── Permission Request ──────────────────────────────────────────────────────

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      // First check if we already have permission
      const { status: existingStatus } = await ExpoLocation.getForegroundPermissionsAsync();
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return true;
      }

      // Request foreground permission
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied. Please enable it in settings.');
        setHasPermission(false);
        return false;
      }

      // Also request background permission for when the app is backgrounded
      const { status: bgStatus } = await ExpoLocation.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        console.warn('[Location] Background location permission not granted — tracking will stop when app is backgrounded.');
      }

      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to request location permission';
      setError(msg);
      console.error('[Location] Permission request failed:', err);
      return false;
    }
  }, []);

  // ── Location Tracking ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!enabled || !hasPermission) {
      // Stop tracking if disabled or no permission
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
        setIsTracking(false);
        console.log('[Location] Tracking stopped');
      }
      return;
    }

    let isMounted = true;

    const startTracking = async () => {
      try {
        // Check if location services are enabled on the device
        const isEnabled = await ExpoLocation.hasServicesEnabledAsync();
        if (!isEnabled) {
          setError('Location services are disabled. Please enable GPS.');
          return;
        }

        // Remove previous subscription if it exists
        if (watchSubscriptionRef.current) {
          watchSubscriptionRef.current.remove();
        }

        const subscription = await ExpoLocation.watchPositionAsync(
          {
            accuracy: ExpoLocation.Accuracy.High,
            timeInterval: LOCATION_INTERVAL_MS,
            distanceInterval: 10, // Get updates every 10m from OS, then we filter further
          },
          (location) => {
            if (!isMounted) return;

            const newCoords: LocationCoords = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
              heading: location.coords.heading ?? undefined,
              speed: location.coords.speed ?? undefined,
              accuracy: location.coords.accuracy ?? undefined,
            };

            // Always update the local state (for map rendering)
            setCurrentLocation(newCoords);

            // Only emit to server if the driver moved beyond the threshold
            const lastEmitted = lastEmittedLocationRef.current;
            const shouldEmit =
              !lastEmitted ||  // Always emit the FIRST reading immediately
              getDistanceInMeters(
                lastEmitted.lat, lastEmitted.lng,
                newCoords.lat, newCoords.lng,
              ) >= distanceThreshold;

            if (shouldEmit) {
              // For the very first emission, use sendMessage (not throttled) to ensure
              // the server receives the driver's initial position immediately.
              const isFirstEmission = !lastEmitted;
              if (isFirstEmission) {
                console.log('[Location] Sending INITIAL location to server:', newCoords.lat.toFixed(4), newCoords.lng.toFixed(4));
              }

              sendThrottledMessage(
                'location_update',
                {
                  location: { lat: newCoords.lat, lng: newCoords.lng },
                  heading: newCoords.heading,
                  speed: newCoords.speed,
                  ...(riderId ? { riderId } : {}),
                },
                isFirstEmission ? 0 : THROTTLE_MS,  // No throttle for first emission
              );

              lastEmittedLocationRef.current = newCoords;
            }
          },
        );

        watchSubscriptionRef.current = subscription;
        setIsTracking(true);
        setError(null);
        console.log('[Location] Tracking started with', distanceThreshold, 'm threshold');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start location tracking';
        setError(msg);
        console.error('[Location] Start tracking failed:', err);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (watchSubscriptionRef.current) {
        watchSubscriptionRef.current.remove();
        watchSubscriptionRef.current = null;
      }
      setIsTracking(false);
    };
  }, [enabled, hasPermission, riderId, distanceThreshold, sendThrottledMessage]);

  // ── Auto-request permission on mount ────────────────────────────────────────

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    currentLocation,
    hasPermission,
    isTracking,
    error,
    requestPermission,
  };
}
