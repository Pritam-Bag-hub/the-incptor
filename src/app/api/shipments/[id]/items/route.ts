import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuantityUnit } from "@prisma/client";
import { normalizeQuantityToKg, convertKgToUnit } from "@/lib/quantityHelpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Center Manager or Admin access required." },
        { status: 403 }
      );
    }

    const { id: shipmentId } = await params;

    const body = await request.json().catch(() => ({}));
    const { receiptId, shippedWeight: rawWeight, unit: rawUnit, notes } = body;

    if (!receiptId || typeof receiptId !== "string") {
      return NextResponse.json({ error: "receiptId is required." }, { status: 400 });
    }

    const shippedWeight = parseFloat(rawWeight);
    if (isNaN(shippedWeight) || shippedWeight <= 0) {
      return NextResponse.json({ error: "Shipped weight must be a positive number." }, { status: 400 });
    }

    const validUnits: QuantityUnit[] = ["KG", "QUINTAL", "TONNE"];
    const unit: QuantityUnit = validUnits.includes(rawUnit) ? rawUnit : "TONNE";

    // Transactional processing to prevent race conditions
    const result = await db.$transaction(async (tx) => {
      const shipment = await tx.shipment.findUnique({
        where: { id: shipmentId },
        include: { vehicle: true, items: true },
      });

      if (!shipment) {
        throw new Error("SHIPMENT_NOT_FOUND");
      }

      if (shipment.status !== "DRAFT") {
        throw new Error("SHIPMENT_NOT_DRAFT");
      }

      const receipt = await tx.harvestReceipt.findUnique({
        where: { id: receiptId },
        include: { contract: true },
      });

      if (!receipt) {
        throw new Error("RECEIPT_NOT_FOUND");
      }

      // Validate buyer compatibility
      if (receipt.contract.buyerId !== shipment.buyerId) {
        throw new Error("BUYER_MISMATCH");
      }

      // Validate receipt inspection status (Only INSPECTED allowed)
      if (receipt.status !== "INSPECTED" && receipt.status !== "AGGREGATED_FOR_SHIPMENT") {
        throw new Error("RECEIPT_NOT_INSPECTED");
      }

      // Calculate remaining unallocated weight for this receipt across all active shipments
      const existingItemsForReceipt = await tx.shipmentItem.findMany({
        where: { receiptId },
      });

      const allocatedKg = existingItemsForReceipt.reduce((acc, item) => {
        return acc + normalizeQuantityToKg(item.shippedWeight, item.unit);
      }, 0);

      const totalReceiptKg = normalizeQuantityToKg(receipt.netWeight, receipt.unit);
      const remainingKg = Math.max(0, totalReceiptKg - allocatedKg);
      const requestedKg = normalizeQuantityToKg(shippedWeight, unit);

      if (requestedKg > remainingKg + 0.001) {
        throw new Error(`OVER_ALLOCATION:${requestedKg.toFixed(1)}:${remainingKg.toFixed(1)}`);
      }

      // If vehicle assigned, validate vehicle capacity
      if (shipment.vehicle) {
        const currentShipmentKg = shipment.items.reduce((acc, item) => {
          return acc + normalizeQuantityToKg(item.shippedWeight, item.unit);
        }, 0);

        const vehicleCapacityKg = normalizeQuantityToKg(shipment.vehicle.capacity, shipment.vehicle.capacityUnit);
        if (currentShipmentKg + requestedKg > vehicleCapacityKg + 0.001) {
          throw new Error(`VEHICLE_OVERLOAD:${(currentShipmentKg + requestedKg).toFixed(1)}:${vehicleCapacityKg.toFixed(1)}`);
        }
      }

      // Derive collection centerId directly from the receipt
      const centerId = receipt.centerId;
      const pickupSequence = shipment.items.length + 1;

      const newItem = await tx.shipmentItem.create({
        data: {
          shipmentId,
          receiptId,
          centerId,
          shippedWeight,
          unit,
          pickupSequence,
          notes: notes || null,
        },
        include: {
          harvestReceipt: true,
          collectionCenter: true,
        },
      });

      // Recalculate shipment total weight
      const allUpdatedItems = await tx.shipmentItem.findMany({
        where: { shipmentId },
      });

      const newTotalKg = allUpdatedItems.reduce((acc, item) => {
        return acc + normalizeQuantityToKg(item.shippedWeight, item.unit);
      }, 0);

      const newTotalWeightInTonnes = convertKgToUnit(newTotalKg, "TONNE");

      await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          totalWeight: newTotalWeightInTonnes,
          weightUnit: "TONNE",
        },
      });

      // Check if receipt is fully allocated (remainingKg - requestedKg <= 0.001)
      if (remainingKg - requestedKg <= 0.001) {
        await tx.harvestReceipt.update({
          where: { id: receiptId },
          data: { status: "AGGREGATED_FOR_SHIPMENT" },
        });
      }

      return newItem;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    const msg = error.message || "";
    if (msg === "SHIPMENT_NOT_FOUND") return NextResponse.json({ error: "Shipment not found." }, { status: 404 });
    if (msg === "SHIPMENT_NOT_DRAFT") return NextResponse.json({ error: "Items can only be added when shipment is in DRAFT status." }, { status: 400 });
    if (msg === "RECEIPT_NOT_FOUND") return NextResponse.json({ error: "Harvest receipt not found." }, { status: 404 });
    if (msg === "BUYER_MISMATCH") return NextResponse.json({ error: "Receipt contract buyer does not match shipment target buyer." }, { status: 400 });
    if (msg === "RECEIPT_NOT_INSPECTED") return NextResponse.json({ error: "Only INSPECTED receipts can be added to a shipment." }, { status: 400 });
    if (msg.startsWith("OVER_ALLOCATION")) {
      const parts = msg.split(":");
      return NextResponse.json({ error: `Requested weight (${parts[1]} KG) exceeds remaining unallocated receipt weight (${parts[2]} KG).` }, { status: 400 });
    }
    if (msg.startsWith("VEHICLE_OVERLOAD")) {
      const parts = msg.split(":");
      return NextResponse.json({ error: `Total shipment weight (${parts[1]} KG) exceeds vehicle capacity (${parts[2]} KG).` }, { status: 400 });
    }

    console.error("POST Shipment Item Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "CENTER_MANAGER" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Center Manager or Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "itemId query parameter is required." }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      const item = await tx.shipmentItem.findUnique({
        where: { id: itemId },
        include: { shipment: true, harvestReceipt: true },
      });

      if (!item) {
        throw new Error("ITEM_NOT_FOUND");
      }

      if (item.shipment.status !== "DRAFT") {
        throw new Error("SHIPMENT_NOT_DRAFT");
      }

      const receiptId = item.receiptId;
      const shipmentId = item.shipmentId;

      await tx.shipmentItem.delete({
        where: { id: itemId },
      });

      // Recalculate remaining items for shipment
      const remainingItems = await tx.shipmentItem.findMany({
        where: { shipmentId },
      });

      const newTotalKg = remainingItems.reduce((acc, i) => {
        return acc + normalizeQuantityToKg(i.shippedWeight, i.unit);
      }, 0);

      await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          totalWeight: convertKgToUnit(newTotalKg, "TONNE"),
          weightUnit: "TONNE",
        },
      });

      // Restore receipt status to INSPECTED if it was AGGREGATED_FOR_SHIPMENT
      if (item.harvestReceipt.status === "AGGREGATED_FOR_SHIPMENT") {
        await tx.harvestReceipt.update({
          where: { id: receiptId },
          data: { status: "INSPECTED" },
        });
      }
    });

    return NextResponse.json({ success: true, message: "Shipment item removed successfully." });
  } catch (error: any) {
    const msg = error.message || "";
    if (msg === "ITEM_NOT_FOUND") return NextResponse.json({ error: "Shipment item not found." }, { status: 404 });
    if (msg === "SHIPMENT_NOT_DRAFT") return NextResponse.json({ error: "Items can only be removed while shipment is in DRAFT status." }, { status: 400 });

    console.error("DELETE Shipment Item Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
