import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient, Role, LandStatus } from "@prisma/client";

const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function run() {
  console.log("=== CREATING MOCK SESSION ===");
  try {
    const buyer = await prisma.user.findFirst({
      where: { phone: "+919999999991" }
    });
    if (!buyer) throw new Error("Buyer user not found.");

    // Create a new session token
    const token = "debug-session-token-" + Date.now();
    await prisma.session.create({
      data: {
        token,
        userId: buyer.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    console.log("Mock session created. Token:", token);

    // Fetch demand and land selection
    const demand = await prisma.buyerDemand.findFirst({
      where: { buyerId: buyer.id },
      include: { selectedLands: true }
    });
    if (!demand) throw new Error("No demand found for buyer.");
    if (demand.selectedLands.length === 0) {
      throw new Error("No lands selected under this demand. Run search and select a land first.");
    }

    const selection = demand.selectedLands[0];
    await prisma.contractHistory.deleteMany({
      where: { contract: { demandId: demand.id, landId: selection.landId } }
    });
    await prisma.contract.deleteMany({
      where: { demandId: demand.id, landId: selection.landId }
    });
    const land = await prisma.land.findUnique({
      where: { id: selection.landId }
    });
    if (!land) throw new Error("Land not found.");

    console.log("Selected Land:", land.name, "(id:", land.id, ")");
    console.log("Demand ID:", demand.id);

    // Now make HTTP request to localhost Next.js app
    const payload = {
      demandId: demand.id,
      landId: land.id,
      proposedPrice: 120000,
      startDate: "2026-09-01",
      expectedHarvestDate: "2026-12-01",
      notes: "Testing contract route"
    };

    console.log("Sending POST /api/contracts request with payload:", payload);

    const res = await fetch("http://localhost:3000/api/contracts", {
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
    console.error("Error running test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
