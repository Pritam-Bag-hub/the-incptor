"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const client_1 = require("@prisma/client");
async function GET() {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const demands = await db_1.db.buyerDemand.findMany({
            where: { buyerId: user.id },
            include: {
                crop: {
                    include: {
                        category: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return server_1.NextResponse.json(demands);
    }
    catch (error) {
        console.error("GET Demands Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const body = await request.json();
        const { cropId, requiredQuantity, quantityUnit, preferredState, preferredDistrict, preferredLatitude, preferredLongitude, searchRadiusKm, requiredLandArea, preferredStartDate, expectedHarvestDate, notes, } = body;
        // Validations
        if (!cropId) {
            return server_1.NextResponse.json({ error: "Crop is required." }, { status: 400 });
        }
        const crop = await db_1.db.crop.findUnique({
            where: { id: cropId },
        });
        if (!crop) {
            return server_1.NextResponse.json({ error: "Selected crop does not exist." }, { status: 400 });
        }
        const parsedQty = parseFloat(requiredQuantity);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            return server_1.NextResponse.json({ error: "Required quantity must be a positive number." }, { status: 400 });
        }
        if (quantityUnit !== "KG" && quantityUnit !== "QUINTAL" && quantityUnit !== "TONNE") {
            return server_1.NextResponse.json({ error: "Invalid quantity unit." }, { status: 400 });
        }
        if (!preferredState || preferredState.trim() === "") {
            return server_1.NextResponse.json({ error: "Preferred state cannot be empty." }, { status: 400 });
        }
        let parsedLandArea = null;
        if (requiredLandArea !== undefined && requiredLandArea !== null && requiredLandArea !== "") {
            parsedLandArea = parseFloat(requiredLandArea);
            if (isNaN(parsedLandArea) || parsedLandArea <= 0) {
                return server_1.NextResponse.json({ error: "Required land area must be greater than 0." }, { status: 400 });
            }
        }
        let lat = null;
        if (preferredLatitude !== undefined && preferredLatitude !== null && preferredLatitude !== "") {
            lat = parseFloat(preferredLatitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                return server_1.NextResponse.json({ error: "Latitude must be between -90 and 90." }, { status: 400 });
            }
        }
        let lng = null;
        if (preferredLongitude !== undefined && preferredLongitude !== null && preferredLongitude !== "") {
            lng = parseFloat(preferredLongitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                return server_1.NextResponse.json({ error: "Longitude must be between -180 and 180." }, { status: 400 });
            }
        }
        let radius = null;
        if (searchRadiusKm !== undefined && searchRadiusKm !== null && searchRadiusKm !== "") {
            radius = parseFloat(searchRadiusKm);
            if (isNaN(radius) || radius <= 0) {
                return server_1.NextResponse.json({ error: "Search radius must be greater than 0." }, { status: 400 });
            }
        }
        let start = null;
        if (preferredStartDate) {
            start = new Date(preferredStartDate);
            if (isNaN(start.getTime())) {
                return server_1.NextResponse.json({ error: "Preferred start date is invalid." }, { status: 400 });
            }
        }
        let harvest = null;
        if (expectedHarvestDate) {
            harvest = new Date(expectedHarvestDate);
            if (isNaN(harvest.getTime())) {
                return server_1.NextResponse.json({ error: "Expected harvest date is invalid." }, { status: 400 });
            }
        }
        if (start && harvest && harvest < start) {
            return server_1.NextResponse.json({ error: "Expected harvest date cannot be before preferred start date." }, { status: 400 });
        }
        const demand = await db_1.db.buyerDemand.create({
            data: {
                buyerId: user.id,
                cropId,
                requiredQuantity: parsedQty,
                quantityUnit: quantityUnit,
                preferredState: preferredState.trim(),
                preferredDistrict: preferredDistrict ? preferredDistrict.trim() : null,
                preferredLatitude: lat,
                preferredLongitude: lng,
                searchRadiusKm: radius,
                requiredLandArea: parsedLandArea,
                preferredStartDate: start,
                expectedHarvestDate: harvest,
                notes: notes ? notes.trim() : null,
                status: client_1.BuyerDemandStatus.ACTIVE,
            },
        });
        return server_1.NextResponse.json({ success: true, demand });
    }
    catch (error) {
        console.error("POST Demand Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
