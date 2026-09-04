"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Navigation,
  Calendar,
  FileText,
  User,
  CheckSquare,
  Play,
  Loader2,
  X,
  Send,
  Building2,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Info,
  Sprout,
  Compass,
  UserCheck,
} from "lucide-react";

export default function WorkerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // Tasks state
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  // Attendance state
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<"NOT_CHECKED_IN" | "WORKING" | "COMPLETED">("NOT_CHECKED_IN");

  // Report Field Issue state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState("Irrigation Problem");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueSeverity, setIssueSeverity] = useState<"WARNING" | "CRITICAL">("WARNING");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  const [issueSuccess, setIssueSuccess] = useState("");

  // Work Contract Modal state
  const [showWorkContractModal, setShowWorkContractModal] = useState(false);

  // Contact Landowner Modal state
  const [showContactModal, setShowContactModal] = useState(false);

  // Nearby Jobs Discovery states
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [loadingNearbyJobs, setLoadingNearbyJobs] = useState(true);
  const [selectedJobDetail, setSelectedJobDetail] = useState<any | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [activeWorkerAssignment, setActiveWorkerAssignment] = useState<any | null>(null);

  // Daily Work & Attendance States
  const [dailyReport, setDailyReport] = useState<any | null>(null);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [loadingDailyReport, setLoadingDailyReport] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [submittingWork, setSubmittingWork] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Outcome Form state
  const [selectedOutcome, setSelectedOutcome] = useState<"COMPLETED" | "PARTIAL" | "NOT_COMPLETED" | "">("");
  const [selectedIssueType, setSelectedIssueType] = useState("");
  const [optionalNotes, setOptionalNotes] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Fetch current user and assignments
  useEffect(() => {
    fetchUserAndContracts();
    fetchDailyReport();
  }, []);

  const fetchDailyReport = async () => {
    setLoadingDailyReport(true);
    try {
      const res = await fetch("/api/worker/daily-report");
      if (res.ok) {
        const data = await res.json();
        setDailyReport(data.report || null);
        setTodayTasks(data.todayTasks || []);
        if (data.activeAssignment) {
          setActiveWorkerAssignment(data.activeAssignment);
        }
        if (data.report?.status) {
          setSelectedOutcome(data.report.status);
          if (data.report.issueType) setSelectedIssueType(data.report.issueType);
          if (data.report.notes) setOptionalNotes(data.report.notes);
        }
      }
    } catch (err) {
      console.error("Error fetching daily report:", err);
    } finally {
      setLoadingDailyReport(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await fetch("/api/worker/daily-report/check-in", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check-in failed.");
      setDailyReport(data.report);
      fetchDailyReport();
    } catch (err: any) {
      alert(err.message || "Error checking in.");
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSubmitDailyWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutcome) {
      setSubmitError("Please select how today's work went.");
      return;
    }
    setSubmittingWork(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/worker/daily-report/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedOutcome,
          issueType: selectedIssueType,
          notes: optionalNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setDailyReport(data.report);
      fetchDailyReport();
    } catch (err: any) {
      setSubmitError(err.message || "Error submitting daily report.");
    } finally {
      setSubmittingWork(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/worker/daily-report/check-out", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Check-out failed.");
      setDailyReport(data.report);
      fetchDailyReport();
    } catch (err: any) {
      alert(err.message || "Error checking out.");
    } finally {
      setCheckingOut(false);
    }
  };

  const fetchUserAndContracts = async () => {
    setLoadingUser(true);
    setLoadingContracts(true);
    try {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const userData = await meRes.json();
        setUser(userData);
      }

      const assignRes = await fetch("/api/worker/assignment");
      if (assignRes.ok) {
        const assignData = await assignRes.json();
        setActiveWorkerAssignment(assignData.activeAssignment || null);
      }

      const cRes = await fetch("/api/contracts");
      if (cRes.ok) {
        const contractData = await cRes.json();
        setContracts(contractData || []);
        if (contractData && contractData.length > 0) {
          setSelectedContractId(contractData[0].id);
        }
      }

      fetchNearbyJobs();
    } catch (err) {
      console.error("Error fetching worker data:", err);
    } finally {
      setLoadingUser(false);
      setLoadingContracts(false);
    }
  };

  const fetchNearbyJobs = async () => {
    setLoadingNearbyJobs(true);
    try {
      const res = await fetch("/api/worker/jobs");
      if (res.ok) {
        const data = await res.json();
        setNearbyJobs(data || []);
      }
    } catch (err) {
      console.error("Error fetching nearby jobs:", err);
    } finally {
      setLoadingNearbyJobs(false);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    setApplyingJobId(jobId);
    try {
      const res = await fetch(`/api/worker/jobs/${jobId}/apply`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit job application.");
      }

      alert("Application Submitted! The Landowner will review your application.");
      setShowJobModal(false);
      fetchNearbyJobs();
    } catch (err: any) {
      alert(err.message || "Error applying for job.");
    } finally {
      setApplyingJobId(null);
    }
  };

  // Fetch tasks when selected contract changes
  useEffect(() => {
    if (selectedContractId) {
      fetchTasks(selectedContractId);
    }
  }, [selectedContractId]);

  const fetchTasks = async (contractId: string) => {
    setLoadingTasks(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}/tasks`);
      if (res.ok) {
        const taskData = await res.json();
        setTasks(taskData || []);
      }
    } catch (err) {
      console.error("Error fetching contract tasks:", err);
    } finally {
      setLoadingTasks(false);
    }
  };

  // Handle task status update (PENDING -> IN_PROGRESS -> COMPLETED)
  const handleUpdateTask = async (taskId: string, newStatus: "IN_PROGRESS" | "COMPLETED") => {
    if (!selectedContractId) return;
    setUpdatingTaskId(taskId);
    try {
      const res = await fetch(`/api/contracts/${selectedContractId}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update task status.");
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || "Error updating task status.");
    } finally {
      setUpdatingTaskId(null);
    }
  };


  // Handle Field Issue Report Submit
  const handleReportIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !issueDescription.trim()) return;
    setSubmittingIssue(true);
    setIssueSuccess("");
    try {
      const res = await fetch(`/api/contracts/${selectedContractId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueType,
          description: issueDescription,
          severity: issueSeverity,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit field issue report.");
      }

      setIssueSuccess("Field issue reported successfully to Landowner!");
      setTimeout(() => {
        setShowIssueModal(false);
        setIssueDescription("");
        setIssueSuccess("");
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Could not submit issue report.");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const currentContract = contracts.find((c) => c.id === selectedContractId) || contracts[0];

  // Calculate task summary metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const pendingTasks = tasks.filter((t) => t.status === "PENDING" || t.status === "OVERDUE").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate work contract days
  let durationDays = 60;
  let daysCompleted = 18;
  let daysRemaining = 42;

  if (currentContract?.startDate && currentContract?.expectedHarvestDate) {
    const start = new Date(currentContract.startDate).getTime();
    const end = new Date(currentContract.expectedHarvestDate).getTime();
    const now = new Date().getTime();
    const totalDiffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const elapsedDays = Math.max(0, Math.min(totalDiffDays, Math.round((now - start) / (1000 * 60 * 60 * 24))));

    durationDays = totalDiffDays;
    daysCompleted = elapsedDays;
    daysRemaining = Math.max(0, totalDiffDays - elapsedDays);
  }

  const locationString = currentContract?.land
    ? `${currentContract.land.name}, ${currentContract.land.village || ""}, ${currentContract.land.district || ""}, ${currentContract.land.state || ""}`
    : "Pea Valley Fields, Punjab";

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* SECTION A: HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-extrabold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded tracking-wider">
              FIELD WORKER DASHBOARD
            </span>
            <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              Operational Contract Execution
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#17251B]">
            Welcome back, {user?.name || "Babu Rao"}
          </h1>
          <p className="text-xs text-[#647067] mt-0.5">
            Phone: <span className="font-semibold text-[#17251B]">{user?.phone || "+919999999993"}</span> | Assigned Field Operations & Task Tracker
          </p>
        </div>

        {/* Quick Shift Status Badge */}
        <div className="flex items-center gap-3 shrink-0 bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
          <div className="text-right">
            <span className="text-[10px] text-[#647067] uppercase font-bold block">Shift Status</span>
            <span className={`text-xs font-extrabold ${
              attendanceStatus === "WORKING" ? "text-[#166534]" :
              attendanceStatus === "COMPLETED" ? "text-blue-700" :
              "text-[#F59E0B]"
            }`}>
              {attendanceStatus === "WORKING" ? "ON DUTY (WORKING)" :
               attendanceStatus === "COMPLETED" ? "SHIFT COMPLETED" :
               "NOT CHECKED IN"}
            </span>
          </div>
          <div className={`w-3 h-3 rounded-full animate-pulse ${
            attendanceStatus === "WORKING" ? "bg-[#22C55E]" :
            attendanceStatus === "COMPLETED" ? "bg-blue-500" :
            "bg-amber-500"
          }`} />
        </div>
      </div>

      {/* SECTION I: MY ASSIGNMENTS SELECTOR (If multiple active contracts exist) */}
      {contracts.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-[#E2E8E3] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#166534]" />
            <span className="text-xs font-extrabold text-[#17251B]">Active Field Assignments ({contracts.length}):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contracts.map((c) => {
              const isSel = c.id === selectedContractId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedContractId(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSel
                      ? "bg-[#166534] text-white shadow-sm"
                      : "bg-[#F6F8F3] border border-[#E2E8E3] text-[#647067] hover:text-[#17251B]"
                  }`}
                >
                  <span>{c.crop?.name}</span>
                  <span className="opacity-75 font-normal">({c.land?.name})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loadingContracts ? (
        <div className="py-20 text-center text-[#647067] bg-white rounded-2xl border border-[#E2E8E3]">
          <Loader2 className="w-8 h-8 animate-spin text-[#166534] mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading assigned field operations...</p>
        </div>
      ) : !currentContract ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-[#E2E8E3] text-center max-w-lg mx-auto my-6 space-y-3">
          <Sprout className="w-12 h-12 text-[#166534] mx-auto opacity-40" />
          <h3 className="font-bold text-[#17251B] text-lg">No Active Assignment Found</h3>
          <p className="text-xs text-[#647067]">
            You currently have no active field work contract assigned. Please check back when a contract is activated.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN: ASSIGNMENT, TODAY'S WORK CARD & NEARBY JOBS (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* SECTION 1: TODAY'S ASSIGNMENT (PROMINENT CARD) */}
            <div className="bg-gradient-to-br from-emerald-900 to-green-950 rounded-2xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden space-y-5">
              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded text-emerald-200">
                    TODAY'S ASSIGNMENT
                  </span>
                  <h2 className="text-2xl font-extrabold mt-2 text-white flex items-center gap-2">
                    {activeWorkerAssignment?.crop?.name || currentContract?.crop?.name || "Green Peas"}
                  </h2>
                </div>
                <span className="px-3 py-1 bg-[#22C55E] text-white font-extrabold text-xs rounded-full shadow-sm uppercase">
                  {activeWorkerAssignment?.status || currentContract?.status || "ACTIVE"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                <div className="space-y-1">
                  <span className="text-emerald-300/80 font-bold uppercase tracking-wider text-[10px]">Field / Land Parcel</span>
                  <p className="font-extrabold text-sm text-white">{activeWorkerAssignment?.land?.name || currentContract?.land?.name || "Pea Valley Fields"}</p>
                  <p className="text-emerald-100/80 flex items-start gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                    <span>{currentContract?.land?.village ? `${currentContract.land.village}, ` : ""}{currentContract?.land?.district || "Ludhiana"}, {currentContract?.land?.state || "Punjab"}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-emerald-300/80 font-bold uppercase tracking-wider text-[10px]">Landowner / Farmer</span>
                  <p className="font-extrabold text-sm text-white">{activeWorkerAssignment?.landowner?.name || currentContract?.landowner?.name || "Ramesh Singh"}</p>
                  <p className="text-emerald-100/80 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                    <span>{activeWorkerAssignment?.landowner?.phone || currentContract?.landowner?.phone || "+919999999992"}</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-emerald-300/80 font-bold uppercase tracking-wider text-[10px]">Field Area & Timeline</span>
                  <p className="font-extrabold text-xs text-white">
                    {currentContract?.landArea || currentContract?.land?.size || "5.0"} Acres | Day {daysCompleted} of {durationDays}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-emerald-300/80 font-bold uppercase tracking-wider text-[10px]">Working Hours</span>
                  <p className="font-extrabold text-xs text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#22C55E]" />
                    {activeWorkerAssignment?.workingHours || "08:00 AM – 04:00 PM"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/15 flex flex-wrap items-center gap-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationString)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-[#22C55E] hover:bg-green-600 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions (✓ 11.2 km away)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contact Landowner</span>
                </button>
              </div>
            </div>

            {/* SECTION 2: TODAY'S WORK CARD (PRIMARY FIELD WORKER INTERACTION) */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E3] pb-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded tracking-wider">
                    TODAY'S WORK
                  </span>
                  <h3 className="font-extrabold text-xl text-[#17251B] mt-1">
                    {activeWorkerAssignment?.crop?.name || currentContract?.crop?.name || "Green Peas"} Cultivation
                  </h3>
                  <p className="text-xs text-[#647067]">
                    {activeWorkerAssignment?.land?.name || currentContract?.land?.name || "Pea Valley Fields"}
                  </p>
                </div>

                {dailyReport?.checkInAt && (
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[11px] font-extrabold uppercase text-[#166534] bg-[#ECFDF3] px-3 py-1 rounded-full border border-[#22C55E]/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Checked in — {new Date(dailyReport.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Today's Planned Activities generated from ContractTask */}
              <div className="bg-[#F6F8F3] p-4.5 rounded-xl border border-[#E2E8E3] space-y-2.5">
                <span className="text-xs font-bold text-[#17251B] uppercase tracking-wider block">
                  Today's Planned Work
                </span>

                {todayTasks.length === 0 ? (
                  <div className="space-y-1 text-xs text-[#17251B]">
                    <p className="flex items-center gap-2 font-medium">• Soil preparation</p>
                    <p className="flex items-center gap-2 font-medium">• Field cleaning</p>
                    <p className="flex items-center gap-2 font-medium">• Seed-bed preparation</p>
                    <span className="text-[11px] text-[#166534] font-bold block pt-1">3 activities planned</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-[#17251B]">
                    {todayTasks.map((t) => (
                      <p key={t.id} className="flex items-center gap-2 font-medium">
                        • {t.title || t.name}
                      </p>
                    ))}
                    <span className="text-[11px] text-[#166534] font-bold block pt-1">
                      {todayTasks.length} {todayTasks.length === 1 ? "activity planned" : "activities planned"}
                    </span>
                  </div>
                )}
              </div>

              {/* WORKFLOW STATE 1: NOT CHECKED IN */}
              {!dailyReport?.checkInAt && (
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    disabled={checkingIn || !activeWorkerAssignment}
                    onClick={handleCheckIn}
                    className="w-full py-4 bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {checkingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
                    <span>[ CHECK IN ]</span>
                  </button>
                  {!activeWorkerAssignment && (
                    <p className="text-xs text-amber-700 font-semibold text-center">
                      You must be assigned to an active field contract before checking in.
                    </p>
                  )}
                </div>
              )}

              {/* WORKFLOW STATE 2: CHECKED IN, WORK UNDERWAY */}
              {dailyReport?.checkInAt && !dailyReport?.submittedAt && (
                <form onSubmit={handleSubmitDailyWork} className="space-y-5 pt-2 border-t border-[#E2E8E3]">
                  <div className="bg-[#ECFDF3]/60 p-3.5 rounded-xl border border-[#22C55E]/30 text-xs text-[#166534] font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#166534] shrink-0" />
                    <span>Checked in at {new Date(dailyReport.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Today's work is underway.</span>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-extrabold text-[#17251B] uppercase tracking-wider">
                      HOW DID TODAY'S WORK GO?
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => setSelectedOutcome("COMPLETED")}
                        className={`p-4 rounded-xl border font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                          selectedOutcome === "COMPLETED"
                            ? "bg-[#166534] text-white border-[#166534] shadow-md"
                            : "bg-white border-[#E2E8E3] text-[#17251B] hover:border-[#166534]/50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedOutcome === "COMPLETED" ? "border-white bg-white" : "border-[#647067]"
                        }`}>
                          {selectedOutcome === "COMPLETED" && <div className="w-2 h-2 rounded-full bg-[#166534]" />}
                        </div>
                        <span>Completed as planned</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOutcome("PARTIAL")}
                        className={`p-4 rounded-xl border font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                          selectedOutcome === "PARTIAL"
                            ? "bg-amber-600 text-white border-amber-600 shadow-md"
                            : "bg-white border-[#E2E8E3] text-[#17251B] hover:border-amber-500/50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedOutcome === "PARTIAL" ? "border-white bg-white" : "border-[#647067]"
                        }`}>
                          {selectedOutcome === "PARTIAL" && <div className="w-2 h-2 rounded-full bg-amber-600" />}
                        </div>
                        <span>Partially completed</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOutcome("NOT_COMPLETED")}
                        className={`p-4 rounded-xl border font-bold text-left transition-all flex items-center gap-3 cursor-pointer ${
                          selectedOutcome === "NOT_COMPLETED"
                            ? "bg-red-600 text-white border-red-600 shadow-md"
                            : "bg-white border-[#E2E8E3] text-[#17251B] hover:border-red-500/50"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedOutcome === "NOT_COMPLETED" ? "border-white bg-white" : "border-[#647067]"
                        }`}>
                          {selectedOutcome === "NOT_COMPLETED" && <div className="w-2 h-2 rounded-full bg-red-600" />}
                        </div>
                        <span>Could not complete</span>
                      </button>
                    </div>
                  </div>

                  {/* OPTIONAL ISSUE REASON SELECTION */}
                  {(selectedOutcome === "PARTIAL" || selectedOutcome === "NOT_COMPLETED") && (
                    <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3 animate-in fade-in duration-200 text-xs">
                      <label className="block font-bold text-amber-900 uppercase text-[11px]">Why?</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          "Irrigation / water problem",
                          "Equipment problem",
                          "Weather",
                          "Pest / disease observed",
                          "Material unavailable",
                          "Other",
                        ].map((issue) => (
                          <button
                            key={issue}
                            type="button"
                            onClick={() => setSelectedIssueType(issue)}
                            className={`p-2.5 rounded-lg border font-semibold text-left transition-all cursor-pointer ${
                              selectedIssueType === issue
                                ? "bg-amber-600 text-white border-amber-600"
                                : "bg-white border-amber-200 text-amber-950 hover:bg-amber-100"
                            }`}
                          >
                            □ {issue}
                          </button>
                        ))}
                      </div>

                      <div>
                        <label className="block font-semibold text-amber-900 mb-1 text-[11px]">Optional note:</label>
                        <input
                          type="text"
                          value={optionalNotes}
                          onChange={(e) => setOptionalNotes(e.target.value)}
                          placeholder="e.g. Water supply delayed by 2 hours..."
                          className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-xs font-medium text-amber-950 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {submitError && (
                    <p className="text-xs text-red-600 font-bold">{submitError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={submittingWork || !selectedOutcome}
                    className="w-full py-4 bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingWork ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    <span>[ SUBMIT TODAY'S WORK ]</span>
                  </button>
                </form>
              )}

              {/* WORKFLOW STATE 3: WORK SUBMITTED (PENDING CHECK OUT) */}
              {dailyReport?.submittedAt && !dailyReport?.checkOutAt && (
                <div className="space-y-4 pt-2 border-t border-[#E2E8E3]">
                  <div className="bg-[#ECFDF3] p-4 rounded-xl border border-[#22C55E]/30 space-y-1 text-xs">
                    <span className="font-extrabold text-sm text-[#166534] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Today's work submitted
                    </span>
                    <p className="text-[#17251B] font-bold">
                      Submitted: {new Date(dailyReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-[#647067]">
                      Status: <span className="font-bold text-[#166534] uppercase">{dailyReport.status?.replace("_", " ")}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={checkingOut}
                    onClick={handleCheckOut}
                    className="w-full py-4 bg-[#166534] hover:bg-[#14532d] text-white font-extrabold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {checkingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5" />}
                    <span>[ CHECK OUT ]</span>
                  </button>
                </div>
              )}

              {/* WORKFLOW STATE 4: DAY COMPLETED */}
              {dailyReport?.checkOutAt && (
                <div className="bg-[#ECFDF3] p-5 rounded-2xl border border-[#22C55E]/40 space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#166534]" />
                    <h4 className="font-extrabold text-base text-[#166534] uppercase tracking-wider">✓ DAY COMPLETED</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-[#E2E8E3]">
                    <div>
                      <span className="text-[#647067] block text-[10px] uppercase font-bold">Check-in</span>
                      <span className="font-extrabold text-sm text-[#17251B]">
                        {new Date(dailyReport.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#647067] block text-[10px] uppercase font-bold">Work submitted</span>
                      <span className="font-extrabold text-sm text-[#166534]">
                        {new Date(dailyReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#647067] block text-[10px] uppercase font-bold">Check-out</span>
                      <span className="font-extrabold text-sm text-[#17251B]">
                        {new Date(dailyReport.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: NEARBY FARMING JOBS */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8E3] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Compass className="w-5 h-5 text-[#166534]" />
                    <h3 className="font-extrabold text-lg text-[#17251B]">Nearby Farming Jobs</h3>
                  </div>
                  <p className="text-xs text-[#647067]">Discovered field opportunities within 50 km radius sorted by location proximity.</p>
                </div>
                <span className="text-xs font-extrabold bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-1 rounded-full shrink-0">
                  {nearbyJobs.length} {nearbyJobs.length === 1 ? "Job Available" : "Jobs Available"}
                </span>
              </div>

              {loadingNearbyJobs ? (
                <div className="py-12 text-center text-[#647067]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#166534] mx-auto mb-2" />
                  <p className="text-xs font-semibold">Scanning nearby agricultural jobs...</p>
                </div>
              ) : nearbyJobs.length === 0 ? (
                <div className="p-8 text-center bg-[#F6F8F3] rounded-xl border border-dashed border-[#E2E8E3] space-y-2">
                  <Compass className="w-8 h-8 text-[#166534] mx-auto opacity-40" />
                  <p className="text-xs font-bold text-[#17251B]">No Nearby Farming Jobs Posted Right Now</p>
                  <p className="text-[11px] text-[#647067]">Check back when Landowners post new worker requirements for active contracts.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {nearbyJobs.map((job) => {
                    const isApplied = job.userApplicationStatus === "APPLIED";
                    const isAccepted = job.userApplicationStatus === "ACCEPTED" || job.isAssignedToUser;
                    const isFilled = job.status === "FILLED" || job.acceptedWorkers >= job.workersRequired;

                    return (
                      <div
                        key={job.id}
                        className={`p-5 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                          isAccepted
                            ? "bg-[#ECFDF3]/60 border-[#22C55E]/40"
                            : isApplied
                            ? "bg-amber-50/50 border-amber-300/50"
                            : isFilled
                            ? "bg-gray-50 border-gray-200"
                            : "bg-white border-[#E2E8E3] hover:border-[#166534]/50 shadow-sm"
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase bg-[#ECFDF3] text-[#166534] px-2 py-0.5 rounded border border-[#22C55E]/30">
                                NEW FARMING JOB
                              </span>
                              <h4 className="font-extrabold text-base text-[#17251B] mt-1">{job.crop?.name} Cultivation</h4>
                            </div>
                            <span className="text-xs font-extrabold text-[#166534] bg-white px-2.5 py-1 rounded-full border border-[#E2E8E3] flex items-center gap-1 shrink-0">
                              <MapPin className="w-3.5 h-3.5" /> {job.distanceKm} km away
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-[#17251B]">
                            <p><strong>Land / Field:</strong> {job.land?.name} ({job.land?.size} Acres)</p>
                            <p><strong>Landowner:</strong> {job.landowner?.name}</p>
                            <p className="text-[#647067]">
                              <strong>Period:</strong> {new Date(job.startDate).toLocaleDateString()} &rarr; {new Date(job.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-[#647067]"><strong>Hours:</strong> {job.workingHours}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E2E8E3]/60 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#166534]">
                            {job.acceptedWorkers} / {job.workersRequired} Workers Needed
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJobDetail(job);
                                setShowJobModal(true);
                              }}
                              className="px-3 py-1.5 border border-[#E2E8E3] hover:border-[#166534] text-[#17251B] font-bold text-xs rounded-xl cursor-pointer transition-all"
                            >
                              View Job
                            </button>

                            {isAccepted ? (
                              <span className="px-3 py-1.5 bg-[#166534] text-white font-bold text-xs rounded-xl flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Assigned
                              </span>
                            ) : isApplied ? (
                              <span className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl">
                                Application Submitted
                              </span>
                            ) : isFilled ? (
                              <span className="px-3 py-1.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                                Position Filled
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={applyingJobId === job.id}
                                onClick={() => handleApplyJob(job.id)}
                                className="px-4 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm disabled:opacity-50"
                              >
                                {applyingJobId === job.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: CONTRACT DETAILS, WORK SUMMARY & ISSUE REPORTING (5 COLS) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* SECTION 4: MY WORK CONTRACT */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#166534]" />
                  <h3 className="font-extrabold text-lg text-[#17251B]">My Work Contract</h3>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-[#ECFDF3] text-[#166534] border border-[#22C55E]/30 px-2.5 py-0.5 rounded">
                  Field Terms Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F6F8F3] p-3.5 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Total Duration</span>
                  <span className="font-extrabold text-sm text-[#17251B]">{durationDays} Days</span>
                </div>
                <div className="bg-[#F6F8F3] p-3.5 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Days Completed</span>
                  <span className="font-extrabold text-sm text-[#166534]">{daysCompleted} Days</span>
                </div>
                <div className="bg-[#F6F8F3] p-3.5 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Days Remaining</span>
                  <span className="font-extrabold text-sm text-amber-700">{daysRemaining} Days</span>
                </div>
                <div className="bg-[#F6F8F3] p-3.5 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Shift Schedule</span>
                  <span className="font-extrabold text-xs text-[#17251B]">{activeWorkerAssignment?.workingHours || "08:00 AM – 04:00 PM"}</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowWorkContractModal(true)}
                  className="text-xs font-bold text-[#166534] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Work Contract Scope</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* SECTION 5: MY WORK SUMMARY */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8E3] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#166534]" />
                  <h3 className="font-extrabold text-base text-[#17251B]">My Work Summary</h3>
                </div>
                <span className="text-xs font-extrabold text-[#166534]">{completionRate}% Completed</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Planned Activities</span>
                  <span className="font-extrabold text-base text-[#17251B]">{totalTasks}</span>
                </div>
                <div className="bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Activities Completed</span>
                  <span className="font-extrabold text-base text-[#166534]">{completedTasks}</span>
                </div>
                <div className="bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">In Progress</span>
                  <span className="font-extrabold text-base text-amber-700">{inProgressTasks}</span>
                </div>
                <div className="bg-[#F6F8F3] p-3 rounded-xl border border-[#E2E8E3]">
                  <span className="text-[10px] text-[#647067] block uppercase font-bold">Pending</span>
                  <span className="font-extrabold text-base text-gray-700">{pendingTasks}</span>
                </div>
              </div>
            </div>

            {/* SECTION 6: REPORT FIELD ISSUE */}
            <div className="bg-amber-50/60 p-6 rounded-2xl border border-amber-300/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-900 border-b border-amber-200/60 pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-extrabold text-base">Report Field Issue</h3>
                  <p className="text-[11px] text-amber-800">Observe an issue on the field? Report directly to Landowner.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIssueModal(true)}
                className="w-full py-3 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Report Field Issue To Landowner</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: REPORT FIELD ISSUE OVERLAY */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
              <div className="flex items-center gap-2 text-[#17251B]">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-extrabold">Report Field Issue</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="p-1 rounded-lg text-[#647067] hover:text-[#17251B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {issueSuccess ? (
              <div className="p-4 bg-[#ECFDF3] border border-[#22C55E]/30 text-[#166534] rounded-xl text-xs font-bold text-center">
                {issueSuccess}
              </div>
            ) : (
              <form onSubmit={handleReportIssueSubmit} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="block text-[#17251B] font-bold mb-1 uppercase text-[10px]">Issue Category</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8E3] rounded-xl outline-none focus:border-[#166534] text-xs font-bold text-[#17251B]"
                  >
                    <option value="Irrigation Problem">Irrigation & Water Channel Issue</option>
                    <option value="Pest / Disease Observation">Pest / Crop Disease Observation</option>
                    <option value="Equipment Failure">Equipment / Tools Problem</option>
                    <option value="Weather Damage">Weather / Storm Damage</option>
                    <option value="Field Condition Problem">Field Boundary / Soil Condition Problem</option>
                    <option value="Worker Safety Issue">Worker Safety Concern</option>
                    <option value="Other">Other Field Observation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#17251B] font-bold mb-1 uppercase text-[10px]">Severity Level</label>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8E3] rounded-xl outline-none focus:border-[#166534] text-xs font-bold text-[#17251B]"
                  >
                    <option value="WARNING">Moderate Warning (Needs Attention)</option>
                    <option value="CRITICAL">Critical Issue (Immediate Action Needed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#17251B] font-bold mb-1 uppercase text-[10px]">Description & Observations</label>
                  <textarea
                    rows={4}
                    required
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe the issue observed in the field (location, severity, immediate requirements)..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E2E8E3] focus:border-[#166534] rounded-xl outline-none text-xs text-[#17251B]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="px-4 py-2.5 border border-[#E2E8E3] text-[#17251B] font-bold rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingIssue}
                    className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {submittingIssue ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Submit Report</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: MY WORK CONTRACT DETAILS OVERLAY */}
      {showWorkContractModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-lg w-full relative space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
              <div className="flex items-center gap-2 text-[#17251B]">
                <ShieldCheck className="w-5 h-5 text-[#166534]" />
                <h3 className="text-lg font-extrabold">Field Work Contract Scope</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkContractModal(false)}
                className="p-1 rounded-lg text-[#647067] hover:text-[#17251B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F6F8F3] p-5 rounded-xl border border-[#E2E8E3] space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                <span className="text-[#647067] font-semibold">Assigned Crop:</span>
                <span className="font-bold text-[#166534]">{currentContract?.crop?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                <span className="text-[#647067] font-semibold">Landowner:</span>
                <span className="font-bold text-[#17251B]">{currentContract?.landowner?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                <span className="text-[#647067] font-semibold">Field Parcel:</span>
                <span className="font-bold text-[#17251B]">{currentContract?.land?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                <span className="text-[#647067] font-semibold">Working Hours:</span>
                <span className="font-bold text-[#17251B]">08:00 AM – 04:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                <span className="text-[#647067] font-semibold">Contract Timeline:</span>
                <span className="font-bold text-[#17251B]">
                  {new Date(currentContract?.startDate).toLocaleDateString()} &rarr; {new Date(currentContract?.expectedHarvestDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#647067] leading-relaxed">
              This contractual work agreement covers on-ground field operations, task execution, daily check-in/out, and reporting for <strong>{currentContract?.land?.name}</strong>. Commercial crop sales and financial details are managed separately by the Landowner.
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowWorkContractModal(false)}
                className="px-5 py-2.5 bg-[#166534] text-white font-bold text-xs rounded-xl"
              >
                Close Work Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONTACT LANDOWNER OVERLAY */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 max-w-sm w-full relative space-y-4 text-center animate-in slide-in-from-bottom-4 duration-300">
            <div className="w-12 h-12 bg-[#ECFDF3] rounded-full flex items-center justify-center mx-auto">
              <Phone className="w-6 h-6 text-[#166534]" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#17251B]">{currentContract?.landowner?.name || "Ramesh Singh"}</h3>
              <p className="text-xs text-[#647067] mt-0.5">Assigned Landowner / Farmer</p>
            </div>

            <div className="bg-[#F6F8F3] p-4 rounded-xl border border-[#E2E8E3]">
              <span className="text-[10px] text-[#647067] uppercase font-bold block mb-1">Phone Number</span>
              <a
                href={`tel:${currentContract?.landowner?.phone || "+919999999992"}`}
                className="text-base font-extrabold text-[#166534] hover:underline"
              >
                {currentContract?.landowner?.phone || "+919999999992"}
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 border border-[#E2E8E3] text-[#17251B] font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <a
                href={`tel:${currentContract?.landowner?.phone || "+919999999992"}`}
                className="w-full py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> Call Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: VIEW JOB DETAILS OVERLAY */}
      {showJobModal && selectedJobDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#E2E8E3] shadow-2xl p-6 sm:p-8 max-w-md w-full relative space-y-5 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between border-b border-[#E2E8E3] pb-3">
              <div className="flex items-center gap-2 text-[#17251B]">
                <Compass className="w-5 h-5 text-[#166534]" />
                <h3 className="text-lg font-extrabold">Farming Job Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="p-1 rounded-lg text-[#647067] hover:text-[#17251B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#17251B]">
              <div className="bg-[#F6F8F3] p-4 rounded-xl border border-[#E2E8E3] space-y-2">
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Crop:</span>
                  <span className="font-bold text-[#166534]">{selectedJobDetail.crop?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Land Parcel:</span>
                  <span className="font-bold">{selectedJobDetail.land?.name} ({selectedJobDetail.land?.size} Acres)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Landowner:</span>
                  <span className="font-bold">{selectedJobDetail.landowner?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Distance:</span>
                  <span className="font-bold text-[#166534]">{selectedJobDetail.distanceKm} km away</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Location / Address:</span>
                  <span className="font-bold text-right">{selectedJobDetail.land?.village || ""}, {selectedJobDetail.land?.district || "Ludhiana"}, {selectedJobDetail.land?.state || "Punjab"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Work Period:</span>
                  <span className="font-bold">
                    {new Date(selectedJobDetail.startDate).toLocaleDateString()} &rarr; {new Date(selectedJobDetail.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Working Hours:</span>
                  <span className="font-bold">{selectedJobDetail.workingHours}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2E8E3]/60">
                  <span className="text-[#647067] font-semibold">Workers Required / Assigned:</span>
                  <span className="font-bold text-[#166534]">{selectedJobDetail.acceptedWorkers} / {selectedJobDetail.workersRequired}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-[#647067] font-bold uppercase block mb-1">Work Description</span>
                <p className="bg-white p-3 rounded-xl border border-[#E2E8E3] text-xs leading-relaxed text-[#17251B]">
                  {selectedJobDetail.description || "Field maintenance, sowing verification, irrigation clearing, and crop care."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8E3]">
              <button
                type="button"
                onClick={() => setShowJobModal(false)}
                className="px-4 py-2.5 border border-[#E2E8E3] text-[#17251B] font-bold text-xs rounded-xl"
              >
                Close
              </button>

              {selectedJobDetail.isAssignedToUser || selectedJobDetail.userApplicationStatus === "ACCEPTED" ? (
                <span className="px-5 py-2.5 bg-[#166534] text-white font-bold text-xs rounded-xl flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Assigned to this Job
                </span>
              ) : selectedJobDetail.userApplicationStatus === "APPLIED" ? (
                <span className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl">
                  Application Submitted
                </span>
              ) : selectedJobDetail.status === "FILLED" || selectedJobDetail.acceptedWorkers >= selectedJobDetail.workersRequired ? (
                <span className="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold text-xs rounded-xl">
                  Position Filled
                </span>
              ) : (
                <button
                  type="button"
                  disabled={applyingJobId === selectedJobDetail.id}
                  onClick={() => handleApplyJob(selectedJobDetail.id)}
                  className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {applyingJobId === selectedJobDetail.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Apply for Job</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
