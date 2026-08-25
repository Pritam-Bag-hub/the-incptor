"use client";

import { MapPin, Clock, CheckSquare, Upload, Sprout } from "lucide-react";

export default function WorkerDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Field Worker Dashboard</h1>
        <p className="text-kombu/70 mt-2">
          View your assignments, verify location, and submit evidence.
        </p>
      </div>

      {/* Assignment Info */}
      <div className="bg-gradient-to-br from-dingley to-kombu rounded-3xl p-8 text-brandy shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Sprout className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase mb-4 text-brandy">
            Current Assignment
          </span>
          <h2 className="text-2xl font-bold mb-1 text-white">Landlord: Ramesh Singh</h2>
          <p className="text-brandy/90 flex items-center gap-2 mb-6">
            <MapPin className="w-4 h-4" /> North Field, Sector 4, Punjab
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-brandy/70 text-sm mb-1">Working Time</p>
              <p className="text-xl font-bold flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" /> 08:00 AM - 04:00 PM
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-brandy/70 text-sm mb-1">Field Done</p>
              <div className="flex items-center gap-3 text-white">
                <div className="flex-1 bg-black/20 rounded-full h-2">
                  <div className="bg-brandy h-2 rounded-full w-[45%]"></div>
                </div>
                <span className="font-bold">45%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckSquare className="w-6 h-6 text-copper" /> Today's Tasks
        </h3>
        
        <div className="space-y-4">
          {/* Task 1 */}
          <div className="bg-white p-5 rounded-2xl border border-dingley shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-dingley"></div>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-lg text-pine">GPS Check-in</h4>
                <p className="text-sm text-kombu/70 mt-1">Verify you are at the correct field boundary.</p>
              </div>
              <span className="bg-dingley/20 text-dingley px-3 py-1 rounded-full text-xs font-bold">
                Completed
              </span>
            </div>
          </div>

          {/* Task 2 */}
          <div className="bg-white p-5 rounded-2xl border border-brandy/40 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-copper"></div>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-lg text-pine">Upload Crop Photos</h4>
                <p className="text-sm text-kombu/70 mt-1">Take 3 photos of the eastern quadrant for AI analysis.</p>
              </div>
              <button className="flex items-center gap-2 bg-pine hover:bg-kombu text-brandy px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0">
                <Upload className="w-4 h-4" /> Upload Evidence
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
