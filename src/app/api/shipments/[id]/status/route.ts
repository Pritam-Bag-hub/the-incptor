import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShipmentStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: shipmentId } = await params;
    const body = await request.json().catch(() => ({}));
    const { status: targetStatus } = body;

    const validStatuses: ShipmentStatus[] = [
      "DRAFT",
      "READY_FOR_DISPATCH",
      "ASSIGNED",
      "IN_TRANSIT",
      "ARRIVED_AT_DESTINATION",
      "DELIVERED_CONFIRMED",
      "DISPUTED",
    ];

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return NextResponse.json({ error: "Valid target shipment status is required." }, { status: 400 });
    }

    if (targetStatus === "DISPUTED") {
      return NextResponse.json(
        { error: "DISPUTED status cannot be set manually via status endpoint." },
        { status: 400 }
      );
    }

    const result = await db.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: { items: { include: { harvestReceipt: true } }, vehicle: true },
      });

      if (!shipment) {
        throw new Error("SHIPMENT_NOT_FOUND");
      }

      const currentStatus = shipment.status;

      // Validate allowed transitions
      if (targetStatus === "READY_FOR_DISPATCH") {
        if (currentStatus !== "DRAFT") {
          throw new Error("INVALID_TRANSITION");
        }
        if (shipment.items.length === 0) {
          throw new Error("NO_ITEMS");
        }
        if (shipment.totalWeight <= 0) {
          throw new Error("ZERO_WEIGHT");
        }
        const hasUninspected = shipment.items.some(
          (i) => i.harvestReceipt.status !== "INSPECTED" && i.harvestReceipt.status !== "AGGREGATED_FOR_SHIPMENT"
        );
        if (hasUninspected) {
          throw new Error("UNINSPECTED_ITEMS");
        }
      } else if (targetStatus === "ASSIGNED") {
        if (currentStatus !== "READY_FOR_DISPATCH" && currentStatus !== "DRAFT") {
          throw new Error("INVALID_TRANSITION");
        }
        if (!shipment.vehicleId) {
          throw new Error("NO_VEHICLE");
        }
      } else if (targetStatus === "IN_TRANSIT") {
        if (currentStatus !== "ASSIGNED") {
          throw new Error("INVALID_TRANSITION");
        }
      } else if (targetStatus === "ARRIVED_AT_DESTINATION") {
        if (currentStatus !== "IN_TRANSIT") {
          throw new Error("INVALID_TRANSITION");
        }
      } else if (targetStatus === "DELIVERED_CONFIRMED") {
        if (currentStatus !== "ARRIVED_AT_DESTINATION" && currentStatus !== "IN_TRANSIT") {
          throw new Error("INVALID_TRANSITION");
        }
      }

      const updateData: any = { status: targetStatus };

      if (targetStatus === "IN_TRANSIT") {
        updateData.dispatchedAt = new Date();
        if (shipment.vehicleId) {
          await tx.vehicle.update({
            where: { id: shipment.vehicleId },
            data: { status: "IN_TRANSIT" },
          });
        }
      } else if (targetStatus === "DELIVERED_CONFIRMED") {
        updateData.deliveredAt = new Date();
        if (shipment.vehicleId) {
          await tx.vehicle.update({
            where: { id: shipment.vehicleId },
            data: { status: "IDLE", isAvailable: true },
          });
        }
      }

      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: updateData,
        include: {
          vehicle: true,
          transporter: { select: { id: true, name: true, phone: true, role: true } },
          items: true,
        },
      });

      return updatedShipment;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error.message || "";
    if (msg === "SHIPMENT_NOT_FOUND") return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    if (msg === "INVALID_TRANSITION") return NextResponse.json({ error: "Invalid status transition sequence." }, { status: 400 });
    if (msg === "NO_ITEMS") return NextResponse.json({ error: "Cannot mark READY_FOR_DISPATCH without any harvest items." }, { status: 400 });
    if (msg === "ZERO_WEIGHT") return NextResponse.json({ error: "Shipment total weight must be greater than zero." }, { status: 400 });
    if (msg === "UNINSPECTED_ITEMS") return NextResponse.json({ error: "All shipment items must be verified INSPECTED receipts." }, { status: 400 });
    if (msg === "NO_VEHICLE") return NextResponse.json({ error: "A vehicle must be assigned before marking ASSIGNED." }, { status: 400 });

    console.error("PATCH Shipment Status Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
