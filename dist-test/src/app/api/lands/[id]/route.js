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
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Landowner access only" }, { status: 403 });
        }
        const { id } = await params;
        const land = await db_1.db.land.findUnique({
            where: { id },
        });
        if (!land) {
            return server_1.NextResponse.json({ error: "Land not found" }, { status: 404 });
        }
        // Security check: Must own the land
        if (land.ownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this land" }, { status: 403 });
        }
        return server_1.NextResponse.json(land);
    }
    catch (error) {
        console.error("GET Land Detail Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function PATCH(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Landowner access only" }, { status: 403 });
        }
        const { id } = await params;
        const land = await db_1.db.land.findUnique({
            where: { id },
        });
        if (!land) {
            return server_1.NextResponse.json({ error: "Land not found" }, { status: 404 });
        }
        // Security check: Must own the land
        if (land.ownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You do not own this land" }, { status: 403 });
        }
        // Restriction: Cannot edit land currently under contract
        if (land.status === "UNDER_CONTRACT") {
            return server_1.NextResponse.json({ error: "Cannot edit land that is currently UNDER_CONTRACT." }, { status: 400 });
        }
        const body = await request.json();
        const { name, size, unit, address, village, district, state, pincode, latitude, longitude, description, } = body;
        // Build update parameters and validate
        const updateData = {};
        if (name !== undefined) {
            if (!name || name.trim() === "") {
                return server_1.NextResponse.json({ error: "Land name is required." }, { status: 400 });
            }
            updateData.name = name.trim();
        }
        if (size !== undefined) {
            const parsedSize = parseFloat(size);
            if (isNaN(parsedSize) || parsedSize <= 0) {
                return server_1.NextResponse.json({ error: "Land size must be a positive number." }, { status: 400 });
            }
            updateData.size = parsedSize;
        }
        if (unit !== undefined) {
            if (unit !== "ACRE" && unit !== "HECTARE") {
                return server_1.NextResponse.json({ error: "Size unit must be ACRE or HECTARE." }, { status: 400 });
            }
            updateData.unit = unit;
        }
        if (address !== undefined) {
            if (!address || address.trim() === "") {
                return server_1.NextResponse.json({ error: "Address is required." }, { status: 400 });
            }
            updateData.address = address.trim();
        }
        if (village !== undefined) {
            if (!village || village.trim() === "") {
                return server_1.NextResponse.json({ error: "Village is required." }, { status: 400 });
            }
            updateData.village = village.trim();
        }
        if (district !== undefined) {
            if (!district || district.trim() === "") {
                return server_1.NextResponse.json({ error: "District is required." }, { status: 400 });
            }
            updateData.district = district.trim();
        }
        if (state !== undefined) {
            if (!state || state.trim() === "") {
                return server_1.NextResponse.json({ error: "State is required." }, { status: 400 });
            }
            updateData.state = state.trim();
        }
        if (pincode !== undefined) {
            updateData.pincode = pincode ? pincode.trim() : null;
        }
        if (latitude !== undefined) {
            const lat = parseFloat(latitude);
            if (isNaN(lat) || lat < -90 || lat > 90) {
                return server_1.NextResponse.json({ error: "Latitude must be a valid number between -90 and 90." }, { status: 400 });
            }
            updateData.latitude = lat;
        }
        if (longitude !== undefined) {
            const lng = parseFloat(longitude);
            if (isNaN(lng) || lng < -180 || lng > 180) {
                return server_1.NextResponse.json({ error: "Longitude must be a valid number between -180 and 180." }, { status: 400 });
            }
            updateData.longitude = lng;
        }
        if (description !== undefined) {
            updateData.description = description ? description.trim() : null;
        }
        const updatedLand = await db_1.db.land.update({
            where: { id },
            data: updateData,
        });
        return server_1.NextResponse.json({ success: true, land: updatedLand });
    }
    catch (error) {
        console.error("PATCH Land Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
