"use client";

import { MapPin, FileText, CheckCircle2, AlertTriangle } from "lucide-react";

export default function BuyerDashboard() {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Buyer Overview</h1>
        <p className="text-kombu/70 mt-2">
          Monitor your contracted landlords and farm progress.
        </p>
      </div>

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
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4"/> {landlord.location}</span>
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
  );
}
