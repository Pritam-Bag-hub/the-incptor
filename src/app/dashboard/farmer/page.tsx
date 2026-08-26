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
  DollarSign
} from "lucide-react";

type Tab = "overview" | "lands" | "crops";

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

  // Fetch lands and categories
  useEffect(() => {
    if (activeTab === "lands") {
      fetchLands();
    } else if (activeTab === "crops") {
      fetchCategories();
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
    </div>
  );
}
