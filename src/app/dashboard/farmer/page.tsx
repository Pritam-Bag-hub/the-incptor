"use client";

import { Activity, Users, Droplets, Thermometer, UserCircle2, Bell } from "lucide-react";

export default function FarmerDashboard() {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Farmer / Landowner Dashboard</h1>
        <p className="text-kombu/70 mt-2">
          Manage your field workers and monitor AI crop analysis.
        </p>
      </div>

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
                      worker.status === 'In Field' ? 'bg-dingley/20 text-dingley' :
                      worker.status === 'Break' ? 'bg-copper/20 text-copper' :
                      'bg-kombu/20 text-kombu'
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
  );
}
