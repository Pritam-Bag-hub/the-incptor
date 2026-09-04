"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Loader2,
  RefreshCw,
  MapPin,
  Camera,
  Layers,
  Scale,
  Clock,
  ChevronRight,
  Info
} from "lucide-react";

interface PendingReceipt {
  id: string;
  receiptNumber: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  unit: string;
  status: string;
  receivedAt: string;
  notes: string | null;
  center: {
    id: string;
    name: string;
    village: string;
    district: string;
  };
  contract: {
    id: string;
    crop?: { name: string };
    landowner?: { name: string; phone: string };
    buyer?: { name: string; phone: string };
  };
  inspections?: any[];
}

export default function InspectorDashboard() {
  const [receipts, setReceipts] = useState<PendingReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Inspection Modal States
  const [selectedReceipt, setSelectedReceipt] = useState<PendingReceipt | null>(null);
  const [acceptedWeight, setAcceptedWeight] = useState("");
  const [rejectedWeight, setRejectedWeight] = useState("0");
  const [grade, setGrade] = useState<"GRADE_A" | "GRADE_B" | "GRADE_C" | "REJECTED">("GRADE_A");
  const [status, setStatus] = useState<"PASSED" | "PASSED_WITH_FLAGS" | "REJECTED">("PASSED");
  const [moistureContent, setMoistureContent] = useState("");
  const [foreignMatter, setForeignMatter] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [gpsLat, setGpsLat] = useState("30.7333");
  const [gpsLng, setGpsLng] = useState("76.7794");
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const fetchPendingReceipts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inspections");
      if (!res.ok) {
        throw new Error("Failed to load inspection tasks.");
      }
      const data = await res.json();
      setReceipts(data);
    } catch (err: any) {
      setError(err.message || "Error loading receipts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingReceipts();
  }, []);

  const openInspectionModal = (receipt: PendingReceipt) => {
    setSelectedReceipt(receipt);
    setAcceptedWeight(receipt.netWeight.toString());
    setRejectedWeight("0");
    setGrade("GRADE_A");
    setStatus("PASSED");
    setMoistureContent("");
    setForeignMatter("");
    setFlagReason("");
    setPhotoUrl("");
    setFormError("");
    setFormSuccess("");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceipt) return;

    setSubmitting(true);
    setFormError("");
    setFormSuccess("");

    try {
      const accNum = parseFloat(acceptedWeight);
      const rejNum = parseFloat(rejectedWeight);

      if (isNaN(accNum) || accNum < 0) {
        throw new Error("Accepted weight must be a non-negative number.");
      }
      if (isNaN(rejNum) || rejNum < 0) {
        throw new Error("Rejected weight must be a non-negative number.");
      }
      if (accNum + rejNum > selectedReceipt.netWeight + 0.001) {
        throw new Error(`Accepted (${accNum}) + Rejected (${rejNum}) weight cannot exceed receipt net weight (${selectedReceipt.netWeight}).`);
      }

      if ((status === "PASSED_WITH_FLAGS" || status === "REJECTED") && !flagReason.trim()) {
        throw new Error("Flag reason is required when marking status as Passed with Flags or Rejected.");
      }

      const body = {
        receiptId: selectedReceipt.id,
        acceptedWeight: accNum,
        rejectedWeight: rejNum,
        unit: selectedReceipt.unit,
        grade,
        status,
        moistureContent: moistureContent ? parseFloat(moistureContent) : null,
        foreignMatterPercentage: foreignMatter ? parseFloat(foreignMatter) : null,
        flagReason: flagReason ? flagReason.trim() : null,
        samplePhotoUrlsJson: photoUrl ? JSON.stringify([photoUrl.trim()]) : null,
        inspectorGpsLat: gpsLat ? parseFloat(gpsLat) : null,
        inspectorGpsLng: gpsLng ? parseFloat(gpsLng) : null,
      };

      const res = await fetch("/api/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit quality inspection.");
      }

      setFormSuccess("Human inspection record created successfully!");
      setTimeout(() => {
        setSelectedReceipt(null);
        fetchPendingReceipts();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "An error occurred during submission.");
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculations
  const pendingCount = receipts.filter((r) => r.status === "RECEIVED").length;
  const inspectedCount = receipts.filter((r) => r.status === "INSPECTED").length;
  const passedCount = receipts.filter((r) => r.inspections && r.inspections.some((i) => i.status === "PASSED")).length;
  const flaggedCount = receipts.filter((r) => r.inspections && r.inspections.some((i) => i.status === "PASSED_WITH_FLAGS" || i.status === "REJECTED")).length;

  return (
    <div className="min-h-screen w-full bg-[#F6F8F3] px-4 sm:px-6 lg:px-8 xl:px-10 py-8 text-[#17251B] font-sans">
      
      {/* Console Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#ECFDF3] border border-[#22C55E]/30 rounded-xl text-[#166534]">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17251B] tracking-tight">
              Quality Inspection & Verification Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#647067] mt-1 font-semibold">
            Human-in-the-Loop Quality Verification System — Grade produce lots, measure moisture %, log scale weights, and issue quality flags.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPendingReceipts}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-[#ECFDF3] border border-[#E2E8E3] text-[#166534] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Tasks
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Tasks</span>
            <span className="p-2 bg-[#FEF3C7] text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#F59E0B]">{pendingCount}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Hub receipts awaiting physical check</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Total Inspected</span>
            <span className="p-2 bg-[#ECFDF3] text-[#166534] rounded-xl border border-[#22C55E]/30">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#17251B]">{inspectedCount}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Lots fully evaluated</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Passed Lots</span>
            <span className="p-2 bg-[#ECFDF3] text-[#166534] rounded-xl border border-[#22C55E]/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#166534]">{passedCount}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Clean Grade A/B verification</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#647067]">
            <span className="text-xs font-bold uppercase tracking-wider">Flagged / Rejected</span>
            <span className="p-2 bg-[#FEE2E2] text-[#DC2626] rounded-xl border border-[#DC2626]/30">
              <AlertTriangle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-[#DC2626]">{flaggedCount}</div>
            <p className="text-xs text-[#647067] mt-1 font-semibold">Quality alerts & rejections</p>
          </div>
        </div>
      </div>

      {/* Main Inspection Tasks Directory */}
      <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-[#17251B]">Collection Receipts Directory</h2>
            <p className="text-xs text-[#647067] mt-0.5">Select a received harvest lot to conduct physical inspection.</p>
          </div>
          <span className="text-xs text-[#166534] font-bold bg-[#ECFDF3] border border-[#22C55E]/30 px-3 py-1 rounded-full uppercase">
            Human Inspection Engine
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#647067]">
            <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
            <p className="text-xs font-semibold">Fetching collection receipts...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
            {error}
          </div>
        ) : receipts.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-[#E2E8E3] rounded-2xl p-6">
            <FileText className="w-12 h-12 text-[#166534] mx-auto mb-2 opacity-40" />
            <h4 className="font-bold text-[#17251B] text-base">No Receipts Available</h4>
            <p className="text-xs text-[#647067] mt-1">Receive produce at collection centre hubs first.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {receipts.map((rcp) => {
              const latestInspection = rcp.inspections && rcp.inspections.length > 0 ? rcp.inspections[0] : null;
              return (
                <div
                  key={rcp.id}
                  className="p-5 bg-[#F6F8F3] rounded-2xl border border-[#E2E8E3] hover:border-[#22C55E]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base text-[#166534]">{rcp.receiptNumber}</span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rcp.status === "INSPECTED" ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30" :
                        rcp.status === "REJECTED" ? "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30" :
                        "bg-[#FEF3C7] text-[#F59E0B] border border-[#F59E0B]/30"
                      }`}>
                        {rcp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-[#647067]">
                      <div>Crop: <strong className="text-[#17251B]">{rcp.contract?.crop?.name || "Crop"}</strong></div>
                      <div>Hub: <strong className="text-[#17251B]">{rcp.center?.name} ({rcp.center?.district})</strong></div>
                      <div>Scale Net: <strong className="text-[#166534]">{rcp.netWeight} {rcp.unit}</strong></div>
                      <div>Received: <strong className="text-[#17251B]">{new Date(rcp.receivedAt).toLocaleDateString()}</strong></div>
                    </div>

                    {latestInspection && (
                      <div className="p-3 bg-white rounded-xl border border-[#E2E8E3] space-y-1">
                        <div className="flex justify-between items-center text-[11px] font-bold">
                          <span className="text-[#166534]">
                            Verified Grade: {latestInspection.grade} ({latestInspection.status})
                          </span>
                          <span className="text-[#647067]">
                            Accepted: {latestInspection.acceptedWeight} {latestInspection.unit} | Rejected: {latestInspection.rejectedWeight} {latestInspection.unit}
                          </span>
                        </div>
                        {latestInspection.flagReason && (
                          <p className="text-[11px] text-[#DC2626] font-semibold">
                            Flag Reason: "{latestInspection.flagReason}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    <button
                      onClick={() => openInspectionModal(rcp)}
                      className="px-4 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{latestInspection ? "Re-Inspect / Audit" : "Conduct Physical Inspection"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANUAL PHYSICAL INSPECTION FORM MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-2xl w-full my-8 animate-in slide-in-from-bottom-4 duration-300 relative text-xs">
            
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4 mb-6">
              <div>
                <span className="text-[10px] bg-[#ECFDF3] text-[#166534] font-bold px-2 py-0.5 rounded uppercase border border-[#22C55E]/30">
                  HUMAN VERIFICATION FORM
                </span>
                <h3 className="text-xl font-extrabold text-[#17251B] mt-1">
                  Physical Quality Evaluation: {selectedReceipt.receiptNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 rounded-full hover:bg-[#F6F8F3] text-[#647067]"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 p-3 bg-[#ECFDF3] border border-[#22C55E]/30 text-[#166534] rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="bg-[#F6F8F3] p-4 rounded-xl border border-[#E2E8E3] mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>Hub: <strong className="text-[#17251B] block">{selectedReceipt.center?.name}</strong></div>
              <div>Crop: <strong className="text-[#17251B] block">{selectedReceipt.contract?.crop?.name}</strong></div>
              <div>Scale Net Weight: <strong className="text-[#166534] block">{selectedReceipt.netWeight} {selectedReceipt.unit}</strong></div>
              <div>Farmer: <strong className="text-[#17251B] block">{selectedReceipt.contract?.landowner?.name || "Landowner"}</strong></div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              
              {/* Weights Evaluation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Accepted Weight ({selectedReceipt.unit})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={acceptedWeight}
                    onChange={(e) => setAcceptedWeight(e.target.value)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B] outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Rejected Weight ({selectedReceipt.unit})</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={rejectedWeight}
                    onChange={(e) => setRejectedWeight(e.target.value)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B] outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              {/* Grade & Status Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Quality Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B] outline-none focus:border-[#166534]"
                  >
                    <option value="GRADE_A">Grade A (Premium Quality)</option>
                    <option value="GRADE_B">Grade B (Standard Commercial)</option>
                    <option value="GRADE_C">Grade C (Sub-Standard)</option>
                    <option value="REJECTED">Rejected (Failed Standards)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Evaluation Decision</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-bold text-[#17251B] outline-none focus:border-[#166534]"
                  >
                    <option value="PASSED">Passed (Clean Verification)</option>
                    <option value="PASSED_WITH_FLAGS">Passed With Quality Flags</option>
                    <option value="REJECTED">Rejected Lot</option>
                  </select>
                </div>
              </div>

              {/* Physical Parameters: Moisture & Foreign Matter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Moisture Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moistureContent}
                    onChange={(e) => setMoistureContent(e.target.value)}
                    placeholder="e.g. 12.5"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-semibold text-[#17251B] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Foreign Matter / Inert Content (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={foreignMatter}
                    onChange={(e) => setForeignMatter(e.target.value)}
                    placeholder="e.g. 1.2"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl font-semibold text-[#17251B] outline-none"
                  />
                </div>
              </div>

              {/* Quality Flag Reason */}
              {(status === "PASSED_WITH_FLAGS" || status === "REJECTED") && (
                <div>
                  <label className="block font-bold text-[#DC2626] uppercase tracking-wider mb-1">
                    Quality Flag / Rejection Reason (Required)
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Describe discolouration, insect infestation, weight mismatch, excess moisture..."
                    className="w-full p-3 bg-[#FEE2E2]/40 border border-[#DC2626]/40 rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#DC2626]"
                  />
                </div>
              )}

              {/* Photo Evidence & GPS Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Photo Evidence URL</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://.../sample_produce_evidence.jpg"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Inspector GPS</label>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="number"
                      step="any"
                      value={gpsLat}
                      onChange={(e) => setGpsLat(e.target.value)}
                      placeholder="Lat"
                      className="p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[10px] font-bold"
                    />
                    <input
                      type="number"
                      step="any"
                      value={gpsLng}
                      onChange={(e) => setGpsLng(e.target.value)}
                      placeholder="Lng"
                      className="p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[10px] font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8E3]">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 border border-[#E2E8E3] text-[#647067] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl shadow-sm cursor-pointer transition-all"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Human Inspection Record"}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
