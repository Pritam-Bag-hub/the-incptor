"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = PATCH;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
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
        const body = await request.json();
        const { status } = body;
        if (status !== "AVAILABLE" && status !== "UNAVAILABLE") {
            return server_1.NextResponse.json({ error: "Status must be AVAILABLE or UNAVAILABLE." }, { status: 400 });
        }
        // Restriction: Cannot manually toggle status when under contract
        if (land.status === "UNDER_CONTRACT") {
            return server_1.NextResponse.json({ error: "Cannot change availability status of land currently UNDER_CONTRACT." }, { status: 400 });
        }
        const updatedLand = await db_1.db.land.update({
            where: { id },
            data: {
                status: status,
            },
        });
        return server_1.NextResponse.json({ success: true, status: updatedLand.status });
    }
    catch (error) {
        console.error("PATCH Land Status Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
