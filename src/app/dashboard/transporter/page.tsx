"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  RefreshCw,
  Navigation,
  Package,
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

export default function TransporterDashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchAssignedTrips = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/shipments");
      if (!res.ok) {
        throw new Error("Failed to fetch assigned shipment trips.");
      }
      const data = await res.json();
      setShipments(data);
    } catch (err: any) {
      setError(err.message || "Error loading trips.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignedTrips();
  }, []);

  const handleUpdateStatus = async (shipmentId: string, nextStatus: string) => {
    setUpdatingId(shipmentId);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to update trip status.");
        return;
      }

      fetchAssignedTrips();
    } catch (err: any) {
      alert("An error occurred updating trip status.");
    } finally {
      setUpdatingId(null);
    }
  };

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
              Transporter Fleet Trip Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#647067] mt-1 font-semibold">
            Vehicle Dispatch & Route Status — View assigned multi-stop trips, hub pickup sequences, and update transit progress.
          </p>
        </div>

        <button
          onClick={fetchAssignedTrips}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#ECFDF3] border border-[#E2E8E3] text-[#166534] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Trips
        </button>
      </div>

      {/* Main Assigned Trips Container */}
      <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#17251B]">Assigned Transport Trips</h2>
            <p className="text-xs text-[#647067] mt-0.5">Active trips assigned to your fleet vehicles.</p>
          </div>
          <span className="text-xs font-bold text-[#166534] bg-[#ECFDF3] border border-[#22C55E]/30 px-3 py-1 rounded-full uppercase">
            {shipments.length} Active Trips
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#647067]">
            <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
            <p className="text-xs font-semibold">Fetching assigned trips...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
            {error}
          </div>
        ) : shipments.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#E2E8E3] rounded-2xl p-6">
            <Truck className="w-12 h-12 text-[#166534] mx-auto mb-2 opacity-40" />
            <h4 className="font-bold text-[#17251B] text-base">No Assigned Trips Found</h4>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Center managers will assign available vehicles to multi-farmer trips.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {shipments.map((shp) => (
              <div
                key={shp.id}
                className="p-6 bg-[#F6F8F3] rounded-2xl border border-[#E2E8E3] hover:border-[#166534]/40 transition-all text-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E3] pb-3">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-lg text-[#166534]">{shp.shipmentCode}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        shp.status === "ASSIGNED" ? "bg-purple-100 text-purple-700 border border-purple-200" :
                        shp.status === "IN_TRANSIT" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                        shp.status === "ARRIVED_AT_DESTINATION" ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30" :
                        "bg-[#FEF3C7] text-[#F59E0B]"
                      }`}>
                        {shp.status}
                      </span>
                    </div>
                    <p className="text-[#647067] text-[11px] mt-1 font-semibold">
                      Target Buyer: <strong className="text-[#17251B]">{shp.buyer?.name}</strong> ({shp.buyer?.phone || "N/A"})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {shp.status === "ASSIGNED" && (
                      <button
                        disabled={updatingId === shp.id}
                        onClick={() => handleUpdateStatus(shp.id, "IN_TRANSIT")}
                        className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {updatingId === shp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        <span>Start Trip (IN TRANSIT)</span>
                      </button>
                    )}

                    {shp.status === "IN_TRANSIT" && (
                      <button
                        disabled={updatingId === shp.id}
                        onClick={() => handleUpdateStatus(shp.id, "ARRIVED_AT_DESTINATION")}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        {updatingId === shp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        <span>Mark Arrived at Buyer Destination</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Trip Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-medium bg-white p-4 rounded-xl border border-[#E2E8E3]">
                  <div>
                    <span className="text-[#647067] block text-[10px] font-bold uppercase">Assigned Truck</span>
                    <span className="font-extrabold text-[#17251B]">
                      {shp.vehicle ? `${shp.vehicle.vehicleNumber} (${shp.vehicle.vehicleType})` : "Vehicle Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#647067] block text-[10px] font-bold uppercase">Total Trip Payload</span>
                    <span className="font-extrabold text-[#166534]">{shp.totalWeight} {shp.weightUnit}</span>
                  </div>
                  <div>
                    <span className="text-[#647067] block text-[10px] font-bold uppercase">Destination Address</span>
                    <span className="font-extrabold text-[#17251B]">{shp.destinationAddress}</span>
                  </div>
                </div>

                {/* Pickup Sequence Stops */}
                {shp.items && shp.items.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-bold text-xs text-[#17251B] block">Multi-Stop Hub Pickups ({shp.items.length})</span>
                    <div className="space-y-2">
                      {shp.items.map((item: any, idx: number) => (
                        <div key={item.id} className="p-3 bg-white rounded-xl border border-[#E2E8E3] flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#166534] text-white flex items-center justify-center font-bold text-[11px]">
                              {idx + 1}
                            </span>
                            <div>
                              <strong className="text-[#17251B]">{item.collectionCenter?.name}</strong>
                              <p className="text-[11px] text-[#647067]">
                                Receipt #{item.harvestReceipt?.receiptNumber} ({item.harvestReceipt?.contract?.crop?.name})
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-[#166534]">{item.shippedWeight} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
