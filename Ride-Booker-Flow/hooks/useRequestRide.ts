import { useCallback } from 'react';
import { PUBLIC_WEBSOCKET_URL } from '@/constants/config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RideRequestPayload {
  riderId: string;
  pickupLocation: { lat: number; lng: number };
  dropLocation?: { lat: number; lng: number };
  fare?: number;
  vehicleType?: string;
  riderName?: string;
  distance?: string | number;
  pickupAddress?: string;
  dropAddress?: string;
}

interface RequestRideResponse {
  success: boolean;
  driversNotified: number;
  message: string;
}

interface UseRequestRideReturn {
  /**
   * POST a ride request to the server's /api/request-ride endpoint.
   * This triggers both WebSocket broadcasts AND push notifications to nearby drivers.
   */
  requestRide: (payload: RideRequestPayload) => Promise<RequestRideResponse>;
}

// ─── Derive HTTP base URL from the WebSocket URL ──────────────────────────────

function getHttpBaseUrl(): string {
  // PUBLIC_WEBSOCKET_URL is like "ws://host:8080" or "wss://host"
  // Convert to HTTP equivalent
  return PUBLIC_WEBSOCKET_URL
    .replace(/^wss:/, 'https:')
    .replace(/^ws:/, 'http:');
}

// ─── Hook Implementation ─────────────────────────────────────────────────────

/**
 * useRequestRide
 *
 * Provides the `requestRide` function that the ride-booker's "Confirm Booking"
 * button calls. Makes a POST request to the server's `/api/request-ride`
 * endpoint, which triggers both WebSocket broadcasts and Expo Push Notifications
 * to nearby drivers.
 *
 * Usage:
 * ```tsx
 * const { requestRide } = useRequestRide({ token });
 *
 * const handleConfirmBooking = async () => {
 *   const result = await requestRide({
 *     riderId: user.phone,
 *     pickupLocation: { lat: pickup.lat, lng: pickup.lng },
 *     dropLocation: { lat: drop.lat, lng: drop.lng },
 *     fare: calculatedFare,
 *     vehicleType: selectedVehicle,
 *     riderName: user.name,
 *     pickupAddress: pickup.address,
 *     dropAddress: drop.address,
 *   });
 *   console.log(`Notified ${result.driversNotified} drivers`);
 * };
 * ```
 */
export function useRequestRide({ token }: { token: string }): UseRequestRideReturn {
  const requestRide = useCallback(
    async (payload: RideRequestPayload): Promise<RequestRideResponse> => {
      const baseUrl = getHttpBaseUrl();
      const url = `${baseUrl}/api/request-ride`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            (errorBody as { error?: string }).error ??
              `Request failed with status ${response.status}`,
          );
        }

        const data = (await response.json()) as RequestRideResponse;
        console.log('[RequestRide] Success:', data.message);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Network error requesting ride';
        console.error('[RequestRide] Failed:', message);

        // Return a failure response rather than throwing, so the UI can handle it gracefully
        return {
          success: false,
          driversNotified: 0,
          message,
        };
      }
    },
    [token],
  );

  return { requestRide };
}
