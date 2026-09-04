import { db as prisma } from "../../src/lib/db";
import { Role, QuantityUnit, VehicleType, VehicleStatus } from "@prisma/client";
import { solveRouteOptimization } from "../../src/lib/routeOptimization";
import { MockFetchFn } from "../../src/lib/matrixHelpers";
import fs from "fs";
import path from "path";

export async function runRouteOptimizationTests() {
  console.log("==================================================");
  console.log("STARTING AGRI-GROWTH ROUTE OPTIMIZATION (CP-SAT + VRP) SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    const ts = Date.now().toString().slice(-6);

    const managerUser = await prisma.user.upsert({
      where: { phone: `+919999974301` },
      update: { role: Role.CENTER_MANAGER },
      create: { name: "Center Manager 743", phone: `+919999974301`, role: Role.CENTER_MANAGER },
    });

    const buyer = await prisma.user.upsert({
      where: { phone: `+919999974303` },
      update: { role: Role.BUYER },
      create: { name: "Test Buyer 743", phone: `+919999974303`, role: Role.BUYER },
    });

    const landowner = await prisma.user.upsert({
      where: { phone: `+919999974304` },
      update: { role: Role.LANDOWNER },
      create: { name: "Farmer 743", phone: `+919999974304`, role: Role.LANDOWNER },
    });

    const transporter = await prisma.user.upsert({
      where: { phone: `+919999974305` },
      update: { role: Role.TRANSPORTER },
      create: { name: "Transporter 743", phone: `+919999974305`, role: Role.TRANSPORTER },
    });

    const category = await prisma.cropCategory.create({ data: { name: `Cat-743-${ts}` } });
    const wheatCrop = await prisma.crop.create({ data: { name: `Wheat-743-${ts}`, categoryId: category.id, durationDays: 120 } });

    const center = await prisma.collectionCenter.create({
      data: {
        name: `Center 743-${ts}`,
        code: `CC-743-${ts}`,
        address: "Mandi Road",
        village: "Mohali",
        district: "Mohali",
        state: "Punjab",
        latitude: 30.704,
        longitude: 76.714,
        capacityTonnes: 1000,
        managerId: managerUser.id,
      },
    });

    const demand = await prisma.buyerDemand.create({
      data: {
        buyerId: buyer.id,
        cropId: wheatCrop.id,
        requiredQuantity: 5000,
        quantityUnit: QuantityUnit.KG,
        preferredState: "Punjab",
      },
    });

    // Test 1: Vehicle start proximity vs buyer-only proximity
    const landA = await prisma.land.create({
      data: { ownerId: landowner.id, name: `Land A 743-${ts}`, size: 10, unit: "ACRE", address: "Farm Road A", village: "Mohali", district: "Mohali", state: "Punjab", latitude: 5.0, longitude: 10.0 },
    });

    const landB = await prisma.land.create({
      data: { ownerId: landowner.id, name: `Land B 743-${ts}`, size: 10, unit: "ACRE", address: "Farm Road B", village: "Mohali", district: "Mohali", state: "Punjab", latitude: 0.0, longitude: 1.0 },
    });

    const contractA = await prisma.contract.create({
      data: { demandId: demand.id, landId: landA.id, buyerId: buyer.id, landownerId: landowner.id, cropId: wheatCrop.id, landArea: 10, allocatedQuantity: 5000, proposedPrice: 100000, startDate: new Date(), expectedHarvestDate: new Date(), status: "ACTIVE" },
    });

    const contractB = await prisma.contract.create({
      data: { demandId: demand.id, landId: landB.id, buyerId: buyer.id, landownerId: landowner.id, cropId: wheatCrop.id, landArea: 10, allocatedQuantity: 5000, proposedPrice: 100000, startDate: new Date(), expectedHarvestDate: new Date(), status: "ACTIVE" },
    });

    const yieldA = await prisma.contractYield.create({
      data: { contractId: contractA.id, estimatedQuantity: 5000, actualQuantity: 5000, unit: QuantityUnit.KG, fulfillmentStatus: "FULFILLED" },
    });

    const yieldB = await prisma.contractYield.create({
      data: { contractId: contractB.id, estimatedQuantity: 5000, actualQuantity: 5000, unit: QuantityUnit.KG, fulfillmentStatus: "FULFILLED" },
    });

    const lotA = await prisma.harvestReceipt.create({
      data: { receiptNumber: `REC-REG1-A-${ts}`, contractId: contractA.id, yieldId: yieldA.id, centerId: center.id, receivedByUserId: managerUser.id, grossWeight: 5000, tareWeight: 0, netWeight: 5000, unit: QuantityUnit.KG, status: "INSPECTED" },
    });

    const lotB = await prisma.harvestReceipt.create({
      data: { receiptNumber: `REC-REG1-B-${ts}`, contractId: contractB.id, yieldId: yieldB.id, centerId: center.id, receivedByUserId: managerUser.id, grossWeight: 5000, tareWeight: 0, netWeight: 5000, unit: QuantityUnit.KG, status: "INSPECTED" },
    });

    const vehicleV1 = await prisma.vehicle.create({
      data: { transporterId: transporter.id, vehicleNumber: `PB-REG1-V1-${ts}`, vehicleType: VehicleType.HEAVY_TRUCK, capacity: 5000, capacityUnit: QuantityUnit.KG, isAvailable: true, status: VehicleStatus.IDLE, currentLatitude: 0.0, currentLongitude: 0.0 },
    });

    const mockProximityMatrixFetch: MockFetchFn = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const body = JSON.parse((init?.body as string) || "{}");
      const originsCount = body.origins?.length || 0;
      const destsCount = body.destinations?.length || 0;

      const mockElements: any[] = [];
      for (let o = 0; o < originsCount; o++) {
        for (let d = 0; d < destsCount; d++) {
          if (o === d) {
            mockElements.push({ originIndex: o, destinationIndex: d, distanceMeters: 0, duration: "0s", status: { code: 0 } });
          } else {
            const oLat = body.origins[o]?.waypoint?.location?.latLng?.latitude;
            const dLat = body.destinations[d]?.waypoint?.location?.latLng?.latitude;

            let dist = 10000;
            let dur = 900;
            if (oLat === 5.0 || dLat === 5.0) {
              dist = 11180;
              dur = 900;
            } else if (oLat === 0.0 || dLat === 0.0) {
              dist = 1000;
              dur = 80;
            }

            mockElements.push({ originIndex: o, destinationIndex: d, distanceMeters: dist, duration: `${dur}s`, status: { code: 0 } });
          }
        }
      }
      return { ok: true, status: 200, json: async () => mockElements } as Response;
    };

    const resReg1 = await solveRouteOptimization({
      buyerId: buyer.id,
      commodityId: wheatCrop.id,
      demandKg: 5000,
      destinationLatitude: 0.0,
      destinationLongitude: 10.0,
      mockFetch: mockProximityMatrixFetch,
    });

    const selectedLotIdsReg1 = new Set(resReg1.selectedLots.map((l: any) => l.receiptId));
    assert(
      selectedLotIdsReg1.has(lotB.id) && !selectedLotIdsReg1.has(lotA.id),
      "Route Optimization: Selected Lot B based on complete route cost"
    );

    // Clean up Test 1 entities
    await prisma.harvestReceipt.delete({ where: { id: lotA.id } });
    await prisma.harvestReceipt.delete({ where: { id: lotB.id } });
    await prisma.contractYield.delete({ where: { id: yieldA.id } });
    await prisma.contractYield.delete({ where: { id: yieldB.id } });
    await prisma.contract.delete({ where: { id: contractA.id } });
    await prisma.contract.delete({ where: { id: contractB.id } });
    await prisma.land.delete({ where: { id: landA.id } });
    await prisma.land.delete({ where: { id: landB.id } });
    await prisma.vehicle.delete({ where: { id: vehicleV1.id } });

    // Test Code Audit for Zero itertools.combinations
    const solvePyPath = path.join(process.cwd(), "optimizer", "solve.py");
    const solvePyContent = fs.readFileSync(solvePyPath, "utf-8");
    const hasCombinations = solvePyContent.includes("itertools.combinations") || solvePyContent.includes("candidate_subsets");

    assert(
      !hasCombinations,
      "Code Audit: Verified zero itertools.combinations or subset enumeration in optimizer/solve.py"
    );

  } catch (err: any) {
    console.error("Route Optimization Test Error:", err);
    failed++;
  }

  console.log(`Route Optimization Suite Complete: ${passed} PASSED, ${failed} FAILED\n`);
  return { passed, failed };
}

if (require.main === module) {
  runRouteOptimizationTests()
    .then(({ failed }) => {
      if (failed > 0) process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
