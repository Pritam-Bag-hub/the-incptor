"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function run() {
    console.log("=== STARTING CONTRACT REVISION AND NEGOTIATION FLOW TESTS ===");
    try {
        // 1. Fetch buyer and landowner users
        const buyer = await prisma.user.findFirst({ where: { phone: "+919999999991" } });
        const landowner = await prisma.user.findFirst({ where: { phone: "+919999999992" } });
        if (!buyer || !landowner)
            throw new Error("Missing seeded test users.");
        // Create session tokens
        const buyerToken = "buyer-rev-token-" + Date.now();
        await prisma.session.create({
            data: { token: buyerToken, userId: buyer.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        });
        const landownerToken = "landowner-rev-token-" + Date.now();
        await prisma.session.create({
            data: { token: landownerToken, userId: landowner.id, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) }
        });
        console.log("Buyer and Landowner session tokens registered.");
        // Get a demand and a land selection
        const demand = await prisma.buyerDemand.findFirst({
            where: { buyerId: buyer.id },
            include: { selectedLands: true }
        });
        if (!demand || demand.selectedLands.length === 0) {
            throw new Error("No buyer demand or land selection found. Run select land first.");
        }
        const selection = demand.selectedLands[0];
        const land = await prisma.land.findUnique({ where: { id: selection.landId } });
        if (!land)
            throw new Error("Land not found.");
        await prisma.land.update({
            where: { id: land.id },
            data: { status: client_1.LandStatus.AVAILABLE }
        });
        // Clean up existing contracts for this selection first
        await prisma.contractHistory.deleteMany({
            where: { contract: { demandId: demand.id, landId: land.id } }
        });
        await prisma.contract.deleteMany({
            where: { demandId: demand.id, landId: land.id }
        });
        console.log(`Cleaned up. Proposing new contract on Land: ${land.name}`);
        // STEP A: Create a new proposal
        const proposalPayload = {
            demandId: demand.id,
            landId: land.id,
            proposedPrice: 100000,
            startDate: "2026-09-01",
            expectedHarvestDate: "2026-12-01",
            notes: "Initial proposal round 1 notes."
        };
        console.log("\n--- STEP A: Submitting initial proposal via HTTP POST /api/contracts...");
        const postRes = await fetch("http://localhost:3000/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": `session_token=${buyerToken}` },
            body: JSON.stringify(proposalPayload)
        });
        const postData = await postRes.json();
        console.log("Response Status:", postRes.status);
        if (!postRes.ok)
            throw new Error(`POST failed: ${JSON.stringify(postData)}`);
        console.log("Proposal Created successfully. ID:", postData.contract.id, "Status:", postData.contract.status, "Revision:", postData.contract.revision);
        const contractId = postData.contract.id;
        // STEP B: Landowner rejects the proposal with a rejection reason
        const rejectPayload = { rejectionReason: "Price is too low for this land size." };
        console.log("\n--- STEP B: Landowner rejects proposal via HTTP PATCH /api/landowner/contracts/[id]/reject...");
        const rejectRes = await fetch(`http://localhost:3000/api/landowner/contracts/${contractId}/reject`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "Cookie": `session_token=${landownerToken}` },
            body: JSON.stringify(rejectPayload)
        });
        const rejectData = await rejectRes.json();
        console.log("Response Status:", rejectRes.status);
        if (!rejectRes.ok)
            throw new Error(`Reject PATCH failed: ${JSON.stringify(rejectData)}`);
        console.log("Contract rejected successfully. Status:", rejectData.contract.status, "Reason:", rejectData.contract.rejectionReason);
        // STEP C: Buyer clicks Propose Again (POSTs another proposal payload for the same land)
        const revisePayload = {
            demandId: demand.id,
            landId: land.id,
            proposedPrice: 125000, // increased price
            startDate: "2026-09-01",
            expectedHarvestDate: "2026-12-01",
            notes: "Revised proposal round 2 notes."
        };
        console.log("\n--- STEP C: Buyer proposes again via HTTP POST /api/contracts...");
        const reviseRes = await fetch("http://localhost:3000/api/contracts", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cookie": `session_token=${buyerToken}` },
            body: JSON.stringify(revisePayload)
        });
        const reviseData = await reviseRes.json();
        console.log("Response Status:", reviseRes.status);
        if (!reviseRes.ok)
            throw new Error(`Revise POST failed: ${JSON.stringify(reviseData)}`);
        console.log("Revised Contract Status:", reviseData.contract.status, "Revision:", reviseData.contract.revision);
        // STEP D: Verify that the old revision is saved in ContractHistory and values are correct
        console.log("\n--- STEP D: Verifying Contract history log in database...");
        const refreshedContract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { history: true }
        });
        if (!refreshedContract)
            throw new Error("Refreshed contract not found in database.");
        console.log("Current Contract Status:", refreshedContract.status);
        console.log("Current Contract Revision:", refreshedContract.revision);
        console.log("Current Contract Notes:", refreshedContract.notes);
        console.log("History records count:", refreshedContract.history.length);
        if (refreshedContract.status !== client_1.ContractStatus.PENDING_APPROVAL) {
            throw new Error(`Expected contract status to be PENDING_APPROVAL, but got: ${refreshedContract.status}`);
        }
        if (refreshedContract.revision !== 2) {
            throw new Error(`Expected contract revision to be 2, but got: ${refreshedContract.revision}`);
        }
        if (refreshedContract.history.length !== 1) {
            throw new Error(`Expected exactly 1 history log row, but got: ${refreshedContract.history.length}`);
        }
        const hist1 = refreshedContract.history[0];
        console.log("Saved History Record - Revision:", hist1.revision, "Status:", hist1.status, "Price:", hist1.proposedPrice, "Notes:", hist1.notes, "Rejection Reason:", hist1.rejectionReason);
        if (hist1.revision !== 1 || hist1.status !== client_1.ContractStatus.REJECTED || hist1.proposedPrice !== 100000) {
            throw new Error("Saved history log values do not match initial contract properties!");
        }
        console.log("\n✓ ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
    }
    catch (error) {
        console.error("\n✗ NEGOTIATION FLOW TEST RUNNER FAILED:", error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
run();
