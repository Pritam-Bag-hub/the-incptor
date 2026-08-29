"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Loader2,
  Calendar,
  Layers,
  Sprout,
  Compass,
  ArrowRight,
  Edit3,
  Play,
  Pause,
  XCircle,
  Eye,
  CheckCircle,
  TrendingUp,
  DollarSign,
  X,
  Check
} from "lucide-react";

type Tab = "overview" | "create-demand" | "my-demands" | "discover-land" | "my-contracts";

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

interface BuyerDemand {
  id: string;
  cropId: string;
  requiredQuantity: number;
  quantityUnit: "KG" | "QUINTAL" | "TONNE";
  preferredState: string;
  preferredDistrict: string | null;
  preferredLatitude: number | null;
  preferredLongitude: number | null;
  searchRadiusKm: number | null;
  requiredLandArea: number | null;
  preferredStartDate: string | null;
  expectedHarvestDate: string | null;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  notes: string | null;
  createdAt: string;
  crop?: Crop;
}

interface DiscoveredLand {
  id: string;
  name: string;
  size: number;
  unit: "ACRE" | "HECTARE";
  village: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  status: string;
  distanceKm: number | null;
  matchScore: number;
  matchReasons: string[];
  ownerName?: string;
}

interface Contract {
  id: string;
  demandId: string;
  landId: string;
  buyerId: string;
  landownerId: string;
  cropId: string;
  landArea: number;
  allocatedQuantity: number;
  proposedPrice: number;
  startDate: string;
  expectedHarvestDate: string;
  status: "PENDING_APPROVAL" | "ACCEPTED" | "ACTIVE" | "REJECTED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  rejectionReason: string | null;
  revision: number;
  decisionDate: string | null;
  activatedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  history?: any[];
  progressUpdates?: any[];
  land?: {
    name: string;
    village: string;
    district: string;
    state: string;
  };
  crop?: {
    name: string;
  };
  landowner?: {
    name: string;
    phone: string;
  };
  buyer?: {
    name: string;
    phone: string;
  };
  demand?: any;
  financialAllocation?: any;
  yield?: any;
}

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  // Database retrieved states
  const [categories, setCategories] = useState<CropCategory[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [demands, setDemands] = useState<BuyerDemand[]>([]);
  const [discoveredLands, setDiscoveredLands] = useState<DiscoveredLand[]>([]);

  // Loaders
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [loadingDemands, setLoadingDemands] = useState(false);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);

  // Selected parameters for Create Demand Flow
  const [createStep, setCreateStep] = useState<1 | 2 | 3 | 4 | 5>(1); // Category -> Crop -> Details -> Review -> Success
  const [selCategory, setSelCategory] = useState<CropCategory | null>(null);
  const [selCrop, setSelCrop] = useState<Crop | null>(null);

  // Form states (Create and Edit Demand)
  const [editingDemand, setEditingDemand] = useState<BuyerDemand | null>(null);
  
  const [reqQuantity, setReqQuantity] = useState("");
  const [qtyUnit, setQtyUnit] = useState<"KG" | "QUINTAL" | "TONNE">("TONNE");
  const [reqLandArea, setReqLandArea] = useState("");
  const [prefState, setPrefState] = useState("");
  const [prefDistrict, setPrefDistrict] = useState("");
  const [prefLat, setPrefLat] = useState("");
  const [prefLng, setPrefLng] = useState("");
  const [searchRadius, setSearchRadius] = useState("");
  const [startDate, setStartDate] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [savingDemand, setSavingDemand] = useState(false);

  // Land discovery panel state
  const [selectedDemandId, setSelectedDemandId] = useState<string>("");
  const [inspectLand, setInspectLand] = useState<DiscoveredLand | null>(null);
  const [discoveryError, setDiscoveryError] = useState("");

  // Persistent selections state
  const [selectedLands, setSelectedLands] = useState<DiscoveredLand[]>([]);
  const [loadingSelections, setLoadingSelections] = useState(false);

  // Contracts state variables
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [demandContracts, setDemandContracts] = useState<Contract[]>([]);

  // Proposal modal/form states
  const [proposingLand, setProposingLand] = useState<DiscoveredLand | null>(null);
  const [propPrice, setPropPrice] = useState("");
  const [propStartDate, setPropStartDate] = useState("");
  const [propEndDate, setPropEndDate] = useState("");
  const [propNotes, setPropNotes] = useState("");
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [propError, setPropError] = useState("");

  // Contract Activation & Details View States
  const [showActivateConfirmId, setShowActivateConfirmId] = useState<string | null>(null);
  const [viewingContractId, setViewingContractId] = useState<string | null>(null);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [loadingViewingContract, setLoadingViewingContract] = useState(false);
  const [viewingContractOverview, setViewingContractOverview] = useState<any | null>(null);
  const [viewingContractMilestones, setViewingContractMilestones] = useState<any[]>([]);
  const [viewingContractTasks, setViewingContractTasks] = useState<any[]>([]);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [milestonesLoadError, setMilestonesLoadError] = useState("");
  const [tasksLoadError, setTasksLoadError] = useState("");
  const [loadingYield, setLoadingYield] = useState(false);
  const [yieldLoadError, setYieldLoadError] = useState("");
  const [loadingFinancials, setLoadingFinancials] = useState(false);
  const [financialsLoadError, setFinancialsLoadError] = useState("");
  const [activeDetailTab, setActiveDetailTab] = useState<"Overview" | "Financials" | "Yield" | "Milestones" | "Tasks" | "Progress" | "Monitoring">("Overview");

  // Financial allocations editing states
  const [editLandownerAmount, setEditLandownerAmount] = useState("");
  const [editWorkforceBudget, setEditWorkforceBudget] = useState("");
  const [editLogisticsBudget, setEditLogisticsBudget] = useState("");
  const [editPlatformFee, setEditPlatformFee] = useState("");
  const [editReserveBudget, setEditReserveBudget] = useState("");
  const [savingFinancials, setSavingFinancials] = useState(false);
  const [financialsError, setFinancialsError] = useState("");

  // Preserved Phase 1 Landlord mock list for Overview Tab
  const landlords = [
    {
      id: "L-101",
      name: "Ramesh Singh",
      location: "Punjab, India",
      crop: "Wheat",
      contractAmount: "₹2,50,000",
      status: "On Track",
      progress: 65,
    },
    {
      id: "L-102",
      name: "Suresh Patel",
      location: "Gujarat, India",
      crop: "Cotton",
      contractAmount: "₹4,00,000",
      status: "Needs Review",
      progress: 30,
    },
    {
      id: "L-103",
      name: "Amrita Desai",
      location: "Maharashtra, India",
      crop: "Sugarcane",
      contractAmount: "₹8,50,000",
      status: "Completed",
      progress: 100,
    },
  ];

  // Load baseline parameters
  useEffect(() => {
    fetchCategories();
    fetchDemands();
  }, []);

  useEffect(() => {
    if (activeTab === "my-demands") {
      fetchDemands();
    } else if (activeTab === "my-contracts") {
      fetchContracts();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/crops/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDemands = async () => {
    setLoadingDemands(true);
    try {
      const res = await fetch("/api/demands");
      if (res.ok) {
        const data = await res.json();
        setDemands(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDemands(false);
    }
  };

  const loadCropsByCategory = async (categoryName: string) => {
    setLoadingCrops(true);
    try {
      const res = await fetch(`/api/crops?category=${encodeURIComponent(categoryName)}`);
      if (res.ok) {
        const data = await res.json();
        setCrops(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCrops(false);
    }
  };

  const handleSelectCategory = (cat: CropCategory) => {
    setSelCategory(cat);
    loadCropsByCategory(cat.name);
    setCreateStep(2);
  };

  const handleSelectCrop = (crop: Crop) => {
    setSelCrop(crop);
    setCreateStep(3);
  };

  const resetForm = () => {
    setReqQuantity("");
    setQtyUnit("TONNE");
    setReqLandArea("");
    setPrefState("");
    setPrefDistrict("");
    setPrefLat("");
    setPrefLng("");
    setSearchRadius("");
    setStartDate("");
    setHarvestDate("");
    setNotes("");
    setFormError("");
    setEditingDemand(null);
  };

  const handleSaveDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSavingDemand(true);

    const payload = {
      cropId: selCrop?.id || editingDemand?.cropId,
      requiredQuantity: reqQuantity,
      quantityUnit: qtyUnit,
      preferredState: prefState,
      preferredDistrict: prefDistrict || null,
      preferredLatitude: prefLat || null,
      preferredLongitude: prefLng || null,
      searchRadiusKm: searchRadius || null,
      requiredLandArea: reqLandArea || null,
      preferredStartDate: startDate || null,
      expectedHarvestDate: harvestDate || null,
      notes: notes || null,
    };

    try {
      const url = editingDemand ? `/api/demands/${editingDemand.id}` : "/api/demands";
      const method = editingDemand ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save demand request.");
      }

      if (editingDemand) {
        // Edit flow finish
        resetForm();
        setActiveTab("my-demands");
        fetchDemands();
      } else {
        // Create flow next step (Success feedback)
        setCreateStep(5);
        fetchDemands();
      }
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
    } finally {
      setSavingDemand(false);
    }
  };

  const handleOpenEdit = (demand: BuyerDemand) => {
    setEditingDemand(demand);
    setSelCrop(demand.crop || null);
    setReqQuantity(demand.requiredQuantity.toString());
    setQtyUnit(demand.quantityUnit);
    setReqLandArea(demand.requiredLandArea !== null ? demand.requiredLandArea.toString() : "");
    setPrefState(demand.preferredState);
    setPrefDistrict(demand.preferredDistrict || "");
    setPrefLat(demand.preferredLatitude !== null ? demand.preferredLatitude.toString() : "");
    setPrefLng(demand.preferredLongitude !== null ? demand.preferredLongitude.toString() : "");
    setSearchRadius(demand.searchRadiusKm !== null ? demand.searchRadiusKm.toString() : "");
    setStartDate(demand.preferredStartDate ? new Date(demand.preferredStartDate).toISOString().split("T")[0] : "");
    setHarvestDate(demand.expectedHarvestDate ? new Date(demand.expectedHarvestDate).toISOString().split("T")[0] : "");
    setNotes(demand.notes || "");
    setFormError("");
    setActiveTab("create-demand");
    setCreateStep(3); // Skip category/crop select when editing
  };

  const handleToggleStatus = async (demand: BuyerDemand, targetStatus: "ACTIVE" | "PAUSED" | "CLOSED") => {
    try {
      const res = await fetch(`/api/demands/${demand.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle status.");
      }

      // Update state directly
      setDemands(demands.map(d => d.id === demand.id ? { ...d, status: targetStatus } : d));
    } catch (err: any) {
      alert(err.message || "Could not toggle status.");
    }
  };

  // Fetch selected lands for the demand
  const fetchSelectedLands = async (demandId: string) => {
    if (!demandId) {
      setSelectedLands([]);
      return;
    }
    setLoadingSelections(true);
    try {
      const res = await fetch(`/api/demands/${demandId}/lands`);
      if (res.ok) {
        const data = await res.json();
        setSelectedLands(data);
      }
    } catch (err) {
      console.error("Error fetching selection:", err);
    } finally {
      setLoadingSelections(false);
    }
  };

  const fetchDemandContracts = async (demandId: string) => {
    try {
      const res = await fetch(`/api/contracts?demandId=${demandId}`);
      if (res.ok) {
        const data = await res.json();
        setDemandContracts(data);
      }
    } catch (err) {
      console.error("Error fetching demand contracts:", err);
    }
  };

  const fetchContracts = async () => {
    setLoadingContracts(true);
    try {
      const res = await fetch("/api/contracts");
      if (res.ok) {
        const data = await res.json();
        setContracts(data);
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
    } finally {
      setLoadingContracts(false);
    }
  };

  const handleCancelContract = async (contractId: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/cancel`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel proposal.");
      }
      fetchContracts();
      if (selectedDemandId) {
        fetchDemandContracts(selectedDemandId);
      }
    } catch (err: any) {
      alert(err.message || "Could not cancel contract.");
    }
  };

  const handleActivateContract = async (contractId: string) => {
    try {
      const res = await fetch(`/api/contracts/${contractId}/activate`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to activate contract.");
      }
      setShowActivateConfirmId(null);
      fetchContracts();
      if (selectedDemandId) {
        fetchDemandContracts(selectedDemandId);
      }
    } catch (err: any) {
      alert(err.message || "Could not activate contract.");
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
      fetchContracts();
      if (selectedDemandId) {
        fetchDemandContracts(selectedDemandId);
      }
    } catch (err: any) {
      alert(err.message || "Could not complete contract.");
    }
  };

  const initFinancialsForm = (contract: any, overview: any) => {
    const val = contract.proposedPrice;
    const fin = overview?.financialSummary || contract.financialAllocation;
    if (fin) {
      setEditLandownerAmount(fin.landownerAmount.toString());
      setEditWorkforceBudget(fin.workforceBudget.toString());
      setEditLogisticsBudget(fin.logisticsBudget.toString());
      setEditPlatformFee(fin.platformFee.toString());
      setEditReserveBudget(fin.reserveBudget.toString());
    } else {
      setEditLandownerAmount((val * 0.50).toString());
      setEditWorkforceBudget((val * 0.25).toString());
      setEditLogisticsBudget((val * 0.10).toString());
      setEditPlatformFee((val * 0.10).toString());
      setEditReserveBudget((val * 0.05).toString());
    }
    setFinancialsError("");
  };

  const fetchContractDetails = async (contractId: string) => {
    setLoadingViewingContract(true);
    setViewingContractOverview(null);
    setViewingContractMilestones([]);
    setViewingContractTasks([]);
    setMilestonesLoadError("");
    setTasksLoadError("");
    setYieldLoadError("");
    setFinancialsLoadError("");
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
        }
        
        initFinancialsForm(data, overviewData);

        // Fetch milestones
        setLoadingMilestones(true);
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
        setLoadingTasks(true);
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

  const handleSaveFinancials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!viewingContract) return;
    setSavingFinancials(true);
    setFinancialsError("");
    try {
      const payload = {
        landownerAmount: parseFloat(editLandownerAmount),
        workforceBudget: parseFloat(editWorkforceBudget),
        logisticsBudget: parseFloat(editLogisticsBudget),
        platformFee: parseFloat(editPlatformFee),
        reserveBudget: parseFloat(editReserveBudget),
      };

      if (
        isNaN(payload.landownerAmount) || payload.landownerAmount < 0 ||
        isNaN(payload.workforceBudget) || payload.workforceBudget < 0 ||
        isNaN(payload.logisticsBudget) || payload.logisticsBudget < 0 ||
        isNaN(payload.platformFee) || payload.platformFee < 0 ||
        isNaN(payload.reserveBudget) || payload.reserveBudget < 0
      ) {
        throw new Error("Budget allocations must be non-negative numbers.");
      }

      const total = payload.landownerAmount + payload.workforceBudget + payload.logisticsBudget + payload.platformFee + payload.reserveBudget;
      const expected = viewingContract.proposedPrice;

      // Validate allocation totals sum up with 0.01 tolerance
      if (Math.abs(total - expected) >= 0.01) {
        throw new Error(`Total allocated budget (${total.toFixed(2)}) must sum up to the agreed price (${expected.toFixed(2)}) within a 0.01 tolerance.`);
      }

      const res = await fetch(`/api/contracts/${viewingContract.id}/financials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save financial allocations.");
      }

      await fetchContractDetails(viewingContract.id);
      alert("Financial allocations saved successfully!");
    } catch (err: any) {
      setFinancialsError(err.message || "An error occurred.");
    } finally {
      setSavingFinancials(false);
    }
  };

  useEffect(() => {
    if (viewingContractId) {
      fetchContractDetails(viewingContractId);
    } else {
      setViewingContract(null);
    }
  }, [viewingContractId]);

  const handleProposeContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemandId || !proposingLand) return;
    setSubmittingProposal(true);
    setPropError("");
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          demandId: selectedDemandId,
          landId: proposingLand.id,
          proposedPrice: propPrice,
          startDate: propStartDate,
          expectedHarvestDate: propEndDate,
          notes: propNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit proposal.");
      }
      await fetchDemandContracts(selectedDemandId);
      setProposingLand(null);
      setPropPrice("");
      setPropStartDate("");
      setPropEndDate("");
      setPropNotes("");
    } catch (err: any) {
      setPropError(err.message || "An error occurred.");
    } finally {
      setSubmittingProposal(false);
    }
  };

  useEffect(() => {
    if (selectedDemandId) {
      fetchSelectedLands(selectedDemandId);
      fetchDemandContracts(selectedDemandId);
    } else {
      setSelectedLands([]);
      setDemandContracts([]);
    }
  }, [selectedDemandId]);

  const handleSelectLand = async (land: DiscoveredLand) => {
    if (!selectedDemandId) return;
    try {
      const res = await fetch(`/api/demands/${selectedDemandId}/lands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landId: land.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to select land.");
      }
      await fetchSelectedLands(selectedDemandId);
    } catch (err: any) {
      alert(err.message || "Could not select land.");
    }
  };

  const handleRemoveLand = async (landId: string) => {
    if (!selectedDemandId) return;
    try {
      const res = await fetch(`/api/demands/${selectedDemandId}/lands`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deselect land.");
      }
      await fetchSelectedLands(selectedDemandId);
    } catch (err: any) {
      alert(err.message || "Could not deselect land.");
    }
  };

  const handleTriggerDiscovery = (demandId: string) => {
    setSelectedDemandId(demandId);
    setActiveTab("discover-land");
    fetchMatchingLands(demandId);
  };

  const fetchMatchingLands = async (demandId: string) => {
    if (!demandId) return;
    setLoadingDiscovery(true);
    setDiscoveryError("");
    setInspectLand(null);
    try {
      const res = await fetch(`/api/lands/discover?demandId=${demandId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to query matching lands.");
      }
      const data = await res.json();
      setDiscoveredLands(data);
      await fetchSelectedLands(demandId);
    } catch (err: any) {
      setDiscoveryError(err.message || "Could not run land matching.");
      setDiscoveredLands([]);
    } finally {
      setLoadingDiscovery(false);
    }
  };

  const activeDemand = demands.find((d) => d.id === selectedDemandId);
  const requiredArea = activeDemand?.requiredLandArea || 0;
  const selectedArea = selectedLands.reduce((acc, l) => acc + l.size, 0);
  const remainingArea = Math.max(requiredArea - selectedArea, 0);
  const requirementMet = requiredArea > 0 && selectedArea >= requiredArea;
  const excessArea = selectedArea > requiredArea ? selectedArea - requiredArea : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brandy/30 pb-4">
        <div>
          <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
          <p className="text-kombu/70 mt-2">
            Procure crops, establish contract requirements, and discover available farm lands.
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
            onClick={() => {
              setActiveTab("create-demand");
              setCreateStep(1);
              resetForm();
            }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "create-demand"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            Create Demand
          </button>
          <button
            onClick={() => setActiveTab("my-demands")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "my-demands"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            My Demands
          </button>
          <button
            onClick={() => {
              setActiveTab("discover-land");
              setDiscoveredLands([]);
              setInspectLand(null);
            }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "discover-land"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            Discover Land
          </button>
          <button
            onClick={() => setActiveTab("my-contracts")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "my-contracts"
                ? "bg-pine text-brandy shadow-md"
                : "text-kombu/80 hover:text-pine hover:bg-brandy/25"
            }`}
          >
            My Contracts
          </button>
        </div>
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <p className="text-sm font-medium text-kombu/70">Total Contracts</p>
              <p className="text-3xl font-bold mt-2">24</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <p className="text-sm font-medium text-kombu/70">Active Value</p>
              <p className="text-3xl font-bold mt-2">₹42.5M</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm">
              <p className="text-sm font-medium text-kombu/70">At Risk</p>
              <p className="text-3xl font-bold mt-2 text-copper">3</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Contracted Landlords</h2>
            <div className="grid grid-cols-1 gap-4">
              {landlords.map((landlord) => (
                <div
                  key={landlord.id}
                  className="bg-white p-6 rounded-2xl border border-brandy/40 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-kombu/10 p-3 rounded-full text-kombu">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{landlord.name}</h3>
                      <div className="flex items-center text-sm text-kombu/70 mt-1 gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {landlord.location}</span>
                        <span className="w-1 h-1 bg-brandy rounded-full"></span>
                        <span>{landlord.crop}</span>
                        <span className="w-1 h-1 bg-brandy rounded-full"></span>
                        <span className="font-medium text-pine">{landlord.contractAmount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="flex items-center gap-2">
                      {landlord.status === "On Track" && <CheckCircle2 className="w-5 h-5 text-dingley" />}
                      {landlord.status === "Needs Review" && <AlertTriangle className="w-5 h-5 text-copper" />}
                      {landlord.status === "Completed" && <CheckCircle2 className="w-5 h-5 text-kombu" />}
                      <span className={`font-medium ${
                        landlord.status === "On Track" ? "text-dingley" :
                        landlord.status === "Needs Review" ? "text-copper" :
                        "text-kombu"
                      }`}>
                        {landlord.status}
                      </span>
                    </div>
                    <div className="w-full md:w-48 bg-brandy/20 rounded-full h-2.5 mt-1">
                      <div
                        className={`h-2.5 rounded-full ${
                          landlord.status === "On Track" ? "bg-dingley" :
                          landlord.status === "Needs Review" ? "bg-copper" :
                          "bg-kombu"
                        }`}
                        style={{ width: `${landlord.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. CREATE DEMAND TAB */}
      {activeTab === "create-demand" && (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl mx-auto">
          {/* STEP 1: Select Category */}
          {createStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-pine text-center sm:text-left">
                Select Crop Category to Establish Contract Procurement Demand
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                  onClick={() => handleSelectCategory({ id: "crops", name: "Crops", description: "" })}
                  className="group relative flex flex-col justify-end h-56 rounded-2xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm text-left transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: "url('/images/categories/crops.jpg')" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Crops</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed">Cereals, paddy, sugarcane, wheat grains.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectCategory({ id: "vegetables", name: "Vegetables", description: "" })}
                  className="group relative flex flex-col justify-end h-56 rounded-2xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm text-left transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: "url('/images/categories/vegetables.jpg')" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Vegetables</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed">Potato, tomato, cabbage, bulb crops.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectCategory({ id: "fruits", name: "Fruits", description: "" })}
                  className="group relative flex flex-col justify-end h-56 rounded-2xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm text-left transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: "url('/images/categories/fruits.jpg')" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Fruits</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed">Mangoes, orchard harvests, apple cultivars.</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelectCategory({ id: "flowers", name: "Flowers", description: "" })}
                  className="group relative flex flex-col justify-end h-56 rounded-2xl overflow-hidden border border-brandy/30 hover:border-dingley shadow-sm text-left transition-all cursor-pointer"
                >
                  <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: "url('/images/categories/flowers.jpg')" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-pine/90 via-pine/40 to-transparent" />
                  <div className="relative z-10 p-6 text-brandy">
                    <h3 className="text-2xl font-bold text-white mb-1">Flowers</h3>
                    <p className="text-xs text-brandy/80 leading-relaxed">Floriculture, ornamental seeds, premium roses.</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Crop */}
          {createStep === 2 && (
            <div className="space-y-6 bg-white p-6 rounded-3xl border border-brandy/30">
              <div className="flex items-center gap-3 border-b border-brandy/20 pb-4">
                <button type="button" onClick={() => setCreateStep(1)} className="p-1 rounded-lg hover:bg-brandy/20 transition-colors">
                  <ArrowRight className="w-5 h-5 rotate-180 text-kombu" />
                </button>
                <h2 className="text-xl font-bold text-pine">Select Crop Variety ({selCategory?.name})</h2>
              </div>

              {loadingCrops ? (
                <div className="flex flex-col items-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-dingley" />
                  <p className="text-xs text-kombu/70 mt-2">Loading crops...</p>
                </div>
              ) : crops.length === 0 ? (
                <p className="text-sm text-kombu/75 italic">No crops found in this category.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {crops.map((crop) => (
                    <button
                      key={crop.id}
                      onClick={() => handleSelectCrop(crop)}
                      className="text-left p-5 bg-brandy/5 hover:bg-brandy/15 border border-brandy/30 hover:border-dingley rounded-2xl transition-all cursor-pointer group"
                    >
                      <h3 className="font-bold text-pine text-base flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-dingley" /> {crop.name}
                      </h3>
                      <p className="text-xs text-kombu/70 mt-2 line-clamp-2">{crop.description || "Specification-backed contract crop."}</p>
                      <span className="inline-block mt-3 text-xs bg-brandy/25 text-kombu px-2 py-0.5 rounded font-mono font-semibold">
                        Cycle: {crop.durationDays} Days
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Demand parameters form */}
          {createStep === 3 && (
            <div className="bg-white p-6 rounded-3xl border border-brandy/30">
              <div className="flex items-center gap-3 border-b border-brandy/20 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    if (editingDemand) {
                      setActiveTab("my-demands");
                      resetForm();
                    } else {
                      setCreateStep(2);
                    }
                  }}
                  className="p-1 rounded-lg hover:bg-brandy/20 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 rotate-180 text-kombu" />
                </button>
                <h2 className="text-xl font-bold text-pine">
                  {editingDemand ? "Edit Demand Parameters" : `Enter Demand Specs: ${selCrop?.name}`}
                </h2>
              </div>

              {formError && (
                <div className="mb-6 p-3.5 bg-copper/10 border border-copper/30 text-copper rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); setCreateStep(4); }} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Quantity and Unit */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-pine mb-2">Required Quantity</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="e.g. 50"
                        value={reqQuantity}
                        onChange={(e) => setReqQuantity(e.target.value)}
                        className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-pine mb-2">Unit</label>
                      <select
                        value={qtyUnit}
                        onChange={(e) => setQtyUnit(e.target.value as any)}
                        className="w-full px-3 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                      >
                        <option value="TONNE">Tonnes</option>
                        <option value="QUINTAL">Quintals</option>
                        <option value="KG">Kilograms</option>
                      </select>
                    </div>
                  </div>

                  {/* Required Land Area */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Required Land Area (Acres)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 15.0"
                      value={reqLandArea}
                      onChange={(e) => setReqLandArea(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Preferred State */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Preferred State</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Punjab"
                      value={prefState}
                      onChange={(e) => setPrefState(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                  {/* Preferred District */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Preferred District (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Jalandhar"
                      value={prefDistrict}
                      onChange={(e) => setPrefDistrict(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                    />
                  </div>
                </div>

                {/* Optional Geolocation matching inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-brandy/5 p-4 rounded-2xl border border-brandy/20">
                  <div className="sm:col-span-3 text-xs text-kombu/70 font-semibold uppercase tracking-wider">
                    Geographic Center & Proximity Search (Optional)
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pine mb-1">Center Latitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="e.g. 31.02"
                      value={prefLat}
                      onChange={(e) => setPrefLat(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-brandy rounded-xl outline-none text-xs font-mono text-pine"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pine mb-1">Center Longitude</label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="e.g. 75.39"
                      value={prefLng}
                      onChange={(e) => setPrefLng(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-brandy rounded-xl outline-none text-xs font-mono text-pine"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pine mb-1">Search Radius (Km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-brandy rounded-xl outline-none text-xs text-pine"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Preferred Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none text-pine"
                    />
                  </div>
                  {/* Harvest Date */}
                  <div>
                    <label className="block text-sm font-semibold text-pine mb-2">Expected Harvest Date</label>
                    <input
                      type="date"
                      value={harvestDate}
                      onChange={(e) => setHarvestDate(e.target.value)}
                      className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none text-pine"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-pine mb-2">Additional Specifications / Quality Notes</label>
                  <textarea
                    placeholder="e.g. Seeking high-gluten wheat grains with organic fertilizer logs."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-kombu text-brandy py-3.5 rounded-xl font-bold transition-all shadow-md"
                >
                  Review Demand Summary <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: Review Summary page */}
          {createStep === 4 && (
            <div className="bg-white p-6 rounded-3xl border border-brandy/30 space-y-6">
              <div className="flex items-center gap-3 border-b border-brandy/20 pb-4">
                <button type="button" onClick={() => setCreateStep(3)} className="p-1 rounded-lg hover:bg-brandy/20 transition-colors">
                  <ArrowRight className="w-5 h-5 rotate-180 text-kombu" />
                </button>
                <h2 className="text-xl font-bold text-pine">Confirm Demand parameters</h2>
              </div>

              <div className="space-y-4 bg-brandy/5 p-6 rounded-2xl border border-brandy/20 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-kombu/60 block">Target Crop</span>
                    <span className="font-bold text-pine text-base">{selCrop?.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-kombu/60 block">Total Volume Required</span>
                    <span className="font-bold text-pine text-base">{reqQuantity} {qtyUnit}s</span>
                  </div>
                  <div>
                    <span className="text-xs text-kombu/60 block">Preferred Area Range</span>
                    <span className="font-bold text-pine text-base">{reqLandArea ? `${reqLandArea} Acres` : "No specified target"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-kombu/60 block">Location Focus</span>
                    <span className="font-bold text-pine text-base">
                      {prefState}{prefDistrict ? `, ${prefDistrict}` : ""}
                    </span>
                  </div>
                  {prefLat && prefLng && (
                    <div className="col-span-2">
                      <span className="text-xs text-kombu/60 block">Center Coordinate Bounds</span>
                      <span className="font-mono text-xs text-pine font-medium">{prefLat}, {prefLng} {searchRadius ? `(Radius: ${searchRadius} Km)` : ""}</span>
                    </div>
                  )}
                  {startDate && (
                    <div>
                      <span className="text-xs text-kombu/60 block">Start Date</span>
                      <span className="font-semibold text-pine">{startDate}</span>
                    </div>
                  )}
                  {harvestDate && (
                    <div>
                      <span className="text-xs text-kombu/60 block">Harvest Date</span>
                      <span className="font-semibold text-pine">{harvestDate}</span>
                    </div>
                  )}
                </div>
                {notes && (
                  <div className="border-t border-brandy/20 pt-3 mt-3">
                    <span className="text-xs text-kombu/60 block">Contract Requirements Notes</span>
                    <p className="text-kombu/80 italic mt-1 font-medium">"{notes}"</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateStep(3)}
                  className="px-6 py-3 border border-brandy text-pine text-sm font-bold rounded-xl hover:bg-brandy/10 transition-all"
                >
                  Change Details
                </button>
                <button
                  type="button"
                  onClick={handleSaveDemand}
                  disabled={savingDemand}
                  className="flex items-center gap-2 px-6 py-3 bg-pine hover:bg-kombu text-brandy text-sm font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {savingDemand ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Publish Demand"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Success Feedback page */}
          {createStep === 5 && (
            <div className="bg-white p-8 rounded-3xl border border-brandy/30 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 bg-dingley/20 text-dingley rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-pine">Demand Published successfully</h2>
                <p className="text-sm text-kombu/70 mt-2 max-w-sm mx-auto">
                  Your crop requirements has been saved. Landowners matching your criteria will now be discovered.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => {
                    setActiveTab("my-demands");
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-6 py-3 border border-brandy text-pine font-bold rounded-xl hover:bg-brandy/10 transition-colors"
                >
                  Go to My Demands
                </button>
                <button
                  onClick={() => {
                    // Try to trigger discovery for the last published demand
                    const latest = demands[0];
                    if (latest) {
                      handleTriggerDiscovery(latest.id);
                    } else {
                      setActiveTab("discover-land");
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl transition-all shadow-md"
                >
                  Discover Available Land <Compass className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MY DEMANDS TAB */}
      {activeTab === "my-demands" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-pine">Your Published Procurement Demands ({demands.length})</h2>
            <button
              onClick={() => { setActiveTab("create-demand"); setCreateStep(1); resetForm(); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-pine hover:bg-kombu text-brandy text-sm font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Crop Demand
            </button>
          </div>

          {loadingDemands ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-3xl border border-brandy/30">
              <Loader2 className="w-8 h-8 animate-spin text-dingley" />
              <p className="text-xs text-kombu/70 mt-3">Loading demands...</p>
            </div>
          ) : demands.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-3xl border border-brandy/30 max-w-xl mx-auto mt-8">
              <Compass className="w-12 h-12 text-brandy mx-auto mb-4" />
              <h3 className="text-xl font-bold text-pine mb-2">No Demands Found</h3>
              <p className="text-xs text-kombu/70 mb-6">
                Publish crop demand specifications to start matching with registered, available lands.
              </p>
              <button
                onClick={() => { setActiveTab("create-demand"); setCreateStep(1); resetForm(); }}
                className="px-6 py-3 bg-pine text-brandy font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                Create First Demand
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demands.map((demand) => (
                <div
                  key={demand.id}
                  className="bg-white rounded-2xl border border-brandy/40 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="bg-gradient-to-r from-pine/10 to-brandy/10 p-5 border-b border-brandy/20 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-pine flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-dingley" /> {demand.crop?.name}
                      </h3>
                      <span className="text-xs font-mono font-medium text-kombu/60">
                        Category: {demand.crop?.category?.name || "Crops"}
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                      demand.status === "ACTIVE" ? "bg-dingley/20 text-dingley" :
                      demand.status === "PAUSED" ? "bg-copper/20 text-copper" :
                      demand.status === "CLOSED" ? "bg-kombu/25 text-kombu" :
                      "bg-brandy/30 text-kombu/60"
                    }`}>
                      {demand.status}
                    </span>
                  </div>

                  <div className="p-5 space-y-4 flex-grow">
                    <div className="grid grid-cols-2 gap-4 text-xs bg-brandy/5 p-4 rounded-xl border border-brandy/25">
                      <div>
                        <span className="text-kombu/60 uppercase">Quantity</span>
                        <p className="font-bold text-pine text-sm mt-0.5">
                          {demand.requiredQuantity} {demand.quantityUnit}s
                        </p>
                      </div>
                      <div>
                        <span className="text-kombu/60 uppercase">Target Land Size</span>
                        <p className="font-bold text-pine text-sm mt-0.5">
                          {demand.requiredLandArea ? `${demand.requiredLandArea} Acres` : "No preference"}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-kombu/60 uppercase">Preferred Location</span>
                        <p className="font-bold text-pine text-sm mt-0.5">
                          {demand.preferredState}{demand.preferredDistrict ? `, ${demand.preferredDistrict}` : ""}
                        </p>
                      </div>
                    </div>

                    {demand.notes && (
                      <p className="text-xs text-kombu/70 leading-relaxed italic border-l-2 border-brandy/60 pl-3">
                        "{demand.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions bar */}
                  <div className="bg-brandy/10 px-5 py-4 border-t border-brandy/25 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {demand.status === "ACTIVE" ? (
                        <button
                          onClick={() => handleToggleStatus(demand, "PAUSED")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-copper/30 hover:bg-copper/5 text-copper text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          <Pause className="w-3.5 h-3.5" /> Pause
                        </button>
                      ) : demand.status === "PAUSED" || demand.status === "DRAFT" ? (
                        <button
                          onClick={() => handleToggleStatus(demand, "ACTIVE")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-dingley hover:bg-dingley/90 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" /> Activate
                        </button>
                      ) : null}

                      {demand.status !== "CLOSED" && (
                        <button
                          onClick={() => handleToggleStatus(demand, "CLOSED")}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-kombu/30 hover:bg-brandy/20 text-kombu text-xs font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Close
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenEdit(demand)}
                        disabled={demand.status === "CLOSED"}
                        className="text-xs font-bold text-pine hover:text-dingley flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleTriggerDiscovery(demand.id)}
                        disabled={demand.status === "CLOSED"}
                        className="text-xs font-bold text-dingley hover:text-pine flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" /> Discover Land
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. DISCOVER LAND TAB */}
      {activeTab === "discover-land" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-3xl border border-brandy/30 space-y-4 max-w-xl mx-auto shadow-sm">
            <h3 className="font-bold text-pine text-lg flex items-center gap-2">
              <Compass className="w-5 h-5 text-dingley animate-pulse" /> Available Land Search Engine
            </h3>
            <p className="text-xs text-kombu/70">
              Select one of your crop demands to automatically match with registered available landowner plots.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <select
                value={selectedDemandId}
                onChange={(e) => setSelectedDemandId(e.target.value)}
                className="flex-1 px-3 py-2 bg-brandy/5 border border-brandy rounded-xl outline-none text-sm text-pine font-medium"
              >
                <option value="">-- Choose Active Crop Demand --</option>
                {demands.filter(d => d.status === "ACTIVE").map(d => (
                  <option key={d.id} value={d.id}>
                    {d.crop?.name} ({d.requiredQuantity} {d.quantityUnit}s) in {d.preferredState}
                  </option>
                ))}
              </select>
              <button
                onClick={() => fetchMatchingLands(selectedDemandId)}
                disabled={!selectedDemandId || loadingDiscovery}
                className="px-5 py-2 bg-pine hover:bg-kombu text-brandy rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Find Available Land
              </button>
            </div>
            {discoveryError && (
              <p className="text-xs text-copper font-semibold">{discoveryError}</p>
            )}
          </div>

          {loadingDiscovery ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-3xl border border-brandy/30">
              <Loader2 className="w-8 h-8 animate-spin text-dingley" />
              <p className="text-xs text-kombu/70 mt-3">Searching registries...</p>
            </div>
          ) : discoveredLands.length === 0 ? (
            <div className="h-44 border border-dashed border-brandy/60 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-brandy/5 text-kombu/60 max-w-xl mx-auto">
              <Compass className="w-10 h-10 mb-2 text-brandy" />
              <h4 className="font-bold text-pine text-base mb-1">No Matches Discovered</h4>
              <p className="text-xs max-w-xs">Run a search above to discover available plots.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: Matches list */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-xs font-bold text-kombu/60 uppercase tracking-wider">Matching Available Plots ({discoveredLands.length})</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {discoveredLands.map((land) => (
                    <div
                      key={land.id}
                      className="bg-white rounded-2xl border border-brandy/35 overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-pine text-base">{land.name}</h4>
                          <div className="flex items-center gap-2">
                            {selectedLands.some((l) => l.id === land.id) && (
                              <span className="text-[10px] font-bold text-dingley px-2 py-0.5 bg-dingley/20 rounded-md">
                                Selected
                              </span>
                            )}
                            <span className="text-xs font-bold text-dingley px-2 py-0.5 bg-dingley/20 rounded-md">
                              Score: {land.matchScore}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-kombu/70 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-copper" /> {land.village}, {land.district}, {land.state}
                        </p>
                        <p className="text-sm font-bold text-pine">
                          Size: {land.size} {land.unit}s
                        </p>
                        <p className="text-xs text-kombu/60 font-semibold">
                          Owner: {land.ownerName || "Registered Owner"}
                        </p>
                        {land.distanceKm !== null && (
                          <span className="inline-block text-[10px] bg-brandy/20 text-kombu px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            Distance: {land.distanceKm} Km
                          </span>
                        )}
                      </div>

                      <div className="bg-brandy/10 px-5 py-3 border-t border-brandy/20 flex justify-between items-center">
                        <button
                          onClick={() => setInspectLand(land)}
                          className="flex items-center gap-1 text-xs font-bold text-pine hover:text-dingley cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>

                        {selectedLands.some((l) => l.id === land.id) ? (
                          <button
                            onClick={() => handleRemoveLand(land.id)}
                            className="flex items-center gap-1 text-xs font-bold text-copper hover:text-copper/85 cursor-pointer"
                          >
                            Remove Selection
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectLand(land)}
                            className="flex items-center gap-1 text-xs font-bold text-dingley hover:text-pine cursor-pointer"
                          >
                            Select Land
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Persistent Selection Summary & Inspector */}
              <div className="md:col-span-1 space-y-6">
                {/* 1. Selected Land Summary */}
                <div className="bg-white p-6 rounded-3xl border border-brandy/30 shadow-sm space-y-4">
                  <h3 className="font-bold text-pine text-lg border-b border-brandy/20 pb-2">
                    Selected Land Summary
                  </h3>
                  
                  {selectedLands.length === 0 ? (
                    <p className="text-xs text-kombu/70 italic">No land parcels selected yet.</p>
                  ) : (
                    <div className="space-y-3">
                      <div className="max-h-72 overflow-y-auto divide-y divide-brandy/10 pr-1">
                        {selectedLands.map((land) => {
                          const contract = demandContracts.find((c) => c.landId === land.id);
                          return (
                            <div key={land.id} className="py-3 last:border-b-0 space-y-2">
                              <div className="flex items-start justify-between text-xs">
                                <div>
                                  <p className="font-bold text-pine">{land.name}</p>
                                  <p className="text-[10px] text-kombu/60">
                                    {land.village}, {land.district} | Owner: {land.ownerName || "Owner"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-semibold text-pine text-xs">{land.size} {land.unit}s</span>
                                  {!contract && (
                                    <button
                                      onClick={() => handleRemoveLand(land.id)}
                                      className="p-1 text-copper hover:bg-brandy/20 rounded transition-colors"
                                      title="Remove selection"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Contract Proposal trigger / state */}
                              <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                                {contract ? (
                                  <>
                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                                      contract.status === "PENDING_APPROVAL" ? "bg-copper/20 text-copper" :
                                      contract.status === "ACCEPTED" ? "bg-dingley/20 text-dingley" :
                                      contract.status === "ACTIVE" ? "bg-pine text-white" :
                                      contract.status === "REJECTED" ? "bg-red-100 text-red-700" :
                                      "bg-gray-100 text-gray-500"
                                    }`}>
                                      {contract.status.replace("_", " ")}
                                    </span>
                                    
                                    {contract.status === "PENDING_APPROVAL" && (
                                      <button
                                        onClick={() => handleCancelContract(contract.id)}
                                        className="text-[10px] font-bold text-copper hover:underline cursor-pointer"
                                      >
                                        Cancel Proposal
                                      </button>
                                    )}

                                    {(contract.status === "REJECTED" || contract.status === "CANCELLED") && (
                                      <button
                                        onClick={() => {
                                          setProposingLand(land);
                                          setPropPrice(contract.proposedPrice.toString());
                                          if (contract.startDate) {
                                            setPropStartDate(new Date(contract.startDate).toISOString().split("T")[0]);
                                          }
                                          if (contract.expectedHarvestDate) {
                                            setPropEndDate(new Date(contract.expectedHarvestDate).toISOString().split("T")[0]);
                                          }
                                          setPropNotes(contract.notes || "");
                                        }}
                                        className="text-[10px] font-bold text-dingley hover:underline cursor-pointer"
                                      >
                                        Propose Again
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setProposingLand(land);
                                      const activeDem = demands.find(d => d.id === selectedDemandId);
                                      const cropMeta = activeDem?.crop?.metadataJson ? JSON.parse(activeDem.crop.metadataJson) : null;
                                      if (cropMeta?.basePricePerTonne) {
                                        const yieldPerAcre = parseFloat(cropMeta.expectedYieldPerAcre) || 0;
                                        const estimatedQty = yieldPerAcre * land.size;
                                        const estimatedCost = estimatedQty * parseFloat(cropMeta.basePricePerTonne);
                                        setPropPrice(Math.round(estimatedCost).toString());
                                      } else {
                                        setPropPrice("");
                                      }
                                    }}
                                    className="text-[10px] font-bold text-dingley hover:text-pine hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    Propose Contract &rarr;
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-brandy/20 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-kombu/70">Required Area:</span>
                      <span className="font-bold text-pine">{requiredArea ? `${requiredArea} Acres` : "Not specified"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kombu/70">Total Selected:</span>
                      <span className="font-bold text-pine">{selectedArea.toFixed(1)} Acres</span>
                    </div>
                    
                    {requiredArea > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-kombu/70">Remaining Required:</span>
                          <span className={`font-bold ${remainingArea === 0 ? "text-dingley" : "text-pine"}`}>
                            {remainingArea.toFixed(1)} Acres
                          </span>
                        </div>

                        {requirementMet ? (
                          <div className="p-2.5 bg-dingley/20 border border-dingley/30 text-dingley rounded-xl font-bold text-center mt-2 flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4" /> Land Requirement Met
                          </div>
                        ) : null}

                        {excessArea > 0 ? (
                          <div className="p-2 bg-brandy/20 border border-brandy/30 text-pine rounded-xl text-center text-[10px] font-semibold mt-2">
                            Selected area exceeds requirement by {excessArea.toFixed(1)} Acres.
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Discovery Inspector */}
                {inspectLand ? (
                  <div className="bg-white p-6 rounded-3xl border border-brandy/30 shadow-sm space-y-6 animate-in fade-in duration-300">
                    <div>
                      <div className="inline-block px-2.5 py-1 bg-dingley/20 text-dingley text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                        Discovery Inspector
                      </div>
                      <h3 className="text-xl font-bold text-pine">{inspectLand.name}</h3>
                      <p className="text-xs text-kombu/70 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-copper" /> {inspectLand.village}, {inspectLand.district}, {inspectLand.state}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs bg-brandy/5 p-4 rounded-xl border border-brandy/20">
                      <div>
                        <span className="text-kombu/60 block uppercase">Area</span>
                        <span className="font-bold text-pine text-sm">{inspectLand.size} {inspectLand.unit}s</span>
                      </div>
                      <div>
                        <span className="text-kombu/60 block uppercase">Status</span>
                        <span className="font-bold text-dingley text-sm uppercase">{inspectLand.status}</span>
                      </div>
                      {inspectLand.distanceKm !== null && (
                        <div className="col-span-2">
                          <span className="text-kombu/60 block uppercase">Radial Distance</span>
                          <span className="font-bold text-pine text-sm">{inspectLand.distanceKm} Kilometers</span>
                        </div>
                      )}
                    </div>

                    {inspectLand.matchReasons && inspectLand.matchReasons.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs text-kombu/60 font-bold uppercase tracking-wider block">Match Analysis</span>
                        <ul className="space-y-1.5">
                          {inspectLand.matchReasons.map((reason, idx) => (
                            <li key={idx} className="text-xs text-kombu/80 font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-dingley shrink-0" /> {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="p-3.5 bg-brandy/10 border border-brandy/30 rounded-xl text-[10px] text-kombu/60 leading-normal">
                      <strong>Discovery View Limit:</strong> In accordance with platform privacy regulations, direct landowner contact details and contract negotiations are unlocked in later contract proposal verification cycles.
                    </div>
                  </div>
                ) : (
                  <div className="h-48 border border-dashed border-brandy/60 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-brandy/5 text-kombu/60">
                    <Compass className="w-10 h-10 mb-2 text-brandy" />
                    <h4 className="font-bold text-pine text-sm mb-1">Select a Plot</h4>
                    <p className="text-[10px] max-w-xs">Click View Details on any discovered land card to inspect score breakdowns and size dimensions.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MY CONTRACTS TAB */}
      {activeTab === "my-contracts" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-pine">
              Contract Proposals Directory
            </h2>
          </div>

          {loadingContracts ? (
            <div className="flex flex-col items-center py-20 bg-white rounded-3xl border border-brandy/30">
              <Loader2 className="w-8 h-8 animate-spin text-dingley" />
              <p className="text-sm text-kombu/70 mt-4">Retrieving proposals...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="h-64 border border-dashed border-brandy/60 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-brandy/5 text-kombu/60 max-w-xl mx-auto">
              <Compass className="w-12 h-12 mb-3 text-brandy" />
              <h4 className="font-bold text-pine text-lg mb-1">No Proposals Sent</h4>
              <p className="text-xs max-w-xs">Selected lands in "Discover Land" tab can be proposed for agricultural contracts.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-white rounded-2xl border border-brandy/40 shadow-sm overflow-hidden"
                >
                  <div className="bg-brandy/10 p-5 border-b border-brandy/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold tracking-wider uppercase bg-dingley/20 text-dingley px-2 py-0.5 rounded">
                        {contract.crop?.name || "Crop"} Proposal
                      </span>
                      <h3 className="font-bold text-lg text-pine mt-1.5 flex items-center gap-2">
                        Contract #{contract.id.substring(0, 8).toUpperCase()}
                        <span className="text-[10px] bg-brandy/20 text-pine px-2 py-0.5 rounded font-semibold">
                          v{contract.revision || 1}
                        </span>
                      </h3>
                      <p className="text-xs text-kombu/60 mt-0.5">
                        Proposed to: <strong>{contract.landowner?.name || "Registered Landowner"}</strong> ({contract.landowner?.phone || "N/A"})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Land Details</span>
                      <p className="font-bold text-pine text-sm">{contract.land?.name || "Plot Location"}</p>
                      <p className="text-kombu/70 mt-0.5">{contract.land?.village}, {contract.land?.district}, {contract.land?.state}</p>
                    </div>

                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Area & Quantity</span>
                      <p className="font-bold text-pine text-sm">{contract.landArea} Acres</p>
                      <p className="text-kombu/70 mt-0.5">Allocated Yield: {contract.allocatedQuantity.toFixed(1)} Tonnes</p>
                    </div>

                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Proposed Value</span>
                      <p className="font-bold text-copper text-sm">₹{contract.proposedPrice.toLocaleString("en-IN")}</p>
                      <p className="text-kombu/70 mt-0.5">Estimated timeline payout</p>
                    </div>

                    <div>
                      <span className="text-kombu/60 block uppercase font-bold tracking-wider mb-1">Contract Timelines</span>
                      <p className="font-bold text-pine text-sm">Start: {new Date(contract.startDate).toLocaleDateString()}</p>
                      <p className="text-kombu/70 mt-0.5">Harvest: {new Date(contract.expectedHarvestDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {contract.notes && (
                    <div className="px-5 pb-5">
                      <div className="bg-brandy/5 border border-brandy/20 p-3 rounded-xl text-xs text-kombu/80">
                        <strong>Negotiation Notes:</strong> "{contract.notes}"
                      </div>
                    </div>
                  )}

                  {contract.status === "REJECTED" && contract.rejectionReason && (
                    <div className="px-5 pb-5">
                      <div className="bg-copper/10 border border-copper/30 p-3 rounded-xl text-xs text-copper">
                        <strong>Landowner Rejection Reason:</strong> "{contract.rejectionReason}"
                      </div>
                    </div>
                  )}

                  <div className="bg-brandy/10 px-5 py-3 border-t border-brandy/20 flex justify-end gap-3">
                    {contract.status === "PENDING_APPROVAL" && (
                      <button
                        onClick={() => handleCancelContract(contract.id)}
                        className="px-4 py-2 border border-copper text-copper font-bold rounded-xl hover:bg-copper/5 text-xs transition-all cursor-pointer"
                      >
                        Cancel Proposal
                      </button>
                    )}
                    {contract.status === "ACCEPTED" && (
                      <button
                        onClick={() => setShowActivateConfirmId(contract.id)}
                        className="px-4 py-2 bg-pine text-brandy hover:bg-kombu font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Activate Contract
                      </button>
                    )}
                    {contract.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => setViewingContractId(contract.id)}
                          className="px-4 py-2 bg-brandy/20 text-pine hover:bg-brandy/35 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          View Contract
                        </button>
                        <button
                          onClick={() => handleCompleteContract(contract.id)}
                          className="px-4 py-2 bg-copper text-brandy hover:bg-copper/90 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Complete Contract
                        </button>
                      </>
                    )}
                    {contract.status === "COMPLETED" && (
                      <button
                        onClick={() => setViewingContractId(contract.id)}
                        className="px-4 py-2 bg-brandy/20 text-pine hover:bg-brandy/35 font-bold rounded-xl text-xs transition-all cursor-pointer"
                      >
                        View Summary
                      </button>
                    )}
                    {(contract.status === "REJECTED" || contract.status === "CANCELLED") && (
                      <>
                        <button
                          onClick={() => setViewingContractId(contract.id)}
                          className="px-4 py-2 bg-brandy/20 text-pine hover:bg-brandy/35 font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            const mockLand: any = {
                              id: contract.landId,
                              name: contract.land?.name || "Plot",
                              size: contract.landArea,
                              unit: "ACRE",
                              village: contract.land?.village || "",
                              district: contract.land?.district || "",
                              state: contract.land?.state || "",
                              ownerName: contract.landowner?.name || "",
                            };
                            setProposingLand(mockLand);
                            setPropPrice(contract.proposedPrice.toString());
                            if (contract.startDate) {
                              setPropStartDate(new Date(contract.startDate).toISOString().split("T")[0]);
                            }
                            if (contract.expectedHarvestDate) {
                              setPropEndDate(new Date(contract.expectedHarvestDate).toISOString().split("T")[0]);
                            }
                            setPropNotes(contract.notes || "");
                          }}
                          className="px-4 py-2 bg-pine text-brandy hover:bg-kombu font-bold rounded-xl text-xs transition-all cursor-pointer"
                        >
                          Propose Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contract Proposal Modal Overlay */}
      {proposingLand && (
        <div className="fixed inset-0 bg-pine/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brandy/30 shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div>
              <h3 className="text-xl font-bold text-pine">Propose Contract</h3>
              <p className="text-xs text-kombu/70 mt-1">
                Specify timeline targets and proposed pricing for plot <strong>{proposingLand.name}</strong>.
              </p>
            </div>

            {propError && (
              <div className="p-3 bg-copper/10 border border-copper/30 text-copper rounded-xl text-xs font-semibold">
                {propError}
              </div>
            )}

            <form onSubmit={handleProposeContractSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-kombu/80 font-bold mb-1.5">Selected Land Area</label>
                <input
                  type="text"
                  disabled
                  value={`${proposingLand.size} ${proposingLand.unit}s`}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-brandy rounded-xl outline-none font-semibold text-pine"
                />
              </div>

              <div>
                <label className="block text-kombu/80 font-bold mb-1.5">Proposed Total Price (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 150000"
                  value={propPrice}
                  onChange={(e) => setPropPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-pine"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-kombu/80 font-bold mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={propStartDate}
                    onChange={(e) => setPropStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-pine"
                  />
                </div>
                <div>
                  <label className="block text-kombu/80 font-bold mb-1.5">Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={propEndDate}
                    onChange={(e) => setPropEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-pine"
                  />
                </div>
              </div>

              <div>
                <label className="block text-kombu/80 font-bold mb-1.5">Optional Proposal Notes</label>
                <textarea
                  rows={3}
                  placeholder="Specify any soil/crop milestone preferences or payment terms..."
                  value={propNotes}
                  onChange={(e) => setPropNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-1 focus:ring-dingley/20 rounded-xl outline-none text-pine"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setProposingLand(null)}
                  className="px-4 py-2 border border-brandy text-pine font-bold rounded-xl hover:bg-brandy/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProposal}
                  className="px-5 py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingProposal ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...
                    </>
                  ) : (
                    "Send Proposal"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activate Contract Confirmation Warning Dialog Modal */}
      {showActivateConfirmId && (
        <div className="fixed inset-0 bg-pine/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-brandy/30 shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div>
              <h3 className="text-xl font-bold text-pine">Confirm Contract Activation</h3>
              <p className="text-xs text-kombu/70 mt-2 leading-relaxed">
                Activating this contract will officially begin the farming agreement.
              </p>
              <div className="bg-brandy/15 border border-brandy/30 text-pine rounded-xl p-3.5 text-xs font-semibold mt-4 leading-normal">
                This action is irreversible. The land parcel status will remain locked as UNDER_CONTRACT. Buyer and farmer will be bound by the agreed rates.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowActivateConfirmId(null)}
                className="px-4 py-2 border border-brandy text-pine font-bold rounded-xl hover:bg-brandy/10 text-xs cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => handleActivateContract(showActivateConfirmId)}
                className="px-5 py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-xl shadow-md hover:shadow-lg text-xs cursor-pointer"
              >
                Confirm & Activate
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
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-brandy/20 text-kombu/60 hover:text-pine transition-colors cursor-pointer"
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
                          <strong>Landowner Rejection Reason:</strong> "{viewingContract.rejectionReason}"
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Financials" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Financial Allocation Card (Buyer View) */}
                      {loadingFinancials ? (
                        <div className="p-3 bg-brandy/5 border border-brandy/20 rounded-2xl flex items-center justify-center text-xs text-kombu/60">
                          <Loader2 className="w-4 h-4 animate-spin text-dingley" />
                          <span className="ml-2">Loading financial allocations...</span>
                        </div>
                      ) : financialsLoadError ? (
                        <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-2xl text-xs font-semibold">
                          Financial allocations details unavailable: {financialsLoadError}
                        </div>
                      ) : viewingContractOverview?.financialSummary ? (
                        <>
                          <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3 text-xs">
                            <div className="flex justify-between items-center border-b border-brandy/10 pb-2">
                              <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Budget Allocation</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                                viewingContractOverview.financialSummary.isConfigured ? "bg-dingley/20 text-pine" : "bg-amber-100 text-amber-800"
                              }`}>
                                {viewingContractOverview.financialSummary.isConfigured ? "Agreed Setup" : "Awaiting Allocation"}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-white/60 p-4 rounded-xl border border-brandy/10">
                              <div>
                                <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Landowner Payout (50%)</span>
                                <span className="font-bold text-pine">₹{viewingContractOverview.financialSummary.landownerAmount.toLocaleString("en-IN")}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Workforce Budget (25%)</span>
                                <span className="font-semibold text-pine">₹{viewingContractOverview.financialSummary.workforceBudget.toLocaleString("en-IN")}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Logistics Budget (10%)</span>
                                <span className="font-semibold text-pine">₹{viewingContractOverview.financialSummary.logisticsBudget.toLocaleString("en-IN")}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Platform Service Fee (10%)</span>
                                <span className="font-semibold text-pine">₹{viewingContractOverview.financialSummary.platformFee.toLocaleString("en-IN")}</span>
                              </div>
                              <div className="col-span-2 border-t border-brandy/25 pt-2">
                                <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Total Contract Valuation</span>
                                <span className="font-bold text-copper text-sm">₹{viewingContractOverview.financialSummary.totalContractValue.toLocaleString("en-IN")}</span>
                              </div>
                            </div>
                          </div>

                          {/* Financial custom settings editor form for Buyer */}
                          {viewingContract.status === "ACCEPTED" && (
                            <form onSubmit={handleSaveFinancials} className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-4 text-xs animate-in fade-in">
                              <h4 className="text-xs font-bold text-pine uppercase tracking-wider border-b border-brandy/10 pb-2 font-bold">
                                Customize Budget Allocations
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[10px] text-kombu/60 font-semibold mb-1">Landowner Payout (₹)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border border-brandy/30 rounded-lg text-xs"
                                    value={editLandownerAmount}
                                    onChange={(e) => setEditLandownerAmount(e.target.value)}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-kombu/60 font-semibold mb-1">Workforce Budget (₹)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border border-brandy/30 rounded-lg text-xs"
                                    value={editWorkforceBudget}
                                    onChange={(e) => setEditWorkforceBudget(e.target.value)}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-kombu/60 font-semibold mb-1">Logistics Budget (₹)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border border-brandy/30 rounded-lg text-xs"
                                    value={editLogisticsBudget}
                                    onChange={(e) => setEditLogisticsBudget(e.target.value)}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-kombu/60 font-semibold mb-1">Platform Service Fee (₹)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border border-brandy/30 rounded-lg text-xs"
                                    value={editPlatformFee}
                                    onChange={(e) => setEditPlatformFee(e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="block text-[10px] text-kombu/60 font-semibold mb-1">Reserve Budget (₹)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-full p-2 border border-brandy/30 rounded-lg text-xs"
                                    value={editReserveBudget}
                                    onChange={(e) => setEditReserveBudget(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>

                              {financialsError && (
                                <p className="text-[10px] text-red-650 font-bold bg-red-50 p-2 rounded-lg">{financialsError}</p>
                              )}

                              <button
                                type="submit"
                                disabled={savingFinancials}
                                className="w-full py-2 bg-pine hover:bg-kombu text-brandy font-bold rounded-lg text-xs shadow transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {savingFinancials ? "Saving custom allocations..." : "Save Financial Allocation"}
                              </button>
                            </form>
                          )}
                        </>
                      ) : (
                        <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60">
                          No financials allocations initialized for this contract.
                        </div>
                      )}
                    </div>
                  )}

                  {activeDetailTab === "Yield" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Yield Allocation Card (Buyer View) */}
                      {loadingYield ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-dingley" />
                          <span className="text-[10px] text-kombu/60 ml-2">Loading yield tracking details...</span>
                        </div>
                      ) : yieldLoadError ? (
                        <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200">
                          <p className="font-semibold text-[10px]">Yield tracking details unavailable</p>
                          <p className="text-[9px] opacity-85 mt-0.5">{yieldLoadError}</p>
                        </div>
                      ) : viewingContractOverview?.yieldSummary ? (
                        <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-3 text-xs">
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider flex items-center justify-between border-b border-brandy/10 pb-2 font-bold">
                            <span>Crop Production & Yield</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                              viewingContractOverview.yieldSummary.fulfillmentStatus === "FULFILLED" ? "bg-dingley/20 text-pine" :
                              viewingContractOverview.yieldSummary.fulfillmentStatus === "OVERFULFILLED" ? "bg-green-100 text-green-800" :
                              viewingContractOverview.yieldSummary.fulfillmentStatus === "PARTIAL" ? "bg-amber-100 text-amber-800" :
                              "bg-brandy/20 text-pine"
                            }`}>
                              {viewingContractOverview.yieldSummary.fulfillmentStatus}
                            </span>
                          </h4>

                          <div className="grid grid-cols-2 gap-3 bg-white/60 p-4 rounded-xl border border-brandy/10">
                            <div>
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Estimated Production Yield</span>
                              <span className="font-bold text-pine">
                                {viewingContractOverview.yieldSummary.estimatedQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.estimatedQuantity.toFixed(2)} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                  : "Calculating..."}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-kombu/60 block font-semibold mb-0.5">Recorded Harvest Yield</span>
                              <span className="font-bold text-pine">
                                {viewingContractOverview.yieldSummary.actualQuantity !== null
                                  ? `${viewingContractOverview.yieldSummary.actualQuantity.toFixed(2)} ${viewingContract.demand?.quantityUnit || "Tonnes"}`
                                  : "Awaiting Harvest..."}
                              </span>
                            </div>
                          </div>
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
                      {/* Crop Milestone Plan Card (Buyer View) */}
                      <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b border-brandy/10 pb-2">
                          <div>
                            <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Crop Milestone Plan</h4>
                            <p className="text-[9px] text-kombu/60 mt-0.5">
                              Planned System Schedule (Compare with Farm Progress History for actual progress)
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
                                  <div className="bg-white/60 p-2.5 rounded-xl border border-brandy/10 flex justify-between items-start gap-4">
                                    <div>
                                      <p className="font-bold text-pine text-xs">{ms.title}</p>
                                      <p className="text-[10px] text-kombu/60 mt-0.5">
                                        Planned Date: {new Date(ms.plannedDate).toLocaleDateString("en-IN", {
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
                          <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60 font-medium italic">
                            No milestones generated for this contract.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDetailTab === "Tasks" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Crop Actionable Tasks Card (Buyer View) */}
                      <div className="bg-brandy/5 border border-brandy/20 p-5 rounded-2xl space-y-4 text-xs">
                        <div>
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-bold">Crop Actionable Tasks</h4>
                          <p className="text-[9px] text-kombu/60 mt-0.5">
                            Detailed operational task checklist per milestone stage (Read-Only)
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
                                  <div className="space-y-2 pt-1">
                                    {msTasks.map((task: any) => {
                                      const priorityColors = 
                                        task.priority === "CRITICAL" ? "text-red-655 bg-red-50 border border-red-100" :
                                        task.priority === "HIGH" ? "text-amber-700 bg-amber-50 border border-amber-100" :
                                        task.priority === "MEDIUM" ? "text-pine bg-dingley/10 border border-dingley/20" :
                                        "text-kombu/60 bg-gray-50 border border-gray-100";

                                      const statusBadge = 
                                        task.status === "COMPLETED" ? "text-dingley border border-dingley/20 bg-dingley/5" :
                                        task.status === "IN_PROGRESS" ? "text-amber-600 border border-amber-200 bg-amber-50" :
                                        task.status === "OVERDUE" ? "text-red-600 border border-red-200 bg-red-50 font-bold animate-pulse" :
                                        "text-kombu/40 border border-gray-200 bg-gray-50";

                                      return (
                                        <div key={task.id} className="flex justify-between items-start gap-3 pl-1 text-[11px] border-b border-brandy/5 pb-2 last:border-0 last:pb-0">
                                          <div className="flex-1">
                                            <p className={`font-semibold ${task.status === 'COMPLETED' ? 'line-through text-kombu/40' : 'text-kombu'}`}>
                                              {task.sequence}. {task.title}
                                            </p>
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
                                          <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${statusBadge}`}>
                                            {task.status}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="bg-brandy/10 p-3 rounded-xl text-center text-kombu/60 font-medium italic">
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

                      {/* Farm Progress Updates Timeline */}
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
                          <h4 className="text-xs font-bold text-pine uppercase tracking-wider font-semibold">Negotiation History ({viewingContract.history.length} previous rounds)</h4>
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
                                  <p className="text-[10px] text-red-655 bg-red-50 p-1.5 rounded">Rejection Reason: "{hist.rejectionReason}"</p>
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
                      {/* Contract Monitoring & Alerts (Buyer View) */}
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
    </div>
  );
}
