export type RouteMatrixLocationType = "LOT" | "COLLECTION_CENTER" | "DESTINATION";

export interface RouteMatrixLocation {
  id: string;
  type: RouteMatrixLocationType;
  latitude: number;
  longitude: number;
  label?: string;
  collectionCenterId?: string | null;
  receiptId?: string | null;
}

export type RouteMatrixElementStatus = "OK" | "UNAVAILABLE" | "ERROR";

export interface RouteMatrixElement {
  originId: string;
  destinationId: string;
  distanceMeters: number;
  durationSeconds: number;
  status: RouteMatrixElementStatus;
  errorReason?: string;
}

export interface RouteMatrixMetadata {
  provider: string;
  travelMode: string;
  routingPreference: string;
  generatedAt: string;
  totalElements: number;
}

export interface RouteMatrixResponse {
  locations: RouteMatrixLocation[];
  matrix: RouteMatrixElement[];
  metadata: RouteMatrixMetadata;
}
