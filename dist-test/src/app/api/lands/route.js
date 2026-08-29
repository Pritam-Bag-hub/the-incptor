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
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Only landowners can access land list" }, { status: 403 });
        }
        const lands = await db_1.db.land.findMany({
            where: { ownerId: user.id },
            orderBy: { createdAt: "desc" },
        });
        return server_1.NextResponse.json(lands);
    }
    catch (error) {
        console.error("GET Lands Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Only landowners can add land" }, { status: 403 });
        }
        const body = await request.json();
        const { name, size, unit, address, village, district, state, pincode, latitude, longitude, description, } = body;
        // Validation
        if (!name || name.trim() === "") {
            return server_1.NextResponse.json({ error: "Land name is required." }, { status: 400 });
        }
        const parsedSize = parseFloat(size);
        if (isNaN(parsedSize) || parsedSize <= 0) {
            return server_1.NextResponse.json({ error: "Land size must be a positive number." }, { status: 400 });
        }
        if (unit !== "ACRE" && unit !== "HECTARE") {
            return server_1.NextResponse.json({ error: "Size unit must be ACRE or HECTARE." }, { status: 400 });
        }
        if (!address || !village || !district || !state) {
            return server_1.NextResponse.json({ error: "Address, Village, District, and State are required." }, { status: 400 });
        }
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (isNaN(lat) || lat < -90 || lat > 90) {
            return server_1.NextResponse.json({ error: "Latitude must be a valid number between -90 and 90." }, { status: 400 });
        }
        if (isNaN(lng) || lng < -180 || lng > 180) {
            return server_1.NextResponse.json({ error: "Longitude must be a valid number between -180 and 180." }, { status: 400 });
        }
        const land = await db_1.db.land.create({
            data: {
                ownerId: user.id,
                name: name.trim(),
                size: parsedSize,
                unit: unit,
                address: address.trim(),
                village: village.trim(),
                district: district.trim(),
                state: state.trim(),
                pincode: pincode ? pincode.trim() : null,
                latitude: lat,
                longitude: lng,
                description: description ? description.trim() : null,
                status: client_1.LandStatus.AVAILABLE,
            },
        });
        return server_1.NextResponse.json({ success: true, land });
    }
    catch (error) {
        console.error("POST Land Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
