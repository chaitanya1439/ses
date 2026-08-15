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
            // Fallback to straight line
            return [origin, destination];
        }

        const points: LatLng[] = [];
        data.routes[0].legs[0].steps.forEach((step: any) => {
            points.push(...decodePolyline(step.polyline.points));
        });
        return points;
    } catch (error) {
        console.warn("Directions API error:", error);
        return [origin, destination];
    }
}

export interface DirectionsResult {
    distanceMeters: number;
    durationSeconds: number;
    polyline: LatLng[];
}

/**
 * Fetches directions and returns distance, duration, and decoded polyline.
 */
export async function fetchDirectionsWithDetails(
    origin: LatLng,
    destination: LatLng,
): Promise<DirectionsResult | null> {
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
        url.searchParams.set("origin", `${origin.latitude},${origin.longitude}`);
        url.searchParams.set("destination", `${destination.latitude},${destination.longitude}`);
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const data = await response.json();

        if (data.status !== "OK" || !data.routes?.length) return null;

        const leg = data.routes[0].legs[0];
        const points: LatLng[] = [];
        leg.steps.forEach((step: any) => {
            points.push(...decodePolyline(step.polyline.points));
        });

        return {
            distanceMeters: leg.distance.value,
            durationSeconds: leg.duration.value,
            polyline: points,
        };
    } catch (error) {
        console.warn("Directions with details error:", error);
        return null;
    }
}

// --- Places Autocomplete ---

export interface PlacePrediction {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

/**
 * Fetches place autocomplete predictions from the Google Places API.
 */
export async function fetchPlaceAutocomplete(
    input: string,
    location?: LatLng,
): Promise<PlacePrediction[]> {
    if (!input || input.length < 2) return [];

    try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
        url.searchParams.set("input", input);
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
        url.searchParams.set("components", "country:in");

        if (location) {
            url.searchParams.set("location", `${location.latitude},${location.longitude}`);
            url.searchParams.set("radius", "50000");
        }

        const response = await fetch(url.toString());
        if (!response.ok) return [];
        const data = await response.json();

        if (data.status !== "OK" || !data.predictions?.length) {
            return [];
        }

        return data.predictions.map(
            (p: {
                place_id: string;
                description: string;
                structured_formatting: {
                    main_text: string;
                    secondary_text: string;
                };
            }) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting.main_text,
                secondaryText: p.structured_formatting.secondary_text,
            }),
        );
    } catch (error) {
        console.warn("Places Autocomplete error:", error);
        return [];
    }
}

// --- Place Details ---

interface PlaceDetails {
    name: string;
    address: string;
    lat: number;
    lng: number;
}

/**
 * Fetches lat/lng and address for a place given its place ID.
 */
export async function fetchPlaceDetails(
    placeId: string,
): Promise<PlaceDetails | null> {
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        url.searchParams.set("place_id", placeId);
        url.searchParams.set("fields", "name,formatted_address,geometry");
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const data = await response.json();

        if (data.status !== "OK" || !data.result) {
            return null;
        }

        const { result } = data;
        return {
            name: result.name,
            address: result.formatted_address,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
        };
    } catch (error) {
        console.warn("Place Details error:", error);
        return null;
    }
}

// --- Reverse Geocode ---

/**
 * Fetches a human-readable address string from latitude/longitude
 * via the Google Geocoding API.
 */
export async function fetchReverseGeocode(
    lat: number,
    lng: number,
): Promise<string | null> {
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
        url.searchParams.set("latlng", `${lat},${lng}`);
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const data = await response.json();

        if (data.status !== "OK" || !data.results?.length) {
            return null;
        }

        // Prefer a shorter "neighborhood, locality" style result
        const preferred = data.results.find(
            (r: { types: string[] }) =>
                r.types.includes("sublocality") ||
                r.types.includes("neighborhood") ||
                r.types.includes("route")
        );

        return (preferred ?? data.results[0]).formatted_address ?? null;
    } catch (error) {
        console.warn("Reverse Geocode error:", error);
        return null;
    }
}

// --- Nearby Places ---

export interface NearbyPlace {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
}

/**
 * Fetches nearby points of interest sorted by distance.
 */
export async function fetchNearbyPlaces(
    lat: number,
    lng: number,
    maxResults: number = 5,
): Promise<NearbyPlace[]> {
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
        url.searchParams.set("location", `${lat},${lng}`);
        url.searchParams.set("rankby", "distance");
        url.searchParams.set("type", "point_of_interest");
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return [];
        const data = await response.json();

        if (data.status !== "OK" || !data.results?.length) return [];

        return data.results.slice(0, maxResults).map(
            (r: {
                place_id: string;
                name: string;
                vicinity: string;
                geometry: { location: { lat: number; lng: number } };
            }) => ({
                id: r.place_id,
                name: r.name,
                address: r.vicinity,
                lat: r.geometry.location.lat,
                lng: r.geometry.location.lng,
            }),
        );
    } catch (error) {
        console.warn("Nearby Places error:", error);
        return [];
    }
}

// --- Distance Matrix ---

export interface DistanceMatrixResult {
    durationSeconds: number;
    durationText: string;
    distanceMeters: number;
    distanceText: string;
}

/**
 * Fetches real driving duration and distance between two points
 * using the Google Maps Distance Matrix API.
 * Used for real-time ETA calculation from driver position to pickup/drop.
 */
export async function fetchDistanceMatrix(
    origin: LatLng,
    destination: LatLng,
): Promise<DistanceMatrixResult | null> {
    try {
        const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
        url.searchParams.set("origins", `${origin.latitude},${origin.longitude}`);
        url.searchParams.set("destinations", `${destination.latitude},${destination.longitude}`);
        url.searchParams.set("mode", "driving");
        url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

        const response = await fetch(url.toString());
        if (!response.ok) return null;
        const data = await response.json();

        if (data.status !== "OK" || !data.rows?.length) return null;

        const element = data.rows[0].elements[0];
        if (element.status !== "OK") return null;

        return {
            durationSeconds: element.duration.value,
            durationText: element.duration.text,
            distanceMeters: element.distance.value,
            distanceText: element.distance.text,
        };
    } catch (error) {
        console.warn("Distance Matrix error:", error);
        return null;
    }
}

