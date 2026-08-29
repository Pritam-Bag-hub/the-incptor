"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
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
        const { id } = await params;
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id },
            include: {
                crop: {
                    include: {
                        category: true,
                    },
                },
            },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand not found" }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
        }
        return server_1.NextResponse.json(demand);
    }
    catch (error) {
        console.error("GET Demand Detail Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function PATCH(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "BUYER") {
            return server_1.NextResponse.json({ error: "Forbidden: Buyer role required" }, { status: 403 });
        }
        const { id } = await params;
        const demand = await db_1.db.buyerDemand.findUnique({
            where: { id },
        });
        if (!demand) {
            return server_1.NextResponse.json({ error: "Demand not found" }, { status: 404 });
        }
        if (demand.buyerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this demand" }, { status: 403 });
        }
        const body = await request.json();
        const { cropId, requiredQuantity, quantityUnit, preferredState, preferredDistrict, preferredLatitude, preferredLongitude, searchRadiusKm, requiredLandArea, preferredStartDate, expectedHarvestDate, notes, } = body;
        const updateData = {};
        if (cropId !== undefined) {
            const crop = await db_1.db.crop.findUnique({ where: { id: cropId } });
            if (!crop) {
                return server_1.NextResponse.json({ error: "Selected crop does not exist." }, { status: 400 });
            }
            updateData.cropId = cropId;
        }
        if (requiredQuantity !== undefined) {
            const parsedQty = parseFloat(requiredQuantity);
            if (isNaN(parsedQty) || parsedQty <= 0) {
                return server_1.NextResponse.json({ error: "Required quantity must be a positive number." }, { status: 400 });
            }
            updateData.requiredQuantity = parsedQty;
        }
        if (quantityUnit !== undefined) {
            if (quantityUnit !== "KG" && quantityUnit !== "QUINTAL" && quantityUnit !== "TONNE") {
                return server_1.NextResponse.json({ error: "Invalid quantity unit." }, { status: 400 });
            }
            updateData.quantityUnit = quantityUnit;
        }
        if (preferredState !== undefined) {
            if (!preferredState || preferredState.trim() === "") {
                return server_1.NextResponse.json({ error: "Preferred state cannot be empty." }, { status: 400 });
            }
            updateData.preferredState = preferredState.trim();
        }
        if (preferredDistrict !== undefined) {
            updateData.preferredDistrict = preferredDistrict ? preferredDistrict.trim() : null;
        }
        if (preferredLatitude !== undefined) {
            if (preferredLatitude === null || preferredLatitude === "") {
                updateData.preferredLatitude = null;
            }
            else {
                const lat = parseFloat(preferredLatitude);
                if (isNaN(lat) || lat < -90 || lat > 90) {
                    return server_1.NextResponse.json({ error: "Latitude must be between -90 and 90." }, { status: 400 });
                }
                updateData.preferredLatitude = lat;
            }
        }
        if (preferredLongitude !== undefined) {
            if (preferredLongitude === null || preferredLongitude === "") {
                updateData.preferredLongitude = null;
            }
            else {
                const lng = parseFloat(preferredLongitude);
                if (isNaN(lng) || lng < -180 || lng > 180) {
                    return server_1.NextResponse.json({ error: "Longitude must be between -180 and 180." }, { status: 400 });
                }
                updateData.preferredLongitude = lng;
            }
        }
        if (searchRadiusKm !== undefined) {
            if (searchRadiusKm === null || searchRadiusKm === "") {
                updateData.searchRadiusKm = null;
            }
            else {
                const radius = parseFloat(searchRadiusKm);
                if (isNaN(radius) || radius <= 0) {
                    return server_1.NextResponse.json({ error: "Search radius must be greater than 0." }, { status: 400 });
                }
                updateData.searchRadiusKm = radius;
            }
        }
        if (requiredLandArea !== undefined) {
            if (requiredLandArea === null || requiredLandArea === "") {
                updateData.requiredLandArea = null;
            }
            else {
                const parsedLandArea = parseFloat(requiredLandArea);
                if (isNaN(parsedLandArea) || parsedLandArea <= 0) {
                    return server_1.NextResponse.json({ error: "Required land area must be greater than 0." }, { status: 400 });
                }
                updateData.requiredLandArea = parsedLandArea;
            }
        }
        let start = demand.preferredStartDate;
        if (preferredStartDate !== undefined) {
            if (preferredStartDate === null || preferredStartDate === "") {
                updateData.preferredStartDate = null;
                start = null;
            }
            else {
                const parsedStart = new Date(preferredStartDate);
                if (isNaN(parsedStart.getTime())) {
                    return server_1.NextResponse.json({ error: "Preferred start date is invalid." }, { status: 400 });
                }
                updateData.preferredStartDate = parsedStart;
                start = parsedStart;
            }
        }
        let harvest = demand.expectedHarvestDate;
        if (expectedHarvestDate !== undefined) {
            if (expectedHarvestDate === null || expectedHarvestDate === "") {
                updateData.expectedHarvestDate = null;
                harvest = null;
            }
            else {
                const parsedHarvest = new Date(expectedHarvestDate);
                if (isNaN(parsedHarvest.getTime())) {
                    return server_1.NextResponse.json({ error: "Expected harvest date is invalid." }, { status: 400 });
                }
                updateData.expectedHarvestDate = parsedHarvest;
                harvest = parsedHarvest;
            }
        }
        if (start && harvest && harvest < start) {
            return server_1.NextResponse.json({ error: "Expected harvest date cannot be before preferred start date." }, { status: 400 });
        }
        if (notes !== undefined) {
            updateData.notes = notes ? notes.trim() : null;
        }
        const updatedDemand = await db_1.db.buyerDemand.update({
            where: { id },
            data: updateData,
            include: {
                crop: {
                    include: {
                        category: true,
                    },
                },
            },
        });
        return server_1.NextResponse.json({ success: true, demand: updatedDemand });
    }
    catch (error) {
        console.error("PATCH Demand Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
