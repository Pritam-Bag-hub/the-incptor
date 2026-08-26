"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.status === 401) {
          router.push("/roles");
          return;
        }

        const data = await res.json();
        if (!data.authenticated) {
          router.push("/roles");
          return;
        }

        setUser(data.user);

        // Role verification and routing restriction
        const role = data.user.role; // BUYER, LANDOWNER, WORKER, ADMIN
        const buyerPath = "/dashboard/buyer";
        const farmerPath = "/dashboard/farmer";
        const workerPath = "/dashboard/worker";

        if (pathname.startsWith(buyerPath) && role !== "BUYER") {
          redirectToCorrectDashboard(role);
        } else if (pathname.startsWith(farmerPath) && role !== "LANDOWNER") {
          redirectToCorrectDashboard(role);
        } else if (pathname.startsWith(workerPath) && role !== "WORKER") {
          redirectToCorrectDashboard(role);
        } else {
          setLoading(false);
        }
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
      } else if (role === "ADMIN") {
        router.push("/admin");
      }
    }

    checkAuth();
  }, [pathname, router]);

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-dingley" />
        <p className="text-sm font-semibold text-kombu/60 mt-4">Verifying session...</p>
      </div>
    );
  }

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
  const userName = user?.name || "User";

  return (
    <div className="min-h-screen bg-background text-pine flex flex-col">
      <nav className="bg-white border-b border-brandy/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-brandy/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-kombu/60" />
              </Link>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-kombu" />
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-dingley to-kombu">
                  AgriContract Dashboard
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brandy/30 flex items-center justify-center text-sm font-semibold text-kombu">
                  {userInitial}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-kombu/80">
                  {userName}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-copper hover:bg-copper/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
