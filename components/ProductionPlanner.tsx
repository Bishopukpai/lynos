"use client";

import { useState } from "react";
import { useProductionPlan, ProductionScene, ProductionMember } from "@/hooks/useProductionPlan";
import { Film, MapPin, Users, Calendar, Plus } from "lucide-react";

export interface ProjectMember {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface Props {
  projectId: string;
  members?: ProjectMember[];
}

type TabType = "scenes" | "shootDays" | "locations" | "roster";

export default function ProductionPlanner({ projectId, members = [] }: Props) {
  const { plan, loading, error, addItem } = useProductionPlan(projectId);
  const [activeTab, setActiveTab] = useState<TabType>("scenes");

  // Form states for each tab
  const [sceneNumber, setSceneNumber] = useState("");
  const [sceneDesc, setSceneDesc] = useState("");

  const [dayTitle, setDayTitle] = useState("");
  const [dayDate, setDayDate] = useState("");

  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");

  const [personName, setPersonName] = useState("");
  const [personRole, setPersonRole] = useState("");

  if (loading) return <div className="p-6 text-xs text-slate-500">Loading production breakdown...</div>;
  if (error) return <div className="p-6 text-xs text-red-500">{error}</div>;

  // Handlers
  const handleAddScene = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sceneNumber) return;
    await addItem("scenes", { sceneNumber, description: sceneDesc });
    setSceneNumber("");
    setSceneDesc("");
  };

  const handleAddShootDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayTitle) return;
    await addItem("shootDays", { title: dayTitle, date: dayDate });
    setDayTitle("");
    setDayDate("");
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName) return;
    await addItem("locations", { name: locationName, address: locationAddress });
    setLocationName("");
    setLocationAddress("");
  };

  const handleAddRosterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName) return;
    await addItem("roster", { name: personName, role: personRole });
    setPersonName("");
    setPersonRole("");
  };

  // Combine cast, crew, and roster for display
  const combinedRoster = [
    ...(plan?.cast || []),
    ...(plan?.crew || []),
    ...(plan?.roster || []),
  ];

  return (
    <div className="space-y-6">
      {/* Header Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Production Hub</h2>
          <p className="text-xs text-slate-500">Manage scenes, breakdown sheets, shoot days, and personnel.</p>
        </div>

        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {[
            { id: "scenes" as const, label: "Scenes", icon: Film },
            { id: "shootDays" as const, label: "Shoot Days", icon: Calendar },
            { id: "locations" as const, label: "Locations", icon: MapPin },
            { id: "roster" as const, label: "Cast & Crew", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Scenes */}
      {activeTab === "scenes" && (
        <div className="space-y-4">
          <form onSubmit={handleAddScene} className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              placeholder="Scene #"
              value={sceneNumber}
              onChange={(e) => setSceneNumber(e.target.value)}
              className="w-24 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Scene description..."
              value={sceneDesc}
              onChange={(e) => setSceneDesc(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Scene
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plan?.scenes?.map((scene: ProductionScene, idx: number) => (
              <div key={scene._id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                    Scene {scene.sceneNumber}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">{scene.description || "No description provided."}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Shoot Days */}
      {activeTab === "shootDays" && (
        <div className="space-y-4">
          <form onSubmit={handleAddShootDay} className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              placeholder="Day Title (e.g. Day 1 - Main House)"
              value={dayTitle}
              onChange={(e) => setDayTitle(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <input
              type="date"
              value={dayDate}
              onChange={(e) => setDayDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Shoot Day
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plan?.shootDays?.map((day: { _id?: string; title: string; date?: string }, idx: number) => (
              <div key={day._id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900">{day.title}</h4>
                {day.date && <p className="mt-1 text-[11px] font-medium text-indigo-600">{day.date}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Locations */}
      {activeTab === "locations" && (
        <div className="space-y-4">
          <form onSubmit={handleAddLocation} className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              placeholder="Location Name"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-1/3 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Address / Details"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Location
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {plan?.locations?.map((loc: { _id?: string; name: string; address?: string }, idx: number) => (
              <div key={loc._id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900">{loc.name}</h4>
                <p className="mt-1 text-xs text-slate-500">{loc.address || "No address provided"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Cast & Crew */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <form onSubmit={handleAddRosterMember} className="flex gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="text"
              placeholder="Name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-1/3 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Role / Department (e.g. Director, DP, Lead)"
              value={personRole}
              onChange={(e) => setPersonRole(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" /> Add Member
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {combinedRoster.map((member: ProductionMember, idx: number) => (
              <div key={member._id || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900">{member.name}</h4>
                <p className="mt-0.5 text-xs font-medium text-indigo-600">{member.role || "Team Member"}</p>
              </div>
            ))}

            {members.map((member, i) => (
              <div key={member.id || member._id || i} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-900">{member.name || member.email || "Workspace Member"}</h4>
                <p className="mt-0.5 text-xs text-slate-500">{member.role || "Project Collaborator"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}