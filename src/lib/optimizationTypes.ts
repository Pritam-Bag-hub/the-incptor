import { QuantityUnit, VehicleType, VehicleStatus, ReceiptStatus, InspectionGrade } from "@prisma/client";

export interface LocationPoint {
  latitude: number;
  longitude: number;
  address?: string;
  village?: string;
  district?: string;
  state?: string;
}

export interface OptimizationDestination extends LocationPoint {
  address: string;
  buyerId?: string;
  demandId?: string;
}

export interface EligibleLot {
  receiptId: string;
  receiptNumber: string;
  contractId: string;
  cropId: string;
  cropName: string;
  quantityKg: number;
  originalQuantity: number;
  originalUnit: QuantityUnit;
  farmerId: string;
  farmerName: string;
  farmerPhone?: string | null;
  pickupLocation: LocationPoint;
  collectionCenterId?: string | null;
  collectionCenterName?: string | null;
  buyerId: string;
  demandId?: string | null;
  status: ReceiptStatus;
  inspectionGrade?: InspectionGrade | null;
}

export interface ExcludedLot {
  receiptId: string;
  receiptNumber: string;
  reason: string;
  contractId?: string;
  cropName?: string;
  originalQuantity?: number;
  originalUnit?: QuantityUnit;
}

export interface EligibleVehicle {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  capacityKg: number;
  originalCapacity: number;
  originalUnit: QuantityUnit;
  transporterId: string;
  transporterName: string;
  transporterPhone?: string | null;
  isAvailable: boolean;
  status: VehicleStatus;
  currentLocation?: LocationPoint | null;
}

export interface ExcludedVehicle {
  vehicleId: string;
  vehicleNumber: string;
  reason: string;
  transporterName?: string;
}

export interface OptimizationSummary {
  totalEligibleLots: number;
  totalEligibleQuantityKg: number;
  totalExcludedLots: number;
  totalEligibleVehicles: number;
  totalVehicleCapacityKg: number;
  totalExcludedVehicles: number;
}

export interface OptimizationInputResponse {
  destination: OptimizationDestination;
  lots: EligibleLot[];
  excludedLots: ExcludedLot[];
  vehicles: EligibleVehicle[];
  excludedVehicles: ExcludedVehicle[];
  summary: OptimizationSummary;
}
