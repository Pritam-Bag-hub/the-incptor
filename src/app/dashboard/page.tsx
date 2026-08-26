"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirectByRole() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/roles");
          return;
        }

        const data = await res.json();
        if (!data.authenticated) {
          router.push("/roles");
          return;
        }

        const role = data.user.role;
        if (role === "BUYER") {
          router.push("/dashboard/buyer");
        } else if (role === "LANDOWNER") {
          router.push("/dashboard/farmer");
        } else if (role === "WORKER") {
          router.push("/dashboard/worker");
        } else if (role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/roles");
        }
      } catch (err) {
        console.error("Dashboard index redirect failed:", err);
        router.push("/roles");
      }
    }

    redirectByRole();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Loader2 className="w-10 h-10 animate-spin text-dingley" />
      <p className="text-sm font-semibold text-kombu/60 mt-4">Directing to your dashboard...</p>
    </div>
  );
}
