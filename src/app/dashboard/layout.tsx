"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brandy/30 flex items-center justify-center text-sm font-semibold text-kombu">
                U
              </div>
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
