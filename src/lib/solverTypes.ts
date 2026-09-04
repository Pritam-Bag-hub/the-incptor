import { VehicleType } from "@prisma/client";
import { LocationPoint } from "./optimizationTypes";

export interface SolverConfig {
  distanceCostPerKm?: number;      // Cost per KM (default: 15 INR/km)
  timeCostPerHour?: number;        // Cost per hour (default: 250 INR/hr)
  vehicleFixedCost?: number;       // Fixed cost per dispatched vehicle (default: 1500 INR)
  unmetDemandPenaltyPerKg?: number;// Penalty per KG of unfulfilled buyer demand (default: 100 INR/kg)
  timeLimitSeconds?: number;       // Solver time limit in seconds (default: 10)
}

export interface OptimizationStop {
  sequence: number;
  type: "LOT" | "COLLECTION_CENTER" | "DESTINATION";
  lotId?: string;
  receiptNumber?: string;
  farmerName?: string;
  crop?: string;
  quantityKg: number;
  latitude: number;
  longitude: number;
  address?: string;
}

export interface OptimizedRoute {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  transporterName?: string;
  capacityKg: number;
  assignedLoadKg: number;
  utilizationPercent: number;
  startLocation: LocationPoint;
  destinationLocation: LocationPoint;
  stops: OptimizationStop[];
  distanceMeters: number;
  durationSeconds: number;
  estimatedCost: number;
}

export interface BaselineComparison {
  distanceMeters: number;
  durationSeconds: number;
  estimatedCost: number;
  vehiclesUsed: number;
}

export interface SavingsMetrics {
  distanceMeters: number;
  distancePercent: number;
  cost: number;
  costPercent: number;
}

export interface DemandFulfillmentSummary {
  requestedDemandKg: number;
  availableSupplyKg: number;
  selectedQuantityKg: number;
  fulfilledQuantityKg: number;
  shortageQuantityKg: number;
  fulfillmentPercentage: number;
}

export type SolverSolutionStatus =
  | "OPTIMAL"
  | "FEASIBLE"
  | "FEASIBLE_NOT_OPTIMAL"
  | "NO_FEASIBLE_SOLUTION";

export interface ExcludedLotResult {
  receiptId: string;
  receiptNumber?: string;
  reason: string;
}

export interface ExcludedVehicleResult {
  vehicleId: string;
  vehicleNumber?: string;
  reason: string;
}

export interface OptimizationSolveResponse {
  solutionStatus: SolverSolutionStatus;
  demand: DemandFulfillmentSummary;
  vehiclesUsed: number;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  estimatedCost: number;

  baseline: BaselineComparison;
  savings: SavingsMetrics;

  routes: OptimizedRoute[];

  selectedLots: any[];
  excludedLots: ExcludedLotResult[];
  excludedVehicles: ExcludedVehicleResult[];

  warnings: string[];
  solverMetadata?: {
    solverEngine: string;
    solverDurationMs: number;
    configUsed: Required<SolverConfig>;
    timestamp: string;
  };
}
