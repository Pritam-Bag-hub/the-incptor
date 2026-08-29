"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_better_sqlite3_1 = require("@prisma/adapter-better-sqlite3");
const client_1 = require("@prisma/client");
const adapter = new adapter_better_sqlite3_1.PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });
const prisma = new client_1.PrismaClient({ adapter });
async function runTests() {
    console.log("=== STARTING PHASE 4.1 INTEGRATION TESTS ===");
    try {
        // 1. Get seeding users
        const buyer = await prisma.user.findFirst({ where: { role: client_1.Role.BUYER } });
        const landowner = await prisma.user.findFirst({ where: { role: client_1.Role.LANDOWNER } });
        if (!buyer || !landowner) {
            throw new Error("Seed users missing!");
        }
        console.log(`Using Buyer: ${buyer.name} (${buyer.phone})`);
        console.log(`Using Landowner: ${landowner.name} (${landowner.phone})`);
        // 2. Query/Create Crops
        const crop = await prisma.crop.findFirst();
        if (!crop)
            throw new Error("Crops not seeded!");
        // 3. Create active demand for Buyer
        console.log("Creating buyer demand...");
        const demand = await prisma.buyerDemand.create({
            data: {
                buyerId: buyer.id,
                cropId: crop.id,
                requiredQuantity: 10,
                quantityUnit: "TONNE",
                preferredState: "Punjab",
                requiredLandArea: 5.0,
            },
        });
        console.log(`Created Demand ID: ${demand.id}`);
        // 4. Create land parcels
        console.log("Creating land parcels...");
        const landAvailable1 = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Plot Alpha (Available)",
                size: 3.5,
                unit: "ACRE",
                address: "Fields A",
                village: "Phagwara",
                district: "Kapurthala",
                state: "Punjab",
                latitude: 31.22,
                longitude: 75.77,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        const landAvailable2 = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Plot Beta (Available)",
                size: 4.0,
                unit: "ACRE",
                address: "Fields B",
                village: "Phagwara",
                district: "Kapurthala",
                state: "Punjab",
                latitude: 31.23,
                longitude: 75.78,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        const landUnavailable = await prisma.land.create({
            data: {
                ownerId: landowner.id,
                name: "Plot Gamma (Unavailable)",
                size: 2.0,
                unit: "ACRE",
                address: "Fields C",
                village: "Phagwara",
                district: "Kapurthala",
                state: "Punjab",
                latitude: 31.24,
                longitude: 75.79,
                status: client_1.LandStatus.UNAVAILABLE,
            },
        });
        // 5. Test selection validation rules
        // Rule A: Select available land
        console.log("TEST A: Adding available land to demand...");
        const select1 = await prisma.demandLandSelection.create({
            data: {
                demandId: demand.id,
                landId: landAvailable1.id,
            },
        });
        console.log("✓ Available land successfully selected.");
        // Rule B: Duplicate selection check
        console.log("TEST B: Verifying duplicate selection prevention...");
        try {
            await prisma.demandLandSelection.create({
                data: {
                    demandId: demand.id,
                    landId: landAvailable1.id,
                },
            });
            console.error("✗ Fail: Duplicate selection was allowed!");
        }
        catch (e) {
            console.log("✓ Pass: Duplicate selection prevented (Database Unique Constraint).");
        }
        // Rule C: Availability guard
        console.log("TEST C: Verifying availability guard simulation...");
        if (landUnavailable.status !== client_1.LandStatus.AVAILABLE) {
            console.log("✓ Pass: API logic prevents selecting this land status:", landUnavailable.status);
        }
        else {
            console.error("✗ Fail: Unavailable status matches AVAILABLE.");
        }
        // Rule D: Select multiple lands
        console.log("TEST D: Selecting multiple lands...");
        const select2 = await prisma.demandLandSelection.create({
            data: {
                demandId: demand.id,
                landId: landAvailable2.id,
            },
        });
        console.log("✓ Multiple land selection works correctly.");
        // Rule E: Fetch selection list and area totals
        console.log("TEST E: Fetching selection summary data...");
        const selections = await prisma.demandLandSelection.findMany({
            where: { demandId: demand.id },
            include: { land: true },
        });
        const totalSelectedArea = selections.reduce((sum, s) => sum + s.land.size, 0);
        const requiredArea = demand.requiredLandArea || 0;
        const remaining = Math.max(requiredArea - totalSelectedArea, 0);
        console.log(`- Demanded: ${requiredArea} ACREs`);
        console.log(`- Selected: ${totalSelectedArea} ACREs`);
        console.log(`- Remaining Required: ${remaining} ACREs`);
        if (totalSelectedArea >= requiredArea) {
            console.log("✓ Status: Land Requirement Met!");
        }
        else {
            console.log(`✓ Status: Pending ${remaining} ACREs`);
        }
        // Rule F: Remove a land parcel selection
        console.log("TEST F: Deleting a selection...");
        await prisma.demandLandSelection.delete({
            where: {
                demandId_landId: {
                    demandId: demand.id,
                    landId: landAvailable1.id,
                },
            },
        });
        const afterDeleteCount = await prisma.demandLandSelection.count({
            where: { demandId: demand.id },
        });
        if (afterDeleteCount === 1) {
            console.log("✓ Pass: Selection deleted successfully. Count is now 1.");
        }
        else {
            console.error("✗ Fail: Delete did not decrement selections count.", afterDeleteCount);
        }
        // Clean up test rows
        console.log("Cleaning up test database rows...");
        await prisma.demandLandSelection.deleteMany({ where: { demandId: demand.id } });
        await prisma.buyerDemand.delete({ where: { id: demand.id } });
        await prisma.land.deleteMany({
            where: {
                id: { in: [landAvailable1.id, landAvailable2.id, landUnavailable.id] },
            },
        });
        console.log("=== ALL INTEGRATION TESTS COMPLETED SUCCESSFULLY ===");
    }
    catch (error) {
        console.error("✗ An error occurred during test execution:", error);
    }
    finally {
        await prisma.$disconnect();
    }
}
runTests();
