"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const auth_1 = require("@/lib/auth");
const db_1 = require("@/lib/db");
async function GET(request, { params }) {
    try {
        const user = await (0, auth_1.getSessionUser)();
        if (!user) {
            return server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id: contractId } = await params;
        const contract = await db_1.db.contract.findUnique({
            where: { id: contractId },
            include: {
                land: true,
                crop: {
                    include: {
                        category: true,
                    },
                },
                buyer: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                landowner: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                },
                history: {
                    orderBy: {
                        revision: "asc"
                    }
                },
                progressUpdates: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            },
        });
        if (!contract) {
            return server_1.NextResponse.json({ error: "Contract not found." }, { status: 404 });
        }
        // Access check: User must be either the buyer or the landowner involved
        if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
            return server_1.NextResponse.json({ error: "Forbidden: You are not authorized to view this contract." }, { status: 403 });
        }
        return server_1.NextResponse.json(contract);
    }
    catch (error) {
        console.error("GET Contract Details Error:", error);
        return server_1.NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
