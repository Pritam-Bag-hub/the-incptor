"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
const client_1 = require("@prisma/client");
async function POST(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (user.role !== "LANDOWNER") {
            return server_1.NextResponse.json({ error: "Forbidden: Landowner role required" }, { status: 403 });
        }
        const { id: contractId } = await params;
        const contract = await db_1.db.contract.findUnique({
            where: { id: contractId },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Verify ownership
        if (contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You are not authorized to update progress on this contract." }, { status: 403 });
        }
        // Verify contract is ACTIVE
        if (contract.status !== "ACTIVE") {
            return server_1.NextResponse.json({ error: "Farming progress can only be updated on ACTIVE contracts." }, { status: 400 });
        }
        const body = await request.json().catch(() => ({}));
        const { stage, notes } = body;
        // Validate stage
        if (!stage || !Object.values(client_1.FarmProgressStage).includes(stage)) {
            return server_1.NextResponse.json({ error: `Invalid stage specified. Must be one of: ${Object.values(client_1.FarmProgressStage).join(", ")}` }, { status: 400 });
        }
        const trimmedNotes = notes ? String(notes).trim() : null;
        const progress = await db_1.db.farmProgress.create({
            data: {
                contractId,
                stage: stage,
                notes: trimmedNotes,
            },
        });
        return server_1.NextResponse.json(progress);
    }
    catch (error) {
        console.error("POST Contract Progress Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
