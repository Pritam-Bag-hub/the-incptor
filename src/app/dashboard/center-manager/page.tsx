"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  MapPin,
  Scale,
  Layers,
  AlertTriangle,
  Loader2,
  ChevronRight,
  UserCheck,
  Sprout
} from "lucide-react";
import { normalizeQuantityToKg, convertKgToUnit } from "@/lib/quantityHelpers";

export default function CenterManagerDashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [pendingHarvests, setPendingHarvests] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal / Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [receivingContract, setReceivingContract] = useState<any | null>(null);

  // Receive at Hub Scale Inputs
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("0");
  const [receiveUnit, setReceiveUnit] = useState<"KG" | "QUINTAL" | "TONNE">("TONNE");
  const [receiveNotes, setReceiveNotes] = useState("");
  const [submittingReceive, setSubmittingReceive] = useState(false);
  const [receiveError, setReceiveError] = useState("");

  // Create Shipment Inputs
  const [buyerId, setBuyerId] = useState("");
  const [destAddress, setDestAddress] = useState("Central Mandi Terminal, Gate 4, Mohali");
  const [destLat, setDestLat] = useState("30.7046");
  const [destLng, setDestLng] = useState("76.7179");
  const [scheduledDate, setScheduledDate] = useState("");
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [createError, setCreateError] = useState("");

  // Add Item Inputs
  const [selectedReceiptId, setSelectedReceiptId] = useState("");
  const [shippedWeight, setShippedWeight] = useState("");
  const [shippedUnit, setShippedUnit] = useState<"KG" | "QUINTAL" | "TONNE">("TONNE");
  const [addingItem, setAddingItem] = useState(false);
  const [itemError, setItemError] = useState("");

  // Vehicle Assignment Inputs
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assigningVehicle, setAssigningVehicle] = useState(false);
  const [assignError, setAssignError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [shipmentsRes, receiptsRes, vehiclesRes, pendingRes, centersRes] = await Promise.all([
        fetch("/api/shipments"),
        fetch("/api/inspections"),
        fetch("/api/vehicles"),
        fetch("/api/collection-centers/pending-harvests"),
        fetch("/api/collection-centers"),
      ]);

      if (shipmentsRes.ok) setShipments(await shipmentsRes.json());
      if (receiptsRes.ok) setReceipts(await receiptsRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (pendingRes.ok) setPendingHarvests(await pendingRes.json());
      if (centersRes.ok) {
        const centersData = await centersRes.json();
        setCenters(centersData);
        if (centersData.length > 0 && !selectedCenterId) {
          setSelectedCenterId(centersData[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard logistics data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReceiveModal = (contract: any) => {
    setReceivingContract(contract);
    const recordedQty = contract.yield?.actualQuantity || 0;
    setGrossWeight(recordedQty.toString());
    setTareWeight("0");
    setReceiveUnit(contract.yield?.unit || "TONNE");
    setReceiveNotes("");
    setReceiveError("");
  };

  const handleReceiveHarvestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivingContract || !selectedCenterId) {
      setReceiveError("Please select a collection center.");
      return;
    }

    setSubmittingReceive(true);
    setReceiveError("");

    try {
      const gross = parseFloat(grossWeight);
      const tare = parseFloat(tareWeight);

      if (isNaN(gross) || gross <= 0) {
        throw new Error("Gross scale weight must be a positive number.");
      }
      if (isNaN(tare) || tare < 0) {
        throw new Error("Tare weight must be a non-negative number.");
      }
      if (tare >= gross) {
        throw new Error("Tare weight must be strictly less than gross scale weight.");
      }

      const res = await fetch(`/api/collection-centers/${selectedCenterId}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId: receivingContract.id,
          yieldId: receivingContract.yield.id,
          grossWeight: gross,
          tareWeight: tare,
          unit: receiveUnit,
          notes: receiveNotes ? receiveNotes.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue harvest receipt.");
      }

      setReceivingContract(null);
      fetchData();
    } catch (err: any) {
      setReceiveError(err.message || "An error occurred during harvest receiving.");
    } finally {
      setSubmittingReceive(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerId) {
      setCreateError("Target buyer ID is required.");
      return;
    }

    setCreatingShipment(true);
    setCreateError("");

    try {
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerId,
          destinationAddress: destAddress,
          destinationLatitude: parseFloat(destLat),
          destinationLongitude: parseFloat(destLng),
          scheduledPickupDate: scheduledDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create shipment.");
      }

      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      setCreateError(err.message || "An error occurred.");
    } finally {
      setCreatingShipment(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !selectedReceiptId) return;

    setAddingItem(true);
    setItemError("");

    try {
      const res = await fetch(`/api/shipments/${selectedShipment.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiptId: selectedReceiptId,
          shippedWeight: parseFloat(shippedWeight),
          unit: shippedUnit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add lot to shipment.");
      }

      setSelectedReceiptId("");
      setShippedWeight("");
      fetchData();
      const updatedShipmentRes = await fetch(`/api/shipments/${selectedShipment.id}`);
      if (updatedShipmentRes.ok) {
        setSelectedShipment(await updatedShipmentRes.json());
      }
    } catch (err: any) {
      setItemError(err.message || "An error occurred adding lot.");
    } finally {
      setAddingItem(false);
    }
  };

  const handleAssignVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !selectedVehicleId) return;

    setAssigningVehicle(true);
    setAssignError("");

    try {
      const res = await fetch(`/api/shipments/${selectedShipment.id}/assign-vehicle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId: selectedVehicleId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign vehicle.");
      }

      fetchData();
      const updatedShipmentRes = await fetch(`/api/shipments/${selectedShipment.id}`);
      if (updatedShipmentRes.ok) {
        setSelectedShipment(await updatedShipmentRes.json());
      }
    } catch (err: any) {
      setAssignError(err.message || "Failed to assign vehicle.");
    } finally {
      setAssigningVehicle(false);
    }
  };

  const handleMarkReady = async (shipmentId: string) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY_FOR_DISPATCH" }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to set status to Ready for Dispatch.");
        return;
      }

      fetchData();
      if (selectedShipment && selectedShipment.id === shipmentId) {
        setSelectedShipment(data);
      }
    } catch (err: any) {
      alert("Error updating shipment status.");
    }
  };

  // KPI & Directory Calculations (Calculates remaining unreceived harvest balance for partial receipt readiness)
  const unreceivedHarvests = pendingHarvests.filter((c) => {
    if (!c.yield?.actualQuantity || c.yield.actualQuantity <= 0) return false;
    const totalRecordedKg = normalizeQuantityToKg(c.yield.actualQuantity, c.yield.unit || "TONNE");
    const totalReceivedKg = (c.harvestReceipts || []).reduce((sum: number, r: any) => {
      return sum + normalizeQuantityToKg(r.netWeight, r.unit);
    }, 0);
    const remainingKg = Math.max(0, totalRecordedKg - totalReceivedKg);
    return remainingKg > 0.001;
  });

  const inspectedReceipts = receipts.filter((r) => r.status === "INSPECTED");
  const draftShipments = shipments.filter((s) => s.status === "DRAFT");
  const readyShipments = shipments.filter((s) => s.status === "READY_FOR_DISPATCH");
  const assignedShipments = shipments.filter((s) => s.status === "ASSIGNED" || s.status === "IN_TRANSIT");

  return (
    <div className="min-h-screen w-full bg-[#F6F8F3] px-4 sm:px-6 lg:px-8 xl:px-10 py-8 text-[#17251B] font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#ECFDF3] border border-[#22C55E]/30 rounded-xl text-[#166534]">
              <Truck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17251B] tracking-tight">
              Collection Center Logistics Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#647067] mt-1 font-semibold">
            Hub Scale Receiving & Multi-Farmer Dispatch Console — Receive incoming farm harvest lots and aggregate verified receipts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#ECFDF3] border border-[#E2E8E3] text-[#166534] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Logistics Data
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Multi-Farmer Shipment
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Farm Harvests</span>
            <span className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
              <Sprout className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-amber-700">{unreceivedHarvests.length}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Farm lots awaiting hub scale receiving</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Lots Available</span>
            <span className="p-2 bg-[#ECFDF3] text-[#166534] rounded-xl border border-[#22C55E]/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#166534]">{inspectedReceipts.length}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Inspected produce ready for shipment</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Draft Shipments</span>
            <span className="p-2 bg-[#FEF3C7] text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#F59E0B]">{draftShipments.length}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Selecting & allocating harvest lots</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned Trips</span>
            <span className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
              <Truck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#17251B]">{assignedShipments.length}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Vehicle & Transporter active</p>
          </div>
        </div>
      </div>

      {/* PHASE 7.1: INCOMING HARVEST LOTS (FARM TO HUB RECEIVING) */}
      <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm p-6 mb-8 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
          <div>
            <h2 className="text-lg font-extrabold text-[#17251B] flex items-center gap-2">
              <span>Incoming Harvest Lots (Farm to Hub Scale Receiving)</span>
              <span className="text-[10px] bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded font-bold uppercase">
                Phase 7.1
              </span>
            </h2>
            <p className="text-xs text-[#647067]">Farmer harvest records awaiting weighbridge scale receiving at partner collection centers.</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase">
            {unreceivedHarvests.length} Pending Lots
          </span>
        </div>

        {unreceivedHarvests.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-[#E2E8E3] rounded-xl p-4 text-xs text-[#647067]">
            <Sprout className="w-8 h-8 text-amber-600 mx-auto mb-2 opacity-50" />
            <p className="font-bold">No Pending Farm Harvests</p>
            <p className="text-[11px] mt-0.5">All recorded farm yields have been received at partner collection hubs or no new harvest has been submitted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unreceivedHarvests.map((contract) => {
              const unit = contract.yield?.unit || "TONNE";
              const recKg = normalizeQuantityToKg(contract.yield?.actualQuantity || 0, unit);
              const recdKg = (contract.harvestReceipts || []).reduce((sum: number, r: any) => sum + normalizeQuantityToKg(r.netWeight, r.unit), 0);
              const remKg = Math.max(0, recKg - recdKg);
              const remQty = convertKgToUnit(remKg, unit);

              return (
                <div key={contract.id} className="p-4 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3] space-y-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-extrabold text-[#166534] text-sm">Contract #{contract.id.substring(0, 8).toUpperCase()}</span>
                      <p className="font-bold text-[#17251B] mt-0.5">{contract.crop?.name}</p>
                      <p className="text-[11px] text-[#647067]">Farmer: <strong>{contract.landowner?.name}</strong> ({contract.landowner?.phone || "N/A"})</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase">
                        Pending: {remQty.toFixed(2)} {unit}
                      </span>
                      <p className="text-[10px] text-[#647067] mt-0.5">Total Farm Yield: {contract.yield?.actualQuantity} {unit}</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => openReceiveModal(contract)}
                      className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Log Hub Scale & Issue Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Section: Available Inspected Receipts Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Shipments Management & Active Console */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#17251B]">Multi-Farmer Shipments</h2>
                <p className="text-xs text-[#647067]">Aggregated vehicle trips combining multiple farmer harvest receipts.</p>
              </div>
              <span className="text-xs font-bold text-[#166534] bg-[#ECFDF3] border border-[#22C55E]/30 px-3 py-1 rounded-full uppercase">
                {shipments.length} Total Trips
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-[#647067]">
                <Loader2 className="w-6 h-6 animate-spin text-[#166534] mx-auto mb-2" />
                <p className="text-xs font-semibold">Loading shipments...</p>
              </div>
            ) : shipments.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-[#E2E8E3] rounded-xl p-6">
                <Package className="w-10 h-10 text-[#166534] mx-auto mb-2 opacity-40" />
                <h4 className="font-bold text-[#17251B]">No Shipments Created</h4>
                <p className="text-xs text-[#647067] mt-1">Click "Create Multi-Farmer Shipment" to start aggregation.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shipments.map((shp) => (
                  <div
                    key={shp.id}
                    className={`p-4 rounded-xl border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      selectedShipment?.id === shp.id
                        ? "bg-[#ECFDF3]/60 border-[#166534] shadow-sm"
                        : "bg-[#F6F8F3] border-[#E2E8E3] hover:border-[#166534]/40"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-[#166534] text-sm">{shp.shipmentCode}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          shp.status === "DRAFT" ? "bg-[#FEF3C7] text-[#F59E0B]" :
                          shp.status === "READY_FOR_DISPATCH" ? "bg-blue-100 text-blue-700" :
                          shp.status === "ASSIGNED" ? "bg-purple-100 text-purple-700" :
                          "bg-[#ECFDF3] text-[#166534]"
                        }`}>
                          {shp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#647067]">
                        Buyer: <strong>{shp.buyer?.name}</strong> | Items: <strong>{shp.items?.length || 0} Lots</strong> | Total Weight: <strong>{shp.totalWeight} {shp.weightUnit}</strong>
                      </p>
                      <p className="text-[11px] text-[#647067]">
                        Destination: <strong>{shp.destinationAddress}</strong>
                      </p>
                      {shp.vehicle && (
                        <p className="text-[11px] text-[#166534] font-bold">
                          Assigned Truck: {shp.vehicle.vehicleNumber} ({shp.vehicle.capacity} {shp.vehicle.capacityUnit})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {shp.status === "DRAFT" && shp.items?.length > 0 && (
                        <button
                          onClick={() => handleMarkReady(shp.id)}
                          className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-[11px]"
                        >
                          Mark Ready for Dispatch
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedShipment(shp)}
                        className="px-3 py-1.5 bg-white border border-[#E2E8E3] hover:bg-[#ECFDF3] text-[#166534] font-bold rounded-lg text-[11px] flex items-center gap-1"
                      >
                        <span>Manage Lots</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipment Management Modal / Detail Card when selected */}
          {selectedShipment && (
            <div className="bg-white rounded-2xl border border-[#166534] shadow-md p-6 space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-[#E2E8E3] pb-3">
                <div>
                  <span className="text-[10px] font-bold bg-[#ECFDF3] text-[#166534] px-2 py-0.5 rounded uppercase">
                    ACTIVE SHIPMENT BUILDER
                  </span>
                  <h3 className="text-xl font-extrabold text-[#17251B] mt-1">
                    Shipment #{selectedShipment.shipmentCode} ({selectedShipment.status})
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedShipment(null)}
                  className="text-xs text-[#647067] font-bold hover:text-[#17251B]"
                >
                  Close Console
                </button>
              </div>

              {/* Add Lot Form for DRAFT shipment */}
              {selectedShipment.status === "DRAFT" && (
                <div className="bg-[#F6F8F3] p-5 rounded-xl border border-[#E2E8E3] space-y-4">
                  <h4 className="font-bold text-xs text-[#17251B] uppercase tracking-wider">
                    Add Inspected Harvest Lot to Shipment
                  </h4>

                  {itemError && (
                    <div className="p-3 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
                      {itemError}
                    </div>
                  )}

                  <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-[#647067] mb-1">Select Inspected Receipt</label>
                      <select
                        required
                        value={selectedReceiptId}
                        onChange={(e) => setSelectedReceiptId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                      >
                        <option value="">-- Choose Verified Lot --</option>
                        {inspectedReceipts.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.receiptNumber} - {r.contract?.crop?.name} ({r.netWeight} {r.unit}) - {r.center?.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-[#647067] mb-1">Shipped Weight</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={shippedWeight}
                          onChange={(e) => setShippedWeight(e.target.value)}
                          placeholder="Qty"
                          className="w-full p-2.5 bg-white border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                        />
                        <select
                          value={shippedUnit}
                          onChange={(e) => setShippedUnit(e.target.value as any)}
                          className="p-2.5 bg-white border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                        >
                          <option value="TONNE">TONNE</option>
                          <option value="KG">KG</option>
                          <option value="QUINTAL">QUINTAL</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        disabled={addingItem}
                        className="px-5 py-2 bg-[#166534] text-white font-bold rounded-xl text-xs shadow-sm hover:bg-[#14532d]"
                      >
                        {addingItem ? "Allocating Lot..." : "Add Lot to Shipment"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Current Items in Shipment */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-[#17251B] uppercase tracking-wider">
                  Allocated Harvest Lots ({selectedShipment.items?.length || 0})
                </h4>

                {selectedShipment.items?.length === 0 ? (
                  <p className="text-xs text-[#647067]">No lots allocated to this shipment yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedShipment.items?.map((item: any) => (
                      <div key={item.id} className="p-3 bg-white border border-[#E2E8E3] rounded-xl text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[#166534]">{item.harvestReceipt?.receiptNumber}</span>
                          <span className="text-[#647067] ml-2">({item.harvestReceipt?.contract?.crop?.name})</span>
                          <p className="text-[11px] text-[#647067] mt-0.5">
                            Hub: {item.collectionCenter?.name} | Farmer: {item.harvestReceipt?.contract?.landowner?.name}
                          </p>
                        </div>
                        <span className="font-extrabold text-[#17251B]">{item.shippedWeight} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicle Assignment Section */}
              {selectedShipment.status === "DRAFT" || selectedShipment.status === "READY_FOR_DISPATCH" ? (
                <div className="bg-[#F6F8F3] p-5 rounded-xl border border-[#E2E8E3] space-y-3">
                  <h4 className="font-bold text-xs text-[#17251B] uppercase tracking-wider">
                    Assign Registered Vehicle & Transporter
                  </h4>

                  {assignError && (
                    <div className="p-3 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
                      {assignError}
                    </div>
                  )}

                  <form onSubmit={handleAssignVehicle} className="flex flex-col sm:flex-row gap-3">
                    <select
                      required
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      className="flex-1 p-3 bg-white border border-[#E2E8E3] rounded-xl font-bold text-xs text-[#17251B]"
                    >
                      <option value="">-- Choose Available Vehicle --</option>
                      {vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.vehicleNumber} ({v.vehicleType} - Cap: {v.capacity} {v.capacityUnit}) - Owner: {v.transporter?.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={assigningVehicle}
                      className="px-5 py-3 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer shrink-0"
                    >
                      {assigningVehicle ? "Assigning..." : "Assign Vehicle"}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Right 1 Col: Inspected Receipts Pool */}
        <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm p-6 space-y-4">
          <div className="border-b border-[#E2E8E3] pb-3 flex justify-between items-center">
            <div>
              <h2 className="text-base font-extrabold text-[#17251B]">Verified Hub Receipts</h2>
              <p className="text-[11px] text-[#647067]">INSPECTED lots eligible for shipment</p>
            </div>
            <span className="text-xs font-bold text-[#166534] bg-[#ECFDF3] px-2.5 py-0.5 rounded">
              {inspectedReceipts.length} Ready
            </span>
          </div>

          {inspectedReceipts.length === 0 ? (
            <p className="text-xs text-[#647067] py-6 text-center">No verified harvest receipts available for dispatch.</p>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {inspectedReceipts.map((rcp) => (
                <div key={rcp.id} className="p-3.5 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3] text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#166534]">{rcp.receiptNumber}</span>
                    <span className="text-[10px] bg-[#ECFDF3] text-[#166534] px-2 py-0.5 rounded uppercase">
                      {rcp.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#647067]">
                    Crop: <strong>{rcp.contract?.crop?.name}</strong> | Scale: <strong>{rcp.netWeight} {rcp.unit}</strong>
                  </p>
                  <p className="text-[11px] text-[#647067]">
                    Hub: <strong>{rcp.center?.name}</strong>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* PHASE 7.1: HARVEST RECEIVING MODAL (HUB SCALE LOGGING) */}
      {receivingContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-md w-full my-8 animate-in slide-in-from-bottom-4 duration-300 relative text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold bg-[#ECFDF3] text-[#166534] px-2 py-0.5 rounded uppercase">
                  PHASE 7.1 WEIGHBRIDGE SCALE
                </span>
                <h3 className="text-lg font-extrabold text-[#17251B] mt-1">
                  Receive Harvest Lot at Collection Hub
                </h3>
              </div>
              <button onClick={() => setReceivingContract(null)} className="text-[#647067] font-bold">✕</button>
            </div>

            {receiveError && (
              <div className="mb-4 p-3 bg-[#FEE2E2] text-[#DC2626] rounded-xl font-semibold">
                {receiveError}
              </div>
            )}

            <div className="p-3.5 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3] mb-4 space-y-1 text-[11px]">
              <div>Farmer: <strong className="text-[#17251B]">{receivingContract.landowner?.name}</strong> ({receivingContract.landowner?.phone || "N/A"})</div>
              <div>Crop: <strong className="text-[#17251B]">{receivingContract.crop?.name}</strong></div>
              <div>Farm Logged Harvest: <strong className="text-[#166534]">{receivingContract.yield?.actualQuantity} {receivingContract.yield?.unit || "Tonnes"}</strong></div>
            </div>

            <form onSubmit={handleReceiveHarvestSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-[#17251B] mb-1">Select Collection Hub</label>
                <select
                  required
                  value={selectedCenterId}
                  onChange={(e) => setSelectedCenterId(e.target.value)}
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                >
                  <option value="">-- Choose Active Collection Center --</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.district}, {c.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17251B] mb-1">Gross Scale Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(e.target.value)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] mb-1">Tare Scale Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={tareWeight}
                    onChange={(e) => setTareWeight(e.target.value)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-[#ECFDF3] rounded-xl border border-[#22C55E]/30 font-bold text-[#166534]">
                <span>Calculated Net Scale Weight:</span>
                <span>
                  {parseFloat(grossWeight) > parseFloat(tareWeight)
                    ? `${(parseFloat(grossWeight) - parseFloat(tareWeight)).toFixed(2)} ${receiveUnit}`
                    : "0.00"}
                </span>
              </div>

              <div>
                <label className="block font-bold text-[#17251B] mb-1">Scale Weight Unit</label>
                <select
                  value={receiveUnit}
                  onChange={(e) => setReceiveUnit(e.target.value as any)}
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                >
                  <option value="TONNE">TONNE</option>
                  <option value="KG">KG</option>
                  <option value="QUINTAL">QUINTAL</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8E3]">
                <button
                  type="button"
                  onClick={() => setReceivingContract(null)}
                  className="px-4 py-2 border border-[#E2E8E3] text-[#647067] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReceive}
                  className="px-6 py-2.5 bg-[#166534] text-white font-bold rounded-xl shadow-sm hover:bg-[#14532d]"
                >
                  {submittingReceive ? "Issuing Receipt..." : "Issue Harvest Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SHIPMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-lg w-full my-8 animate-in slide-in-from-bottom-4 duration-300 relative text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3 mb-4">
              <h3 className="text-lg font-extrabold text-[#17251B]">Create Multi-Farmer Shipment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#647067] font-bold">✕</button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-[#FEE2E2] text-[#DC2626] rounded-xl font-semibold">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block font-bold text-[#17251B] mb-1">Target Buyer User ID</label>
                <input
                  type="text"
                  required
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  placeholder="Enter Buyer User ID (e.g. buyer_id_123)"
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B] outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17251B] mb-1">Destination Address</label>
                <input
                  type="text"
                  required
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#17251B] mb-1">Destination Lat</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={destLat}
                    onChange={(e) => setDestLat(e.target.value)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] mb-1">Destination Lng</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={destLng}
                    onChange={(e) => setDestLng(e.target.value)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17251B] mb-1">Scheduled Pickup Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8E3]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-[#E2E8E3] text-[#647067] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingShipment}
                  className="px-6 py-2.5 bg-[#166534] text-white font-bold rounded-xl shadow-sm hover:bg-[#14532d]"
                >
                  {creatingShipment ? "Creating..." : "Create DRAFT Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
