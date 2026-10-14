"use client";

import React, { useState } from "react";
import { EngineSimulationResult, ModelEngineInputs } from "@/types/model";
import { formatCurrency, formatPercent, formatMonths } from "@/lib/formatters";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Filter,
  Sparkles,
  Zap,
  Target,
  Coins,
  Check,
} from "lucide-react";

import { isModelEmpty } from "@/lib/engine";
import { StrategicHelpPriority } from "@/lib/advisoryEngine";
import { computeHealthAudit } from "@/lib/healthAudit";
export type { SignalItem } from "@/lib/healthAudit";

interface SituationAnalysisRadarProps {
  result: EngineSimulationResult;
  inputs: ModelEngineInputs;
  helpPriority?: StrategicHelpPriority;
  decisionGoal?: string;
}

const priorityLabels: Record<StrategicHelpPriority, { title: string; subtitle: string }> = {
  runway_preservation: {
    title: "Extend Cash Runway & Capital Preservation",
    subtitle: "Focus: Minimizing net operating cash burn and maintaining minimum reserve cushion.",
  },
  unit_economics: {
    title: "Optimize Unit Economics & LTV:CAC",
    subtitle: "Focus: Accelerating CAC payback velocity and widening gross margins above 75%.",
  },
  scale_acquisition: {
    title: "Scale Acquisition & Top-Line ARR Growth",
    subtitle: "Focus: Maximizing lead conversion rates and scalable customer addition velocity.",
  },
  break_even: {
    title: "Achieve Operating Cash Break-Even",
    subtitle: "Focus: Generating enough contribution margin to fully fund payroll and opex.",
  },
  fundraising: {
    title: "Investor Due Diligence & Series Readiness",
    subtitle: "Focus: Meeting venture fundable benchmarks (Rule of 40, LTV:CAC > 3x, 18M+ runway).",
  },
  custom_goal: {
    title: "Custom Strategic Objective",
    subtitle: "Focus: Executing specific founder milestones and capital deployment targets.",
  },
};

