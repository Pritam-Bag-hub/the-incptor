import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role, LandStatus, ContractStatus } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("=== RUNNING HTTP PROGRESS API TEST ===");
  try {
    const landowner = await prisma.user.findFirst({
      where: { phone: "+919999999992" } // Ramesh landowner
    });
    if (!landowner) throw new Error("Landowner not found.");

    // Create session token
    const token = "debug-progress-session-" + Date.now();
    await prisma.session.create({
      data: {
        token,
        userId: landowner.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    console.log("Session created for Landowner Ramesh. Token:", token);

    // Find or create an ACTIVE contract for Ramesh
    let contract = await prisma.contract.findFirst({
      where: { landownerId: landowner.id, status: ContractStatus.ACTIVE }
    });

    if (!contract) {
      console.log("No active contract found. Creating one for testing...");
      const buyer = await prisma.user.findFirst({ where: { role: Role.BUYER } });
      const crop = await prisma.crop.findFirst();
      const land = await prisma.land.findFirst({ where: { ownerId: landowner.id } });
      const demand = await prisma.buyerDemand.findFirst({ where: { buyerId: buyer?.id } });
      if (!buyer || !crop || !land || !demand) throw new Error("Seed data missing.");

      contract = await prisma.contract.create({
        data: {
          demandId: demand.id,
          landId: land.id,
          buyerId: buyer.id,
          landownerId: landowner.id,
          cropId: crop.id,
          landArea: land.size,
          allocatedQuantity: 10,
          proposedPrice: 150000,
          startDate: new Date(),
          expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: ContractStatus.ACTIVE
        }
      });
    }

    console.log("Active Contract ID:", contract.id);

    const payload = {
      stage: "LAND_PREPARATION",
      notes: "Field plowing started using local test runner."
    };

    console.log("Sending POST /api/contracts/[id]/progress payload:", payload);

    const res = await fetch(`http://localhost:3000/api/contracts/${contract.id}/progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `session_token=${token}`
      },
      body: JSON.stringify(payload)
    });

    const bodyText = await res.text();
    console.log("\nResponse Status:", res.status);
    console.log("Response Body:", bodyText);

  } catch (error: any) {
    console.error("Error in runner:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
