import { db } from "./db";
import { normalizeQuantityToKg } from "./quantityHelpers";
import {
  OptimizationInputResponse,
  EligibleLot,
  ExcludedLot,
  EligibleVehicle,
  ExcludedVehicle,
  OptimizationDestination,
  LocationPoint,
} from "./optimizationTypes";
import { QuantityUnit } from "@prisma/client";

export interface BuildOptimizationInputOptions {
  buyerId?: string;
  demandId?: string;
  destinationAddress?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
}

/**
 * Validates whether GPS coordinates are valid geographic numbers between [-90, 90] and [-180, 180].
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Builds a clean, validated Route Optimization Input Layer from the existing database.
 * Strictly READ-ONLY — creates zero database records or shipments.
 */
export async function buildOptimizationInput(
  options: BuildOptimizationInputOptions = {}
): Promise<OptimizationInputResponse> {
  // 1. Resolve Destination Coordinates & Address
  let destAddress = options.destinationAddress || "";
  let destLat = options.destinationLatitude;
  let destLng = options.destinationLongitude;

  // If demandId provided, attempt to resolve buyer demand context
  if (options.demandId) {
    const demand = await db.buyerDemand.findUnique({
      where: { id: options.demandId },
      include: { buyer: true },
    });
    if (demand) {
      if (!destAddress && demand.preferredState) {
        destAddress = `${demand.cropId} Buyer Distribution Terminal, ${demand.preferredState}`;
      }
    }
  }

  // If buyerId provided and coordinates not explicitly passed, attempt to resolve from existing buyer shipment
  if ((destLat === undefined || destLng === undefined) && options.buyerId) {
    const existingShipment = await db.shipment.findFirst({
      where: { buyerId: options.buyerId },
      orderBy: { createdAt: "desc" },
    });
    if (existingShipment && isValidCoordinate(existingShipment.destinationLatitude, existingShipment.destinationLongitude)) {
      destLat = existingShipment.destinationLatitude;
      destLng = existingShipment.destinationLongitude;
      if (!destAddress) destAddress = existingShipment.destinationAddress;
    }
  }

  // Default terminal coordinates for test/demo mode when query parameters are omitted
  if (destLat === undefined || destLng === undefined) {
    destLat = 30.7046;
    destLng = 76.7179;
    if (!destAddress) destAddress = "Central Wholesale Agromandi Terminal, Gate 4, Mohali";
  }

  if (!isValidCoordinate(destLat, destLng)) {
    throw new Error("DESTINATION_COORDINATES_UNRESOLVED: Destination latitude must be in [-90, 90] and longitude in [-180, 180].");
  }

  const destination: OptimizationDestination = {
    address: destAddress,
    latitude: destLat,
    longitude: destLng,
    buyerId: options.buyerId,
    demandId: options.demandId,
  };

  // 2. Fetch and Validate Harvest Receipts / Lots
  const whereReceipts: any = {};

  if (options.buyerId) {
    whereReceipts.contract = { buyerId: options.buyerId };
  }

  const receipts = await db.harvestReceipt.findMany({
    where: whereReceipts,
    include: {
      center: true,
      yield: true,
      contract: {
        include: {
          crop: true,
          land: true,
          landowner: { select: { id: true, name: true, phone: true } },
          buyer: { select: { id: true, name: true, phone: true } },
        },
      },
      inspections: {
        orderBy: { createdAt: "desc" },
      },
      shipmentItems: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const eligibleLots: EligibleLot[] = [];
  const excludedLots: ExcludedLot[] = [];

  for (const r of receipts) {
    const receiptId = r.id;
    const receiptNumber = r.receiptNumber;

    // Rule A: Positive Net Quantity
    if (typeof r.netWeight !== "number" || isNaN(r.netWeight) || r.netWeight <= 0) {
      excludedLots.push({
        receiptId,
        receiptNumber,
        reason: "INVALID_OR_ZERO_NET_QUANTITY",
        contractId: r.contractId,
        cropName: r.contract?.crop?.name,
        originalQuantity: r.netWeight,
        originalUnit: r.unit,
      });
      continue;
    }

    // Rule B: Produce must not be REJECTED
    if (r.status === "REJECTED") {
      excludedLots.push({
        receiptId,
        receiptNumber,
        reason: "LOT_REJECTED",
        contractId: r.contractId,
        cropName: r.contract?.crop?.name,
        originalQuantity: r.netWeight,
        originalUnit: r.unit,
      });
      continue;
    }

    const latestInspection = r.inspections[0];
    if (latestInspection && latestInspection.status === "REJECTED") {
      excludedLots.push({
        receiptId,
        receiptNumber,
        reason: "HUMAN_INSPECTION_REJECTED",
        contractId: r.contractId,
        cropName: r.contract?.crop?.name,
        originalQuantity: r.netWeight,
        originalUnit: r.unit,
      });
      continue;
    }

    // Rule C: Inspection Verification Requirement (Must be INSPECTED or have passed inspection)
    if (r.status === "RECEIVED" && (!latestInspection || (latestInspection.status !== "PASSED" && latestInspection.status !== "PASSED_WITH_FLAGS"))) {
      excludedLots.push({
        receiptId,
        receiptNumber,
        reason: "AWAITING_HUMAN_QUALITY_INSPECTION",
        contractId: r.contractId,
        cropName: r.contract?.crop?.name,
        originalQuantity: r.netWeight,
        originalUnit: r.unit,
      });
      continue;
    }

    // Rule D: Calculate Remaining Unallocated Weight in KG
    const netWeightKg = normalizeQuantityToKg(r.netWeight, r.unit);
    const allocatedKg = (r.shipmentItems || []).reduce((acc, item) => {
      return acc + normalizeQuantityToKg(item.shippedWeight, item.unit);
    }, 0);

    const remainingUnallocatedKg = Math.max(0, netWeightKg - allocatedKg);

    if (remainingUnallocatedKg <= 0.001) {
      excludedLots.push({
        receiptId,
        receiptNumber,
        reason: "FULLY_ALLOCATED_TO_ACTIVE_SHIPMENTS",
        contractId: r.contractId,
        cropName: r.contract?.crop?.name,
        originalQuantity: r.netWeight,
        originalUnit: r.unit,
      });
      continue;
    }

    // Rule E: Pickup Location Coordinates Validation (Prefer Farm Land GPS, fallback to Center GPS)
    let lat: number | null = null;
    let lng: number | null = null;
    let address = "";
    let centerId: string | null = r.center?.id || null;
    let centerName: string | null = r.center?.name || null;

    if (r.contract?.land && isValidCoordinate(r.contract.land.latitude, r.contract.land.longitude)) {
      lat = r.contract.land.latitude;
      lng = r.contract.land.longitude;
      address = `${r.contract.land.name}, ${r.contract.land.village}, ${r.contract.land.district}, ${r.contract.land.state}`;
    } else if (r.center && isValidCoordinate(r.center.latitude, r.center.longitude)) {
      lat = r.center.latitude;
      lng = r.center.longitude;
      address = `${r.center.name}, ${r.center.address}, ${r.center.district}, ${r.center.state}`;
    }

    if (lat === null || lng === null || !isValidCoordinate(lat, lng)) {
      excludedLots.push({
        receiptId,
        receiptNumber,
        reason: "MISSING_OR_INVALID_PICKUP_COORDINATES",
        contractId: r.contractId,
        cropName: r.contract?.crop?.name,
        originalQuantity: r.netWeight,
        originalUnit: r.unit,
      });
      continue;
    }

    const pickupLocation: LocationPoint = {
      latitude: lat,
      longitude: lng,
      address,
      village: r.contract?.land?.village || r.center?.village,
      district: r.contract?.land?.district || r.center?.district,
      state: r.contract?.land?.state || r.center?.state,
    };

    eligibleLots.push({
      receiptId,
      receiptNumber,
      contractId: r.contractId,
      cropId: r.contract.cropId,
      cropName: r.contract.crop.name,
      quantityKg: remainingUnallocatedKg,
      originalQuantity: r.netWeight,
      originalUnit: r.unit,
      farmerId: r.contract.landownerId,
      farmerName: r.contract.landowner.name,
      farmerPhone: r.contract.landowner.phone,
      pickupLocation,
      collectionCenterId: centerId,
      collectionCenterName: centerName,
      buyerId: r.contract.buyerId,
      demandId: r.contract.demandId,
      status: r.status,
      inspectionGrade: latestInspection?.grade || null,
    });
  }

  // 3. Fetch and Validate Vehicles
  const vehiclesList = await db.vehicle.findMany({
    include: {
      transporter: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const eligibleVehicles: EligibleVehicle[] = [];
  const excludedVehicles: ExcludedVehicle[] = [];

  for (const v of vehiclesList) {
    const vehicleId = v.id;
    const vehicleNumber = v.vehicleNumber;

    if (typeof v.capacity !== "number" || isNaN(v.capacity) || v.capacity <= 0) {
      excludedVehicles.push({
        vehicleId,
        vehicleNumber,
        reason: "INVALID_OR_ZERO_CAPACITY",
        transporterName: v.transporter?.name,
      });
      continue;
    }

    if (!v.isAvailable || v.status !== "IDLE") {
      excludedVehicles.push({
        vehicleId,
        vehicleNumber,
        reason: `UNAVAILABLE_OR_BUSY (Status: ${v.status}, Available: ${v.isAvailable})`,
        transporterName: v.transporter?.name,
      });
      continue;
    }

    const capacityKg = normalizeQuantityToKg(v.capacity, v.capacityUnit);

    let currentLocation: LocationPoint | null = null;
    if (isValidCoordinate(v.currentLatitude, v.currentLongitude)) {
      currentLocation = {
        latitude: v.currentLatitude!,
        longitude: v.currentLongitude!,
      };
    }

    eligibleVehicles.push({
      vehicleId,
      vehicleNumber,
      vehicleType: v.vehicleType,
      capacityKg,
      originalCapacity: v.capacity,
      originalUnit: v.capacityUnit,
      transporterId: v.transporterId,
      transporterName: v.transporter.name,
      transporterPhone: v.transporter.phone,
      isAvailable: v.isAvailable,
      status: v.status,
      currentLocation,
    });
  }

  // 4. Summarize Data
  const totalEligibleLots = eligibleLots.length;
  const totalEligibleQuantityKg = eligibleLots.reduce((acc, lot) => acc + lot.quantityKg, 0);
  const totalExcludedLots = excludedLots.length;
  const totalEligibleVehicles = eligibleVehicles.length;
  const totalVehicleCapacityKg = eligibleVehicles.reduce((acc, veh) => acc + veh.capacityKg, 0);
  const totalExcludedVehicles = excludedVehicles.length;

  return {
    destination,
    lots: eligibleLots,
    excludedLots,
    vehicles: eligibleVehicles,
    excludedVehicles,
    summary: {
      totalEligibleLots,
      totalEligibleQuantityKg,
      totalExcludedLots,
      totalEligibleVehicles,
      totalVehicleCapacityKg,
      totalExcludedVehicles,
    },
  };
}
