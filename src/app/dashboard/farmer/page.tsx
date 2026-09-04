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
  UserCheck,
  Clock,
  FileText,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Filter,
  RefreshCw,
  Trash2,
  Search
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
  const [contractSearchTerm, setContractSearchTerm] = useState("");
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
  const [activeDetailTab, setActiveDetailTab] = useState<"Overview" | "Financials" | "Yield" | "Milestones" | "Tasks" | "Progress" | "Monitoring" | "Workers">("Overview");
  
  // Worker Hiring & Management states
  const [workerJobs, setWorkerJobs] = useState<any[]>([]);
  const [loadingWorkerJobs, setLoadingWorkerJobs] = useState(false);
  const [showCreateWorkerJobModal, setShowCreateWorkerJobModal] = useState(false);
  const [jobWorkersRequired, setJobWorkersRequired] = useState(3);
  const [jobWorkingHours, setJobWorkingHours] = useState("08:00 AM – 04:00 PM");
  const [jobDescription, setJobDescription] = useState("");
  const [submittingWorkerJob, setSubmittingWorkerJob] = useState(false);
  const [workerJobError, setWorkerJobError] = useState("");
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Phase 7.1 Harvest Receipts & Collection Receiving states
  const [viewingContractReceipts, setViewingContractReceipts] = useState<any[]>([]);
  const [showCenterReceivingModal, setShowCenterReceivingModal] = useState(false);
  const [collectionCenters, setCollectionCenters] = useState<any[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [rcvGrossWeight, setRcvGrossWeight] = useState("");
  const [rcvTareWeight, setRcvTareWeight] = useState("");
  const [rcvUnit, setRcvUnit] = useState<"KG" | "QUINTAL" | "TONNE">("TONNE");
  const [rcvNotes, setRcvNotes] = useState("");
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [rcvError, setRcvError] = useState("");
  
  // Farmer-Driven Cultivation Flow states ("Choose What to Grow")
  const [showCultivationModal, setShowCultivationModal] = useState(false);
  const [cultivationStep, setCultivationStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedCultivationLand, setSelectedCultivationLand] = useState<Land | null>(null);
  const [selectedCultivationCrop, setSelectedCultivationCrop] = useState<Crop | null>(null);
  const [selectedCultivationDemand, setSelectedCultivationDemand] = useState<any | null>(null);
  const [cropCategoryFilter, setCropCategoryFilter] = useState("ALL");
  const [cropSearchQuery, setCropSearchQuery] = useState("");
  const [buyerDemands, setBuyerDemands] = useState<any[]>([]);
  const [loadingBuyerDemands, setLoadingBuyerDemands] = useState(false);
  const [submittingCultivationContract, setSubmittingCultivationContract] = useState(false);

  // Farmer Crop Catalog states (Two-Level UI: null = Level 1 Categories, category string = Level 2 Crops)
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<"ALL" | "Vegetables" | "Fruits" | "Flowers" | "Crops" | null>(null);
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");

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

  const fetchCrops = async (category?: CropCategory | string) => {
    setLoadingCrops(true);
    try {
      let url = "/api/crops";
      if (category) {
        const categoryQuery = typeof category === "string" ? category : (category.name || category.id);
        url = `/api/crops?category=${encodeURIComponent(categoryQuery)}`;
      }
      const res = await fetch(url);
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

      try {
        const receiptsRes = await fetch(`/api/contracts/${contractId}/receipts`);
        if (receiptsRes.ok) {
          const receiptsData = await receiptsRes.json();
          setViewingContractReceipts(receiptsData);
        }
      } catch (e) {
        console.error("Error fetching receipts:", e);
      }

      fetchWorkerJobs(contractId);
    } catch (err) {
      console.error("Error fetching contract details:", err);
    } finally {
      setLoadingViewingContract(false);
    }
  };

  const fetchWorkerJobs = async (contractId: string) => {
    setLoadingWorkerJobs(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/worker-jobs`);
      if (res.ok) {
        const data = await res.json();
        setWorkerJobs(data || []);
      }
    } catch (err) {
      console.error("Error fetching worker jobs:", err);
    } finally {
      setLoadingWorkerJobs(false);
    }
  };

  const handleCreateWorkerJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingContract) return;
    setSubmittingWorkerJob(true);
    setWorkerJobError("");
    try {
      const res = await fetch(`/api/contracts/${viewingContract.id}/worker-jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workersRequired: jobWorkersRequired,
          workingHours: jobWorkingHours,
          description: jobDescription,
          startDate: viewingContract.startDate,
          endDate: viewingContract.expectedHarvestDate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to post worker requirement.");
      }

      setShowCreateWorkerJobModal(false);
      setJobDescription("");
      fetchWorkerJobs(viewingContract.id);
    } catch (err: any) {
      setWorkerJobError(err.message || "Error posting job requirement.");
    } finally {
      setSubmittingWorkerJob(false);
    }
  };

  const handleProcessApplication = async (applicationId: string, action: "ACCEPT" | "REJECT") => {
    if (!viewingContract) return;
    setProcessingAppId(applicationId);
    try {
      const res = await fetch(`/api/worker-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action.toLowerCase()} application.`);
      }

      fetchWorkerJobs(viewingContract.id);
    } catch (err: any) {
      alert(err.message || "Error processing application.");
    } finally {
      setProcessingAppId(null);
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

  // Fetch lands, categories, contracts and all crops
  useEffect(() => {
    fetchLands();
    fetchIncomingContracts();
    fetchCategories();
    fetchCrops();
  }, []);

  // Contract search filter (case-insensitive, partial matching across contract ID, crop, buyer, farmer, land, status)
  const filteredIncomingContracts = incomingContracts.filter((contract) => {
    if (!contractSearchTerm.trim()) return true;
    const term = contractSearchTerm.trim().toLowerCase();

    const idMatch = contract.id?.toLowerCase().includes(term);
    const shortIdMatch = contract.id?.substring(0, 8).toLowerCase().includes(term);
    const cropMatch = contract.crop?.name?.toLowerCase().includes(term);
    const buyerMatch = contract.buyer?.name?.toLowerCase().includes(term);
    const farmerMatch = (contract.landowner?.name || contract.farmer?.name || "")?.toLowerCase().includes(term);
    const landMatch = contract.land?.name?.toLowerCase().includes(term);
    const statusMatch = contract.status?.toLowerCase().includes(term) || contract.status?.replace(/_/g, " ").toLowerCase().includes(term);

    return idMatch || shortIdMatch || cropMatch || buyerMatch || farmerMatch || landMatch || statusMatch;
  });

  // Helper & Handler for Farmer-Driven Cultivation Flow
  const fetchMatchingDemands = async (cropId?: string) => {
    setLoadingBuyerDemands(true);
    try {
      const res = await fetch("/api/demands");
      if (res.ok) {
        const data = await res.json();
        setBuyerDemands(data);
      }
    } catch (err) {
      console.error("Error fetching buyer demands:", err);
    } finally {
      setLoadingBuyerDemands(false);
    }
  };

  const handleInitiateFarmerContract = async () => {
    if (!selectedCultivationLand || !selectedCultivationDemand) return;
    setSubmittingCultivationContract(true);
    try {
      const res = await fetch("/api/landowner/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandId: selectedCultivationDemand.id,
          landId: selectedCultivationLand.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit contract proposal.");
      }

      setShowCultivationModal(false);
      fetchIncomingContracts();
      setActiveTab("contract-requests");
      alert("Cultivation agreement proposal submitted successfully!");
    } catch (err: any) {
      alert(err.message || "An error occurred initiating contract proposal.");
    } finally {
      setSubmittingCultivationContract(false);
    }
  };

  const mapCropToHighLevelCategory = (crop: any): "Vegetables" | "Fruits" | "Flowers" | "Crops" => {
    const name = (crop?.name || "").toLowerCase();
    if (
      name.includes("pea") ||
      name.includes("tomato") ||
      name.includes("potato") ||
      name.includes("onion") ||
      name.includes("veg") ||
      name.includes("carrot") ||
      name.includes("cabbage") ||
      name.includes("chilli") ||
      name.includes("pepper") ||
      name.includes("brinjal") ||
      name.includes("eggplant") ||
      name.includes("spinach") ||
      name.includes("cucumber")
    ) {
      return "Vegetables";
    }
    if (
      name.includes("apple") ||
      name.includes("mango") ||
      name.includes("banana") ||
      name.includes("orange") ||
      name.includes("fruit") ||
      name.includes("berry") ||
      name.includes("grape") ||
      name.includes("papaya") ||
      name.includes("guava") ||
      name.includes("citrus")
    ) {
      return "Fruits";
    }
    if (
      name.includes("rose") ||
      name.includes("marigold") ||
      name.includes("jasmine") ||
      name.includes("flower") ||
      name.includes("orchid") ||
      name.includes("lotus") ||
      name.includes("tulip") ||
      name.includes("dahlia") ||
      name.includes("sunflower")
    ) {
      return "Flowers";
    }
    return "Crops";
  };

  const getFarmerCategoryName = (crop: Crop): string => {
    return mapCropToHighLevelCategory(crop);
  };

  const catalogFilteredCrops = crops.filter((crop) => {
    const categoryMatches =
      selectedCatalogCategory === "ALL" ||
      mapCropToHighLevelCategory(crop) === selectedCatalogCategory;

    const searchMatches =
      !catalogSearchQuery.trim() ||
      crop.name.toLowerCase().includes(catalogSearchQuery.trim().toLowerCase());

    return categoryMatches && searchMatches;
  });

  const displayedCrops = crops.filter((crop) => {
    const friendlyCat = getFarmerCategoryName(crop);
    const categoryMatches =
      cropCategoryFilter === "ALL" ||
      friendlyCat.toLowerCase().includes(cropCategoryFilter.toLowerCase()) ||
      (cropCategoryFilter === "Cereals/Crops" && (friendlyCat.includes("Cereal") || friendlyCat.includes("Crop")));

    const searchMatches =
      !cropSearchQuery.trim() ||
      crop.name.toLowerCase().includes(cropSearchQuery.trim().toLowerCase());

    return categoryMatches && searchMatches;
  });

  const matchingDemands = buyerDemands.filter((demand) => {
    if (!selectedCultivationCrop) return true;
    return demand.cropId === selectedCultivationCrop.id || demand.crop?.id === selectedCultivationCrop.id || demand.crop?.name?.toLowerCase() === selectedCultivationCrop.name?.toLowerCase();
  });

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
              setShowCultivationModal(true);
              setCultivationStep(1);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Compass className="w-4 h-4" /> Choose What to Grow
          </button>
          <button
            onClick={() => {
              setIsAdding(true);
              resetLandForm();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E2E8E3] text-[#166534] hover:bg-[#ECFDF3] text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
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
                ) : filteredIncomingContracts.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#E2E8E3] rounded-2xl p-6">
                    <Search className="w-10 h-10 text-[#166534] mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-bold text-[#17251B]">No contracts found</p>
                    <p className="text-xs text-[#647067] mt-1">Try searching by contract ID, crop, buyer, or land.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredIncomingContracts.slice(0, 3).map((contract) => (
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

          {/* Prominent Contract Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-[#E2E8E3] shadow-sm">
            <div className="relative flex items-center w-full">
              <Search className="w-5 h-5 text-[#647067] absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={contractSearchTerm}
                onChange={(e) => setContractSearchTerm(e.target.value)}
                placeholder="Search contracts by contract ID, crop, buyer, farmer, or land..."
                className="w-full pl-11 pr-10 py-3 text-sm bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] placeholder-[#647067] focus:outline-none focus:border-[#166534] focus:bg-white focus:ring-2 focus:ring-[#166534]/20 transition-all font-medium"
              />
              {contractSearchTerm && (
                <button
                  type="button"
                  onClick={() => setContractSearchTerm("")}
                  className="absolute right-3.5 p-1 text-[#647067] hover:text-[#17251B] rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
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
          ) : filteredIncomingContracts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E2E8E3] text-center max-w-xl mx-auto my-8">
              <Search className="w-12 h-12 mb-3 text-[#166534] mx-auto opacity-40" />
              <h4 className="font-bold text-[#17251B] text-lg mb-1">No contracts found</h4>
              <p className="text-xs text-[#647067] mb-4">Try searching by contract ID, crop, buyer, or land.</p>
              <button
                type="button"
                onClick={() => setContractSearchTerm("")}
                className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredIncomingContracts.map((contract) => (
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
                      <p className="font-bold text-[#17251B] text-sm">{contract.allocatedQuantity} {contract.demand?.quantityUnit || "TONNE"}</p>
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

      {/* CROP CATALOG TAB CONTENT (TWO-LEVEL UI) */}
      {activeTab === "crops" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* LEVEL 1: CATEGORY VIEW (Shown when no category/search is active) */}
          {selectedCatalogCategory === null && !catalogSearchQuery.trim() ? (
            <div className="space-y-6">
              {/* Level 1 Header & Search Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-[#17251B] mb-1">Contract Crop Catalog</h2>
                  <p className="text-xs text-[#647067]">
                    Select a high-level crop category below to explore supported varieties, cultivation timelines, and yield guidelines.
                  </p>
                </div>
                
                {/* Search Bar (typing searches all crops) */}
                <div className="relative flex items-center w-full md:w-80">
                  <Search className="w-4 h-4 text-[#647067] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    placeholder="Search crops by name (e.g. Green Peas, Paddy)..."
                    className="w-full pl-10 pr-9 py-2 text-xs bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] placeholder-[#647067] focus:outline-none focus:border-[#166534]"
                  />
                  {catalogSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearchQuery("")}
                      className="absolute right-3 p-1 text-[#647067] hover:text-[#17251B]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* High-Level Category Cards (Level 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: "Vegetables",
                    title: "Vegetables",
                    subtitle: "Green Peas, Tomato, Potato, Onion & Nightshades",
                    examples: ["Green Peas", "Tomato", "Potato", "Onion"],
                    bgColor: "bg-emerald-50/70 hover:bg-emerald-100/60",
                    borderColor: "border-[#22C55E]/40",
                    badgeColor: "bg-[#166534] text-white",
                    textColor: "text-[#166534]",
                  },
                  {
                    id: "Fruits",
                    title: "Fruits",
                    subtitle: "Mango, Banana, Apple & Orchard Produce",
                    examples: ["Mango", "Banana", "Apple", "Orchard Crops"],
                    bgColor: "bg-amber-50/70 hover:bg-amber-100/60",
                    borderColor: "border-amber-400/40",
                    badgeColor: "bg-amber-700 text-white",
                    textColor: "text-amber-800",
                  },
                  {
                    id: "Flowers",
                    title: "Flowers",
                    subtitle: "Rose, Marigold, Jasmine & Floriculture",
                    examples: ["Rose", "Marigold", "Jasmine", "Floriculture"],
                    bgColor: "bg-rose-50/70 hover:bg-rose-100/60",
                    borderColor: "border-pink-400/40",
                    badgeColor: "bg-rose-700 text-white",
                    textColor: "text-rose-800",
                  },
                  {
                    id: "Crops",
                    title: "Crops & Cereals",
                    subtitle: "Paddy, Wheat, Maize, Corn & Oilseeds",
                    examples: ["Paddy", "Wheat", "Maize", "Corn", "Oilseeds"],
                    bgColor: "bg-teal-50/70 hover:bg-teal-100/60",
                    borderColor: "border-teal-400/40",
                    badgeColor: "bg-teal-800 text-white",
                    textColor: "text-teal-900",
                  },
                  {
                    id: "ALL",
                    title: "All Crops",
                    subtitle: "Browse all available contract farming varieties",
                    examples: ["All 80+ Supported Agricultural Crops"],
                    bgColor: "bg-slate-50 hover:bg-slate-100",
                    borderColor: "border-slate-300/60",
                    badgeColor: "bg-slate-800 text-white",
                    textColor: "text-slate-900",
                  },
                ].map((cat) => {
                  const count = crops.filter(
                    (c) => cat.id === "ALL" || mapCropToHighLevelCategory(c) === cat.id
                  ).length;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCatalogCategory(cat.id as any)}
                      className={`p-6 rounded-2xl border-2 ${cat.bgColor} ${cat.borderColor} hover:border-[#166534] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-base font-extrabold ${cat.textColor}`}>
                            {cat.title}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-2xs ${cat.badgeColor}`}>
                            {count} {count === 1 ? "Crop" : "Crops"}
                          </span>
                        </div>
                        <p className="text-xs text-[#647067] leading-relaxed mb-4">
                          {cat.subtitle}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.examples.map((ex, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-white/90 border border-[#E2E8E3] rounded-lg text-[11px] font-semibold text-[#17251B]"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E2E8E3]/60 flex items-center justify-between text-xs font-bold text-[#166534] group-hover:translate-x-1 transition-transform">
                        <span>Explore {cat.title}</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* LEVEL 2: CROP VIEW */
            <div className="space-y-6">
              {/* Level 2 Top Action & Header Bar */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogCategory(null);
                      setCatalogSearchQuery("");
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#ECFDF3] hover:bg-[#166534] text-[#166534] hover:text-white font-bold text-xs rounded-xl border border-[#22C55E]/30 transition-all cursor-pointer shadow-2xs"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Categories</span>
                  </button>

                  <div>
                    <h2 className="text-xl font-extrabold text-[#17251B]">
                      {selectedCatalogCategory === "ALL" || !selectedCatalogCategory
                        ? "All Supported Crops"
                        : `${selectedCatalogCategory} Category`}
                    </h2>
                    <p className="text-xs text-[#647067] mt-0.5">
                      Displaying {catalogFilteredCrops.length} verified contract crop varieties.
                    </p>
                  </div>
                </div>

                {/* Search Bar inside Level 2 */}
                <div className="relative flex items-center w-full md:w-80">
                  <Search className="w-4 h-4 text-[#647067] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    placeholder="Filter crops by name..."
                    className="w-full pl-10 pr-9 py-2 text-xs bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] placeholder-[#647067] focus:outline-none focus:border-[#166534]"
                  />
                  {catalogSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearchQuery("")}
                      className="absolute right-3 p-1 text-[#647067] hover:text-[#17251B]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Category Filter Pills in Level 2 */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "ALL", label: "All Crops" },
                  { id: "Vegetables", label: "Vegetables" },
                  { id: "Fruits", label: "Fruits" },
                  { id: "Flowers", label: "Flowers" },
                  { id: "Crops", label: "Crops & Cereals" },
                ].map((cat) => {
                  const isSelected = selectedCatalogCategory === cat.id;
                  const count = crops.filter(
                    (c) => cat.id === "ALL" || mapCropToHighLevelCategory(c) === cat.id
                  ).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCatalogCategory(cat.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#166534] text-white shadow-sm"
                          : "bg-[#F6F8F3] border border-[#E2E8E3] text-[#647067] hover:text-[#17251B]"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                          isSelected ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Level 2 Crop Cards Grid */}
              {loadingCrops ? (
                <div className="py-16 text-center text-[#647067]">
                  <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
                  <p className="text-xs font-semibold">Loading crop varieties...</p>
                </div>
              ) : catalogFilteredCrops.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E2E8E3] text-center max-w-xl mx-auto my-6 space-y-3">
                  <Sprout className="w-12 h-12 text-[#166534] mx-auto opacity-40" />
                  <h4 className="font-bold text-[#17251B] text-lg">No crops found in this view</h4>
                  <p className="text-xs text-[#647067]">
                    No crop models match category "{selectedCatalogCategory || "Selected"}" or search term "{catalogSearchQuery}".
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogCategory(null);
                      setCatalogSearchQuery("");
                    }}
                    className="px-4 py-2 bg-[#166534] text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    ← Back to Categories
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {catalogFilteredCrops.map((crop) => {
                    const highCategory = mapCropToHighLevelCategory(crop);
                    return (
                      <div
                        key={crop.id}
                        className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col justify-between space-y-4 hover:border-[#22C55E]/40 transition-all"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded">
                              {highCategory}
                            </span>
                            <span className="text-xs font-bold text-[#647067] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#166534]" /> {crop.durationDays} Days Duration
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-[#17251B]">{crop.name}</h3>
                          <p className="text-xs text-[#647067] bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                            {crop.description || "High-yield contract farming crop model with verified agronomic parameters."}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#E2E8E3] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCultivationCrop(crop);
                              setShowCultivationModal(true);
                              setCultivationStep(1);
                            }}
                            className="w-full py-2 px-3 bg-[#ECFDF3] hover:bg-[#166534] text-[#166534] hover:text-white border border-[#22C55E]/30 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Choose to Grow</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
                      "Workers",
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
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-[#E2E8E3]">
                              <span className="text-[10px] text-[#647067] block uppercase font-bold tracking-wide">Target Agreed Yield</span>
                              <span className="font-bold text-[#17251B] text-base">
                                {viewingContract.allocatedQuantity} {viewingContract.demand?.quantityUnit || "TONNE"}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-[#E2E8E3]">
                              <span className="text-[10px] text-[#647067] block uppercase font-bold tracking-wide">Est. Agronomic Yield</span>
                              <span className="font-bold text-[#17251B] text-base">
                                {viewingContractOverview.yieldSummary.estimatedQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.estimatedQuantity} ${viewingContractOverview.yieldSummary.unit || viewingContract.demand?.quantityUnit || "TONNE"}`
                                  : "Unavailable"}
                              </span>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-[#E2E8E3]">
                              <span className="text-[10px] text-[#647067] block uppercase font-bold tracking-wide">Actual Harvested Record</span>
                              <span className="font-bold text-[#166534] text-base">
                                {viewingContractOverview.yieldSummary.actualQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.actualQuantity} ${viewingContractOverview.yieldSummary.unit || viewingContract.demand?.quantityUnit || "TONNE"}`
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

                          {/* Phase 7.1 Collection Center Receiving & Quality Inspection Status */}
                          <div className="bg-white p-6 rounded-xl border border-[#E2E8E3] space-y-4">
                            <h5 className="font-bold text-sm text-[#17251B] flex items-center justify-between border-b border-[#E2E8E3] pb-3">
                              <span>Collection Center Receiving & Quality Status</span>
                              <span className="text-[10px] bg-[#ECFDF3] text-[#166534] font-bold px-2 py-0.5 rounded uppercase border border-[#22C55E]/30">
                                Phase 7.1 Active
                              </span>
                            </h5>

                            {/* 3-Stage Progress Indicator */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                              {/* Stage 1 */}
                              <div className={`p-3.5 rounded-xl border ${
                                viewingContractOverview.yieldSummary.actualQuantity !== null
                                  ? "bg-[#ECFDF3] border-[#22C55E]/30 text-[#166534]"
                                  : "bg-[#F6F8F3] border-[#E2E8E3] text-[#647067]"
                              }`}>
                                <div className="font-bold text-xs">1. Harvest Recorded</div>
                                <div className="text-[10px] mt-0.5">
                                  {viewingContractOverview.yieldSummary.actualQuantity !== null
                                    ? `${viewingContractOverview.yieldSummary.actualQuantity} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                    : "Pending Farm Record"}
                                </div>
                              </div>

                              {/* Stage 2 */}
                              <div className={`p-3.5 rounded-xl border ${
                                viewingContractReceipts.length > 0
                                  ? "bg-[#ECFDF3] border-[#22C55E]/30 text-[#166534]"
                                  : "bg-[#F6F8F3] border-[#E2E8E3] text-[#647067]"
                              }`}>
                                <div className="font-bold text-xs">2. Received at Hub</div>
                                <div className="text-[10px] mt-0.5">
                                  {viewingContractReceipts.length > 0
                                    ? `${viewingContractReceipts.length} Lot(s) Received (${viewingContractReceipts[0].netWeight} ${viewingContractReceipts[0].unit})`
                                    : "Pending Hub Arrival"}
                                </div>
                              </div>

                              {/* Stage 3 */}
                              <div className={`p-3.5 rounded-xl border ${
                                viewingContractReceipts.some((r) => r.inspections && r.inspections.length > 0)
                                  ? "bg-[#ECFDF3] border-[#22C55E]/30 text-[#166534]"
                                  : "bg-[#F6F8F3] border-[#E2E8E3] text-[#647067]"
                              }`}>
                                <div className="font-bold text-xs">3. Quality Inspected</div>
                                <div className="text-[10px] mt-0.5">
                                  {viewingContractReceipts.some((r) => r.inspections && r.inspections.length > 0)
                                    ? `Grade ${viewingContractReceipts[0].inspections[0]?.grade || "A"} Verified`
                                    : "Pending Inspection"}
                                </div>
                              </div>
                            </div>

                            {/* Detailed Receipts List */}
                            {viewingContractReceipts.length > 0 && (
                              <div className="space-y-3 pt-2">
                                <span className="font-bold text-xs text-[#17251B] block">Collection Receipts ({viewingContractReceipts.length})</span>
                                {viewingContractReceipts.map((rcp) => (
                                  <div key={rcp.id} className="p-4 bg-[#F6F8F3] rounded-xl border border-[#E2E8E3] text-xs space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="font-extrabold text-[#166534]">{rcp.receiptNumber}</span>
                                      <span className="px-2 py-0.5 bg-white border border-[#E2E8E3] font-bold text-[10px] rounded uppercase">
                                        {rcp.status}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#647067]">
                                      <div>Hub: <strong className="text-[#17251B]">{rcp.center?.name || "Partner Center"}</strong></div>
                                      <div>Gross Scale: <strong className="text-[#17251B]">{rcp.grossWeight} {rcp.unit}</strong></div>
                                      <div>Tare: <strong className="text-[#17251B]">{rcp.tareWeight} {rcp.unit}</strong></div>
                                      <div>Net Accepted: <strong className="text-[#166534]">{rcp.netWeight} {rcp.unit}</strong></div>
                                    </div>
                                    {rcp.inspections && rcp.inspections.length > 0 && (
                                      <div className="p-3 bg-white rounded-lg border border-[#22C55E]/30 text-[11px] space-y-1.5">
                                        <div className="flex justify-between font-bold text-[#166534]">
                                          <span>Human Inspection: {rcp.inspections[0].grade} ({rcp.inspections[0].status})</span>
                                          <span>Accepted: {rcp.inspections[0].acceptedWeight} {rcp.inspections[0].unit} | Rejected: {rcp.inspections[0].rejectedWeight} {rcp.inspections[0].unit}</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-[#647067]">
                                          <div>Moisture: <strong className="text-[#17251B]">{rcp.inspections[0].moistureContent !== null ? `${rcp.inspections[0].moistureContent}%` : "N/A"}</strong></div>
                                          <div>Foreign Matter: <strong className="text-[#17251B]">{rcp.inspections[0].foreignMatterPercentage !== null ? `${rcp.inspections[0].foreignMatterPercentage}%` : "N/A"}</strong></div>
                                          <div>Date: <strong className="text-[#17251B]">{new Date(rcp.inspections[0].inspectedAt || rcp.inspections[0].createdAt).toLocaleDateString()}</strong></div>
                                        </div>
                                        {rcp.inspections[0].flagReason && (
                                          <p className="text-[#DC2626] font-semibold border-t border-[#E2E8E3] pt-1">
                                            Flag Reason: "{rcp.inspections[0].flagReason}"
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {rcp.shipmentItems && rcp.shipmentItems.length > 0 && (
                                      <div className="p-2.5 bg-[#ECFDF3] rounded-lg border border-[#22C55E]/40 text-[11px] space-y-1">
                                        <div className="flex justify-between items-center font-bold text-[#166534]">
                                          <span>Allocated to Shipment: #{rcp.shipmentItems[0].shipment?.shipmentCode || "SHP-ACTIVE"}</span>
                                          <span className="px-2 py-0.5 bg-white rounded uppercase text-[10px]">
                                            Status: {rcp.shipmentItems[0].shipment?.status || "ALLOCATED"}
                                          </span>
                                        </div>
                                        <p className="text-[#647067]">
                                          Allocated Quantity: <strong>{rcp.shipmentItems[0].shippedWeight} {rcp.shipmentItems[0].unit}</strong>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
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

                  {activeDetailTab === "Workers" && (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8E3] pb-4">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase text-[#166534] bg-[#ECFDF3] px-2.5 py-0.5 rounded border border-[#22C55E]/30">
                              WORKER HIRING & MANAGEMENT
                            </span>
                            <h4 className="font-extrabold text-lg text-[#17251B] mt-1">Field Worker Requirements</h4>
                            <p className="text-xs text-[#647067]">Create job requirements for this active contract & review applicant field workers.</p>
                          </div>

                          {viewingContract.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() => setShowCreateWorkerJobModal(true)}
                              className="px-4 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>Hire Field Workers</span>
                            </button>
                          )}
                        </div>

                        {loadingWorkerJobs ? (
                          <div className="py-12 text-center text-[#647067]">
                            <Loader2 className="w-6 h-6 animate-spin text-[#166534] mx-auto mb-2" />
                            <p className="text-xs font-semibold">Loading worker requirements & applications...</p>
                          </div>
                        ) : workerJobs.length === 0 ? (
                          <div className="p-8 text-center bg-[#F6F8F3] rounded-xl border border-dashed border-[#E2E8E3] space-y-3">
                            <Users className="w-10 h-10 text-[#166534] mx-auto opacity-40" />
                            <h5 className="font-bold text-[#17251B] text-sm">No Worker Requirement Posted Yet</h5>
                            <p className="text-xs text-[#647067] max-w-md mx-auto">
                              Post a job requirement to notify nearby field workers for {viewingContract.crop?.name} cultivation on {viewingContract.land?.name}.
                            </p>
                            {viewingContract.status === "ACTIVE" && (
                              <button
                                type="button"
                                onClick={() => setShowCreateWorkerJobModal(true)}
                                className="px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>Create Worker Requirement</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {workerJobs.map((job) => {
                              const isFilled = job.status === "FILLED" || job.acceptedWorkers >= job.workersRequired;

                              return (
                                <div key={job.id} className="bg-[#F6F8F3] p-5 rounded-2xl border border-[#E2E8E3] space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E3] pb-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h5 className="font-extrabold text-base text-[#17251B]">{job.title}</h5>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                          isFilled ? "bg-blue-100 text-blue-800" : "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30"
                                        }`}>
                                          {isFilled ? "POSITION FILLED" : "ACCEPTING APPLICATIONS"}
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#647067] mt-0.5">{job.description}</p>
                                    </div>

                                    <div className="text-right shrink-0">
                                      <span className="text-xs font-extrabold text-[#166534]">
                                        {job.acceptedWorkers} / {job.workersRequired} Workers Assigned
                                      </span>
                                      <span className="text-[10px] text-[#647067] block">Hours: {job.workingHours}</span>
                                    </div>
                                  </div>

                                  {/* APPLICANTS SECTION */}
                                  <div className="space-y-3">
                                    <h6 className="text-xs font-bold text-[#17251B] uppercase tracking-wider flex items-center gap-1.5">
                                      <Users className="w-4 h-4 text-[#166534]" /> Applicant Field Workers ({job.applications?.length || 0})
                                    </h6>

                                    {(!job.applications || job.applications.length === 0) ? (
                                      <p className="text-xs text-[#647067] italic bg-white p-3.5 rounded-xl border border-[#E2E8E3]">
                                        No workers have applied yet. Nearby workers (within 50 km) will discover this job requirement on their dashboard.
                                      </p>
                                    ) : (
                                      <div className="space-y-2.5">
                                        {job.applications.map((app: any) => {
                                          const isAccepted = app.status === "ACCEPTED";
                                          const isRejected = app.status === "REJECTED";
                                          const isProcessing = processingAppId === app.id;

                                          return (
                                            <div
                                              key={app.id}
                                              className="bg-white p-4 rounded-xl border border-[#E2E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <span className="font-extrabold text-sm text-[#17251B]">{app.worker.name}</span>
                                                  <span className="text-xs text-[#647067]">({app.worker.phone})</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[#647067] mt-0.5">
                                                  <span className="flex items-center gap-1 text-[#166534] font-bold">
                                                    <MapPin className="w-3.5 h-3.5" /> {app.distanceKm ? `${app.distanceKm} km away` : "Nearby"}
                                                  </span>
                                                  <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                                                </div>
                                              </div>

                                              <div className="flex items-center gap-2 shrink-0">
                                                {isAccepted ? (
                                                  <span className="px-3 py-1 bg-[#166534] text-white font-bold text-xs rounded-lg flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Assigned Worker
                                                  </span>
                                                ) : isRejected ? (
                                                  <span className="px-3 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg">
                                                    Rejected
                                                  </span>
                                                ) : isFilled ? (
                                                  <span className="px-3 py-1 bg-gray-100 text-gray-600 font-bold text-xs rounded-lg">
                                                    Capacity Full
                                                  </span>
                                                ) : (
                                                  <>
                                                    <button
                                                      type="button"
                                                      disabled={isProcessing}
                                                      onClick={() => handleProcessApplication(app.id, "REJECT")}
                                                      className="px-3 py-1.5 border border-red-300 text-red-600 font-bold text-xs rounded-lg hover:bg-red-50 cursor-pointer disabled:opacity-50"
                                                    >
                                                      Reject
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={isProcessing}
                                                      onClick={() => handleProcessApplication(app.id, "ACCEPT")}
                                                      className="px-4 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                                                    >
                                                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                                                      <span>Accept & Assign</span>
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* ASSIGNED WORKERS & TODAY'S ACTIVITY */}
                                  {job.workerContracts && job.workerContracts.length > 0 && (
                                    <div className="space-y-3 pt-3 border-t border-[#E2E8E3]">
                                      <h6 className="text-xs font-bold text-[#17251B] uppercase tracking-wider flex items-center gap-1.5">
                                        <UserCheck className="w-4 h-4 text-[#166534]" /> Assigned Worker Activity & Daily Reports
                                      </h6>
                                      <div className="space-y-2">
                                        {job.workerContracts.map((wc: any) => {
                                          const latestReport = wc.dailyReports?.[0];
                                          const isCompleted = latestReport?.status === "COMPLETED";
                                          const isPartial = latestReport?.status === "PARTIAL";
                                          const isNotCompleted = latestReport?.status === "NOT_COMPLETED";

                                          return (
                                            <div key={wc.id} className="bg-white p-4 rounded-xl border border-[#E2E8E3] space-y-2 text-xs">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <span className="font-extrabold text-sm text-[#17251B]">{wc.worker?.name}</span>
                                                  <span className="text-[#647067]">({wc.worker?.phone})</span>
                                                </div>
                                                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                  isCompleted ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30" :
                                                  isPartial ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                                  isNotCompleted ? "bg-red-100 text-red-800 border border-red-300" :
                                                  latestReport?.checkInAt ? "bg-[#ECFDF3] text-[#166534]" : "bg-gray-100 text-gray-700"
                                                }`}>
                                                  {isCompleted ? "COMPLETED AS PLANNED" :
                                                   isPartial ? "PARTIALLY COMPLETED" :
                                                   isNotCompleted ? "COULD NOT COMPLETE" :
                                                   latestReport?.checkInAt ? "ON DUTY (WORKING)" : "NOT CHECKED IN TODAY"}
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-3 gap-2 bg-[#F6F8F3] p-2.5 rounded-lg text-[11px]">
                                                <div>
                                                  <span className="text-[#647067] block text-[10px] uppercase font-bold">Check-In</span>
                                                  <span className="font-bold text-[#17251B]">
                                                    {latestReport?.checkInAt ? new Date(latestReport.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-[#647067] block text-[10px] uppercase font-bold">Submitted</span>
                                                  <span className="font-bold text-[#17251B]">
                                                    {latestReport?.submittedAt ? new Date(latestReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                                  </span>
                                                </div>
                                                <div>
                                                  <span className="text-[#647067] block text-[10px] uppercase font-bold">Check-Out</span>
                                                  <span className="font-bold text-[#17251B]">
                                                    {latestReport?.checkOutAt ? new Date(latestReport.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                                  </span>
                                                </div>
                                              </div>

                                              {(latestReport?.issueType || latestReport?.notes) && (
                                                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900 space-y-0.5">
                                                  {latestReport.issueType && (
                                                    <p className="font-bold">Issue Reported: {latestReport.issueType}</p>
                                                  )}
                                                  {latestReport.notes && (
                                                    <p className="italic">"{latestReport.notes}"</p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
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

      {/* FARMER CULTIVATION WIZARD MODAL: CHOOSE WHAT TO GROW */}
      {showCultivationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-3xl w-full my-8 animate-in slide-in-from-bottom-4 duration-300 relative text-xs">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-[#ECFDF3] border border-[#22C55E]/30 rounded-xl text-[#166534]">
                  <Sprout className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-[#17251B]">Choose What to Grow</h3>
                  <p className="text-xs text-[#647067] mt-0.5">Farmer-Driven Cultivation Flow — Select land, choose crop, & find matching buyer demands.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCultivationModal(false)}
                className="p-1.5 text-[#647067] hover:text-[#17251B] rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Bar */}
            <div className="flex items-center justify-between gap-2 mb-8 bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
              {[
                { step: 1, label: "1. Land Parcel" },
                { step: 2, label: "2. Choose Crop" },
                { step: 3, label: "3. Buyer Demands" },
                { step: 4, label: "4. Review & Confirm" },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`flex-1 text-center py-1.5 px-2 rounded-lg font-bold text-[11px] transition-all ${
                    cultivationStep === s.step
                      ? "bg-[#166534] text-white shadow-sm"
                      : cultivationStep > s.step
                      ? "bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30"
                      : "text-[#647067]"
                  }`}
                >
                  {s.label}
                </div>
              ))}
            </div>

            {/* STEP 1: SELECT LAND PARCEL */}
            {cultivationStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-base text-[#17251B]">Step 1: Select Your Land Parcel</h4>
                  <p className="text-xs text-[#647067] mt-0.5">Select an available land parcel from your registered farms to cultivate.</p>
                </div>

                {lands.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#E2E8E3] rounded-2xl text-center">
                    <MapPin className="w-10 h-10 text-[#166534] mx-auto mb-2 opacity-50" />
                    <h5 className="font-bold text-[#17251B] text-sm">No suitable land selected / registered</h5>
                    <p className="text-xs text-[#647067] mt-1 mb-4">Please register a land parcel first before choosing crops.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCultivationModal(false);
                        setIsAdding(true);
                        resetLandForm();
                      }}
                      className="px-4 py-2 bg-[#166534] text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Add Land Parcel
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {lands.map((land) => {
                      const isSelected = selectedCultivationLand?.id === land.id;
                      return (
                        <div
                          key={land.id}
                          onClick={() => setSelectedCultivationLand(land)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-[#166534] bg-[#ECFDF3]/40 ring-2 ring-[#166534]/20"
                              : "border-[#E2E8E3] hover:border-[#22C55E]/40 bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-extrabold text-sm text-[#17251B]">{land.name}</h5>
                              {isSelected && <CheckCircle2 className="w-5 h-5 text-[#166534]" />}
                            </div>
                            <p className="text-xs text-[#647067] flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#166534]" /> {land.village}, {land.district}
                            </p>
                          </div>
                          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#E2E8E3] text-xs">
                            <span className="font-bold text-[#166534]">{land.size} {land.unit}s</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              land.status === "AVAILABLE" ? "bg-[#ECFDF3] text-[#166534]" : "bg-amber-100 text-amber-700"
                            }`}>
                              {land.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8E3]">
                  <button
                    type="button"
                    onClick={() => setShowCultivationModal(false)}
                    className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#17251B] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCultivationLand}
                    onClick={() => setCultivationStep(2)}
                    className={`px-5 py-2 font-bold rounded-xl text-xs transition-all ${
                      selectedCultivationLand
                        ? "bg-[#166534] hover:bg-[#14532d] text-white shadow-sm cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Next: Choose Crop →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: SELECT CROP */}
            {cultivationStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-base text-[#17251B]">Step 2: Select Crop to Cultivate</h4>
                  <p className="text-xs text-[#647067] mt-0.5">Explore crop catalog, view expected duration & yield, and select your target crop.</p>
                </div>

                {/* Farmer-friendly Category Tabs */}
                <div className="flex flex-wrap gap-2">
                  {["ALL", "Vegetables", "Pulses", "Cereals/Crops", "Fruits", "Oilseeds"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCropCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        cropCategoryFilter === cat
                          ? "bg-[#166534] text-white shadow-sm"
                          : "bg-[#F6F8F3] border border-[#E2E8E3] text-[#647067] hover:text-[#17251B]"
                      }`}
                    >
                      {cat === "ALL" ? "All Categories" : cat}
                    </button>
                  ))}
                </div>

                {/* Crop Search Bar */}
                <div className="relative flex items-center w-full">
                  <Search className="w-4 h-4 text-[#647067] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={cropSearchQuery}
                    onChange={(e) => setCropSearchQuery(e.target.value)}
                    placeholder="Search crop by name (e.g. Green Peas, Paddy, Wheat)..."
                    className="w-full pl-10 pr-9 py-2.5 text-xs bg-[#F6F8F3] border border-[#E2E8E3] rounded-xl text-[#17251B] placeholder-[#647067] focus:outline-none focus:border-[#166534]"
                  />
                  {cropSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCropSearchQuery("")}
                      className="absolute right-3 p-1 text-[#647067] hover:text-[#17251B]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Crop Selection Grid */}
                {displayedCrops.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#E2E8E3] rounded-2xl text-center">
                    <Sprout className="w-10 h-10 text-[#166534] mx-auto mb-2 opacity-50" />
                    <h5 className="font-bold text-[#17251B] text-sm">No crops available</h5>
                    <p className="text-xs text-[#647067] mt-1">No crops match your search or selected category filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto p-1">
                    {displayedCrops.map((crop) => {
                      const isSelected = selectedCultivationCrop?.id === crop.id;
                      const friendlyCategory = getFarmerCategoryName(crop);
                      return (
                        <div
                          key={crop.id}
                          onClick={() => setSelectedCultivationCrop(crop)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-[#166534] bg-[#ECFDF3]/40 ring-2 ring-[#166534]/20"
                              : "border-[#E2E8E3] hover:border-[#22C55E]/40 bg-white"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-extrabold text-sm text-[#17251B]">{crop.name}</h5>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-[#166534]" />}
                            </div>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 mb-2">
                              {friendlyCategory}
                            </span>
                            <p className="text-[11px] text-[#647067] line-clamp-2">
                              {crop.description || "High-yield crop variety suitable for contract farming."}
                            </p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-[#E2E8E3] flex justify-between text-[11px] font-semibold text-[#647067]">
                            <span>Duration: <strong className="text-[#17251B]">{crop.durationDays} days</strong></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-4 border-t border-[#E2E8E3]">
                  <button
                    type="button"
                    onClick={() => setCultivationStep(1)}
                    className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#17251B] font-bold rounded-xl text-xs cursor-pointer"
                  >
                    ← Back to Land
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCultivationCrop}
                    onClick={() => {
                      setCultivationStep(3);
                      fetchMatchingDemands(selectedCultivationCrop?.id);
                    }}
                    className={`px-5 py-2 font-bold rounded-xl text-xs transition-all ${
                      selectedCultivationCrop
                        ? "bg-[#166534] hover:bg-[#14532d] text-white shadow-sm cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Next: Find Buyer Demands →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: FIND MATCHING BUYER DEMANDS */}
            {cultivationStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-base text-[#17251B]">
                    Step 3: Buyer Demands for {selectedCultivationCrop?.name}
                  </h4>
                  <p className="text-xs text-[#647067] mt-0.5">Select an active buyer demand seeking to contract {selectedCultivationCrop?.name}.</p>
                </div>

                {loadingBuyerDemands ? (
                  <div className="py-12 text-center text-[#647067]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
                    <p className="text-xs font-semibold">Searching active buyer demands...</p>
                  </div>
                ) : matchingDemands.length === 0 ? (
                  <div className="p-8 border border-dashed border-[#E2E8E3] rounded-2xl text-center">
                    <Compass className="w-10 h-10 text-[#166534] mx-auto mb-2 opacity-50" />
                    <h5 className="font-bold text-[#17251B] text-sm">No matching buyer demands for {selectedCultivationCrop?.name}</h5>
                    <p className="text-xs text-[#647067] mt-1 mb-4">
                      There are currently no active buyer demands seeking {selectedCultivationCrop?.name}. You can choose a different crop or check back later.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCultivationStep(2)}
                      className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#166534] font-bold rounded-xl text-xs hover:bg-[#ECFDF3]"
                    >
                      ← Choose Different Crop
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto p-1">
                    {matchingDemands.map((demand) => {
                      const isSelected = selectedCultivationDemand?.id === demand.id;
                      return (
                        <div
                          key={demand.id}
                          onClick={() => setSelectedCultivationDemand(demand)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? "border-[#166534] bg-[#ECFDF3]/40 ring-2 ring-[#166534]/20"
                              : "border-[#E2E8E3] hover:border-[#22C55E]/40 bg-white"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E3] pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-[#17251B]">
                                Buyer: {demand.buyer?.name || "Registered Buyer"}
                              </h5>
                              <span className="text-[10px] text-[#647067]">({demand.buyer?.phone || "N/A"})</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30">
                              {demand.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#647067]">
                            <div>Required Qty: <strong className="text-[#166534]">{demand.requiredQuantity} {demand.quantityUnit}</strong></div>
                            <div>Location: <strong className="text-[#17251B]">{demand.preferredDistrict || "Statewide"}, {demand.preferredState}</strong></div>
                            <div>Start: <strong className="text-[#17251B]">{demand.preferredStartDate ? new Date(demand.preferredStartDate).toLocaleDateString() : "Immediate"}</strong></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex justify-between gap-3 pt-4 border-t border-[#E2E8E3]">
                  <button
                    type="button"
                    onClick={() => setCultivationStep(2)}
                    className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#17251B] font-bold rounded-xl text-xs"
                  >
                    ← Back to Crop
                  </button>
                  <button
                    type="button"
                    disabled={!selectedCultivationDemand}
                    onClick={() => setCultivationStep(4)}
                    className={`px-5 py-2 font-bold rounded-xl text-xs transition-all ${
                      selectedCultivationDemand
                        ? "bg-[#166534] hover:bg-[#14532d] text-white shadow-sm cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Next: Review Agreement →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {cultivationStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-extrabold text-base text-[#17251B]">Step 4: Review & Propose Cultivation Agreement</h4>
                  <p className="text-xs text-[#647067] mt-0.5">
                    Confirm your chosen land, crop, and buyer demand. No contract will be finalized until you explicitly proceed.
                  </p>
                </div>

                <div className="bg-[#F6F8F3] p-5 rounded-2xl border border-[#E2E8E3] space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white rounded-xl border border-[#E2E8E3]">
                      <span className="text-[10px] font-bold text-[#647067] uppercase block mb-1">Selected Land Parcel</span>
                      <p className="font-bold text-sm text-[#17251B]">{selectedCultivationLand?.name}</p>
                      <p className="text-[#647067] mt-0.5">{selectedCultivationLand?.size} {selectedCultivationLand?.unit}s ({selectedCultivationLand?.village}, {selectedCultivationLand?.district})</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#E2E8E3]">
                      <span className="text-[10px] font-bold text-[#647067] uppercase block mb-1">Selected Crop</span>
                      <p className="font-bold text-sm text-[#166534]">{selectedCultivationCrop?.name}</p>
                      <p className="text-[#647067] mt-0.5">Category: {selectedCultivationCrop ? getFarmerCategoryName(selectedCultivationCrop) : "Crops"} | {selectedCultivationCrop?.durationDays} Days</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#E2E8E3]">
                      <span className="text-[10px] font-bold text-[#647067] uppercase block mb-1">Target Buyer</span>
                      <p className="font-bold text-sm text-[#17251B]">{selectedCultivationDemand?.buyer?.name || "Registered Buyer"}</p>
                      <p className="text-[#647067] mt-0.5">Phone: {selectedCultivationDemand?.buyer?.phone || "N/A"}</p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-[#E2E8E3]">
                      <span className="text-[10px] font-bold text-[#647067] uppercase block mb-1">Agreed Delivery Volume</span>
                      <p className="font-bold text-sm text-[#166534]">{selectedCultivationDemand?.requiredQuantity} {selectedCultivationDemand?.quantityUnit}</p>
                      <p className="text-[#647067] mt-0.5">Status: {selectedCultivationDemand?.status}</p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-[#ECFDF3] border border-[#22C55E]/30 rounded-xl text-[#166534] font-semibold text-xs flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <span>Clicking "Initiate Agreement" submits your land proposal to the buyer for formal contract activation.</span>
                  </div>
                </div>

                <div className="flex justify-between gap-3 pt-4 border-t border-[#E2E8E3]">
                  <button
                    type="button"
                    onClick={() => setCultivationStep(3)}
                    className="px-4 py-2 bg-white border border-[#E2E8E3] text-[#17251B] font-bold rounded-xl text-xs"
                  >
                    ← Back to Demands
                  </button>
                  <button
                    type="button"
                    disabled={submittingCultivationContract}
                    onClick={handleInitiateFarmerContract}
                    className="px-6 py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    {submittingCultivationContract ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Proposal...</span>
                      </>
                    ) : (
                      <span>Initiate Agreement →</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREATE WORKER REQUIREMENT OVERLAY */}
      {showCreateWorkerJobModal && viewingContract && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
              <div className="flex items-center gap-2 text-[#17251B]">
                <UserCheck className="w-5 h-5 text-[#166534]" />
                <h3 className="text-lg font-extrabold">Post Worker Requirement</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateWorkerJobModal(false)}
                className="p-1 rounded-lg text-[#647067] hover:text-[#17251B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto-filled details info box */}
            <div className="bg-[#F6F8F3] p-4 rounded-xl border border-[#E2E8E3] space-y-1 text-xs text-[#17251B]">
              <p><strong>Farming Contract:</strong> #{viewingContract.id.substring(0, 8).toUpperCase()}</p>
              <p><strong>Crop:</strong> {viewingContract.crop?.name} | <strong>Land:</strong> {viewingContract.land?.name} ({viewingContract.landArea} Acres)</p>
              <p><strong>Timeline:</strong> {new Date(viewingContract.startDate).toLocaleDateString()} &rarr; {new Date(viewingContract.expectedHarvestDate).toLocaleDateString()}</p>
            </div>

            {workerJobError && (
              <div className="p-3 bg-red-100 text-red-700 text-xs font-bold rounded-xl">
                {workerJobError}
              </div>
            )}

            <form onSubmit={handleCreateWorkerJob} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[#17251B] font-bold mb-1 uppercase text-[10px]">Workers Required</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={jobWorkersRequired}
                  onChange={(e) => setJobWorkersRequired(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8E3] focus:border-[#166534] rounded-xl outline-none font-bold text-[#17251B]"
                />
              </div>

              <div>
                <label className="block text-[#17251B] font-bold mb-1 uppercase text-[10px]">Working Hours Schedule</label>
                <input
                  type="text"
                  required
                  value={jobWorkingHours}
                  onChange={(e) => setJobWorkingHours(e.target.value)}
                  placeholder="e.g. 08:00 AM – 04:00 PM"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8E3] focus:border-[#166534] rounded-xl outline-none font-bold text-[#17251B]"
                />
              </div>

              <div>
                <label className="block text-[#17251B] font-bold mb-1 uppercase text-[10px]">Required Work Scope & Description</label>
                <textarea
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Field maintenance, sowing verification, irrigation clearing, and crop care..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8E3] focus:border-[#166534] rounded-xl outline-none text-[#17251B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateWorkerJobModal(false)}
                  className="px-4 py-2.5 border border-[#E2E8E3] text-[#17251B] font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWorkerJob}
                  className="px-5 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {submittingWorkerJob ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Post Job Requirement</span>
                </button>
              </div>
            </form>
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
