"use client";

import { ShieldAlert, BarChart3, Users, FileWarning, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          router.push("/roles");
          return;
        }

        const data = await res.json();
        if (!data.authenticated || data.user.role !== "ADMIN") {
          if (data.authenticated) {
            redirectToCorrectDashboard(data.user.role);
          } else {
            router.push("/roles");
          }
          return;
        }

        setUser(data.user);
        setLoading(false);
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/roles");
      }
    }

    function redirectToCorrectDashboard(role: string) {
      if (role === "BUYER") {
        router.push("/dashboard/buyer");
      } else if (role === "LANDOWNER") {
        router.push("/dashboard/farmer");
      } else if (role === "WORKER") {
        router.push("/dashboard/worker");
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
        <p className="text-sm font-semibold text-slate-400 mt-4">Verifying admin session...</p>
      </div>
    );
  }

  const userName = user?.name || "Admin";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-12">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-red-500 mb-2">
              <ShieldAlert className="w-8 h-8" />
              <h1 className="text-3xl font-bold tracking-tight text-white">Admin Console</h1>
            </div>
            <p className="text-slate-400">
              System-wide overview, high-risk cases, and platform analytics.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-sm font-medium text-slate-400">
              Welcome, {userName}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg bg-red-950 hover:bg-red-900 border border-red-900/30 transition-colors text-sm font-medium text-red-200 cursor-pointer"
            >
              Logout
            </button>
            <Link href="/" className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium">
              Exit
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <BarChart3 className="w-5 h-5" />
              <h3 className="font-medium">Total Contracts</h3>
            </div>
            <p className="text-4xl font-bold">1,248</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Users className="w-5 h-5" />
              <h3 className="font-medium">Active Users</h3>
            </div>
            <p className="text-4xl font-bold">8,932</p>
          </div>

          <div className="bg-slate-900 border border-red-900/30 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/5"></div>
            <div className="relative">
              <div className="flex items-center gap-3 text-red-400 mb-2">
                <FileWarning className="w-5 h-5" />
                <h3 className="font-medium">Milestone Disputes</h3>
              </div>
              <p className="text-4xl font-bold text-red-400">14</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-amber-900/30 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-amber-500/5"></div>
            <div className="relative">
              <div className="flex items-center gap-3 text-amber-400 mb-2">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-medium">High Risk Crops</h3>
              </div>
              <p className="text-4xl font-bold text-amber-400">27</p>
            </div>
          </div>
        </div>

        {/* Action Required Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-xl font-bold text-white">Action Required: Flagged by AI</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950">
                <tr>
                  <th className="p-4 font-semibold text-slate-400">Contract ID</th>
                  <th className="p-4 font-semibold text-slate-400">Parties</th>
                  <th className="p-4 font-semibold text-slate-400">Flag Reason</th>
                  <th className="p-4 font-semibold text-slate-400">Risk Score</th>
                  <th className="p-4 font-semibold text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono text-sm text-slate-300">CTR-8892</td>
                  <td className="p-4">ITC Ltd. ↔ R. Singh</td>
                  <td className="p-4 text-amber-400 text-sm">Growth assessment mismatch</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-amber-950 text-amber-400 rounded text-xs font-bold">85/100</span>
                  </td>
                  <td className="p-4">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                      Review
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4 font-mono text-sm text-slate-300">CTR-9014</td>
                  <td className="p-4">AgriCorp ↔ S. Patel</td>
                  <td className="p-4 text-red-400 text-sm">GPS check-in outside field</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-red-950 text-red-400 rounded text-xs font-bold">92/100</span>
                  </td>
                  <td className="p-4">
                    <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors">
                      Review
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
