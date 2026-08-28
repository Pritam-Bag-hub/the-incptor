import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contractId } = await params;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        financialAllocation: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Access check: User must be buyer or landowner
    if (contract.buyerId !== user.id && contract.landownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access." }, { status: 403 });
    }

    if (!contract.financialAllocation) {
      return NextResponse.json({ error: "Financial allocation not configured yet." }, { status: 404 });
    }

    return NextResponse.json(contract.financialAllocation);
  } catch (error: any) {
    console.error("GET Financials Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(request, params);
}

async function handleUpdate(
  request: Request,
  params: Promise<{ id: string }>
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contractId } = await params;

    const contract = await db.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found." }, { status: 404 });
    }

    // Authorization: Only associated Buyer can edit financials
    if (contract.buyerId !== user.id) {
      return NextResponse.json({ error: "Forbidden: Only the associated buyer can configure financials." }, { status: 403 });
    }

    // Status constraint: Must be ACCEPTED or ACTIVE
    if (contract.status !== "ACCEPTED" && contract.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Financial allocations can only be configured for ACCEPTED or ACTIVE contracts." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const landownerAmount = parseFloat(body.landownerAmount || 0);
    const workforceBudget = parseFloat(body.workforceBudget || 0);
    const logisticsBudget = parseFloat(body.logisticsBudget || 0);
    const platformFee = parseFloat(body.platformFee || 0);
    const reserveBudget = parseFloat(body.reserveBudget || 0);

    if (
      landownerAmount < 0 ||
      workforceBudget < 0 ||
      logisticsBudget < 0 ||
      platformFee < 0 ||
      reserveBudget < 0
    ) {
      return NextResponse.json({ error: "Budget components cannot be negative." }, { status: 400 });
    }

    const totalAllocated = landownerAmount + workforceBudget + logisticsBudget + platformFee + reserveBudget;
    const expectedValue = contract.proposedPrice;

    // Check with floating-point tolerance of 0.01
    if (Math.abs(totalAllocated - expectedValue) >= 0.01) {
      return NextResponse.json(
        {
          error: `Total allocations (${totalAllocated}) must sum up to the agreed contract value (${expectedValue}).`
        },
        { status: 400 }
      );
    }

    const allocation = await db.contractFinancialAllocation.upsert({
      where: { contractId },
      create: {
        contractId,
        totalContractValue: expectedValue,
        landownerAmount,
        workforceBudget,
        logisticsBudget,
        platformFee,
        reserveBudget,
        isConfigured: true,
        currency: "INR",
      },
      update: {
        totalContractValue: expectedValue,
        landownerAmount,
        workforceBudget,
        logisticsBudget,
        platformFee,
        reserveBudget,
        isConfigured: true,
      },
    });

    return NextResponse.json({ success: true, financialAllocation: allocation });
  } catch (error: any) {
    console.error("Update Financials Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
