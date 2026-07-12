import { GOOGLE_MAPS_API_KEY } from "@/constants/config";

// --- Polyline Decoder ---

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Decodes an encoded polyline string from the Google Maps Directions API
 * into an array of lat/lng coordinates.
 */
export function decodePolyline(encoded: string): LatLng[] {
    const points: LatLng[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        lat += result & 1 ? ~(result >> 1) : result >> 1;

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        lng += result & 1 ? ~(result >> 1) : result >> 1;

        points.push({
            latitude: lat / 1e5,
            longitude: lng / 1e5,
        });
    }

    return points;
}

// --- Directions API ---

/**
 * Fetches a road-following polyline between two points using
 * the Google Maps Directions API.
 */
export async function fetchDirectionsPolyline(
    origin: LatLng,
    destination: LatLng,
): Promise<LatLng[]> {
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
        url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
        url.searchParams.set("destination", `${destination.latitude},${destination.longitude}`);
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return [origin, destination];
        const data = await response.json();

        if (data.status !== "OK" || !data.routes?.length) {
            console.warn("Directions API returned no routes:", data.status);
            return [origin, destination];
        }

        const encoded = data.routes[0].overview_polyline.points;
        return [origin, ...decodePolyline(encoded), destination];
    } catch (error) {
        console.warn("Directions API error:", error);
        return [origin, destination];
    }
}
