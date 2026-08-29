"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Users,
  Droplets,
  Thermometer,
  UserCircle2,
  Bell,
  MapPin,
  Plus,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Compass,
  ArrowLeft,
  Calendar,
  Layers,
  Sprout,
  DollarSign,
  X,
  Check,
  AlertTriangle
} from "lucide-react";

type Tab = "overview" | "lands" | "crops" | "contract-requests";

interface Land {
  id: string;
  name: string;
  size: number;
  unit: "ACRE" | "HECTARE";
  address: string;
  village: string;
  district: string;
  state: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
  status: "AVAILABLE" | "UNAVAILABLE" | "UNDER_CONTRACT";
  description: string | null;
}

interface CropCategory {
  id: string;
  name: string;
  description: string | null;
}

interface Crop {
  id: string;
  name: string;
  categoryId: string;
  durationDays: number;
  description: string | null;
  metadataJson: string | null;
  category?: CropCategory;
}

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Lands management states
  const [lands, setLands] = useState<Land[]>([]);
  const [loadingLands, setLoadingLands] = useState(false);
  const [errorLands, setErrorLands] = useState("");
  
  // Land form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingLand, setEditingLand] = useState<Land | null>(null);
  
  const [formName, setFormName] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formUnit, setFormUnit] = useState<"ACRE" | "HECTARE">("ACRE");
  const [formAddress, setFormAddress] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formState, setFormState] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formDesc, setFormDesc] = useState("");
  
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Crops states
  const [categories, setCategories] = useState<CropCategory[]>([]);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CropCategory | null>(null);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);

  // Incoming contracts state variables
  const [incomingContracts, setIncomingContracts] = useState<any[]>([]);
  const [loadingIncoming, setLoadingIncoming] = useState(false);
  const [showAcceptConfirmId, setShowAcceptConfirmId] = useState<string | null>(null);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<any | null>(null);
  const [loadingViewingContract, setLoadingViewingContract] = useState(false);
  const [viewingContractOverview, setViewingContractOverview] = useState<any | null>(null);
  const [viewingContractMilestones, setViewingContractMilestones] = useState<any[]>([]);
  const [viewingContractTasks, setViewingContractTasks] = useState<any[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [milestonesLoadError, setMilestonesLoadError] = useState("");
  const [tasksLoadError, setTasksLoadError] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<"Overview" | "Financials" | "Yield" | "Milestones" | "Tasks" | "Progress" | "Monitoring">("Overview");
  // Harvest quantity submission states
  const [actualHarvestQty, setActualHarvestQty] = useState("");
  const [savingHarvest, setSavingHarvest] = useState(false);
  const [harvestError, setHarvestError] = useState("");
  const [showProgressModalContract, setShowProgressModalContract] = useState<any | null>(null);
  const [progressStage, setProgressStage] = useState("LAND_PREPARATION");
  const [progressNotes, setProgressNotes] = useState("");
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [rejectingContractId, setRejectingContractId] = useState<string | null>(null);
  const [rejectionText, setRejectionText] = useState("");

  // Phase 1 Static Worker data preserved
  const workers = [
    {
      id: "W-01",
      name: "Babu Rao",
      task: "Fertilizer Application",
      status: "In Field",
      timeLogged: "4h 30m",
      fieldDone: "45%",
    },
    {
      id: "W-02",
      name: "Lakshmi Devi",
      task: "Weed Control",
      status: "Break",
      timeLogged: "3h 15m",
      fieldDone: "30%",
    },
    {
      id: "W-03",
      name: "Ram Kumar",
      task: "Soil Testing",
      status: "Completed",
      timeLogged: "6h 00m",
      fieldDone: "100%",
    },
  ];

  const fetchIncomingContracts = async () => {
    setLoadingIncoming(true);
    try {
      const res = await fetch("/api/landowner/contracts");
      if (res.ok) {
        const data = await res.json();
        setIncomingContracts(data);
      }
    } catch (err) {
      console.error("Error fetching incoming contracts:", err);
    } finally {
      setLoadingIncoming(false);
    }
  };

  const handleAcceptContract = async (contractId: string) => {
    try {
      const res = await fetch(`/api/landowner/contracts/${contractId}/accept`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept contract proposal.");
      }
      setShowAcceptConfirmId(null);
      fetchIncomingContracts();
    } catch (err: any) {
      alert(err.message || "Could not accept contract proposal.");
    }
  };

  const handleRejectContract = (contractId: string) => {
    setRejectingContractId(contractId);
    setRejectionText("");
  };

  const handleConfirmReject = async () => {
    if (!rejectingContractId || !rejectionText.trim()) return;
    try {
      const res = await fetch(`/api/landowner/contracts/${rejectingContractId}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: rejectionText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject contract proposal.");
      }
      setRejectingContractId(null);
      setRejectionText("");
      fetchIncomingContracts();
    } catch (err: any) {
      alert(err.message || "Could not reject contract proposal.");
    }
  };

  const handleCompleteContract = async (contractId: string) => {
    const confirmComplete = confirm("Are you sure you want to complete this contract? This will release the land parcel back to AVAILABLE status.");
    if (!confirmComplete) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/complete`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete contract.");
      }
      fetchIncomingContracts();
    } catch (err: any) {
      alert(err.message || "Could not complete contract.");
    }
  };

  const handlePostProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProgressModalContract) return;
    setSubmittingProgress(true);
    try {
      const res = await fetch(`/api/contracts/${showProgressModalContract.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: progressStage,
          notes: progressNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to post progress update.");
      }
      setShowProgressModalContract(null);
      setProgressStage("LAND_PREPARATION");
      setProgressNotes("");
      fetchIncomingContracts();
      if (viewingContractId === showProgressModalContract.id) {
        fetchContractDetails(showProgressModalContract.id);
      }
    } catch (err: any) {
      alert(err.message || "Could not post progress update.");
    } finally {
      setSubmittingProgress(false);
    }
  };



  const fetchContractDetails = async (contractId: string) => {
    setLoadingViewingContract(true);
    setViewingContractOverview(null);
    setViewingContractMilestones([]);
    setViewingContractTasks([]);
    setMilestonesLoadError("");
    setTasksLoadError("");
    setLoadingMilestones(true);
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`);
      const overviewRes = await fetch(`/api/contracts/${contractId}/overview`);
      if (res.ok) {
        const data = await res.json();
        setViewingContract(data);
        
        let overviewData = null;
        if (overviewRes.ok) {
          overviewData = await overviewRes.json();
          setViewingContractOverview(overviewData);
          setActualHarvestQty(overviewData.yieldSummary?.actualQuantity !== null ? overviewData.yieldSummary.actualQuantity.toString() : "");
        } else {
          setActualHarvestQty("");
        }

        // Fetch milestones
        try {
          const mRes = await fetch(`/api/contracts/${contractId}/milestones`);
          if (mRes.ok) {
            setViewingContractMilestones(await mRes.json());
          } else {
            const err = await mRes.json();
            setMilestonesLoadError(err.error || "Failed to load crop milestones.");
          }
        } catch (e: any) {
          setMilestonesLoadError(e.message || "Failed to fetch milestones.");
        } finally {
          setLoadingMilestones(false);
        }

        // Fetch tasks
        try {
          const tRes = await fetch(`/api/contracts/${contractId}/tasks`);
          if (tRes.ok) {
            setViewingContractTasks(await tRes.json());
          } else {
            const err = await tRes.json();
            setTasksLoadError(err.error || "Failed to load crop tasks.");
          }
        } catch (e: any) {
          setTasksLoadError(e.message || "Failed to fetch tasks.");
        } finally {
          setLoadingTasks(false);
        }
      }
    } catch (err) {
      console.error("Error fetching contract details:", err);
    } finally {
      setLoadingViewingContract(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!viewingContract) return;
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/contracts/${viewingContract.id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update task status.");
      }
      await fetchContractDetails(viewingContract.id);
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleSaveHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingContract) return;
    setSavingHarvest(true);
    setHarvestError("");
    try {
      const qty = parseFloat(actualHarvestQty);
      if (isNaN(qty) || qty < 0) {
        throw new Error("Harvest quantity must be a non-negative number.");
      }

      const res = await fetch(`/api/contracts/${viewingContract.id}/yield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualQuantity: qty }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit yield quantity.");
      }

      await fetchContractDetails(viewingContract.id);
      alert("Harvest quantity recorded successfully!");
    } catch (err: any) {
      setHarvestError(err.message || "An error occurred.");
    } finally {
      setSavingHarvest(false);
    }
  };

  useEffect(() => {
    if (viewingContractId) {
      setActiveDetailTab("Overview");
      fetchContractDetails(viewingContractId);
    } else {
      setViewingContract(null);
    }
  }, [viewingContractId]);

  // Fetch lands, categories and contracts
  useEffect(() => {
    if (activeTab === "lands") {
      fetchLands();
    } else if (activeTab === "crops") {
      fetchCategories();
    } else if (activeTab === "contract-requests") {
      fetchIncomingContracts();
    }
  }, [activeTab]);

  const fetchLands = async () => {
    setLoadingLands(true);
    setErrorLands("");
    try {
      const res = await fetch("/api/lands");
      if (!res.ok) throw new Error("Failed to load lands");
      const data = await res.json();
      setLands(data);
    } catch (err: any) {
      setErrorLands(err.message || "Could not retrieve land parcels.");
    } finally {
      setLoadingLands(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCrops(true);
    try {
      const res = await fetch("/api/crops/categories");
      if (!res.ok) throw new Error("Failed to load crop categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCrops(false);
    }
  };

  const fetchCropsByCategory = async (categoryName: string) => {
    setLoadingCrops(true);
    setSelectedCrop(null);
    try {
      const res = await fetch(`/api/crops?category=${encodeURIComponent(categoryName)}`);
      if (!res.ok) throw new Error("Failed to load crops");
      const data = await res.json();
      setCrops(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCrops(false);
    }
  };

  // Reset form states
  const resetForm = () => {
    setFormName("");
    setFormSize("");
    setFormUnit("ACRE");
    setFormAddress("");
    setFormVillage("");
    setFormDistrict("");
    setFormState("");
    setFormPincode("");
    setFormLat("");
    setFormLng("");
    setFormDesc("");
    setFormError("");
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAdding(true);
    setEditingLand(null);
  };

  const handleOpenEdit = (land: Land) => {
    setEditingLand(land);
    setFormName(land.name);
    setFormSize(land.size.toString());
    setFormUnit(land.unit);
    setFormAddress(land.address);
    setFormVillage(land.village);
    setFormDistrict(land.district);
    setFormState(land.state);
    setFormPincode(land.pincode || "");
    setFormLat(land.latitude.toString());
    setFormLng(land.longitude.toString());
    setFormDesc(land.description || "");
    setFormError("");
    setIsAdding(true);
  };

  const handleSaveLand = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSaving(true);

    const payload = {
      name: formName,
      size: formSize,
      unit: formUnit,
      address: formAddress,
      village: formVillage,
      district: formDistrict,
      state: formState,
      pincode: formPincode || null,
      latitude: formLat,
      longitude: formLng,
      description: formDesc || null,
    };

    try {
      const url = editingLand ? `/api/lands/${editingLand.id}` : "/api/lands";
      const method = editingLand ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save land information.");
      }

      setIsAdding(false);
      setEditingLand(null);
      resetForm();
      fetchLands();
    } catch (err: any) {
      setFormError(err.message || "An error occurred while saving.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleStatus = async (land: Land) => {
    if (land.status === "UNDER_CONTRACT") return;

    const newStatus = land.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    
    try {
      const res = await fetch(`/api/lands/${land.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status.");
      }

      // Update local state directly
      setLands(lands.map(l => l.id === land.id ? { ...l, status: newStatus as any } : l));
    } catch (err: any) {
      alert(err.message || "Could not toggle availability.");
    }
  };

  // Helper to extract metadata
  const getCropMetadata = (crop: Crop) => {
    if (!crop.metadataJson) return null;
    try {
      return JSON.parse(crop.metadataJson);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Tab Navigation header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brandy/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold">Farmer / Landowner Dashboard</h1>
          <p className="text-kombu/70 mt-2">
            Manage your land parcels, browse contract crops, and track workers.
          </p>
        </div>
        <div className="flex bg-brandy/10 p-1.5 rounded-xl border border-brandy/20 select-none">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("lands")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "lands"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            My Lands
          </button>
          <button
            onClick={() => setActiveTab("crops")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "crops"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            Browse Crops
          </button>
          <button
            onClick={() => setActiveTab("contract-requests")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "contract-requests"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            Contract Requests
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB (Pre-existing design) */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Alerts Section */}
          <div className="bg-copper/10 border border-copper/30 rounded-2xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Bell className="w-32 h-32 text-copper -mt-8 -mr-8" />
            </div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="bg-copper/20 p-3 rounded-full text-copper shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-block px-2 py-1 bg-copper/20 text-copper text-xs font-bold rounded-md uppercase tracking-wide mb-2">
                  Job Alert
                </div>
                <h3 className="text-xl font-bold text-pine flex items-center gap-2 mb-1">
                  Field Vacancies Detected
                </h3>
                <p className="text-kombu/80">
                  There is a shortage of labor for <strong>Soil Preparation & Tilling</strong> in <strong>Block B, Field 102</strong>. You need at least 2 more workers to meet the upcoming milestone deadline.
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <button className="px-5 py-2.5 bg-copper text-white text-sm font-bold rounded-xl hover:bg-copper/90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
                    Broadcast Vacancy to Workers
                  </button>
                  <button className="px-5 py-2.5 bg-white border border-brandy/50 text-pine text-sm font-bold rounded-xl hover:bg-brandy/20 transition-all">
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics & Status Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-pine">Crop Health</h3>
                <Activity className="w-5 h-5 text-dingley" />
              </div>
              <p className="text-3xl font-bold text-dingley">89%</p>
              <p className="text-sm text-kombu/70 mt-1">Excellent condition</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-pine">Market Status</h3>
                <Activity className="w-5 h-5 text-kombu" />
              </div>
              <p className="text-3xl font-bold text-kombu">High</p>
              <p className="text-sm text-kombu/70 mt-1">Demand is peaking</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-pine">Soil Moisture</h3>
                <Droplets className="w-5 h-5 text-dingley" />
              </div>
              <p className="text-3xl font-bold text-pine">42%</p>
              <p className="text-sm text-kombu/70 mt-1">Optimal range</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-pine">Weather Risk</h3>
                <Thermometer className="w-5 h-5 text-copper" />
              </div>
              <p className="text-3xl font-bold text-copper">Low</p>
              <p className="text-sm text-kombu/70 mt-1">Clear skies expected</p>
            </div>
          </div>

          {/* Workers Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-dingley" /> Active Workers
            </h2>
            <div className="overflow-x-auto bg-white rounded-2xl border border-brandy/40 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-brandy/40 bg-brandy/10">
                    <th className="p-4 font-semibold text-kombu/80">Worker Name</th>
                    <th className="p-4 font-semibold text-kombu/80">Current Task</th>
                    <th className="p-4 font-semibold text-kombu/80">Working Time</th>
                    <th className="p-4 font-semibold text-kombu/80">Field Done</th>
                    <th className="p-4 font-semibold text-kombu/80">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr key={worker.id} className="border-b border-brandy/20 last:border-0 hover:bg-brandy/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <UserCircle2 className="w-8 h-8 text-kombu/40" />
                          <span className="font-medium">{worker.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-kombu/90">{worker.task}</td>
                      <td className="p-4 font-mono text-sm">{worker.timeLogged}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-brandy/30 rounded-full h-2 max-w-[100px]">
                            <div
                              className="bg-dingley h-2 rounded-full"
                              style={{ width: worker.fieldDone }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">{worker.fieldDone}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          worker.status === "In Field" ? "bg-dingley/20 text-dingley" :
                          worker.status === "Break" ? "bg-copper/20 text-copper" :
                          "bg-kombu/20 text-kombu"
                        }`}>
                          {worker.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. MY LANDS TAB */}
      {activeTab === "lands" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!isAdding ? (
            <>
              {/* Lands List Control Bar */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2 text-pine">
                  Registered Farmland Parcels ({lands.length})
                </h2>
                <button
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-5 py-2.5 bg-pine hover:bg-kombu text-brandy text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Land Parcel
                </button>
              </div>

              {loadingLands ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-brandy/30">
                  <Loader2 className="w-8 h-8 animate-spin text-dingley" />
                  <p className="text-sm text-kombu/70 mt-4">Retrieving land parcels...</p>
                </div>
              ) : errorLands ? (
                <div className="p-6 bg-copper/10 border border-copper/30 text-copper rounded-2xl text-center">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold">{errorLands}</p>
                  <button onClick={fetchLands} className="mt-4 px-4 py-2 bg-copper text-white rounded-xl text-sm font-bold">
                    Retry
                  </button>
                </div>
              ) : lands.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-brandy/30 shadow-sm max-w-xl mx-auto mt-8">
                  <div className="w-16 h-16 bg-brandy/20 rounded-full flex items-center justify-center text-dingley mb-4">
                    <Compass className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-pine mb-2">No Farmland Registered</h3>
                  <p className="text-kombu/70 text-sm mb-6 max-w-sm">
                    Register your agricultural plots, boundaries, and availability to receive matching contract offers from buyers.
                  </p>
                  <button
                    onClick={handleOpenAdd}
                    className="px-6 py-3 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Register Your First Plot
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {lands.map((land) => (
                    <div
                      key={land.id}
                      className="bg-white rounded-2xl border border-brandy/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                    >
                      {/* Farmland Header Card Decor */}
                      <div className="bg-gradient-to-r from-dingley/20 to-brandy/10 p-5 border-b border-brandy/20 flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg text-pine">{land.name}</h3>
                          <p className="text-xs text-kombu/70 mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-copper" /> {land.village}, {land.district}, {land.state}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          land.status === "AVAILABLE" ? "bg-dingley/20 text-dingley" :
                          land.status === "UNDER_CONTRACT" ? "bg-kombu/25 text-kombu" :
                          "bg-brandy/40 text-kombu/60"
                        }`}>
                          {land.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="p-5 space-y-4 flex-1">
                        {land.description && (
                          <p className="text-sm text-kombu/80 leading-relaxed italic border-l-2 border-brandy/60 pl-3">
                            "{land.description}"
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm bg-brandy/5 p-4 rounded-xl border border-brandy/20">
                          <div>
                            <span className="text-xs text-kombu/60 uppercase font-semibold">Total Area</span>
                            <p className="font-bold text-pine text-base mt-0.5">{land.size} {land.unit}s</p>
                          </div>
                          <div>
                            <span className="text-xs text-kombu/60 uppercase font-semibold">Coordinates</span>
                            <p className="font-mono text-xs text-pine font-medium mt-1">
                              {land.latitude.toFixed(5)}, {land.longitude.toFixed(5)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-brandy/10 px-5 py-4 border-t border-brandy/25 flex items-center justify-between">
                        {/* Toggle Availability */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(land)}
                            disabled={land.status === "UNDER_CONTRACT"}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              land.status === "UNDER_CONTRACT"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : land.status === "AVAILABLE"
                                ? "bg-white border border-copper/30 text-copper hover:bg-copper/5 cursor-pointer"
                                : "bg-dingley text-white hover:bg-dingley/90 cursor-pointer"
                            }`}
                          >
                            {land.status === "AVAILABLE" ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Mark Unavailable
                              </>
                            ) : land.status === "UNAVAILABLE" ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" /> Mark Available
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" /> Bound in Contract
                              </>
                            )}
                          </button>
                        </div>
                        {/* Edit details link */}
                        <button
                          onClick={() => handleOpenEdit(land)}
                          disabled={land.status === "UNDER_CONTRACT"}
                          className={`flex items-center gap-1 text-xs font-bold text-pine hover:text-dingley transition-colors ${
                            land.status === "UNDER_CONTRACT" ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Add or Edit Land form layout */
            <div className="bg-white rounded-3xl border border-brandy/30 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 border-b border-brandy/20 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1.5 rounded-lg hover:bg-brandy/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-kombu" />
                </button>
                <h2 className="text-xl font-bold text-pine">
                  {editingLand ? `Edit Land Details: ${editingLand.name}` : "Register New Farmland Plot"}
                </h2>
              </div>

              {formError && (
                <div className="mb-6 p-3.5 bg-copper/10 border border-copper/30 text-copper rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveLand} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name field */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Plot Name / Identifier</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. North Field Sector A"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                  {/* Size and Unit */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-pine mb-2">Plot Size</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="e.g. 4.5"
                        value={formSize}
                        onChange={(e) => setFormSize(e.target.value)}
                        className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-pine mb-2">Unit</label>
                      <select
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value as any)}
                        className="w-full px-3 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                      >
                        <option value="ACRE">Acres</option>
                        <option value="HECTARE">Hectares</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Coordinates Latitude */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="e.g. 31.028540"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium font-mono"
                    />
                  </div>
                  {/* Coordinates Longitude */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      required
                      placeholder="e.g. 75.394850"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Local Boundary Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. G.T Road Near Market"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                  {/* Village */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Village / Sub-district</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phillaur"
                      value={formVillage}
                      onChange={(e) => setFormVillage(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* District */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">District</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jalandhar"
                      value={formDistrict}
                      onChange={(e) => setFormDistrict(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                  {/* State */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">State</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Punjab"
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                  {/* Pincode */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 144410"
                      value={formPincode}
                      onChange={(e) => setFormPincode(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-pine mb-2">Optional Notes / Details</label>
                  <textarea
                    placeholder="e.g. Fertile clay loam soil, active tubewell connection on-site."
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-brandy/20 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-6 py-3 border border-brandy text-pine text-sm font-bold rounded-xl hover:bg-brandy/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="flex items-center gap-2 px-6 py-3 bg-pine hover:bg-kombu text-brandy text-sm font-bold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {formSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Save Land Parcel"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 3. BROWSE CROPS TAB */}
      {activeTab === "crops" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {!selectedCategory ? (
            /* Choose Category Menu */
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-pine text-center sm:text-left">
                Select a Crop Category to Browse Master Requirements
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Crops Card */}
                <button
                  onClick={() => {
                    const cat = categories.find(c => c.name === "Crops") || { id: "crops", name: "Crops", description: "" };
                    setSelectedCategory(cat);
                    fetchCropsByCategory("Crops");
                  }}
                  className="group relative flex flex-col justify-end h-64 rounded-3xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm hover:shadow-md text-left transition-all cursor-pointer"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: "url('/images/categories/crops.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Crops</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed line-clamp-2">
                      Browse wheat, paddy, maize, and sugar crop specifications.
                    </p>
                  </div>
                </button>

                {/* Vegetables Card */}
                <button
                  onClick={() => {
                    const cat = categories.find(c => c.name === "Vegetables") || { id: "vegetables", name: "Vegetables", description: "" };
                    setSelectedCategory(cat);
                    fetchCropsByCategory("Vegetables");
                  }}
                  className="group relative flex flex-col justify-end h-64 rounded-3xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm hover:shadow-md text-left transition-all cursor-pointer"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: "url('/images/categories/vegetables.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Vegetables</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed line-clamp-2">
                      Check parameters for potato, tomato, onion, and greens.
                    </p>
                  </div>
                </button>

                {/* Fruits Card */}
                <button
                  onClick={() => {
                    const cat = categories.find(c => c.name === "Fruits") || { id: "fruits", name: "Fruits", description: "" };
                    setSelectedCategory(cat);
                    fetchCropsByCategory("Fruits");
                  }}
                  className="group relative flex flex-col justify-end h-64 rounded-3xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm hover:shadow-md text-left transition-all cursor-pointer"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: "url('/images/categories/fruits.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Fruits</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed line-clamp-2">
                      Review requirements for tropical and temperate orchard fruits.
                    </p>
                  </div>
                </button>

                {/* Flowers Card */}
                <button
                  onClick={() => {
                    const cat = categories.find(c => c.name === "Flowers") || { id: "flowers", name: "Flowers", description: "" };
                    setSelectedCategory(cat);
                    fetchCropsByCategory("Flowers");
                  }}
                  className="group relative flex flex-col justify-end h-64 rounded-3xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm hover:shadow-md text-left transition-all cursor-pointer"
                >
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: "url('/images/categories/flowers.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Flowers</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed line-clamp-2">
                      Browse floriculture profiles, rose varieties, and seed crops.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Selected Category: Crop List & Details Split View */
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-brandy/20 pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null);
                    setCrops([]);
                    setSelectedCrop(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-brandy/20 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-kombu" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-pine">{selectedCategory.name} Category</h2>
                  <p className="text-xs text-kombu/70 mt-0.5">{selectedCategory.description || "Master crop directories."}</p>
                </div>
              </div>

              {loadingCrops ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-brandy/30">
                  <Loader2 className="w-8 h-8 animate-spin text-dingley" />
                  <p className="text-sm text-kombu/70 mt-4">Loading crops...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column: Crop List */}
                  <div className="md:col-span-1 space-y-3">
                    <h3 className="text-sm font-bold text-kombu/60 uppercase tracking-wider mb-2">Available Crop Types</h3>
                    {crops.map((crop) => (
                      <button
                        key={crop.id}
                        onClick={() => setSelectedCrop(crop)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center cursor-pointer ${
                          selectedCrop?.id === crop.id
                            ? "bg-pine text-brandy border-pine shadow-sm font-bold"
                            : "bg-white border-brandy/30 text-pine hover:bg-brandy/10 hover:border-brandy"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Sprout className="w-4 h-4 shrink-0" />
                          <span>{crop.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          selectedCrop?.id === crop.id ? "bg-white/10 text-white" : "bg-brandy/20 text-kombu"
                        }`}>
                          {crop.durationDays} Days
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Right Column: Crop Detail Card */}
                  <div className="md:col-span-2">
                    {selectedCrop ? (
                      <div className="bg-white p-6 rounded-3xl border border-brandy/30 shadow-sm space-y-6 animate-in fade-in duration-300">
                        <div>
                          <div className="inline-block px-2.5 py-1 bg-dingley/20 text-dingley text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                            Master Spec Sheet
                          </div>
                          <h3 className="text-2xl font-bold text-pine">{selectedCrop.name} Details</h3>
                          {selectedCrop.description && (
                            <p className="text-kombu/80 text-sm mt-3 leading-relaxed">
                              {selectedCrop.description}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Duration Card */}
                          <div className="bg-brandy/5 border border-brandy/20 p-4 rounded-xl flex items-center gap-3">
                            <Calendar className="w-10 h-10 text-dingley shrink-0" />
                            <div>
                              <span className="text-xs text-kombu/60 uppercase font-semibold">Cultivation Cycle</span>
                              <p className="font-bold text-pine mt-0.5">{selectedCrop.durationDays} Days</p>
                            </div>
                          </div>

                          {/* Category Reference */}
                          <div className="bg-brandy/5 border border-brandy/20 p-4 rounded-xl flex items-center gap-3">
                            <Layers className="w-10 h-10 text-copper shrink-0" />
                            <div>
                              <span className="text-xs text-kombu/60 uppercase font-semibold">Group Category</span>
                              <p className="font-bold text-pine mt-0.5">{selectedCategory.name}</p>
                            </div>
                          </div>
                        </div>

                        {/* Metadata Details (Pricing, Yield, Workers) */}
                        {getCropMetadata(selectedCrop) && (
                          <div className="border-t border-brandy/25 pt-6 space-y-4">
                            <h4 className="text-sm font-bold text-kombu/60 uppercase tracking-wider">Estimated Parameters (per Acre)</h4>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div className="border border-brandy/35 p-4 rounded-xl text-center">
                                <span className="text-xs text-kombu/60 uppercase block">Expected Yield</span>
                                <p className="text-lg font-bold text-pine mt-1">
                                  {getCropMetadata(selectedCrop).expectedYieldPerAcre} Tonnes
                                </p>
                              </div>
                              
                              <div className="border border-brandy/35 p-4 rounded-xl text-center font-bold">
                                <span className="text-xs text-kombu/60 uppercase block">Base Price / Tonne</span>
                                <p className="text-lg font-bold text-copper mt-1 flex items-center justify-center">
                                  <DollarSign className="w-4 h-4 -mr-0.5" />
                                  {getCropMetadata(selectedCrop).basePricePerTonne.toLocaleString("en-IN")}
                                </p>
                              </div>

                              <div className="border border-brandy/35 p-4 rounded-xl text-center">
                                <span className="text-xs text-kombu/60 uppercase block">Peak Labor Factor</span>
                                <p className="text-lg font-bold text-pine mt-1">
                                  {getCropMetadata(selectedCrop).laborFactor} workers
                                </p>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-brandy/10 border border-brandy/30 rounded-xl text-xs text-kombu/70 leading-relaxed">
                              <strong>Note on Master Data:</strong> These fields are used by the platform to automatically calculate required land coordinates, crop timeline milestones, and workforce thresholds during contract proposal phases.
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full min-h-[300px] border border-dashed border-brandy/60 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-brandy/5 text-kombu/60">
                        <Sprout className="w-12 h-12 mb-3 text-brandy" />
                        <h4 className="font-bold text-pine text-lg mb-1">Select a Crop</h4>
                        <p className="text-xs max-w-xs">Click one of the crops in the sidebar list to inspect growing details and metadata parameters.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. CONTRACT REQUESTS TAB */}
      {activeTab === "contract-requests" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-pine">
              Incoming Contract Proposals ({incomingContracts.length})
            </h2>
          </div>

          {loadingIncoming ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-brandy/30">
              <Loader2 className="w-8 h-8 animate-spin text-dingley" />
              <p className="text-sm text-kombu/70 mt-4">Retrieving contract requests...</p>
            </div>
          ) : incomingContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-brandy/30 shadow-sm max-w-xl mx-auto mt-8">
              <div className="w-16 h-16 bg-brandy/20 rounded-full flex items-center justify-center text-dingley mb-4">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-pine mb-2">No Contract Requests</h3>
              <p className="text-kombu/70 text-sm max-w-sm">
                When buyers select your available land parcels and propose cultivation cycles, they will appear here for review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {incomingContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white rounded-2xl border border-brandy/40 shadow-sm overflow-hidden"
                >
                  <div className="bg-brandy/10 p-5 border-b border-brandy/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-dingley/20 text-dingley px-2 py-0.5 rounded">
                        {contract.crop?.name || "Crop"} Cultivation
                      </span>
                      <h3 className="font-bold text-lg text-pine mt-1.5 flex items-center gap-2">
                        Contract Proposal #{contract.id.substring(0, 8).toUpperCase()}
                        <span className="text-[10px] bg-brandy/20 text-pine px-2 py-0.5 rounded font-semibold">
                          v{contract.revision || 1}
                        </span>
                      </h3>
                      <p className="text-xs text-kombu/60 mt-0.5">
                        Proposed by buyer: <strong>{contract.buyer?.name || "N/A"}</strong> ({contract.buyer?.phone || "N/A"})
                      </p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        contract.status === "PENDING_APPROVAL" ? "bg-copper/20 text-copper" :
                        contract.status === "ACCEPTED" ? "bg-dingley/20 text-dingley" :
                        contract.status === "ACTIVE" ? "bg-pine text-white" :
                        contract.status === "REJECTED" ? "bg-red-100 text-red-700" :
                        "bg-gray-150 text-gray-500"
                      }`}>
                        {contract.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Target Land Parcel</span>
                      <p className="font-bold text-pine text-sm">{contract.land?.name || "Plot Location"}</p>
                      <p className="text-kombu/70 mt-0.5">{contract.land?.village}, {contract.land?.district}, {contract.land?.state}</p>
                    </div>

                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Area & Requested Yield</span>
                      <p className="font-bold text-pine text-sm">{contract.landArea} Acres</p>
                      <p className="text-kombu/70 mt-0.5">Allocated Qty: {contract.allocatedQuantity.toFixed(1)} Tonnes</p>
                    </div>

                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Proposed Price</span>
                      <p className="font-bold text-copper text-sm">₹{contract.proposedPrice.toLocaleString("en-IN")}</p>
                      <p className="text-kombu/70 mt-0.5">Offered payout amount</p>
                    </div>

                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Timeline Schedule</span>
                      <p className="font-bold text-pine text-sm">Start: {new Date(contract.startDate).toLocaleDateString()}</p>
                      <p className="text-kombu/70 mt-0.5">Harvest: {new Date(contract.expectedHarvestDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {contract.notes && (
                    <div className="px-5 pb-5">
                      <div className="bg-brandy/5 border border-brandy/20 p-3 rounded-xl text-xs text-kombu/80">
                        <strong>Buyer Proposal Notes:</strong> "{contract.notes}"
                      </div>
                    </div>
                  )}

                  {contract.status === "REJECTED" && contract.rejectionReason && (
                    <div className="px-5 pb-5">
                      <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700">
                        <strong>Your Rejection Reason:</strong> "{contract.rejectionReason}"
                      </div>
                    </div>
                  )}

                  {contract.activatedAt && (
                    <div className="px-5 pb-4 text-xs text-kombu/70">
                      <strong>Activated At:</strong> {new Date(contract.activatedAt).toLocaleString()}
                    </div>
                  )}

                  <div className="bg-brandy/10 px-5 py-3 border-t border-brandy/20 flex justify-end items-center gap-3">
                    {contract.status === "PENDING_APPROVAL" && (
                      <>
                        <button
                          onClick={() => handleRejectContract(contract.id)}
                          className="px-4 py-2 border border-copper text-copper font-bold rounded-xl hover:bg-copper/5 text-xs transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => setShowAcceptConfirmId(contract.id)}
                          className="px-5 py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl shadow-md hover:shadow-lg text-xs transition-all cursor-pointer"
                        >
                          Accept Proposal
                        </button>
                      </>
                    )}
                    {contract.status === "ACCEPTED" && (
                      <span className="text-xs text-pine font-bold italic">
                        Waiting for Buyer Activation
                      </span>
                    )}
                    {contract.status === "ACTIVE" && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-dingley font-bold">
                          Contract Active
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setViewingContractId(contract.id)}
                            className="px-4 py-2 bg-brandy/20 text-pine hover:bg-brandy/35 font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            View Contract
                          </button>
                          <button
                            onClick={() => {
                              setShowProgressModalContract(contract);
                              setProgressStage("LAND_PREPARATION");
                              setProgressNotes("");
                            }}
                            className="px-4 py-2 bg-pine text-brandy hover:bg-kombu font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            Update Farm Progress
                          </button>
                          <button
                            onClick={() => handleCompleteContract(contract.id)}
                            className="px-4 py-2 bg-copper text-brandy hover:bg-copper/90 font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            Complete Contract
                          </button>
                        </div>
                      </div>
                    )}
                    {contract.status === "COMPLETED" && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-pine font-bold">
                          Contract Completed
                        </span>
                        <button
                          onClick={() => setViewingContractId(contract.id)}
                          className="px-4 py-2 bg-brandy/20 text-pine hover:bg-brandy/35 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          View Summary
                        </button>
                      </div>
                    )}
                    {(contract.status === "REJECTED" || contract.status === "CANCELLED") && (
                      <button
                        onClick={() => setViewingContractId(contract.id)}
                        className="px-4 py-2 bg-brandy/20 text-pine hover:bg-brandy/35 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accept Proposal Warning Confirmation Modal */}
      {showAcceptConfirmId && (
        <div className="fixed inset-0 bg-pine/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brandy/30 shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div>
              <h3 className="text-xl font-bold text-pine">Confirm Contract Acceptance</h3>
              <p className="text-xs text-kombu/70 mt-2 leading-relaxed">
                Are you sure you want to accept this contract proposal? 
              </p>
              <div className="bg-copper/10 border border-copper/30 text-copper rounded-xl p-3.5 text-xs font-medium mt-4 leading-normal">
                <strong>Important Warning:</strong> Accepting will bind your land parcel to this contract and change its status to <strong>UNDER_CONTRACT</strong>. Any other pending contract proposals for this plot will be rejected automatically.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAcceptConfirmId(null)}
                className="px-4 py-2 border border-brandy text-pine font-bold rounded-xl hover:bg-brandy/10 text-xs cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleAcceptContract(showAcceptConfirmId)}
                className="px-5 py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl shadow-md hover:shadow-lg text-xs cursor-pointer"
              >
                Accept and Lock Land
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details / Timeline Modal Overlay */}
      {viewingContractId && (
        <div className="fixed inset-0 bg-pine/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brandy/30 shadow-2xl p-6 sm:p-8 max-w-lg w-full relative my-8 animate-in slide-in-from-bottom-4 duration-300 max-h-[calc(100vh-4rem)] flex flex-col">
            <button
              onClick={() => setViewingContractId(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brandy/20 text-kombu/60 hover:text-pine transition-colors cursor-pointer z-10"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingViewingContract ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-dingley" />
                <p className="text-xs text-kombu/70 mt-3">Fetching contract details...</p>
              </div>
            ) : viewingContract ? (
              <div className="flex flex-col flex-1 min-h-0 space-y-4 mt-2">
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-dingley/20 text-dingley px-2 py-0.5 rounded">
                    {viewingContract.crop?.name || "Crop"} Contract Details
                  </span>
                  <h3 className="text-2xl font-bold text-pine mt-2 flex items-center gap-2">
                    Contract #{viewingContract.id.substring(0, 8).toUpperCase()}
                    <span className="text-xs bg-brandy/20 text-pine px-2 py-0.5 rounded font-semibold">
                      v{viewingContract.revision}
                    </span>
                  </h3>
                  <p className="text-xs text-kombu/60 mt-1 uppercase tracking-wider font-semibold">
                    Current Status: <span className="text-copper">{viewingContract.status.replace("_", " ")}</span>
                  </p>
                </div>

                {/* Tab Navigation Bar */}
                <div className="flex border-b border-brandy/20 overflow-x-auto scrollbar-none gap-2 pb-1 text-xs font-semibold shrink-0">
                  {[
                    "Overview",
                    "Financials",
                    "Yield",
                    "Milestones",
                    "Tasks",
                    "Progress",
                    "Monitoring",
                  ].map((tab) => {
                    const isActive = activeDetailTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveDetailTab(tab as any)}
                        className={`px-3 py-1.5 rounded-t-lg transition-colors whitespace-nowrap cursor-pointer ${
                          isActive
                            ? "bg-pine text-brandy font-bold border-b-2 border-pine"
                            : "text-kombu/60 hover:text-pine hover:bg-brandy/5"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>

                {/* Active Tab Content Area */}
                <div className="overflow-y-auto flex-1 pr-1 space-y-4 min-h-0">
                  {activeDetailTab === "Overview" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Timeline Tracker */}
                      <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-brandy/10 pb-2">
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Timeline Tracker</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            viewingContract.status === "ACTIVE" ? "bg-dingley/20 text-pine" : "bg-brandy/20 text-pine"
                          }`}>
                            {viewingContract.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs font-medium text-kombu">
                          <div>
                            <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Proposed Start Date</span>
                            <span>{new Date(viewingContract.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Target Harvest Date</span>
                            <span>{new Date(viewingContract.expectedHarvestDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Contract Health Overview Banner */}
                      {viewingContractOverview && (
                        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-semibold ${
                          viewingContractOverview.health === "COMPLETED" ? "bg-dingley/15 text-pine border border-dingley/30" :
                          viewingContractOverview.health === "NEEDS_ATTENTION" ? "bg-red-50 text-red-800 border border-red-200" :
                          "bg-copper/10 text-copper border border-copper/30"
                        }`}>
                          <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Contract Health Status</p>
                            <p className="text-base font-bold mt-0.5">
                              {viewingContractOverview.health.replace("_", " ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70">Timeline Progress</p>
                            <p className="text-base font-bold mt-0.5">{viewingContractOverview.progressPercentage}%</p>
                          </div>
                        </div>
                      )}

                      {/* Grid Info */}
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                        <div>
                          <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-0.5">Buyer Involved</span>
                          <span className="font-bold text-pine">{viewingContract.buyer?.name}</span>
                          <span className="text-[10px] text-kombu/60 block">{viewingContract.buyer?.phone}</span>
                        </div>
                        <div>
                          <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-0.5">Farmer Owner</span>
                          <span className="font-bold text-pine">{viewingContract.landowner?.name}</span>
                          <span className="text-[10px] text-kombu/60 block">{viewingContract.landowner?.phone}</span>
                        </div>
                        <div className="col-span-2 border-t border-brandy/20 pt-3">
                          <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-0.5">Land Parcel Details</span>
                          <span className="font-bold text-pine">{viewingContract.land?.name}</span>
                          <span className="text-kombu/70 block mt-0.5">
                            {viewingContract.land?.village}, {viewingContract.land?.district}, {viewingContract.land?.state}
                          </span>
                        </div>
                        <div className="border-t border-brandy/20 pt-3">
                          <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-0.5">Proposed Area</span>
                          <span className="font-bold text-pine text-sm">{viewingContract.landArea} Acres</span>
                        </div>
                        <div className="border-t border-brandy/20 pt-3">
                          <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-0.5">Payout Valuation</span>
                          <span className="font-bold text-copper text-sm">₹{viewingContract.proposedPrice.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {viewingContract.notes && (
                        <div className="bg-brandy/5 border border-brandy/20 p-3 rounded-xl text-xs text-kombu/80">
                          <strong>Proposal Note log:</strong> "{viewingContract.notes}"
                        </div>
                      )}

                      {viewingContract.status === "REJECTED" && viewingContract.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700">
                          <strong>Your Rejection Reason:</strong> "{viewingContract.rejectionReason}"
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Financials" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Financial Allocation Card (Farmer/Landowner Read-Only View) */}
                      {viewingContractOverview?.financialSummary ? (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3 text-xs">
                          <div className="flex justify-between items-center border-b border-brandy/10 pb-2">
                            <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Financial Breakdown</h4>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              viewingContractOverview.financialSummary.isConfigured ? "bg-dingley/20 text-pine" : "bg-amber-100 text-amber-800"
                            }`}>
                              {viewingContractOverview.financialSummary.isConfigured ? "Agreed Budget" : "Tentative"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-white/60 p-4 rounded-xl border border-brandy/10">
                            <div>
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Your Payment (Landowner Amount)</span>
                              <span className="font-bold text-pine">₹{viewingContractOverview.financialSummary.landownerAmount.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Workforce Budget</span>
                              <span className="font-semibold text-pine">₹{viewingContractOverview.financialSummary.workforceBudget.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Logistics Budget</span>
                              <span className="font-semibold text-pine">₹{viewingContractOverview.financialSummary.logisticsBudget.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Platform Service Fee (10%)</span>
                              <span className="font-semibold text-pine">₹{viewingContractOverview.financialSummary.platformFee.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="col-span-2 border-t border-brandy/25 pt-2">
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Total Agreed Contract Budget Value</span>
                              <span className="font-bold text-copper text-sm">₹{viewingContractOverview.financialSummary.totalContractValue.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60">
                          Financial breakdown unavailable.
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Yield" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Yield & Fulfillment Card with Harvest Submission */}
                      {viewingContractOverview?.yieldSummary ? (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3 text-xs">
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider flex items-center justify-between border-b border-brandy/10 pb-2 font-bold">
                            <span>Crop Production & Yield</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              viewingContractOverview.yieldSummary.fulfillmentStatus === "FULFILLED" ? "bg-dingley/20 text-pine" :
                              viewingContractOverview.yieldSummary.fulfillmentStatus === "OVERFULFILLED" ? "bg-green-100 text-green-800" :
                              viewingContractOverview.yieldSummary.fulfillmentStatus === "PARTIAL" ? "bg-amber-100 text-amber-805" :
                              "bg-brandy/20 text-pine"
                            }`}>
                              {viewingContractOverview.yieldSummary.fulfillmentStatus}
                            </span>
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/60 p-3 rounded-xl border border-brandy/10">
                              <span className="text-[10px] text-kombu/60 block uppercase font-bold tracking-wide">Estimated Yield</span>
                              <span className="font-bold text-pine text-sm">
                                {viewingContractOverview.yieldSummary.estimatedQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.estimatedQuantity.toFixed(2)} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                  : "Unavailable"}
                              </span>
                            </div>
                            <div className="bg-white/60 p-3 rounded-xl border border-brandy/10">
                              <span className="text-[10px] text-kombu/60 block uppercase font-bold tracking-wide">Actual Harvested</span>
                              <span className="font-bold text-copper text-sm">
                                {viewingContractOverview.yieldSummary.actualQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.actualQuantity.toFixed(2)} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                  : "Not recorded"}
                              </span>
                            </div>
                          </div>

                          {/* Harvest Submission Form for Landowner */}
                          {viewingContract.status === "ACTIVE" && (
                            <form onSubmit={handleSaveHarvest} className="space-y-3 pt-2 border-t border-brandy/10">
                              <div className="flex flex-col sm:flex-row items-end justify-between gap-3">
                                <div className="flex-1 w-full">
                                  <label className="block text-[10px] text-kombu/60 font-semibold mb-1">
                                    Record Actual Harvest Quantity ({viewingContract.demand?.quantityUnit || "Tonnes"})
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    disabled={
                                      !viewingContract.progressUpdates?.some(
                                        (pu: any) => pu.stage === "HARVEST_READY" || pu.stage === "HARVEST_COMPLETED"
                                      )
                                    }
                                    placeholder={
                                      viewingContract.progressUpdates?.some(
                                        (pu: any) => pu.stage === "HARVEST_READY" || pu.stage === "HARVEST_COMPLETED"
                                      )
                                        ? "Enter quantity harvested"
                                        : "Available once harvest is ready/completed"
                                    }
                                    className="w-full p-2 border border-brandy/30 rounded-lg text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    value={actualHarvestQty}
                                    onChange={(e) => setActualHarvestQty(e.target.value)}
                                    required
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={
                                    savingHarvest ||
                                    !viewingContract.progressUpdates?.some(
                                      (pu: any) => pu.stage === "HARVEST_READY" || pu.stage === "HARVEST_COMPLETED"
                                    )
                                  }
                                  className="px-4 py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-lg text-xs shadow transition-colors disabled:opacity-50 cursor-pointer shrink-0 w-full sm:w-auto text-center"
                                >
                                  {savingHarvest ? "Saving..." : "Submit Harvest"}
                                </button>
                              </div>
                              {harvestError && (
                                <p className="text-[10px] text-red-600 font-bold bg-red-50 p-2 rounded-lg">{harvestError}</p>
                              )}
                            </form>
                          )}
                        </div>
                      ) : (
                        <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60">
                          Yield parameters not initialized yet.
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Milestones" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Crop Milestone Plan Card (Farmer View) */}
                      <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b border-brandy/10 pb-2">
                          <div>
                            <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Crop Milestone Plan</h4>
                            <p className="text-[9px] text-kombu/60 mt-0.5">
                              Planned Cultivation stages generated by the system.
                            </p>
                          </div>
                        </div>

                        {loadingMilestones ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-dingley" />
                            <span className="text-[10px] text-kombu/60 ml-2">Loading crop milestones...</span>
                          </div>
                        ) : milestonesLoadError ? (
                          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200">
                            <p className="font-semibold text-[10px]">Crop milestone plan unavailable</p>
                            <p className="text-[9px] opacity-85 mt-0.5">{milestonesLoadError}</p>
                          </div>
                        ) : viewingContractMilestones.length > 0 ? (
                          <div className="relative border-l border-brandy/30 ml-2 pl-4 space-y-3 py-1">
                            {viewingContractMilestones.map((ms: any) => {
                              const statusColors = 
                                ms.status === "COMPLETED" ? "bg-dingley/20 text-pine" :
                                ms.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-800" :
                                ms.status === "OVERDUE" ? "bg-red-100 text-red-800 font-bold" :
                                "bg-gray-100 text-gray-700";

                              return (
                                <div key={ms.id} className="relative">
                                  <span className={`absolute -left-[22px] top-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold ring-4 ring-white ${
                                    ms.status === "COMPLETED" ? "bg-dingley text-white" : "bg-brandy/30 text-kombu"
                                  }`}>
                                    {ms.sequence}
                                  </span>
                                  <div className="bg-white/60 p-2.5 rounded-xl border border-brandy/10 flex justify-between items-start gap-4 shadow-sm">
                                    <div>
                                      <p className="font-bold text-pine text-xs">{ms.title}</p>
                                      <p className="text-[10px] text-kombu/60 mt-0.5">
                                        Planned: {new Date(ms.plannedDate).toLocaleDateString("en-IN", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric"
                                        })}
                                      </p>
                                      {ms.completedAt && (
                                        <p className="text-[9px] text-dingley font-semibold mt-0.5">
                                          Completed: {new Date(ms.completedAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric"
                                          })}
                                        </p>
                                      )}
                                    </div>
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${statusColors}`}>
                                      {ms.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60">
                            No milestones generated for this contract.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "Tasks" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Crop Actionable Tasks Card (Farmer/Landowner View - Interactive) */}
                      <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-4 text-xs">
                        <div>
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Crop Actionable Tasks</h4>
                          <p className="text-[9px] text-kombu/60 mt-0.5">
                            Farming checklists checklist per stage. Update task status as work progresses.
                          </p>
                        </div>

                        {loadingTasks ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-dingley" />
                            <span className="text-[10px] text-kombu/60 ml-2">Loading crop tasks...</span>
                          </div>
                        ) : tasksLoadError ? (
                          <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200">
                            <p className="font-semibold text-[10px]">Crop tasks unavailable</p>
                            <p className="text-[9px] opacity-85 mt-0.5">{tasksLoadError}</p>
                          </div>
                        ) : viewingContractTasks.length > 0 ? (
                          <div className="space-y-4">
                            {viewingContractMilestones.map((ms: any) => {
                              const msTasks = viewingContractTasks.filter((t) => t.milestoneId === ms.id);
                              if (msTasks.length === 0) return null;

                              return (
                                <div key={ms.id} className="bg-white/60 p-3.5 rounded-xl border border-brandy/10 space-y-2">
                                  <h5 className="font-bold text-pine text-xs border-b border-brandy/10 pb-1.5 flex justify-between items-center font-bold">
                                    <span>Stage {ms.sequence}: {ms.title}</span>
                                    <span className="text-[9px] px-1.5 py-0.2 bg-pine/10 text-pine rounded font-semibold uppercase">
                                      {ms.status}
                                    </span>
                                  </h5>
                                  <div className="space-y-3 pt-1">
                                    {msTasks.map((task: any) => {
                                      const priorityColors = 
                                        task.priority === "CRITICAL" ? "text-red-600 bg-red-50 border border-red-100" :
                                        task.priority === "HIGH" ? "text-amber-700 bg-amber-50 border border-amber-100" :
                                        task.priority === "MEDIUM" ? "text-pine bg-dingley/10 border border-dingley/20" :
                                        "text-kombu/60 bg-gray-50 border border-gray-100";

                                      const isOverdue = task.status === "OVERDUE";
                                      const statusSelectStyle = 
                                        task.status === "COMPLETED" ? "border-dingley bg-dingley/5 text-pine font-bold" :
                                        task.status === "IN_PROGRESS" ? "border-amber-400 bg-amber-50 text-amber-800 font-bold" :
                                        task.status === "OVERDUE" ? "border-red-400 bg-red-50 text-red-800 font-bold" :
                                        "border-brandy/40 bg-white text-kombu/80";

                                      return (
                                        <div key={task.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pl-1 text-[11px] border-b border-brandy/5 pb-2 last:border-0 last:pb-0">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-1.5">
                                              <p className={`font-semibold ${task.status === 'COMPLETED' ? 'line-through text-kombu/40' : 'text-kombu'}`}>
                                                {task.sequence}. {task.title}
                                              </p>
                                              {isOverdue && (
                                                <span className="text-[9px] font-bold text-red-600 animate-pulse bg-red-100/50 px-1 rounded">
                                                  ⚠ OVERDUE BY {task.daysOverdue} DAYS
                                                </span>
                                              )}
                                            </div>
                                            {task.description && (
                                              <p className="text-[9.5px] text-kombu/50 mt-0.5">{task.description}</p>
                                            )}
                                            <div className="flex gap-2 items-center mt-1 text-[8.5px]">
                                              <span className={`px-1 rounded ${priorityColors}`}>{task.priority} Priority</span>
                                              {task.dueDate && (
                                                <span className="text-kombu/50">
                                                  Due: {new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 self-start sm:self-center">
                                            {updatingTaskId === task.id ? (
                                              <Loader2 className="w-4 h-4 animate-spin text-dingley" />
                                            ) : (
                                              <select
                                                value={task.storedStatus}
                                                onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                className={`text-[9px] p-1 border rounded outline-none font-bold uppercase transition-colors cursor-pointer ${statusSelectStyle}`}
                                              >
                                                <option value="PENDING">PENDING</option>
                                                <option value="IN_PROGRESS">IN PROGRESS</option>
                                                <option value="COMPLETED">COMPLETED</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                              </select>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60">
                            No actionable tasks generated for this contract status.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "Progress" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Milestone Stepper */}
                      {viewingContract.status === "ACTIVE" && (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3">
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Milestone Stepper</h4>
                          <div className="flex justify-between items-center text-[10px] text-kombu/70">
                            {[
                              { key: "LAND_PREPARATION", label: "Prep" },
                              { key: "SOWING", label: "Sowing" },
                              { key: "GROWING", label: "Growing" },
                              { key: "HARVEST_READY", label: "Harvest Ready" },
                              { key: "HARVEST_COMPLETED", label: "Harvested" },
                            ].map((step, idx) => {
                              const isCompleted = viewingContract.progressUpdates?.some((pu: any) => pu.stage === step.key);
                              const isLatest = viewingContract.progressUpdates && viewingContract.progressUpdates[viewingContract.progressUpdates.length - 1]?.stage === step.key;
                              return (
                                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                                  {/* Connector line */}
                                  {idx > 0 && (
                                    <div className={`absolute left-[-50%] right-[50%] top-2.5 h-[2px] z-0 ${
                                      isCompleted ? "bg-dingley" : "bg-brandy/20"
                                    }`} />
                                  )}
                                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold text-[9px] relative z-10 ${
                                    isLatest ? "bg-pine text-white ring-4 ring-pine/20" :
                                    isCompleted ? "bg-dingley text-white" :
                                    "bg-brandy/20 text-kombu/45"
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <span className={`mt-1 font-semibold ${isLatest ? "text-pine font-bold" : isCompleted ? "text-dingley" : "text-kombu/50"}`}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Farm Progress History */}
                      {viewingContract.status === "ACTIVE" && (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3">
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Farm Progress History</h4>
                          {!viewingContract.progressUpdates || viewingContract.progressUpdates.length === 0 ? (
                            <p className="text-xs text-kombu/50 italic">No farming progress updates yet.</p>
                          ) : (
                            <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                              {viewingContract.progressUpdates.map((update: any) => (
                                <div key={update.id} className="p-3 bg-brandy/5 border border-brandy/20 rounded-xl text-xs space-y-1">
                                  <div className="flex justify-between items-center border-b border-brandy/10 pb-1">
                                    <span className="font-bold text-pine uppercase tracking-wide text-[10px]">
                                      {update.stage.replace("_", " ")}
                                    </span>
                                    <span className="text-[9px] text-kombu/60">
                                      {new Date(update.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  {update.notes && (
                                    <p className="text-[10px] text-kombu/80 mt-1 italic font-medium">"{update.notes}"</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Negotiation History UI */}
                      {viewingContract.history && viewingContract.history.length > 0 && (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3">
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-semibold font-bold">Negotiation History ({viewingContract.history.length} previous rounds)</h4>
                          <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
                            {viewingContract.history.map((hist: any) => (
                              <div key={hist.id} className="p-3 bg-brandy/5 border border-brandy/20 rounded-xl text-xs space-y-1.5">
                                <div className="flex justify-between items-center border-b border-brandy/10 pb-1">
                                  <span className="font-bold text-pine">Round {hist.revision}</span>
                                  <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    hist.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                    hist.status === "CANCELLED" ? "bg-gray-150 text-gray-500" :
                                    "bg-gray-100 text-gray-700"
                                  }`}>
                                    {hist.status.replace("_", " ")}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] text-kombu/70">
                                  <div>Proposed Price: <strong className="text-pine">₹{hist.proposedPrice.toLocaleString("en-IN")}</strong></div>
                                  <div>Area: <strong>{hist.landArea} Acres</strong></div>
                                  <div>Harvest Date: <strong>{new Date(hist.expectedHarvestDate).toLocaleDateString()}</strong></div>
                                  <div>Quantity: <strong>{hist.allocatedQuantity.toFixed(1)} Tonnes</strong></div>
                                </div>
                                {hist.notes && (
                                  <p className="text-[10px] text-kombu/60 italic">Buyer Note: "{hist.notes}"</p>
                                )}
                                {hist.rejectionReason && (
                                  <p className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded">Rejection Reason: "{hist.rejectionReason}"</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Monitoring" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Contract Monitoring & Alerts (Farmer View) */}
                      {viewingContractOverview && (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3 text-xs">
                          <div className="flex justify-between items-center border-b border-brandy/10 pb-2">
                            <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Contract Alert Summary</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              viewingContractOverview.activeAlertCount > 0 ? "bg-red-100 text-red-700" : "bg-dingley/20 text-pine"
                            }`}>
                              {viewingContractOverview.activeAlertCount} Issue{viewingContractOverview.activeAlertCount !== 1 ? "s" : ""} Active
                            </span>
                          </div>

                          {viewingContractOverview.activeAlertCount > 0 ? (
                            <div className="space-y-2.5">
                              {viewingContractOverview.monitoringAlertsSummary.map((alert: any) => {
                                const alertColors = 
                                  alert.severity === "CRITICAL" ? "bg-red-50 text-red-800 border-red-200" :
                                  alert.severity === "WARNING" ? "bg-amber-50 text-amber-805 border-amber-200" :
                                  "bg-blue-50 text-blue-800 border-blue-200";

                                return (
                                  <div key={alert.id || alert.message} className={`p-3 rounded-xl border flex items-start gap-2.5 ${alertColors}`}>
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-[11.5px]">{alert.message}</p>
                                      {alert.milestone && (
                                        <p className="text-[9.5px] opacity-80 mt-0.5">Stage: {alert.milestone}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 bg-white/60 border border-brandy/10 rounded-xl text-center text-kombu/60 italic font-medium">
                              Everything is running on track! No milestones or harvests are delayed.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer close button */}
                <div className="flex justify-end pt-2 border-t border-brandy/10 shrink-0">
                  <button
                    onClick={() => setViewingContractId(null)}
                    className="px-5 py-2.5 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl shadow-md text-xs cursor-pointer animate-in fade-in"
                  >
                    Close View
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-copper font-semibold">Error displaying contract details.</p>
            )}
          </div>
        </div>
      )}

      {/* Reject Reason input dialog overlay modal */}
      {rejectingContractId && (
        <div className="fixed inset-0 bg-pine/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brandy/30 shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div>
              <h3 className="text-xl font-bold text-pine">Reject Proposal</h3>
              <p className="text-xs text-kombu/70 mt-1">
                Please specify a reason for rejecting this cultivation proposal. This comment will be visible to the buyer.
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="e.g. The proposed payout price is too low for this land area..."
                value={rejectionText}
                onChange={(e) => setRejectionText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-xs text-pine font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingContractId(null);
                  setRejectionText("");
                }}
                className="px-4 py-2 border border-brandy text-pine font-bold rounded-xl hover:bg-brandy/10 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectionText.trim()}
                onClick={() => handleConfirmReject()}
                className="px-5 py-2 bg-copper hover:bg-copper/90 text-brandy font-bold rounded-xl shadow-md text-xs cursor-pointer disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Farm Progress Stage Overlay Modal */}
      {showProgressModalContract && (
        <div className="fixed inset-0 bg-pine/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brandy/30 shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div>
              <h3 className="text-xl font-bold text-pine">Update Farm Progress</h3>
              <p className="text-xs text-kombu/70 mt-1">
                Post a new farming milestone progress update for Contract <strong>#{showProgressModalContract.id.substring(0, 8).toUpperCase()}</strong>.
              </p>
            </div>

            <form onSubmit={handlePostProgressSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-kombu/70 block uppercase font-bold tracking-wider mb-1.5">Farming Milestone Stage</label>
                <select
                  value={progressStage}
                  onChange={(e) => setProgressStage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-xs text-pine font-medium"
                >
                  <option value="LAND_PREPARATION">Land Preparation</option>
                  <option value="SOWING">Sowing</option>
                  <option value="GROWING">Growing</option>
                  <option value="HARVEST_READY">Harvest Ready</option>
                  <option value="HARVEST_COMPLETED">Harvest Completed</option>
                </select>
              </div>

              <div>
                <label className="text-kombu/70 block uppercase font-bold tracking-wider mb-1.5">Optional Notes / Details</label>
                <textarea
                  rows={4}
                  placeholder="e.g. Field preparation completed, starting irrigation planning..."
                  value={progressNotes}
                  onChange={(e) => setProgressNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-xs text-pine font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowProgressModalContract(null);
                    setProgressStage("LAND_PREPARATION");
                    setProgressNotes("");
                  }}
                  className="px-4 py-2 border border-brandy text-pine font-bold rounded-xl hover:bg-brandy/10 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProgress}
                  className="px-5 py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl shadow-md text-xs cursor-pointer disabled:opacity-50"
                >
                  {submittingProgress ? "Posting..." : "Post Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
