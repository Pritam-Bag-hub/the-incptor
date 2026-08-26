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
  DollarSign
} from "lucide-react";

type Tab = "overview" | "create-demand" | "my-demands" | "discover-land";

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
    } catch (err: any) {
      setDiscoveryError(err.message || "Could not run land matching.");
      setDiscoveredLands([]);
    } finally {
      setLoadingDiscovery(false);
    }
  };

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
                          <span className="text-xs font-bold text-dingley px-2 py-0.5 bg-dingley/20 rounded-md">
                            Score: {land.matchScore}%
                          </span>
                        </div>
                        <p className="text-xs text-kombu/70 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-copper" /> {land.village}, {land.district}, {land.state}
                        </p>
                        <p className="text-sm font-bold text-pine">
                          Size: {land.size} {land.unit}s
                        </p>
                        {land.distanceKm !== null && (
                          <span className="inline-block text-[10px] bg-brandy/20 text-kombu px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            Distance: {land.distanceKm} Km
                          </span>
                        )}
                      </div>

                      <div className="bg-brandy/10 px-5 py-3 border-t border-brandy/20 flex justify-end">
                        <button
                          onClick={() => setInspectLand(land)}
                          className="flex items-center gap-1 text-xs font-bold text-pine hover:text-dingley cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Plot inspector */}
              <div className="md:col-span-1">
                {inspectLand ? (
                  <div className="bg-white p-6 rounded-3xl border border-brandy/30 shadow-sm space-y-6 animate-in fade-in duration-300 sticky top-24">
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
                  <div className="h-64 border border-dashed border-brandy/60 rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-brandy/5 text-kombu/60 sticky top-24">
                    <Compass className="w-12 h-12 mb-2 text-brandy" />
                    <h4 className="font-bold text-pine text-sm mb-1">Select a Plot</h4>
                    <p className="text-[10px] max-w-xs">Click View Details on any discovered land card to inspect score breakdowns and size dimensions.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
