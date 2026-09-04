import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeQuantityToKg } from "@/lib/quantityHelpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Authorized: CENTER_MANAGER or ADMIN
    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required to assign vehicles." },
        { status: 403 }
      );
    }

    const { id: shipmentId } = await params;
    const body = await request.json().catch(() => ({}));
    const { vehicleId } = body;

    if (!vehicleId || typeof vehicleId !== "string") {
      return NextResponse.json({ error: "vehicleId is required." }, { status: 400 });
    }

    const result = await db.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: { items: true },
      });

      if (!shipment) {
        throw new Error("SHIPMENT_NOT_FOUND");
      }

      const vehicle = await tx.vehicle.findUnique({
        where: { id: vehicleId },
        include: { transporter: true },
      });

      if (!vehicle) {
        throw new Error("VEHICLE_NOT_FOUND");
      }

      if (!vehicle.isAvailable || vehicle.status !== "IDLE") {
        throw new Error("VEHICLE_UNAVAILABLE");
      }

      if (vehicle.transporter.role !== "TRANSPORTER") {
        throw new Error("INVALID_TRANSPORTER_ROLE");
      }

      // Weight vs Capacity Check
      const shipmentKg = shipment.items.reduce((acc, item) => {
        return acc + normalizeQuantityToKg(item.shippedWeight, item.unit);
      }, 0);

      const vehicleCapKg = normalizeQuantityToKg(vehicle.capacity, vehicle.capacityUnit);

      if (shipmentKg > vehicleCapKg + 0.001) {
        throw new Error(`CAPACITY_EXCEEDED:${shipmentKg.toFixed(1)}:${vehicleCapKg.toFixed(1)}`);
      }

      // Update shipment and vehicle status
      const updatedShipment = await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          vehicleId: vehicle.id,
          transporterId: vehicle.transporterId,
          status: "ASSIGNED",
        },
        include: {
          vehicle: true,
          transporter: { select: { id: true, name: true, phone: true, role: true } },
        },
      });

      await tx.vehicle.update({
        where: { id: vehicleId },
        data: { status: "ASSIGNED" },
      });

      return updatedShipment;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const msg = error.message || "";
    if (msg === "SHIPMENT_NOT_FOUND") return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    if (msg === "VEHICLE_NOT_FOUND") return NextResponse.json({ error: "Vehicle not found." }, { status: 404 });
    if (msg === "VEHICLE_UNAVAILABLE") return NextResponse.json({ error: "Vehicle is currently unavailable or assigned to another trip." }, { status: 400 });
    if (msg === "INVALID_TRANSPORTER_ROLE") return NextResponse.json({ error: "Vehicle owner must have TRANSPORTER role." }, { status: 400 });
    if (msg.startsWith("CAPACITY_EXCEEDED")) {
      const parts = msg.split(":");
      return NextResponse.json(
        { error: `Total shipment weight (${parts[1]} KG) exceeds vehicle capacity (${parts[2]} KG).` },
        { status: 400 }
      );
    }

    console.error("Assign Vehicle Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
