"use client";

import React from "react";
import {
  LayoutDashboard,
  Sliders,
  Calculator,
  Compass,
  GitCompare,
  TrendingDown,
  Users,
  FileSpreadsheet,
  Target,
} from "lucide-react";

export type TabId =
  | "overview"
  | "model_editor"
  | "unit_economics"
  | "growth_simulator"
  | "scenarios"
  | "reverse_planner"
  | "sensitivity"
  | "cash_flow_hiring"
  | "reports";

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: "overview", label: "Overview Dashboard", icon: LayoutDashboard },
    { id: "model_editor", label: "Financial Model", icon: Sliders },
    { id: "unit_economics", label: "Unit Economics", icon: Calculator },
    { id: "growth_simulator", label: "Growth Simulator", icon: Compass },
    { id: "scenarios", label: "Scenario Planning", icon: GitCompare },
    {
      id: "reverse_planner",
      label: "Reverse Planner",
      icon: Target,
      highlight: true,
      badge: "Core Feature",
    },
    { id: "sensitivity", label: "Sensitivity Analysis", icon: TrendingDown },
    { id: "cash_flow_hiring", label: "Cash Flow & Hiring", icon: Users },
    { id: "reports", label: "Reports & Data", icon: FileSpreadsheet },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Decision Modules
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id as TabId)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? item.highlight
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-900 text-white shadow-sm"
                  : item.highlight
                  ? "text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70"
                  : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? "text-white"
                      : item.highlight
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-700">Deterministic Engine</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          100% mathematical certainty. All metrics derived from balance sheet & unit economic invariants.
        </p>
      </div>
    </aside>
  );
};