export const SituationAnalysisRadar: React.FC<SituationAnalysisRadarProps> = ({
  result,
  inputs,
  helpPriority = "runway_preservation",
  decisionGoal,
}) => {
  const [filterType, setFilterType] = useState<"all" | "priority" | "good" | "bad" | "warning">("all");
  const { summary, projections } = result;
  const curr = inputs.currency;

  // Requirement: if no data is filled by user in any field, show nothing on dashboard, all thing as N/A no flags no triggers no good no bad
  if (isModelEmpty(inputs)) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-3 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
          <ShieldAlert className="h-6 w-6 text-slate-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">
            Current Situation Analysis: Awaiting Financial Data
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No company metrics have been entered yet. Complete the assessment or input your venture numbers in the Model Editor to generate live solvency diagnostics, health triggers, and CFO recommendations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
          <span>Status: All metrics N/A • Zero triggers active</span>
        </div>
      </div>
    );
  }

  const audit = computeHealthAudit(inputs, result, helpPriority);
  const { signals, goodSignals, badSignals, warningSignals, goalPrioritySignals, overallGrade, quantifiedTargets } = audit;
  const {
    estimatedMonthlyBurn,
    target18MBurn,
    requiredBurnCut,
    currentRunway,
    requiredCapitalBridge,
    currentLtvCac,
    targetCacFor35x,
    requiredCacCut,
    targetArpuFor35x,
    requiredArpuExpansion,
    current12MArr,
    targetArr,
    targetTotalCustomers,
    requiredCustomerAddsDelta,
    requiredMonthlyLeads,
    requiredLeadsDelta,
    effectiveConv,
    totalFixedOverhead,
    requiredBreakEvenAccounts,
    customerAccountShortfall,
    requiredAdditionalMrr,
    runwayGap,
    ltvGap,
    gmGap,
  } = quantifiedTargets;

  const displayedSignals = signals.filter((s) => {
    if (filterType === "all") return true;
    if (filterType === "priority") return s.isGoalPriority;
    return s.type === filterType;
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Strategic Focus Header Banner */}
      {helpPriority && priorityLabels[helpPriority] && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Target className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Active Advisory Objective (Section 5)
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800">
                  Prioritized Engine
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5 break-words">
                {priorityLabels[helpPriority].title}
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5 break-words leading-relaxed">
                {decisionGoal && decisionGoal.trim()
                  ? `Goal Context: "${decisionGoal}" • ${priorityLabels[helpPriority].subtitle}`
                  : priorityLabels[helpPriority].subtitle}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg shrink-0 self-start sm:self-auto">
            Dynamic Diagnostics Active
          </span>
        </div>
      )}

      {/* Dynamic Section 5 Quantified Action Plan & Requirements Card */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs shadow-xs">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Quantified Requirements for: {priorityLabels[helpPriority].title}
              </h4>
              <p className="text-[11px] text-slate-500">
                Actionable targets and exact financial improvements required based on your selected priority
              </p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 border border-emerald-200 shrink-0 self-start sm:self-auto">
            Target Action Plan
          </span>
        </div>

        {/* 3 Metric Benchmark Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {helpPriority === "runway_preservation" && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current Monthly Net Burn</span>
                <span className="text-sm font-extrabold text-rose-600 mt-0.5 block">{formatCurrency(estimatedMonthlyBurn, curr, false)} / mo</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Allowable for 18M: ≤ {formatCurrency(target18MBurn, curr, false)} / mo</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Required Burn Cut</span>
                <span className={`text-sm font-extrabold ${requiredBurnCut > 0 ? "text-amber-700" : "text-emerald-700"} mt-0.5 block`}>
                  {requiredBurnCut > 0 ? `-${formatCurrency(requiredBurnCut, curr, false)} / mo` : "0 (Runway Solvent)"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{requiredBurnCut > 0 ? `${Math.round((requiredBurnCut / Math.max(1, estimatedMonthlyBurn)) * 100)}% burn reduction needed` : "Runway exceeds 18M buffer"}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Capital Bridge Target</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                  {requiredCapitalBridge > 0 ? formatCurrency(requiredCapitalBridge, curr, true) : "Self-Funded"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">To guarantee 18-month solvency buffer</span>
              </div>
            </>
          )}

          {helpPriority === "unit_economics" && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Current LTV : CAC Multiple</span>
                <span className={`text-sm font-extrabold ${currentLtvCac >= 3.5 ? "text-emerald-700" : currentLtvCac >= 2.0 ? "text-amber-700" : "text-rose-700"} mt-0.5 block`}>
                  {currentLtvCac.toFixed(1)}x
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Target Benchmark: ≥ 3.5x Multiple</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target CAC Ceiling</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                  ≤ {formatCurrency(targetCacFor35x, curr, false)}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {requiredCacCut > 0 ? `Required CAC cut: -${formatCurrency(requiredCacCut, curr, false)}` : "CAC meets target multiple"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Target ARPU Expansion</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                  {requiredArpuExpansion > 0 ? `+${formatCurrency(requiredArpuExpansion, curr, false)} / mo` : "Pricing Optimal"}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">Alternative to reach 3.5x multiple</span>
              </div>
            </>
          )}

          {helpPriority === "scale_acquisition" && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">12-Month ARR Target</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">{formatCurrency(targetArr, curr, true)}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Current ARR: {formatCurrency(current12MArr, curr, true)}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Customer Additions Gap</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">+{requiredCustomerAddsDelta} Accounts</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Total Target: {targetTotalCustomers} active clients</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Required Lead Volume</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">+{requiredLeadsDelta} Leads / mo</span>
                <span className="text-[10px] text-slate-400 mt-1 block">At current {(effectiveConv * 100).toFixed(1)}% conversion rate</span>
              </div>
            </>
          )}

          {helpPriority === "break_even" && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Break-Even Account Target</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">{requiredBreakEvenAccounts} Accounts</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Current Paying: {inputs.initial_paying_customers} accounts</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Account Shortfall Gap</span>
                <span className="text-sm font-extrabold text-amber-700 mt-0.5 block">+{customerAccountShortfall} Accounts</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Needed to cover all fixed costs</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Required Additional MRR</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">+{formatCurrency(requiredAdditionalMrr, curr, false)} / mo</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Total Fixed Burden: {formatCurrency(totalFixedOverhead, curr, false)} / mo</span>
              </div>
            </>
          )}

          {helpPriority === "fundraising" && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Diligence Runway Buffer</span>
                <span className={`text-sm font-extrabold ${runwayGap === 0 ? "text-emerald-700" : "text-amber-700"} mt-0.5 block`}>
                  {currentRunway} Mos (Target: 18 Mos)
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{runwayGap > 0 ? `Gap: +${runwayGap} Mos needed` : "Runway satisfies institutional standard"}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">LTV : CAC Multiple</span>
                <span className={`text-sm font-extrabold ${currentLtvCac >= 3.0 ? "text-emerald-700" : "text-rose-700"} mt-0.5 block`}>
                  {currentLtvCac.toFixed(1)}x (Target: ≥ 3.0x)
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{ltvGap > 0 ? `Gap: +${ltvGap.toFixed(1)}x required` : "Unit multiple is top-quartile"}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Gross Margin Standard</span>
                <span className={`text-sm font-extrabold ${summary.average_gross_margin_pct >= 0.7 ? "text-emerald-700" : "text-amber-700"} mt-0.5 block`}>
                  {(summary.average_gross_margin_pct * 100).toFixed(1)}% (Target: ≥ 70%)
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">{gmGap > 0 ? `Gap: +${gmGap}% margin expansion` : "Gross margin exceeds SaaS standard"}</span>
              </div>
            </>
          )}

          {helpPriority === "custom_goal" && (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ending Cash Balance</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{formatCurrency(summary.ending_cash, curr, true)}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Safety Floor: {formatCurrency(inputs.minimum_cash_reserve, curr, true)}</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Closing Customers</span>
                <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">{summary.final_month_customers} Accounts</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Starting: {inputs.initial_paying_customers} accounts</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ending ARR Run Rate</span>
                <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">{formatCurrency(summary.final_month_arr, curr, true)}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Gross Margin: {(summary.average_gross_margin_pct * 100).toFixed(1)}%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Header & Diagnosis Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Current Situation Analysis &amp; Health Radar</span>
            </h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${overallGrade.color}`}>
              {overallGrade.label}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time deterministic assessment of your venture&apos;s solvency, unit economics, acquisition speed, and retention.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`rounded-xl px-3 py-1.5 font-semibold transition-all border ${
              filterType === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Findings ({signals.length})
          </button>
          {goalPrioritySignals.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterType("priority")}
              className={`rounded-xl px-3 py-1.5 font-semibold transition-all border ${
                filterType === "priority"
                  ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              🎯 Goal Focus ({goalPrioritySignals.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setFilterType("good")}
            className={`rounded-xl px-3 py-1.5 font-semibold transition-all border ${
              filterType === "good"
                ? "bg-emerald-700 text-white border-emerald-700 shadow-sm"
                : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            🟢 Good ({goodSignals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("bad")}
            className={`rounded-xl px-3 py-1.5 font-semibold transition-all border ${
              filterType === "bad"
                ? "bg-rose-700 text-white border-rose-700 shadow-sm"
                : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
            }`}
          >
            🔴 Critical / Bad ({badSignals.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("warning")}
            className={`rounded-xl px-3 py-1.5 font-semibold transition-all border ${
              filterType === "warning"
                ? "bg-amber-700 text-white border-amber-700 shadow-sm"
                : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            }`}
          >
            🟡 Watchlist ({warningSignals.length})
          </button>
        </div>
      </div>

      {/* Findings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedSignals.map((item) => {
          const isGood = item.type === "good";
          const isBad = item.type === "bad";

          const cardBorder = isGood
            ? "border-emerald-200/90 bg-emerald-50/25"
            : isBad
            ? "border-rose-200/90 bg-rose-50/25"
            : "border-amber-200/90 bg-amber-50/25";

          const badgeBg = isGood
            ? "bg-emerald-100 text-emerald-800 border border-emerald-200/70"
            : isBad
            ? "bg-rose-100 text-rose-800 border border-rose-200/70"
            : "bg-amber-100 text-amber-800 border border-amber-200/70";

          const iconBg = isGood
            ? "bg-emerald-100/80 text-emerald-700"
            : isBad
            ? "bg-rose-100/80 text-rose-700"
            : "bg-amber-100/80 text-amber-700";

          const Icon = isGood ? CheckCircle2 : isBad ? XCircle : AlertTriangle;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-all hover:shadow-md ${cardBorder} min-w-0 break-words`}
            >
              <div className="space-y-3 min-w-0">
                {/* Header bar: category + status badges */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2.5 min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    {item.category}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    {item.isGoalPriority && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-700 text-white px-2 py-0.5 text-[9px] font-extrabold tracking-tight shadow-2xs">
                        <span>🎯</span> Focus Area
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap ${badgeBg}`}>
                      {isGood ? "Strength" : isBad ? "Critical Risk" : "Watchlist"}
                    </span>
                  </div>
                </div>

                {/* Metric Title & Value with enclosed icon badge */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs mt-0.5 ${iconBg}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 leading-snug break-words">{item.title}</h4>
                    <p className="text-xs font-extrabold text-slate-800 mt-1 break-words">
                      <span className="text-slate-400 font-normal mr-1">Signal:</span>
                      {item.metricValue}
                    </p>
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-slate-600 leading-relaxed break-words">{item.summary}</p>
              </div>

              {/* CFO Recommendation */}
              <div className="rounded-xl border border-slate-200/80 bg-white/95 p-3.5 text-[11px] text-slate-700 space-y-1.5 min-w-0 break-words shadow-2xs">
                <span className="font-extrabold text-slate-900 block text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                  CFO Recommendation
                </span>
                <p className="leading-relaxed text-slate-600 break-words">{item.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
