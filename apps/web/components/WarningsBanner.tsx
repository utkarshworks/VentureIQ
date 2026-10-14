"use client";

import React, { useState } from "react";
import { ModelWarning } from "@/types/model";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  ShieldAlert,
  TrendingDown,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface WarningsBannerProps {
  warnings: ModelWarning[];
}

interface WarningConfig {
  title: string;
  category: string;
  remedy: string;
  icon: React.ComponentType<{ className?: string }>;
}

const WARNING_CONFIGS: Record<string, WarningConfig> = {
  INSOLVENCY_RISK: {
    title: "Critical Solvency & Cash Invalidation Risk",
    category: "RUNWAY EXHAUSTION",
    remedy:
      "Capital conservation protocol required: Curtail discretionary customer acquisition spend, renegotiate fixed vendor contracts, or secure debt/equity financing to prevent negative liquidity.",
    icon: AlertCircle,
  },
  RESERVE_BREACH: {
    title: "Safety Cash Buffer Depletion Alert",
    category: "SAFETY RESERVE BREACH",
    remedy:
      "Working capital buffer drops below designated policy floor. Prioritize cash collections, defer non-critical capital expenditures, and maintain an operating buffer of at least 3 months.",
    icon: ShieldAlert,
  },
  NEGATIVE_UNIT_ECONOMICS: {
    title: "Negative Unit Gross Contribution Margin",
    category: "MARGIN LEAKAGE",
    remedy:
      "Every new customer acquisition incurs variable operating loss. Review third-party API and hosting costs per customer and consider adjusting price tiers to restore positive gross margin.",
    icon: TrendingDown,
  },
  HIGH_CHURN: {
    title: "Elevated Customer Churn Velocity",
    category: "HIGH ATTRITION",
    remedy:
      "Monthly churn rate exceeds sustainable SaaS threshold (> 10%/mo). Prioritize customer onboarding, product engagement telemetry, and retention incentives before increasing ad acquisition budgets.",
    icon: AlertTriangle,
  },
  LONG_PAYBACK: {
    title: "Extended CAC Recovery Payback Timeline",
    category: "CAPITAL EFFICIENCY LAG",
    remedy:
      "Months required to recover customer acquisition expense exceed planning horizon. Introduce annual upfront prepayments or optimize lead funnel conversion rates to compress payback velocity.",
    icon: Clock,
  },
};

export const WarningsBanner: React.FC<WarningsBannerProps> = ({ warnings }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  if (!warnings || warnings.length === 0) return null;

  const criticalCount = warnings.filter((w) => w.severity === "critical").length;
  const warningCount = warnings.filter((w) => w.severity === "warning").length;

  return (
    <div className="mb-6 space-y-3">
      {/* Executive Alert Header Bar */}
      <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-white shadow-xs">
            <ShieldAlert className="h-3 w-3" />
          </div>
          <span className="font-bold text-rose-950">
            CFO Solvency &amp; Strategic Risk Radar:
          </span>
          <span className="text-rose-800">
            {warnings.length} active financial {warnings.length === 1 ? "trigger" : "triggers"} identified
            {criticalCount > 0 && ` (${criticalCount} Critical, ${warningCount} High Attention)`}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1 font-semibold text-rose-800 hover:text-rose-950 transition-colors"
        >
          <span>{collapsed ? "Show Details" : "Collapse"}</span>
          {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Warnings List */}
      {!collapsed && (
        <div className="grid grid-cols-1 gap-2.5 animate-in fade-in duration-150">
          {warnings.map((w, idx) => {
            const config = WARNING_CONFIGS[w.code] || {
              title: w.code.replace(/_/g, " "),
              category: "RISK FACTOR",
              remedy: "Review operational assumptions to optimize financial sustainability.",
              icon: w.severity === "critical" ? AlertCircle : AlertTriangle,
            };

            const isCritical = w.severity === "critical";
            const isWarning = w.severity === "warning";
            const cleanMessage = w.message.replace(/^\[.*?\]\s*/, "");

            const cardBorder = isCritical
              ? "border-l-4 border-l-rose-500 border-rose-200 bg-white"
              : isWarning
              ? "border-l-4 border-l-amber-500 border-amber-200 bg-white"
              : "border-l-4 border-l-sky-500 border-sky-200 bg-white";

            const badgeStyle = isCritical
              ? "bg-rose-100 text-rose-800 border-rose-200"
              : isWarning
              ? "bg-amber-100 text-amber-800 border-amber-200"
              : "bg-sky-100 text-sky-800 border-sky-200";

            const iconColor = isCritical
              ? "text-rose-600"
              : isWarning
              ? "text-amber-600"
              : "text-sky-600";

            const Icon = config.icon;

            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 shadow-xs transition-all ${cardBorder}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 tracking-tight">
                          {config.title}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}
                        >
                          {config.category}
                        </span>
                        {w.month && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                            Month {w.month}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {cleanMessage}
                      </p>
                    </div>
                  </div>
                </div>

                {/* CFO Actionable Recommendation */}
                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-2.5 flex items-start gap-2 text-[11px] text-slate-600">
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slate-500" />
                  <div>
                    <span className="font-bold text-slate-800">CFO Action Plan: </span>
                    <span>{config.remedy}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
