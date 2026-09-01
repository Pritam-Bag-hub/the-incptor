"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ArrowRight,
  Calendar,
  Layers,
  Sprout,
  DollarSign,
  X,
  Check,
  AlertTriangle,
  ShieldCheck,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Filter,
  RefreshCw,
  Trash2
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

  const fetchLands = async () => {
    setLoadingLands(true);
    setErrorLands("");
    try {
      const res = await fetch("/api/lands");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch land parcels.");
      }
      setLands(data);
    } catch (err: any) {
      setErrorLands(err.message || "Error loading lands.");
    } finally {
      setLoadingLands(false);
    }
  };

  const resetLandForm = () => {
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

  const handleAddLandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSaving(true);
    try {
      const body = {
        name: formName,
        size: parseFloat(formSize),
        unit: formUnit,
        address: formAddress,
        village: formVillage,
        district: formDistrict,
        state: formState,
        pincode: formPincode || undefined,
        latitude: parseFloat(formLat),
        longitude: parseFloat(formLng),
        description: formDesc || undefined,
      };

      const res = await fetch("/api/lands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create land parcel.");
      }
      setIsAdding(false);
      resetLandForm();
      fetchLands();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleEditLandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLand) return;
    setFormError("");
    setFormSaving(true);
    try {
      const body = {
        name: formName,
        size: parseFloat(formSize),
        unit: formUnit,
        address: formAddress,
        village: formVillage,
        district: formDistrict,
        state: formState,
        pincode: formPincode || undefined,
        latitude: parseFloat(formLat),
        longitude: parseFloat(formLng),
        description: formDesc || undefined,
      };

      const res = await fetch(`/api/lands/${editingLand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update land parcel.");
      }
      setEditingLand(null);
      resetLandForm();
      fetchLands();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteLand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this land parcel?")) return;
    try {
      const res = await fetch(`/api/lands/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete land parcel.");
      }
      fetchLands();
    } catch (err: any) {
      alert(err.message || "Could not delete land parcel.");
    }
  };

  const startEditingLand = (land: Land) => {
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
  };

  const fetchCategories = async () => {
    setLoadingCrops(true);
    try {
      const res = await fetch("/api/crops/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0]);
        }
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoadingCrops(false);
    }
  };

  const fetchCrops = async (category: CropCategory | string) => {
    if (!category) return;
    setLoadingCrops(true);
    try {
      const categoryQuery = typeof category === "string" ? category : (category.name || category.id);
      const res = await fetch(`/api/crops?category=${encodeURIComponent(categoryQuery)}`);
      const data = await res.json();
      if (res.ok) {
        setCrops(data);
      }
    } catch (err) {
      console.error("Error fetching crops:", err);
    } finally {
      setLoadingCrops(false);
    }
  };

  const handlePostProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showProgressModalContract) return;
    setSubmittingProgress(true);
    try {
      const res = await fetch(`/api/contracts/${showProgressModalContract.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: progressStage, notes: progressNotes }),
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
      }
      if (overviewRes.ok) {
        const overviewData = await overviewRes.json();
        setViewingContractOverview(overviewData);
      }

      try {
        const milestonesRes = await fetch(`/api/contracts/${contractId}/milestones`);
        if (milestonesRes.ok) {
          const milestonesData = await milestonesRes.json();
          setViewingContractMilestones(milestonesData);
        } else {
          setMilestonesLoadError("Milestones data currently unavailable.");
        }
      } catch (e) {
        setMilestonesLoadError("Could not connect to milestones service.");
      } finally {
        setLoadingMilestones(false);
      }

      try {
        const tasksRes = await fetch(`/api/contracts/${contractId}/tasks`);
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          setViewingContractTasks(tasksData);
        } else {
          setTasksLoadError("Tasks data currently unavailable.");
        }
      } catch (e) {
        setTasksLoadError("Could not connect to tasks service.");
      } finally {
        setLoadingTasks(false);
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
      setViewingContractTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || "Error updating task status.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleRecordHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingContract || !actualHarvestQty.trim()) return;
    setSavingHarvest(true);
    setHarvestError("");
    try {
      const qtyNum = parseFloat(actualHarvestQty);
      if (isNaN(qtyNum) || qtyNum < 0) {
        throw new Error("Please enter a valid positive harvest quantity.");
      }
      const res = await fetch(`/api/contracts/${viewingContract.id}/yield`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actualQuantity: qtyNum }),
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

  const handleCompleteContract = async (contractId: string) => {
    if (!confirm("Are you sure you want to mark this contract as COMPLETED?")) return;
    try {
      const res = await fetch(`/api/contracts/${contractId}/complete`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete contract.");
      }
      fetchIncomingContracts();
      if (viewingContractId === contractId) {
        fetchContractDetails(contractId);
      }
    } catch (err: any) {
      alert(err.message || "Could not complete contract.");
    }
  };

  const modalPushedRef = useRef(false);

  const openContractModal = (contractId: string) => {
    if (!contractId) return;
    setViewingContractId(contractId);
    if (!modalPushedRef.current && typeof window !== "undefined") {
      try {
        window.history.pushState({ farmerContractModal: true }, "", window.location.pathname);
        modalPushedRef.current = true;
      } catch (err) {
        console.error("pushState error:", err);
      }
    }
  };

  const closeContractModal = () => {
    setViewingContractId(null);
    setViewingContract(null);
    if (modalPushedRef.current && typeof window !== "undefined") {
      modalPushedRef.current = false;
      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch (err) {
        console.error("replaceState error:", err);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (modalPushedRef.current) {
        modalPushedRef.current = false;
        setViewingContractId(null);
        setViewingContract(null);
      }
    };

    window.addEventListener("popstate", handlePopState);

    const handleResetView = () => {
      setViewingContractId(null);
      setViewingContract(null);
      setActiveTab("contract-requests");
    };

    window.addEventListener("dashboard-reset-view", handleResetView);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("dashboard-reset-view", handleResetView);
    };
  }, []);

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
    fetchLands();
    fetchIncomingContracts();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchCrops(selectedCategory);
    }
  }, [selectedCategory]);

  // KPI Computations based strictly on existing state
  const activeContractsList = incomingContracts.filter(
    (c) => c.status === "ACTIVE" || c.status === "ACCEPTED"
  );
  const pendingProposalsList = incomingContracts.filter(
    (c) => c.status === "PENDING_APPROVAL"
  );
  const activeContractsCount = activeContractsList.length;
  const totalValuation = activeContractsList.reduce(
    (acc, curr) => acc + (curr.proposedPrice || 0),
    0
  );
  const totalLandArea = lands.reduce((acc, curr) => acc + (curr.size || 0), 0);

  return (
    <div className="min-h-screen w-full bg-[#F6F8F3] px-4 sm:px-6 lg:px-8 xl:px-10 py-8 text-[#17251B] font-sans">
      
      {/* Top Console Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#ECFDF3] border border-[#22C55E]/30 rounded-xl text-[#166534]">
              <Sprout className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17251B] tracking-tight">
              Landowner & Cultivation Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#647067] mt-1">
            Manage land parcels, review contract proposals, track crop progress, and record harvest evidence.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsAdding(true);
              resetLandForm();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Land Parcel
          </button>
        </div>
      </div>

      {/* Main Full-Width Navigation Tabs */}
      <div className="border-b border-[#E2E8E3] mb-8 bg-white rounded-xl p-1 shadow-sm">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "Overview Summary", icon: LayoutGridIcon },
            { id: "contract-requests", label: `Contract Proposals (${incomingContracts.length})`, icon: FileText },
            { id: "lands", label: `Registered Parcels (${lands.length})`, icon: MapPin },
            { id: "crops", label: "Crop Catalog", icon: Sprout },
          ].map((tabItem) => {
            const isActive = activeTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => setActiveTab(tabItem.id as Tab)}
                className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[#166534] text-[#166534] bg-[#ECFDF3]/50 rounded-t-lg"
                    : "border-transparent text-[#647067] hover:text-[#17251B] hover:bg-[#F6F8F3] rounded-t-lg"
                }`}
              >
                <span>{tabItem.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 4-Card Responsive KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* KPI 1: Active Contracts */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#647067]">
                <span className="text-xs font-bold uppercase tracking-wider">Active Contracts</span>
                <span className="p-2 bg-[#ECFDF3] text-[#166534] rounded-xl border border-[#22C55E]/30">
                  <ShieldCheck className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-[#17251B]">{activeContractsCount}</div>
                <p className="text-xs text-[#647067] mt-1 font-semibold">
                  {incomingContracts.length} total proposals in records
                </p>
              </div>
            </div>

            {/* KPI 2: Contract Valuation */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#647067]">
                <span className="text-xs font-bold uppercase tracking-wider">Total Contracted Price</span>
                <span className="p-2 bg-[#ECFDF3] text-[#166534] rounded-xl border border-[#22C55E]/30">
                  <DollarSign className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-[#166534]">
                  ₹{totalValuation.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-[#647067] mt-1 font-semibold">Valuation of active crop agreements</p>
              </div>
            </div>

            {/* KPI 3: Total Land Registered */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#647067]">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Acreage</span>
                <span className="p-2 bg-[#ECFDF3] text-[#166534] rounded-xl border border-[#22C55E]/30">
                  <MapPin className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-[#17251B]">
                  {totalLandArea.toFixed(1)} <span className="text-lg font-bold text-[#647067]">Acres</span>
                </div>
                <p className="text-xs text-[#647067] mt-1 font-semibold">{lands.length} verified land parcels</p>
              </div>
            </div>

            {/* KPI 4: Pending Proposals */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#647067]">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Proposals</span>
                <span className="p-2 bg-[#FEF3C7] text-[#F59E0B] rounded-xl border border-[#F59E0B]/30">
                  <Clock className="w-5 h-5" />
                </span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-[#F59E0B]">
                  {pendingProposalsList.length}
                </div>
                <p className="text-xs text-[#647067] mt-1 font-semibold">Awaiting acceptance/rejection decision</p>
              </div>
            </div>
          </div>

          {/* 2-Column Responsive Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (7 cols): Active Contracts & Proposal Directory */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4 mb-6">
                  <div>
                    <h3 className="font-extrabold text-lg text-[#17251B]">Recent Contract Proposals</h3>
                    <p className="text-xs text-[#647067]">Proposals submitted by buyers for your land parcels</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("contract-requests")}
                    className="text-xs font-bold text-[#166534] hover:underline flex items-center gap-1"
                  >
                    View All ({incomingContracts.length}) <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingIncoming ? (
                  <div className="py-12 text-center text-[#647067]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
                    <p className="text-xs">Loading proposals...</p>
                  </div>
                ) : incomingContracts.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#E2E8E3] rounded-2xl p-6">
                    <FileText className="w-10 h-10 text-[#166534] mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-bold text-[#17251B]">No proposals found</p>
                    <p className="text-xs text-[#647067] mt-1">Make sure your land parcels are registered as Available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingContracts.slice(0, 3).map((contract) => (
                      <div
                        key={contract.id}
                        className="bg-[#F6F8F3] p-5 rounded-2xl border border-[#E2E8E3] hover:border-[#22C55E]/40 transition-all"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E3] pb-3">
                          <div>
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2 py-0.5 rounded">
                              {contract.crop?.name || "Crop"} Proposal
                            </span>
                            <h4 className="font-bold text-base text-[#17251B] mt-1">
                              Contract #{contract.id.substring(0, 8).toUpperCase()}
                            </h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            contract.status === "ACTIVE" ? "bg-[#166534] text-white" :
                            contract.status === "ACCEPTED" ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30" :
                            contract.status === "PENDING_APPROVAL" ? "bg-[#FEF3C7] text-[#F59E0B] border border-[#F59E0B]/30" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {contract.status.replace("_", " ")}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3 text-xs">
                          <div>
                            <span className="text-[#647067] block uppercase font-bold text-[10px]">Buyer Name</span>
                            <span className="font-bold text-[#17251B]">{contract.buyer?.name || "Registered Buyer"}</span>
                          </div>
                          <div>
                            <span className="text-[#647067] block uppercase font-bold text-[10px]">Land Parcel</span>
                            <span className="font-bold text-[#17251B]">{contract.land?.name || "Plot"} ({contract.landArea} Acres)</span>
                          </div>
                          <div>
                            <span className="text-[#647067] block uppercase font-bold text-[10px]">Proposed Price</span>
                            <span className="font-bold text-[#166534]">₹{contract.proposedPrice.toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8E3]">
                          {contract.status === "PENDING_APPROVAL" && (
                            <>
                              <button
                                onClick={() => handleRejectContract(contract.id)}
                                className="px-3 py-1.5 border border-[#DC2626] text-[#DC2626] hover:bg-[#FEE2E2] font-bold rounded-xl text-xs transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => setShowAcceptConfirmId(contract.id)}
                                className="px-3.5 py-1.5 bg-[#166534] text-white hover:bg-[#14532d] font-bold rounded-xl text-xs transition-all cursor-pointer"
                              >
                                Accept Proposal
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => openContractModal(contract.id)}
                            className="px-3.5 py-1.5 bg-white border border-[#E2E8E3] text-[#166534] hover:bg-[#ECFDF3] font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            View Contract
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (5 cols): Registered Land Parcels & Workers */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Land Parcels Summary */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4 mb-4">
                  <h3 className="font-extrabold text-base text-[#17251B]">Your Land Parcels</h3>
                  <button
                    onClick={() => setActiveTab("lands")}
                    className="text-xs font-bold text-[#166534] hover:underline"
                  >
                    Manage ({lands.length})
                  </button>
                </div>

                <div className="space-y-3">
                  {lands.slice(0, 3).map((land) => (
                    <div
                      key={land.id}
                      className="p-4 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-[#17251B]">{land.name}</h4>
                        <p className="text-xs text-[#647067] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#166534]" /> {land.village}, {land.district}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-sm text-[#166534]">{land.size} {land.unit}s</span>
                        <span className={`block text-[10px] font-bold uppercase mt-0.5 ${
                          land.status === "UNDER_CONTRACT" ? "text-[#166534]" : "text-[#F59E0B]"
                        }`}>
                          {land.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Field Workers Activity Log */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm">
                <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4 mb-4">
                  <h3 className="font-extrabold text-base text-[#17251B] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#166534]" /> Workforce Activity
                  </h3>
                  <span className="text-xs text-[#647067] font-semibold">{workers.length} active today</span>
                </div>

                <div className="space-y-3">
                  {workers.map((worker) => (
                    <div key={worker.id} className="p-3 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#17251B]">{worker.name}</span>
                        <span className="text-[10px] font-bold bg-[#ECFDF3] text-[#166534] px-2 py-0.5 rounded uppercase">
                          {worker.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#647067]">{worker.task}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#647067] mt-2 font-semibold">
                        <span>Logged: {worker.timeLogged}</span>
                        <span>Field Done: {worker.fieldDone}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* CONTRACT PROPOSALS TAB CONTENT */}
      {activeTab === "contract-requests" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#17251B]">Contract Proposals & Agreements</h2>
              <p className="text-xs text-[#647067] mt-1">Review incoming buyer proposals, accept terms, track progress, or submit harvest logs.</p>
            </div>
            <button
              onClick={fetchIncomingContracts}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F6F8F3] hover:bg-[#ECFDF3] border border-[#E2E8E3] text-[#166534] font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" /> Refresh Proposals
            </button>
          </div>

          {loadingIncoming ? (
            <div className="py-20 text-center text-[#647067]">
              <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-3" />
              <p className="text-sm font-semibold">Fetching contract agreements...</p>
            </div>
          ) : incomingContracts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E2E8E3] text-center max-w-xl mx-auto my-8">
              <Compass className="w-12 h-12 mb-3 text-[#166534] mx-auto" />
              <h4 className="font-bold text-[#17251B] text-lg mb-1">No Contract Proposals</h4>
              <p className="text-xs text-[#647067]">Ensure your land parcels are registered as available so buyers can send contract proposals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {incomingContracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm overflow-hidden"
                >
                  <div className="bg-[#F6F8F3] p-5 border-b border-[#E2E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded">
                        {contract.crop?.name || "Crop"} Proposal
                      </span>
                      <h3 className="font-extrabold text-lg text-[#17251B] mt-1.5 flex items-center gap-2">
                        Contract #{contract.id.substring(0, 8).toUpperCase()}
                        <span className="text-[10px] bg-white border border-[#E2E8E3] text-[#17251B] px-2 py-0.5 rounded font-semibold">
                          v{contract.revision || 1}
                        </span>
                      </h3>
                      <p className="text-xs text-[#647067] mt-0.5">
                        Proposed by Buyer: <strong>{contract.buyer?.name || "Registered Buyer"}</strong> ({contract.buyer?.phone || "N/A"})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        contract.status === "PENDING_APPROVAL" ? "bg-[#FEF3C7] text-[#F59E0B] border border-[#F59E0B]/30" :
                        contract.status === "ACCEPTED" ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30" :
                        contract.status === "ACTIVE" ? "bg-[#166534] text-white" :
                        contract.status === "REJECTED" ? "bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/30" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {contract.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-xs">
                    <div>
                      <span className="text-[#647067] block uppercase font-bold tracking-wider mb-1">Land Allocated</span>
                      <p className="font-bold text-[#17251B] text-sm">{contract.land?.name || "Plot Location"}</p>
                      <p className="text-[#647067] mt-0.5">{contract.landArea} Acres allocated ({contract.land?.village}, {contract.land?.district})</p>
                    </div>

                    <div>
                      <span className="text-[#647067] block uppercase font-bold tracking-wider mb-1">Target Yield</span>
                      <p className="font-bold text-[#17251B] text-sm">{contract.allocatedQuantity?.toFixed(1)} Tonnes</p>
                      <p className="text-[#647067] mt-0.5">Agreed delivery volume</p>
                    </div>

                    <div>
                      <span className="text-[#647067] block uppercase font-bold tracking-wider mb-1">Proposed Price</span>
                      <p className="font-bold text-[#166534] text-sm">₹{contract.proposedPrice?.toLocaleString("en-IN")}</p>
                      <p className="text-[#647067] mt-0.5">Agreed valuation payout</p>
                    </div>

                    <div>
                      <span className="text-[#647067] block uppercase font-bold tracking-wider mb-1">Timeline</span>
                      <p className="font-bold text-[#17251B] text-sm">Start: {new Date(contract.startDate).toLocaleDateString()}</p>
                      <p className="text-[#647067] mt-0.5">Harvest: {new Date(contract.expectedHarvestDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {contract.notes && (
                    <div className="px-5 pb-5">
                      <div className="bg-[#F6F8F3] border border-[#E2E8E3] p-3.5 rounded-xl text-xs text-[#17251B]">
                        <strong>Proposal Note:</strong> "{contract.notes}"
                      </div>
                    </div>
                  )}

                  {contract.status === "REJECTED" && contract.rejectionReason && (
                    <div className="px-5 pb-5">
                      <div className="bg-[#FEE2E2] border border-[#DC2626]/30 p-3.5 rounded-xl text-xs text-[#DC2626]">
                        <strong>Rejection Reason:</strong> "{contract.rejectionReason}"
                      </div>
                    </div>
                  )}

                  <div className="bg-[#F6F8F3] px-5 py-3 border-t border-[#E2E8E3] flex flex-wrap items-center justify-end gap-3">
                    {contract.status === "PENDING_APPROVAL" && (
                      <>
                        <button
                          onClick={() => handleRejectContract(contract.id)}
                          className="px-4 py-2 border border-[#DC2626] text-[#DC2626] font-bold rounded-xl hover:bg-[#FEE2E2] text-xs transition-all cursor-pointer"
                        >
                          Reject Proposal
                        </button>
                        <button
                          onClick={() => setShowAcceptConfirmId(contract.id)}
                          className="px-4 py-2 bg-[#166534] text-white hover:bg-[#14532d] font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                        >
                          Accept Proposal
                        </button>
                      </>
                    )}
                    {contract.status === "ACCEPTED" && (
                      <span className="text-xs text-[#166534] font-bold italic">
                        Waiting for Buyer Activation
                      </span>
                    )}
                    {contract.status === "ACTIVE" && (
                      <div className="flex flex-wrap items-center justify-between w-full gap-3">
                        <span className="text-xs text-[#166534] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Contract Active & Running
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openContractModal(contract.id)}
                            className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#166534] hover:bg-[#ECFDF3] font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            View Contract
                          </button>
                          <button
                            onClick={() => {
                              setShowProgressModalContract(contract);
                              setProgressStage("LAND_PREPARATION");
                              setProgressNotes("");
                            }}
                            className="px-4 py-2 bg-[#166534] text-white hover:bg-[#14532d] font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            Update Farm Progress
                          </button>
                          <button
                            onClick={() => handleCompleteContract(contract.id)}
                            className="px-4 py-2 bg-[#F59E0B] text-white hover:bg-[#d97706] font-bold rounded-xl text-xs transition-all cursor-pointer"
                          >
                            Complete Contract
                          </button>
                        </div>
                      </div>
                    )}
                    {contract.status === "COMPLETED" && (
                      <button
                        onClick={() => openContractModal(contract.id)}
                        className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#166534] hover:bg-[#ECFDF3] font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        View Summary
                      </button>
                    )}
                    {(contract.status === "REJECTED" || contract.status === "CANCELLED") && (
                      <button
                        onClick={() => openContractModal(contract.id)}
                        className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#17251B] hover:bg-[#F6F8F3] font-bold rounded-xl text-xs transition-all cursor-pointer"
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

      {/* REGISTERED LAND PARCELS TAB CONTENT */}
      {activeTab === "lands" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#17251B]">Registered Land Parcels</h2>
              <p className="text-xs text-[#647067] mt-1">Manage your agricultural land records for contract matching.</p>
            </div>
            <button
              onClick={() => {
                setIsAdding(true);
                resetLandForm();
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Land Parcel
            </button>
          </div>

          {loadingLands ? (
            <div className="py-20 text-center text-[#647067]">
              <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-3" />
              <p className="text-sm font-semibold">Loading registered land parcels...</p>
            </div>
          ) : lands.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E2E8E3] text-center max-w-xl mx-auto my-8">
              <MapPin className="w-12 h-12 mb-3 text-[#166534] mx-auto" />
              <h4 className="font-bold text-[#17251B] text-lg mb-1">No Land Parcels Registered</h4>
              <p className="text-xs text-[#647067] mb-4">Click below to add your first land parcel with GPS coordinates.</p>
              <button
                onClick={() => {
                  setIsAdding(true);
                  resetLandForm();
                }}
                className="px-4 py-2 bg-[#166534] text-white text-xs font-bold rounded-xl"
              >
                Add Land Parcel
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lands.map((land) => (
                <div
                  key={land.id}
                  className="bg-white rounded-2xl border border-[#E2E8E3] shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        land.status === "AVAILABLE" ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30" :
                        land.status === "UNDER_CONTRACT" ? "bg-[#166534] text-white" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {land.status.replace("_", " ")}
                      </span>
                      <span className="text-sm font-extrabold text-[#166534]">
                        {land.size} {land.unit}s
                      </span>
                    </div>

                    <h3 className="font-extrabold text-lg text-[#17251B] mb-1">{land.name}</h3>
                    <p className="text-xs text-[#647067] flex items-center gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                      {land.village}, {land.district}, {land.state}
                    </p>

                    <p className="text-xs text-[#647067] line-clamp-2 bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                      {land.description || "No description provided."}
                    </p>
                  </div>

                  <div className="bg-[#F6F8F3] px-6 py-3 border-t border-[#E2E8E3] flex justify-end gap-2">
                    <button
                      onClick={() => startEditingLand(land)}
                      className="p-2 bg-white border border-[#E2E8E3] hover:bg-[#ECFDF3] text-[#166534] rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Edit land parcel"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLand(land.id)}
                      className="p-2 bg-white border border-[#E2E8E3] hover:bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-bold transition-all cursor-pointer"
                      title="Delete land parcel"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CROP CATALOG TAB CONTENT */}
      {activeTab === "crops" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm">
            <h2 className="text-xl font-extrabold text-[#17251B] mb-1">Available Crop Categories & Metadata</h2>
            <p className="text-xs text-[#647067]">Explore supported contract crops and standard cultivation durations.</p>

            <div className="flex gap-2 overflow-x-auto scrollbar-none mt-6 pb-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id || selectedCategory?.name === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      fetchCrops(cat);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? "bg-[#166534] text-white shadow-sm"
                        : "bg-[#F6F8F3] text-[#647067] hover:bg-[#E2E8E3] border border-[#E2E8E3]"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {loadingCrops ? (
            <div className="py-12 text-center text-[#647067]">
              <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
              <p className="text-xs">Loading crops...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {crops.map((crop) => (
                <div key={crop.id} className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2 py-0.5 rounded">
                      {selectedCategory?.name || "Crop"}
                    </span>
                    <span className="text-xs font-bold text-[#647067]">
                      {crop.durationDays} Days Duration
                    </span>
                  </div>
                  <h3 className="font-extrabold text-lg text-[#17251B]">{crop.name}</h3>
                  <p className="text-xs text-[#647067] bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                    {crop.description || "Standard contract farming crop model."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD / EDIT LAND MODAL OVERLAY */}
      {(isAdding || editingLand) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-2xl w-full my-8 animate-in slide-in-from-bottom-4 duration-300 relative">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4 mb-6">
              <h3 className="text-xl font-extrabold text-[#17251B]">
                {editingLand ? "Edit Land Parcel Parameters" : "Register New Land Parcel"}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingLand(null);
                }}
                className="p-2 rounded-full hover:bg-[#F6F8F3] text-[#647067]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-[#FEE2E2] border border-[#DC2626]/30 text-[#DC2626] rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={editingLand ? handleEditLandSubmit : handleAddLandSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Parcel Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. North Field Sector A"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Area Size</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      placeholder="e.g. 5.5"
                      className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Unit</label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value as any)}
                      className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                    >
                      <option value="ACRE">Acre</option>
                      <option value="HECTARE">Hectare</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    placeholder="Village Name"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={formDistrict}
                    onChange={(e) => setFormDistrict(e.target.value)}
                    placeholder="District"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formState}
                    onChange={(e) => setFormState(e.target.value)}
                    placeholder="State"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Full Address / Survey Number"
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLat}
                    onChange={(e) => setFormLat(e.target.value)}
                    placeholder="e.g. 30.7333"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLng}
                    onChange={(e) => setFormLng(e.target.value)}
                    placeholder="e.g. 76.7794"
                    className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#17251B] uppercase tracking-wider mb-1">Description / Irrigation Details</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Tubewell irrigation, canal access, soil type..."
                  className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none focus:border-[#166534]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8E3]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingLand(null);
                  }}
                  className="px-4 py-2 border border-[#E2E8E3] text-[#647067] font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-6 py-2 bg-[#166534] text-white font-bold rounded-xl hover:bg-[#14532d]"
                >
                  {formSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingLand ? "Update Parcel" : "Save Land Parcel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRACT DETAILS / TIMELINE MODAL OVERLAY - Full Width 96vw / 1400px */}
      {viewingContractId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl w-[96vw] max-w-[1400px] h-[90vh] flex flex-col min-h-0 relative animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Modal Fixed Top Header */}
            <div className="p-6 sm:p-8 pb-4 border-b border-[#E2E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => closeContractModal()}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F6F8F3] hover:bg-[#ECFDF3] border border-[#E2E8E3] hover:border-[#22C55E] text-[#166534] font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 z-20"
                  title="Back to Dashboard"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Back to Dashboard</span>
                </button>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded">
                    {viewingContract?.crop?.name || "Crop"} Contract Details
                  </span>
                  <h3 className="text-2xl font-extrabold text-[#17251B] mt-1 flex items-center gap-3">
                    Contract #{viewingContractId.substring(0, 8).toUpperCase()}
                    {viewingContract && (
                      <span className="text-xs bg-[#F6F8F3] border border-[#E2E8E3] text-[#17251B] px-2.5 py-0.5 rounded font-semibold">
                        v{viewingContract.revision}
                      </span>
                    )}
                  </h3>
                  {viewingContract && (
                    <p className="text-xs text-[#647067] mt-1 uppercase tracking-wider font-semibold">
                      Current Status: <span className="text-[#166534] font-bold">{viewingContract.status.replace("_", " ")}</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => closeContractModal()}
                className="p-2 rounded-full hover:bg-[#F6F8F3] text-[#647067] hover:text-[#17251B] transition-colors cursor-pointer self-start sm:self-auto"
                title="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {loadingViewingContract ? (
              <div className="flex flex-col items-center justify-center flex-1 py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#166534]" />
                <p className="text-xs text-[#647067] mt-3">Fetching contract details...</p>
              </div>
            ) : viewingContract ? (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                {/* Fixed Sticky Tab Navigation Bar */}
                <div className="px-6 sm:px-8 pt-3 border-b border-[#E2E8E3] bg-white sticky top-0 z-10 shrink-0">
                  <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 text-sm font-semibold">
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
                          className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer text-xs sm:text-sm ${
                            isActive
                              ? "bg-[#166534] text-white font-bold shadow-sm"
                              : "text-[#647067] hover:text-[#17251B] hover:bg-[#F6F8F3]"
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Scrollable Content Section */}
                <div className="p-6 sm:p-8 flex-1 overflow-y-auto min-h-0 space-y-6">
                  
                  {activeDetailTab === "Overview" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="bg-[#F6F8F3] border border-[#E2E8E3] p-6 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold text-[#17251B] uppercase tracking-wider border-b border-[#E2E8E3] pb-2">
                          Contract Timeline & Valuation
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-medium">
                          <div>
                            <span className="text-[#647067] block font-bold uppercase">Proposed Start Date</span>
                            <span className="font-extrabold text-sm text-[#17251B]">{new Date(viewingContract.startDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[#647067] block font-bold uppercase">Target Harvest Date</span>
                            <span className="font-extrabold text-sm text-[#17251B]">{new Date(viewingContract.expectedHarvestDate).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-[#647067] block font-bold uppercase">Contract Valuation</span>
                            <span className="font-extrabold text-sm text-[#166534]">₹{viewingContract.proposedPrice.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      {viewingContract.notes && (
                        <div className="bg-[#F6F8F3] border border-[#E2E8E3] p-4 rounded-xl text-xs text-[#17251B]">
                          <strong>Negotiation Notes:</strong> "{viewingContract.notes}"
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Financials" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {viewingContractOverview?.financialSummary ? (
                        <div className="bg-[#F6F8F3] border border-[#E2E8E3] p-6 rounded-2xl space-y-4 text-xs">
                          <div className="flex justify-between items-center border-b border-[#E2E8E3] pb-2">
                            <h4 className="text-xs font-bold text-[#17251B] uppercase tracking-wider font-bold">Financial Breakdown</h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              viewingContractOverview.financialSummary.isConfigured ? "bg-[#ECFDF3] text-[#166534]" : "bg-amber-100 text-amber-800"
                            }`}>
                              {viewingContractOverview.financialSummary.isConfigured ? "Agreed Budget" : "Tentative"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-[#E2E8E3]">
                            <div>
                              <span className="text-[10px] text-[#647067] block font-semibold mb-0.5">Landowner Amount</span>
                              <span className="font-bold text-[#166534] text-sm">₹{viewingContractOverview.financialSummary.landownerAmount?.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#647067] block font-semibold mb-0.5">Workforce Budget</span>
                              <span className="font-semibold text-[#17251B]">₹{viewingContractOverview.financialSummary.workforceBudget?.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#647067] block font-semibold mb-0.5">Logistics Budget</span>
                              <span className="font-semibold text-[#17251B]">₹{viewingContractOverview.financialSummary.logisticsBudget?.toLocaleString("en-IN")}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-[#647067] block font-semibold mb-0.5">Total Valuation</span>
                              <span className="font-bold text-[#166534] text-sm">₹{viewingContractOverview.financialSummary.totalProposedPrice?.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#647067]">Financial breakdown data currently loading.</p>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Yield" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {viewingContractOverview?.yieldSummary ? (
                        <div className="bg-[#F6F8F3] border border-[#E2E8E3] p-6 rounded-2xl space-y-4 text-xs">
                          <h4 className="text-xs font-bold text-[#17251B] uppercase tracking-wider flex items-center justify-between border-b border-[#E2E8E3] pb-2 font-bold">
                            <span>Crop Production & Harvest Summary</span>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-[#ECFDF3] text-[#166534]">
                              {viewingContractOverview.yieldSummary.fulfillmentStatus}
                            </span>
                          </h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-[#E2E8E3]">
                              <span className="text-[10px] text-[#647067] block uppercase font-bold tracking-wide">Target Agreed Yield</span>
                              <span className="font-bold text-[#17251B] text-base">
                                {viewingContractOverview.yieldSummary.estimatedQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.estimatedQuantity.toFixed(2)} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                  : "Unavailable"}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-[#E2E8E3]">
                              <span className="text-[10px] text-[#647067] block uppercase font-bold tracking-wide">Actual Harvested Record</span>
                              <span className="font-bold text-[#166534] text-base">
                                {viewingContractOverview.yieldSummary.actualQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.actualQuantity.toFixed(2)} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                  : "Not recorded yet"}
                              </span>
                            </div>
                          </div>

                          {/* Harvest Submission Form for Landowner */}
                          <div className="bg-white p-6 rounded-xl border border-[#22C55E]/30 space-y-3">
                            <h5 className="font-bold text-sm text-[#17251B]">Record Actual Harvest Yield</h5>
                            <p className="text-xs text-[#647067]">Submit final harvested quantity for buyer verification.</p>
                            
                            {harvestError && (
                              <div className="p-3 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
                                {harvestError}
                              </div>
                            )}

                            <form onSubmit={handleRecordHarvest} className="flex flex-col sm:flex-row gap-3">
                              <input
                                type="number"
                                step="0.01"
                                required
                                value={actualHarvestQty}
                                onChange={(e) => setActualHarvestQty(e.target.value)}
                                placeholder={`Enter quantity in ${viewingContract.demand?.quantityUnit || "Tonnes"}`}
                                className="flex-1 p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-xs text-[#17251B] font-bold outline-none"
                              />
                              <button
                                type="submit"
                                disabled={savingHarvest}
                                className="px-5 py-3 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs transition-all cursor-pointer shrink-0"
                              >
                                {savingHarvest ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Harvest Record"}
                              </button>
                            </form>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-[#647067]">Yield summary data loading...</p>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Milestones" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {loadingMilestones ? (
                        <div className="py-12 text-center text-[#647067]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#166534] mx-auto mb-2" />
                          <p className="text-xs">Loading cultivation milestones...</p>
                        </div>
                      ) : milestonesLoadError ? (
                        <div className="p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
                          {milestonesLoadError}
                        </div>
                      ) : viewingContractMilestones.length === 0 ? (
                        <p className="text-xs text-[#647067]">No cultivation milestones generated yet.</p>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-[#17251B] uppercase tracking-wider border-b border-[#E2E8E3] pb-2">
                            Cultivation Progress Timeline
                          </h4>
                          <div className="grid grid-cols-1 gap-3">
                            {viewingContractMilestones.map((m, idx) => (
                              <div
                                key={m.id || idx}
                                className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
                                  m.status === "COMPLETED" ? "bg-[#ECFDF3] border-[#22C55E]/30 text-[#166534]" :
                                  m.status === "IN_PROGRESS" ? "bg-[#FEF3C7] border-[#F59E0B]/30 text-[#F59E0B]" :
                                  "bg-[#F6F8F3] border-[#E2E8E3] text-[#647067]"
                                }`}
                              >
                                <div>
                                  <span className="font-extrabold text-sm block">{m.stage.replace("_", " ")}</span>
                                  <span className="text-[10px] text-[#647067]">Due: {new Date(m.targetCompletionDate).toLocaleDateString()}</span>
                                </div>
                                <span className="font-bold text-xs uppercase px-2.5 py-1 rounded bg-white border border-[#E2E8E3]">
                                  {m.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Tasks" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      {loadingTasks ? (
                        <div className="py-12 text-center text-[#647067]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#166534] mx-auto mb-2" />
                          <p className="text-xs">Loading farm tasks...</p>
                        </div>
                      ) : tasksLoadError ? (
                        <div className="p-4 bg-[#FEE2E2] text-[#DC2626] rounded-xl text-xs font-semibold">
                          {tasksLoadError}
                        </div>
                      ) : viewingContractTasks.length === 0 ? (
                        <p className="text-xs text-[#647067]">No tasks recorded for this contract.</p>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-[#17251B] uppercase tracking-wider border-b border-[#E2E8E3] pb-2">
                            Field Action Items & Task Status
                          </h4>
                          <div className="space-y-3">
                            {viewingContractTasks.map((t) => (
                              <div key={t.id} className="p-4 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                                <div>
                                  <h5 className="font-bold text-sm text-[#17251B]">{t.title}</h5>
                                  <p className="text-[#647067] mt-0.5">{t.description || "Field operation task."}</p>
                                  <span className="text-[10px] text-[#647067] block mt-1">Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <select
                                    disabled={updatingTaskId === t.id}
                                    value={t.status}
                                    onChange={(e) => handleUpdateTaskStatus(t.id, e.target.value)}
                                    className="p-2 bg-white border border-[#E2E8E3] rounded-xl text-xs font-bold text-[#17251B] outline-none"
                                  >
                                    <option value="PENDING">PENDING</option>
                                    <option value="IN_PROGRESS">IN PROGRESS</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                  </select>
                                  {updatingTaskId === t.id && <Loader2 className="w-4 h-4 animate-spin text-[#166534]" />}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Progress" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="bg-[#F6F8F3] p-6 rounded-2xl border border-[#E2E8E3] space-y-4">
                        <h4 className="font-bold text-sm text-[#17251B]">Log New Farm Progress Stage</h4>
                        <form onSubmit={handlePostProgressUpdate} className="space-y-3 text-xs">
                          <div>
                            <label className="block font-bold text-[#17251B] mb-1">Cultivation Stage</label>
                            <select
                              value={progressStage}
                              onChange={(e) => setProgressStage(e.target.value)}
                              className="w-full p-3 bg-white border border-[#E2E8E3] rounded-xl text-[#17251B] font-bold outline-none"
                            >
                              <option value="LAND_PREPARATION">Land Preparation</option>
                              <option value="SOWING">Sowing / Planting</option>
                              <option value="GERMINATION">Germination</option>
                              <option value="VEGETATIVE">Vegetative Growth</option>
                              <option value="FLOWERING">Flowering</option>
                              <option value="HARVEST_READY">Harvest Ready</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-bold text-[#17251B] mb-1">Stage Notes & Observations</label>
                            <textarea
                              rows={2}
                              value={progressNotes}
                              onChange={(e) => setProgressNotes(e.target.value)}
                              placeholder="Describe crop height, soil condition, irrigation..."
                              className="w-full p-3 bg-white border border-[#E2E8E3] rounded-xl text-[#17251B] font-semibold outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={submittingProgress}
                            className="px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs cursor-pointer"
                          >
                            {submittingProgress ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Post Stage Update"}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "Monitoring" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="bg-[#F6F8F3] p-6 rounded-2xl border border-[#E2E8E3] space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b border-[#E2E8E3] pb-2">
                          <h4 className="font-bold text-[#17251B] uppercase tracking-wider">Phase 6.2 Contract Health Status</h4>
                          <span className="px-2.5 py-0.5 bg-[#ECFDF3] text-[#166534] rounded font-bold uppercase">
                            ON TRACK
                          </span>
                        </div>
                        <p className="text-[#647067]">
                          Automated monitoring engine verifies timeline adherence, task completions, and temperature range requirements.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Modal Fixed Footer */}
                <div className="px-6 sm:px-8 py-4 border-t border-[#E2E8E3] flex justify-end shrink-0 bg-white rounded-b-2xl">
                  <button
                    onClick={() => closeContractModal()}
                    className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl shadow-sm text-xs cursor-pointer transition-all"
                  >
                    Close View
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-8 text-center space-y-4">
                <p className="text-xs text-[#DC2626] font-semibold">Error displaying contract details.</p>
                <button
                  onClick={() => closeContractModal()}
                  className="px-4 py-2 bg-[#166534] text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACCEPT CONFIRMATION DIALOG */}
      {showAcceptConfirmId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8E3] max-w-md w-full text-center space-y-4">
            <ShieldCheck className="w-12 h-12 text-[#166534] mx-auto" />
            <h3 className="text-xl font-extrabold text-[#17251B]">Accept Contract Proposal?</h3>
            <p className="text-xs text-[#647067]">
              By accepting this proposal, you agree to allocate your land parcel for this crop cycle under the proposed terms.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowAcceptConfirmId(null)}
                className="px-4 py-2 border border-[#E2E8E3] text-[#647067] font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAcceptContract(showAcceptConfirmId)}
                className="px-6 py-2 bg-[#166534] text-white font-bold rounded-xl text-xs hover:bg-[#14532d]"
              >
                Confirm & Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT PROPOSAL REASON DIALOG */}
      {rejectingContractId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E2E8E3] max-w-md w-full space-y-4">
            <h3 className="text-xl font-extrabold text-[#17251B]">Reject Contract Proposal</h3>
            <p className="text-xs text-[#647067]">Please state your reason for rejecting this buyer proposal.</p>
            <textarea
              rows={3}
              value={rejectionText}
              onChange={(e) => setRejectionText(e.target.value)}
              placeholder="e.g. Price too low, timeline conflict..."
              className="w-full p-3 bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-xs font-semibold outline-none text-[#17251B]"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingContractId(null)}
                className="px-4 py-2 border border-[#E2E8E3] text-[#647067] font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={!rejectionText.trim()}
                className="px-6 py-2 bg-[#DC2626] text-white font-bold rounded-xl text-xs hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper LayoutGridIcon
function LayoutGridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
