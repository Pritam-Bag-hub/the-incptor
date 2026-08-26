"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Phone, KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setError("Please enter a valid phone number.");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
    }, 400); // simulate network delay
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Authentication failed.");
        setIsLoading(false);
        return;
      }

      // Successful login, redirect according to DB role
      const userRole = data.user.role; // BUYER, LANDOWNER, WORKER, ADMIN
      setIsLoading(false);

      if (userRole === "BUYER") {
        router.push("/dashboard/buyer");
      } else if (userRole === "LANDOWNER") {
        router.push("/dashboard/farmer");
      } else if (userRole === "WORKER") {
        router.push("/dashboard/worker");
      } else if (userRole === "ADMIN") {
        router.push("/admin");
      } else {
        setError("Invalid user role assigned.");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("Connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-brandy/20 relative z-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-pine mb-2">
          {step === "phone" ? "Welcome Back" : "Verify OTP"}
        </h2>
        <p className="text-kombu/70">
          {step === "phone"
            ? "Enter your phone number to sign in or create an account."
            : `We sent a code to ${phone}. Enter it below.`}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-copper/10 border border-copper/30 text-copper rounded-xl text-sm font-medium text-center animate-in shake">
          {error}
        </div>
      )}

      {step === "phone" ? (
        <form onSubmit={handlePhoneSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-pine mb-2">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kombu/50">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter demo phone, e.g. 9999999991"
                className="w-full pl-12 pr-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium"
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || !phone}
            className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-kombu text-brandy py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-pine mb-2">One-Time Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-kombu/50">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter '0000' for demo"
                maxLength={4}
                className="w-full pl-12 pr-4 py-3 bg-brandy/5 border border-brandy focus:border-dingley focus:ring-2 focus:ring-dingley/20 rounded-xl outline-none transition-all text-pine font-medium text-center tracking-widest text-lg"
                autoFocus
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || otp.length !== 4}
            className="w-full flex items-center justify-center gap-2 bg-pine hover:bg-kombu text-brandy py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
              }}
              className="text-sm text-dingley hover:text-pine font-semibold transition-colors"
            >
              Change Phone Number
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 text-center text-sm text-kombu/60">
        By continuing, you agree to AgriContract's{" "}
        <Link href="#" className="text-dingley hover:underline">Terms of Service</Link> &{" "}
        <Link href="#" className="text-dingley hover:underline">Privacy Policy</Link>.
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor matching landing page */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-dingley/10 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] rounded-full bg-brandy/20 blur-3xl" />
      </div>

      <Link href="/" className="absolute top-6 left-6 text-pine hover:text-dingley font-semibold transition-colors flex items-center gap-2 z-20">
        <ArrowRight className="w-5 h-5 rotate-180" /> Back to Role Selection
      </Link>

      <Suspense fallback={<div className="z-10"><Loader2 className="w-10 h-10 animate-spin text-dingley" /></div>}>
        <AuthForm />
      </Suspense>
    </div>
  );
}
