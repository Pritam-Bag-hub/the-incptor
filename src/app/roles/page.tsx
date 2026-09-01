"use client";

import React, { useState } from "react";
import { Building2, Sprout, ClipboardCheck, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "buyer" | "farmer" | "worker";

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const router = useRouter();

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/auth?role=${selectedRole}`);
    }
  };

  const roles = [
    {
      id: "buyer" as Role,
      title: "Buyer / Company",
      description: "Create contracts, define milestones, monitor farms, and review AI insights.",
      icon: <Building2 className="w-8 h-8 mb-4 text-kombu" />,
      gradient: "from-kombu/5 to-kombu/10 hover:from-kombu/10 hover:to-kombu/20",
      border: "border-brandy hover:border-kombu",
      activeBorder: "border-kombu ring-2 ring-kombu/20",
    },
    {
      id: "farmer" as Role,
      title: "Farmer / Landowner",
      description: "Accept contracts, manage crops & workers, and track payments.",
      icon: <Sprout className="w-8 h-8 mb-4 text-dingley" />,
      gradient: "from-dingley/5 to-dingley/10 hover:from-dingley/10 hover:to-dingley/20",
      border: "border-brandy hover:border-dingley",
      activeBorder: "border-dingley ring-2 ring-dingley/20",
    },
    {
      id: "worker" as Role,
      title: "Field Worker",
      description: "Check in via GPS, upload evidence photos, and complete tasks.",
      icon: <ClipboardCheck className="w-8 h-8 mb-4 text-copper" />,
      gradient: "from-copper/5 to-copper/10 hover:from-copper/10 hover:to-copper/20",
      border: "border-brandy hover:border-copper",
      activeBorder: "border-copper ring-2 ring-copper/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 transition-colors duration-300 relative">
      <Link href="/" className="absolute top-6 left-6 text-pine hover:text-dingley font-semibold transition-colors flex items-center gap-2 z-20 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-dingley/10 blur-3xl" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-brandy/20 blur-3xl" />
      </div>

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-pine mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-dingley to-kombu">AgriContract AI</span>
          </h1>
          <p className="text-lg text-kombu/80 max-w-2xl mx-auto">
            The intelligent platform for verifiable contract farming. Please select your primary role to get started.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {roles.map((role) => {
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative group flex flex-col text-left p-6 sm:p-8 rounded-2xl border-2 transition-all duration-300 ease-in-out bg-white backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md ${
                  isActive ? role.activeBorder : role.border
                }`}
              >
                {/* Background Gradient Hover effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "group-hover:opacity-100"
                  } ${role.gradient}`}
                />
                
                {/* Check Icon for selected state */}
                <div
                  className={`absolute top-4 right-4 transition-all duration-300 ${
                    isActive ? "opacity-100 scale-100" : "opacity-0 scale-75"
                  }`}
                >
                  <CheckCircle2 className={`w-6 h-6 ${
                    role.id === "buyer" ? "text-kombu" :
                    role.id === "farmer" ? "text-dingley" :
                    "text-copper"
                  }`} />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="transform transition-transform duration-300 group-hover:-translate-y-1">
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-bold text-pine mb-2">
                    {role.title}
                  </h3>
                  <p className="text-sm text-kombu/70 flex-grow">
                    {role.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`
              flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300
              ${
                selectedRole
                  ? "bg-pine hover:bg-kombu text-brandy shadow-xl hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
                  : "bg-brandy/20 text-pine/30 cursor-not-allowed"
              }
            `}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
