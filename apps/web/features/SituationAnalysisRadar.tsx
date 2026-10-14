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
} from "lucide-react";

import { isModelEmpty } from "@/lib/engine";

interface SignalItem {
  id: string;
  type: "good" | "bad" | "warning";
  category: "Capital & Runway" | "Unit Economics" | "Retention & Churn" | "Growth & Payback";
  title: string;
  metricValue: string;
  summary: string;
  recommendation: string;
}

interface SituationAnalysisRadarProps {
  result: EngineSimulationResult;
  inputs: ModelEngineInputs;
}

export const SituationAnalysisRadar: React.FC<SituationAnalysisRadarProps> = ({
  result,
  inputs,
}) => {
  const [filterType, setFilterType] = useState<"all" | "good" | "bad" | "warning">("all");
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

  const signals: SignalItem[] = [];

  // 1. Capital & Runway Evaluation
  const hasCash = (inputs.initial_cash_balance || 0) > 0;
  const hasOutflows = projections.some((p) => p.cash_outflows > 0);

  if (hasCash) {
    const isReserveBreached = summary.ending_cash < inputs.minimum_cash_reserve || summary.runway_months !== null;
    if (isReserveBreached) {
      signals.push({
        id: "runway_breach",
        type: "bad",
        category: "Capital & Runway",
        title: "Safety Cash Reserve Breached",
        metricValue: summary.runway_months ? `Month ${summary.runway_months}` : "Deficit",
        summary: `Projected cash balance drops below your safety floor (${formatCurrency(
          inputs.minimum_cash_reserve,
          curr,
          true
        )}). Operations risk severe insolvency under current burn rate.`,
        recommendation: `Extend runway by trimming non-essential OpEx or securing bridge capital before Month ${
          summary.runway_months ?? 1
        }.`,
      });
    } else {
      signals.push({
        id: "runway_solvent",
        type: "good",
        category: "Capital & Runway",
        title: "Fully Funded & Solvent Operating Runway",
        metricValue: `> ${inputs.planning_horizon} Months`,
        summary: `Ending liquid treasury (${formatCurrency(
          summary.ending_cash,
          curr,
          true
        )}) comfortably exceeds minimum safety reserve (${formatCurrency(
          inputs.minimum_cash_reserve,
          curr,
          true
        )}) through the full simulation.`,
        recommendation:
          "Operations are capital-stable; you have autonomy to reinvest operating cash flow into growth without emergency dilution pressure.",
      });
    }
  } else if (hasOutflows) {
    signals.push({
      id: "runway_zero_cash",
      type: "bad",
      category: "Capital & Runway",
      title: "Zero Operating Cash Treasury",
      metricValue: "0 Cash",
      summary: "Your venture has active monthly cash outflows but zero initial liquid cash balance recorded.",
      recommendation: "Record initial cash treasury reserves or model imminent financing events to ensure solvency.",
    });
  }

  // 2. Unit Economics (LTV : CAC) Evaluation
  if (summary.ltv_to_cac_ratio_final !== null) {
    if (summary.ltv_to_cac_ratio_final >= 3.0) {
      signals.push({
        id: "ltv_cac_high",
        type: "good",
        category: "Unit Economics",
        title: "Strong LTV : CAC Multiple",
        metricValue: `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`,
        summary: `Customer lifetime value significantly outpaces acquisition cost, well above the 3.0x venture viability benchmark.`,
        recommendation:
          "High unit efficiency indicates you can afford to aggressively scale paid and outbound acquisition budgets.",
      });
    } else if (summary.ltv_to_cac_ratio_final < 2.0) {
      signals.push({
        id: "ltv_cac_low",
        type: "bad",
        category: "Unit Economics",
        title: "Sub-Optimal Unit Economics (< 2.0x)",
        metricValue: `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`,
        summary: `Customer acquisition cost is unsustainably close to gross lifetime revenue. Customer additions may deplete cash faster than they generate value.`,
        recommendation:
          "Review acquisition channels to lower blended CAC, or increase monthly subscription price (ARPU) to expand LTV.",
      });
    } else {
      signals.push({
        id: "ltv_cac_moderate",
        type: "warning",
        category: "Unit Economics",
        title: "Moderate Unit Economics (2.0x – 3.0x)",
        metricValue: `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`,
        summary: `Unit economics are marginally viable, but leave limited cushion if customer acquisition costs rise or churn increases.`,
        recommendation:
          "Optimize lead conversion rate and test annual contract incentives to lift unit multiple past 3.0x.",
      });
    }
  }

  // 3. Gross Margin Evaluation (only if business has active revenue)
  if (summary.final_month_mrr > 0) {
    if (summary.average_gross_margin_pct >= 0.75) {
      signals.push({
        id: "margin_high",
        type: "good",
        category: "Unit Economics",
        title: "Superior Gross Margin (> 75%)",
        metricValue: `${(summary.average_gross_margin_pct * 100).toFixed(1)}%`,
        summary: `Direct cloud hosting, payment processing, and variable servicing absorb only ${(
          (1 - summary.average_gross_margin_pct) *
          100
        ).toFixed(1)}% of revenue.`,
        recommendation:
          "High gross margin yields strong operating gross profit to support team payroll and marketing.",
      });
    } else if (summary.average_gross_margin_pct < 0.6) {
      signals.push({
        id: "margin_low",
        type: "bad",
        category: "Unit Economics",
        title: "High Delivery Cost / Compressed Gross Margin",
        metricValue: `${(summary.average_gross_margin_pct * 100).toFixed(1)}%`,
        summary: `Variable hosting and direct costs consume over 40% of customer receipts, putting downward pressure on contribution margin.`,
        recommendation:
          "Audit cloud infrastructure efficiency, renegotiate third-party API costs, and verify unit pricing tiers.",
      });
    }
  }

  // 4. CAC Payback Period Evaluation (only if payback is calculated and positive)
  if (summary.cac_payback_final !== null && summary.cac_payback_final > 0) {
    if (summary.cac_payback_final <= 12) {
      signals.push({
        id: "payback_fast",
        type: "good",
        category: "Growth & Payback",
        title: "Rapid CAC Payback Velocity (< 12 Mos)",
        metricValue: `${summary.cac_payback_final.toFixed(1)} Months`,
        summary: `Acquisition spend is fully recovered in under a year, creating fast working capital recycling.`,
        recommendation:
          "Fast capital recycling allows reinvesting cash flow back into marketing repeatedly within the same fiscal year.",
      });
    } else if (summary.cac_payback_final > 18) {
      signals.push({
        id: "payback_slow",
        type: "bad",
        category: "Growth & Payback",
        title: "Sluggish Working Capital Payback (> 18 Mos)",
        metricValue: `${summary.cac_payback_final.toFixed(1)} Months`,
        summary: `Taking over 18 months to recover marketing expenditure creates heavy working capital drag and elevates churn exposure.`,
        recommendation:
          "Offer annual upfront billing with a 10–15% discount to collect customer CAC on Day 1.",
      });
    } else {
      signals.push({
        id: "payback_moderate",
        type: "warning",
        category: "Growth & Payback",
        title: "Moderate Payback Duration (12–18 Mos)",
        metricValue: `${summary.cac_payback_final.toFixed(1)} Months`,
        summary: `Capital payback is standard for enterprise contracts, but requires adequate liquid cash buffer to float upfront sales costs.`,
        recommendation:
          "Introduce expansion upsells early in the customer lifecycle to accelerate cash payback.",
      });
    }
  }

  // 5. Customer Retention & Churn Evaluation (only if venture has an active or starting paying customer base)
  if (inputs.initial_paying_customers > 0 || summary.final_month_customers > 0) {
    if (inputs.customer_churn_rate <= 0.02) {
      signals.push({
        id: "churn_low",
        type: "good",
        category: "Retention & Churn",
        title: "Strong Customer Retention (≤ 2.0% Churn)",
        metricValue: `${(inputs.customer_churn_rate * 100).toFixed(1)}% / mo`,
        summary: `Low monthly customer decay minimizes revenue leakage and lets organic and paid additions compound ARR.`,
        recommendation:
          "High customer retention makes this an opportune time to launch expansion tiers and cross-sells.",
      });
    } else if (inputs.customer_churn_rate >= 0.04) {
      signals.push({
        id: "churn_high",
        type: "bad",
        category: "Retention & Churn",
        title: "Severe Customer Attrition (≥ 4.0% Churn)",
        metricValue: `${(inputs.customer_churn_rate * 100).toFixed(1)}% / mo`,
        summary: `Monthly attrition of ${(inputs.customer_churn_rate * 100).toFixed(
          1
        )}% leaks over 38% of your customer base annually, creating an expensive treadmill.`,
        recommendation:
          "Conduct customer retention audits and address onboarding friction before scaling acquisition spend.",
      });
    } else {
      signals.push({
        id: "churn_moderate",
        type: "warning",
        category: "Retention & Churn",
        title: "Moderate Churn Decay (2% – 4% / mo)",
        metricValue: `${(inputs.customer_churn_rate * 100).toFixed(1)}% / mo`,
        summary: `Attrition is within average early-stage ranges, but compound churn will become a growth bottleneck as account volume increases.`,
        recommendation:
          "Implement automated health scoring to flag at-risk accounts before cancellation notices.",
      });
    }
  }

  // 6. Break-Even & Profitability Evaluation (only if business has active revenue or opex)
  if (summary.final_month_mrr > 0 || projections.some((p) => p.total_opex > 0)) {
    if (summary.break_even_month !== null) {
      signals.push({
        id: "breakeven_reached",
        type: "good",
        category: "Capital & Runway",
        title: "Operating Break-Even Achieved",
        metricValue: `Month ${summary.break_even_month}`,
        summary: `Revenue covers all operational overhead and payroll starting in Month ${summary.break_even_month}, achieving cash self-sufficiency.`,
        recommendation:
          "Reaching cash flow positivity dramatically reduces fundraising risk and maximizes founder leverage.",
      });
    } else {
      signals.push({
        id: "breakeven_unreached",
        type: "warning",
        category: "Capital & Runway",
        title: "Operating Burn Throughout Planning Horizon",
        metricValue: `No Break-Even`,
        summary: `Business remains net cash-flow negative across all ${inputs.planning_horizon} months under current growth velocity.`,
        recommendation:
          "Run reverse planning to identify the exact customer count or ARPU required to achieve break-even before cash reserve breaches.",
      });
    }
  }

  const goodSignals = signals.filter((s) => s.type === "good");
  const badSignals = signals.filter((s) => s.type === "bad");
  const warningSignals = signals.filter((s) => s.type === "warning");

  const displayedSignals = signals.filter((s) => {
    if (filterType === "all") return true;
    return s.type === filterType;
  });

  // Overall Health Diagnosis
  const overallGrade =
    badSignals.length === 0
      ? { label: "Grade A • Strong & Resilient", color: "text-emerald-700 bg-emerald-50 border-emerald-200" }
      : badSignals.length === 1
      ? { label: "Grade B • Viable with Key Focus", color: "text-amber-800 bg-amber-50 border-amber-200" }
      : { label: "Grade C • Urgent Interventions Needed", color: "text-rose-800 bg-rose-50 border-rose-200" };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header & Diagnosis Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
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
            ? "border-emerald-200 bg-emerald-50/30"
            : isBad
            ? "border-rose-200 bg-rose-50/30"
            : "border-amber-200 bg-amber-50/30";

          const badgeBg = isGood
            ? "bg-emerald-100 text-emerald-800"
            : isBad
            ? "bg-rose-100 text-rose-800"
            : "bg-amber-100 text-amber-800";

          const Icon = isGood ? CheckCircle2 : isBad ? XCircle : AlertTriangle;
          const iconColor = isGood ? "text-emerald-600" : isBad ? "text-rose-600" : "text-amber-600";

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4.5 flex flex-col justify-between space-y-3 transition-all hover:shadow-sm ${cardBorder}`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.category}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeBg}`}>
                    {isGood ? "Strength" : isBad ? "Critical Risk" : "Watchlist"}
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                    <p className="text-xs font-extrabold text-slate-800 mt-0.5">{item.metricValue}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-white/80 p-2.5 text-[11px] text-slate-700 space-y-0.5">
                <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider">
                  CFO Recommendation
                </span>
                <p className="leading-relaxed text-slate-600">{item.recommendation}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

