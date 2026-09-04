import { buildOptimizationInput, BuildOptimizationInputOptions } from "./optimizationHelpers";
import {
  RouteMatrixResponse,
  RouteMatrixLocation,
  RouteMatrixElement,
  RouteMatrixMetadata,
} from "./matrixTypes";

export type MockFetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface BuildRouteMatrixOptions extends BuildOptimizationInputOptions {
  mockFetch?: MockFetchFn;
}

/**
 * Parses Google Routes API duration string (e.g., "1120s") into numeric seconds.
 */
export function parseDurationSeconds(durationStr?: string | null): number {
  if (!durationStr || typeof durationStr !== "string") return 0;
  const num = parseInt(durationStr.replace("s", ""), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Builds an N x N Road Distance & Travel-Time Matrix from eligible Phase 7.4.1 locations.
 * Uses official Google Maps Routes API (POST https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix).
 * Strictly READ-ONLY — zero database modifications.
 */
export async function buildRouteMatrix(
  options: BuildRouteMatrixOptions = {}
): Promise<RouteMatrixResponse> {
  const optInput = await buildOptimizationInput(options);

  // 1. Construct Deterministic Location Nodes
  const locations: RouteMatrixLocation[] = [];
  const addedIds = new Set<string>();

  // Node 1: Destination
  const destId = "DESTINATION";
  locations.push({
    id: destId,
    type: "DESTINATION",
    latitude: optInput.destination.latitude,
    longitude: optInput.destination.longitude,
    label: optInput.destination.address,
  });
  addedIds.add(destId);

  // Node 2...N: Harvest Lots
  for (const lot of optInput.lots) {
    const lotId = `LOT_${lot.receiptId}`;
    if (!addedIds.has(lotId)) {
      locations.push({
        id: lotId,
        type: lot.collectionCenterId ? "COLLECTION_CENTER" : "LOT",
        latitude: lot.pickupLocation.latitude,
        longitude: lot.pickupLocation.longitude,
        label: lot.collectionCenterName ? `${lot.collectionCenterName} - ${lot.cropName} (${lot.farmerName})` : `${lot.cropName} (${lot.farmerName})`,
        receiptId: lot.receiptId,
        collectionCenterId: lot.collectionCenterId || undefined,
      });
      addedIds.add(lotId);
    }
  }

  const N = locations.length;
  const matrix: RouteMatrixElement[] = [];

  // 2. Identify Same-Location Pairs (A -> A) and Inter-Location Pairs (A -> B)
  const interPairs: { originIndex: number; destIndex: number; origin: RouteMatrixLocation; dest: RouteMatrixLocation }[] = [];

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const originNode = locations[i];
      const destNode = locations[j];

      if (i === j || originNode.id === destNode.id) {
        matrix.push({
          originId: originNode.id,
          destinationId: destNode.id,
          distanceMeters: 0,
          durationSeconds: 0,
          status: "OK",
        });
      } else {
        interPairs.push({
          originIndex: i,
          destIndex: j,
          origin: originNode,
          dest: destNode,
        });
      }
    }
  }

  // If only 1 node exists (e.g. self-only), return immediately
  if (interPairs.length === 0) {
    return {
      locations,
      matrix,
      metadata: {
        provider: "GOOGLE_ROUTES_API",
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_UNAWARE",
        generatedAt: new Date().toISOString(),
        totalElements: matrix.length,
      },
    };
  }

  // 3. API Key & HTTP Client Setup
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const fetchFn = options.mockFetch || fetch;

  if (!apiKey && !options.mockFetch) {
    throw new Error(
      "GOOGLE_MAPS_API_KEY is not configured on the server. Please set GOOGLE_MAPS_API_KEY in your server environment variables."
    );
  }

  // 4. Batching for Google Routes API (Max 625 elements per call, e.g. 25 origins x 25 destinations)
  // For small SIH matrices (N < 25), we can send all origins & destinations in a single request.
  const originsWaypoints = locations.map((loc) => ({
    waypoint: {
      location: {
        latLng: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
      },
    },
  }));

  const destinationsWaypoints = locations.map((loc) => ({
    waypoint: {
      location: {
        latLng: {
          latitude: loc.latitude,
          longitude: loc.longitude,
        },
      },
    },
  }));

  const requestBody = {
    origins: originsWaypoints,
    destinations: destinationsWaypoints,
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
  };

  const endpointUrl = `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix`;

  try {
    const apiResponse = await fetchFn(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey || "mock-key",
        "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,status,condition",
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      throw new Error(`Google Routes API returned HTTP ${apiResponse.status}: ${errText}`);
    }

    const rawData = await apiResponse.json();
    const resultsList = Array.isArray(rawData) ? rawData : [rawData];

    // Create index map for inter-location lookups
    const fetchedMap = new Map<string, { distanceMeters: number; durationSeconds: number; status: string; errorReason?: string }>();

    for (const item of resultsList) {
      const oIdx = item.originIndex ?? 0;
      const dIdx = item.destinationIndex ?? 0;
      const pairKey = `${oIdx}->${dIdx}`;

      if (item.status && item.status.code && item.status.code !== 0) {
        fetchedMap.set(pairKey, {
          distanceMeters: 0,
          durationSeconds: 0,
          status: "UNAVAILABLE",
          errorReason: item.status.message || `Route Condition: ${item.condition || "UNKNOWN"}`,
        });
      } else {
        const dist = typeof item.distanceMeters === "number" ? item.distanceMeters : 0;
        const durSec = parseDurationSeconds(item.duration);
        fetchedMap.set(pairKey, {
          distanceMeters: dist,
          durationSeconds: durSec,
          status: "OK",
        });
      }
    }

    // Populate inter-location matrix elements
    for (const pair of interPairs) {
      const key = `${pair.originIndex}->${pair.destIndex}`;
      const fetched = fetchedMap.get(key);

      if (fetched) {
        matrix.push({
          originId: pair.origin.id,
          destinationId: pair.dest.id,
          distanceMeters: fetched.distanceMeters,
          durationSeconds: fetched.durationSeconds,
          status: fetched.status as any,
          errorReason: fetched.errorReason,
        });
      } else {
        matrix.push({
          originId: pair.origin.id,
          destinationId: pair.dest.id,
          distanceMeters: 0,
          durationSeconds: 0,
          status: "UNAVAILABLE",
          errorReason: "No route element returned from API",
        });
      }
    }
  } catch (err: any) {
    if (options.mockFetch || err.message?.includes("GOOGLE_MAPS_API_KEY")) {
      throw err;
    }
    // If live API call fails, record UNAVAILABLE status for inter-location pairs without generating fake straight-line distances
    for (const pair of interPairs) {
      matrix.push({
        originId: pair.origin.id,
        destinationId: pair.dest.id,
        distanceMeters: 0,
        durationSeconds: 0,
        status: "UNAVAILABLE",
        errorReason: err.message || "Google Routes API Request Failed",
      });
    }
  }

  const metadata: RouteMatrixMetadata = {
    provider: "GOOGLE_ROUTES_API",
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
    generatedAt: new Date().toISOString(),
    totalElements: matrix.length,
  };

  return {
    locations,
    matrix,
    metadata,
  };
}
