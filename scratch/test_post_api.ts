import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role, LandStatus, ContractStatus } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function testPost() {
  console.log("=== RUNNING POST API SIMULATION ===");

  try {
    // 1. Fetch buyer, demand, land
    const user = await prisma.user.findFirst({ where: { role: Role.BUYER } });
    if (!user) throw new Error("No buyer found.");

    const demand = await prisma.buyerDemand.findFirst({ where: { buyerId: user.id } });
    if (!demand) throw new Error("No buyer demand found.");

    const land = await prisma.land.findFirst({ where: { status: LandStatus.AVAILABLE } });
    if (!land) throw new Error("No available land found.");

    // Input payload mimicking the frontend
    const payload = {
      demandId: demand.id,
      landId: land.id,
      proposedPrice: "120000",
      startDate: "2026-09-01",
      expectedHarvestDate: "2026-12-01",
      notes: "Revised test proposal notes",
    };

    console.log("Payload:", payload);

    // 2. Parse fields
    const price = parseFloat(payload.proposedPrice);
    const start = new Date(payload.startDate);
    const end = new Date(payload.expectedHarvestDate);

    // Calculate yield allocation
    let allocatedQuantity = land.size;
    const crop = await prisma.crop.findUnique({
      where: { id: demand.cropId },
    });

    if (crop?.metadataJson) {
      try {
        const meta = JSON.parse(crop.metadataJson);
        const yieldPerAcre = parseFloat(meta.expectedYieldPerAcre);
        if (!isNaN(yieldPerAcre) && yieldPerAcre > 0) {
          allocatedQuantity = yieldPerAcre * land.size;
        }
      } catch (e) {
        console.error("Error parsing yield:", e);
      }
    }

    // Attempt creation
    console.log("Creating contract in database...");
    const contract = await prisma.contract.create({
      data: {
        demandId: payload.demandId,
        landId: payload.landId,
        buyerId: user.id,
        landownerId: land.ownerId,
        cropId: demand.cropId,
        landArea: land.size,
        allocatedQuantity,
        proposedPrice: price,
        startDate: start,
        expectedHarvestDate: end,
        status: ContractStatus.PENDING_APPROVAL,
        notes: payload.notes,
      },
    });

    console.log("✓ Success: Contract created:", contract);

  } catch (error: any) {
    console.error("✗ Failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPost();
