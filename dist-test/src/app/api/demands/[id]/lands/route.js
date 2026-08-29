"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
async function GET(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { id: demandId } = await params;
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id: demandId },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand profile not found" }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
        }
        const selections = await db_1.db.demandLandSelection.findMany({
            where: { demandId },
            include: {
                land: {
                    include: {
                        owner: true,
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });
        return server_1.NextResponse.json(selections.map((s) => ({
            id: s.land.id,
            name: s.land.name,
            size: s.land.size,
            unit: s.land.unit,
            village: s.land.village,
            district: s.land.district,
            state: s.land.state,
            latitude: s.land.latitude,
            longitude: s.land.longitude,
            status: s.land.status,
            ownerName: s.land.owner.name,
            selectionId: s.id,
        })));
    }
    catch (error) {
        console.error("GET Selection Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function POST(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { id: demandId } = await params;
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id: demandId },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand profile not found" }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
        }
        const body = await request.json();
        const { landId } = body;
        if (!landId) {
            return server_1.NextResponse.json({ error: "Land ID is required." }, { status: 400 });
        }
        const land = await db_1.db.land.findUnique({
            where: { id: landId },
        });
        if (!land) {
            return server_1.NextResponse.json({ error: "Selected land parcel does not exist." }, { status: 404 });
        }
        if (land.status !== "AVAILABLE") {
            return server_1.NextResponse.json({ error: "Selected land is not available." }, { status: 400 });
        }
        // Check duplicate
        const existing = await db_1.db.demandLandSelection.findUnique({
            where: {
                demandId_landId: {
                    demandId,
                    landId,
                },
            },
        });
        if (existing) {
            return server_1.NextResponse.json({ error: "Land is already selected for this demand." }, { status: 400 });
        }
        const selection = await db_1.db.demandLandSelection.create({
            data: {
                demandId,
                landId,
            },
        });
        return server_1.NextResponse.json({ success: true, selection });
    }
    catch (error) {
        console.error("POST Selection Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function DELETE(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { id: demandId } = await params;
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id: demandId },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand profile not found" }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
        }
        const body = await request.json();
        const { landId } = body;
        if (!landId) {
            return server_1.NextResponse.json({ error: "Land ID is required." }, { status: 400 });
        }
        await db_1.db.demandLandSelection.delete({
            where: {
                demandId_landId: {
                    demandId,
                    landId,
                },
            },
        }).catch(() => { });
        return server_1.NextResponse.json({ success: true });
    }
    catch (error) {
        console.error("DELETE Selection Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
