"use client";

import React from "react";
import { EngineSimulationResult, ModelEngineInputs } from "@/types/model";
import { formatCurrency, formatPercent, formatMonths, formatNumber } from "@/lib/formatters";
import { MetricCard } from "@/components/MetricCard";
import { isModelEmpty } from "@/lib/engine";
import {
  Calculator,
  ShieldCheck,
  Zap,
  BookOpen,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Clock,
  Coins,
  Repeat,
} from "lucide-react";

interface UnitEconomicsViewProps {
  result: EngineSimulationResult;
  inputs: ModelEngineInputs;
  onOpenAI?: (query?: string) => void;
}

export const UnitEconomicsView: React.FC<UnitEconomicsViewProps> = ({
  result,
  inputs,
  onOpenAI,
}) => {
  const { summary } = result;
  const curr = inputs.currency;
  const isEmpty = isModelEmpty(inputs);

  // Derived unit metrics
  const cac = summary.blended_cac_final;
  const payback = summary.cac_payback_final;
  const ltv = summary.simplified_ltv_final;
  const ltvToCac = summary.ltv_to_cac_ratio_final;
  const grossMarginPct = summary.average_gross_margin_pct;
  const arpu = inputs.arpu || 0;
  const monthlyGrossProfitPerCust = arpu * grossMarginPct;
  const churn = inputs.customer_churn_rate || 0.05;

  // Cohort cumulative gross profit milestones
  const m3Cumulative = cac !== null ? monthlyGrossProfitPerCust * 3 - cac : null;
  const m6Cumulative = cac !== null ? monthlyGrossProfitPerCust * 6 - cac : null;
  const m12Cumulative = cac !== null ? monthlyGrossProfitPerCust * 12 - cac : null;
  const m24Cumulative = cac !== null ? monthlyGrossProfitPerCust * 24 - cac : null;

  // Retention sensitivity lever: What if churn reduces by 1.5%?
  const simulatedReducedChurn = Math.max(0.005, churn - 0.015);
  const potentialLtvLift =
    churn > 0 && monthlyGrossProfitPerCust > 0
      ? monthlyGrossProfitPerCust / simulatedReducedChurn
      : null;
  const ltvDelta =
    potentialLtvLift !== null && ltv !== null ? potentialLtvLift - ltv : null;

  return (
    <div className="space-y-6">
      {/* View Header with Advisor CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Unit Economics &amp; Customer Efficiency</h2>
          <p className="text-xs text-slate-500">
            Rigorous unit viability analysis, capital recycling velocity, forward cohort trajectory, and product-thesis levers.
          </p>
        </div>
        {onOpenAI && (
          <button
            onClick={() =>
              onOpenAI(
                "Perform an executive unit economics diagnostic on our CAC payback, LTV:CAC multiple, and contribution margin. What product levers compress our payback window?"
              )
            }
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Consult Advisor on Unit Economics</span>
          </button>
        )}
      </div>

      {/* Primary Efficiency Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Customer Acquisition Cost"
          value={isEmpty || cac === null ? "N/A" : formatCurrency(cac, curr)}
          subtitle="Acquisition Spend ÷ New Customers"
          statusBadge={isEmpty || cac === null ? "No Data" : "Blended CAC"}
          statusType="neutral"
        />
        <MetricCard
          title="CAC Payback Period"
          value={isEmpty || payback === null ? "N/A" : formatMonths(payback)}
          subtitle="Months to recover acquisition cost"
          statusBadge={
            isEmpty || payback === null
              ? "No Data"
              : payback <= 8
              ? "Rapid (< 8m)"
              : payback <= 14
              ? "Moderate (8-14m)"
              : "Slow (> 14m)"
          }
          statusType={
            isEmpty || payback === null
              ? "neutral"
              : payback <= 12
              ? "good"
              : "warning"
          }
        />
        <MetricCard
          title="Simplified LTV"
          value={isEmpty || ltv === null ? "N/A" : formatCurrency(ltv, curr, true)}
          subtitle="(ARPU × Gross Margin) ÷ Churn"
          statusBadge={isEmpty || ltv === null ? "No Data" : "Customer Value"}
          statusType={isEmpty || ltv === null ? "neutral" : "good"}
        />
        <MetricCard
          title="LTV : CAC Ratio"
          value={
            isEmpty || ltvToCac === null
              ? "N/A"
              : `${ltvToCac.toFixed(1)}x`
          }
          subtitle="Benchmark: > 3.0x is sustainable"
          statusBadge={
            isEmpty || ltvToCac === null
              ? "No Data"
              : ltvToCac >= 3.5
              ? "High Surplus (≥3.5x)"
              : ltvToCac >= 3.0
              ? "Healthy (3.0x)"
              : "Unit Fragility (<3.0x)"
          }
          statusType={
            isEmpty || ltvToCac === null
              ? "neutral"
              : ltvToCac >= 3.0
              ? "good"
              : "danger"
          }
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Operating Break-Even Revenue"
          value={
            isEmpty
              ? "N/A"
              : result.projections[0]?.break_even_revenue
              ? formatCurrency(result.projections[0].break_even_revenue, curr, true)
              : summary.final_month_mrr === 0
              ? "N/A"
              : "Negative Unit Econ"
          }
          subtitle="Fixed OpEx ÷ Contribution Margin %"
          statusBadge={
            isEmpty || summary.final_month_mrr === 0
              ? "No Data"
              : result.projections[0]?.break_even_revenue
              ? "Break-Even MRR"
              : "Deficit"
          }
          statusType={
            isEmpty || summary.final_month_mrr === 0
              ? "neutral"
              : result.projections[0]?.break_even_revenue
              ? "good"
              : "danger"
          }
        />
        <MetricCard
          title="Gross Margin %"
          value={isEmpty || summary.final_month_mrr === 0 ? "N/A" : formatPercent(summary.average_gross_margin_pct)}
          subtitle="(Revenue - Direct COGS) ÷ Revenue"
          statusBadge={
            isEmpty || summary.final_month_mrr === 0
              ? "No Data"
              : summary.average_gross_margin_pct >= 0.7
              ? "Healthy"
              : "Low"
          }
          statusType={
            isEmpty || summary.final_month_mrr === 0
              ? "neutral"
              : summary.average_gross_margin_pct >= 0.7
              ? "good"
              : "warning"
          }
        />
        <MetricCard
          title="Contribution Margin %"
          value={isEmpty || summary.final_month_mrr === 0 ? "N/A" : formatPercent(summary.average_contribution_margin_pct)}
          subtitle="(Revenue - Variable Costs) ÷ Revenue"
          statusBadge={
            isEmpty || summary.final_month_mrr === 0
              ? "No Data"
              : summary.average_contribution_margin_pct > 0
              ? "Positive"
              : "Negative"
          }
          statusType={
            isEmpty || summary.final_month_mrr === 0
              ? "neutral"
              : summary.average_contribution_margin_pct > 0
              ? "good"
              : "danger"
          }
        />
      </div>

      {/* STRATEGIC INTERPRETATION & CAPITAL VELOCITY ANALYSIS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Unit Interpretation &amp; Capital Velocity Diagnosis
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Executive Synthesis
          </span>
        </div>

        {isEmpty ? (
          <p className="text-xs text-slate-500 py-3 italic">
            Enter company revenue, acquisition, and expense parameters in the assessment or financial model to unlock dynamic capital velocity diagnosis.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Velocity Card 1 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Capital Velocity Rating</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    payback && payback <= 8
                      ? "bg-emerald-100 text-emerald-800"
                      : payback && payback <= 14
                      ? "bg-blue-100 text-blue-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {payback && payback <= 8
                    ? "Hyper-Efficient"
                    : payback && payback <= 14
                    ? "Sustainable Pace"
                    : "Capital Drag"}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {payback && payback <= 8
                  ? `Your payback period of ${formatMonths(payback)} recycles capital rapidly. Every dollar spent acquiring customers returns within two quarters, allowing self-funded reinvestment without excessive debt or dilutive equity.`
                  : payback && payback <= 14
                  ? `Payback of ${formatMonths(payback)} is within acceptable venture benchmarks. However, scaling customer acquisition will tie up working capital for approximately one full operating year.`
                  : `Payback of ${payback ? formatMonths(payback) : "N/A"} represents a significant working capital burden. Growth will consume substantial upfront cash before producing positive operating contribution.`}
              </p>
            </div>

            {/* Velocity Card 2 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">LTV Margin of Safety</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    ltvToCac && ltvToCac >= 3.5
                      ? "bg-emerald-100 text-emerald-800"
                      : ltvToCac && ltvToCac >= 3.0
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {ltvToCac && ltvToCac >= 3.0 ? "Resilient Buffer" : "Vulnerable"}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {ltvToCac && ltvToCac >= 3.0
                  ? `At ${ltvToCac.toFixed(1)}x LTV:CAC, your customer margin covers acquisition, direct delivery, and general overhead with surplus. Ad costs can inflate up to ${(
                      (ltvToCac - 3.0) *
                      33
                    ).toFixed(0)}% before breaching the 3.0x venture hurdle.`
                  : `At ${ltvToCac ? `${ltvToCac.toFixed(1)}x` : "N/A"}, your margin of safety is tight. Any minor increase in ad auction prices or churn will push unit economics into capital-destructive territory.`}
              </p>
            </div>

            {/* Velocity Card 3 */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Monthly Gross Profit / Account</span>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {formatCurrency(monthlyGrossProfitPerCust, curr)}/mo
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                After accounting for direct delivery COGS (payment fees, hosting, servicing), each customer delivers {formatCurrency(monthlyGrossProfitPerCust, curr)} net gross margin per month. It takes exactly {payback ? `${Math.ceil(payback)} billing cycles` : "N/A"} to offset initial CAC.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FORWARD TRAJECTORY: 12-MONTH COHORT CASH RECOVERY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Forward Trajectory: Customer Cohort Net Cash Accumulation
              </h3>
              <p className="text-[11px] text-slate-500">
                What happens to cash balance after acquiring 1 customer over 3, 6, 12, and 24 months
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Cohort Economics
          </span>
        </div>

        {isEmpty || cac === null ? (
          <p className="text-xs text-slate-400 py-2 italic">
            Cohort trajectory requires baseline customer acquisition cost and pricing data.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Month 0 (Acquired)</span>
                <Clock className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="text-sm font-bold text-rose-600">
                -{formatCurrency(cac, curr)}
              </div>
              <p className="text-[10px] text-slate-500">Initial cash drag from sales &amp; marketing spend</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Month 3 Position</span>
                <span className="text-[10px] font-bold text-slate-600">3 Cycles</span>
              </div>
              <div
                className={`text-sm font-bold ${
                  m3Cumulative && m3Cumulative >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {m3Cumulative && m3Cumulative >= 0 ? "+" : ""}
                {formatCurrency(m3Cumulative ?? 0, curr)}
              </div>
              <p className="text-[10px] text-slate-500">
                {m3Cumulative && m3Cumulative >= 0 ? "Recovered into profit" : "Still in payback window"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Month 12 Cumulative</span>
                <span className="text-[10px] font-bold text-emerald-700">1 Year</span>
              </div>
              <div
                className={`text-sm font-bold ${
                  m12Cumulative && m12Cumulative >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {m12Cumulative && m12Cumulative >= 0 ? "+" : ""}
                {formatCurrency(m12Cumulative ?? 0, curr)}
              </div>
              <p className="text-[10px] text-slate-500">Net cumulative cash profit per retained customer</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Month 24 Cumulative</span>
                <span className="text-[10px] font-bold text-emerald-700">2 Years</span>
              </div>
              <div
                className={`text-sm font-bold ${
                  m24Cumulative && m24Cumulative >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {m24Cumulative && m24Cumulative >= 0 ? "+" : ""}
                {formatCurrency(m24Cumulative ?? 0, curr)}
              </div>
              <p className="text-[10px] text-slate-500">Long-tail enterprise compounding value</p>
            </div>
          </div>
        )}
      </div>

      {/* PRODUCT THESIS ANGLES & ACTIONABLE LEVERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Product Thesis &amp; Strategic Levers
            </h3>
          </div>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Actionable Playbook
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lever 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Coins className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">1. Upfront Prepayment Float</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transition 25% of new accounts from monthly invoicing to annual upfront contracts with a 15% discount.
            </p>
            <div className="rounded-lg bg-emerald-50/80 p-2 text-[11px] text-emerald-900 font-medium">
              Impact: Compresses effective payback from {payback ? formatMonths(payback) : "N/A"} to Day 1 on annual accounts, creating non-dilutive working capital float to fund acquisition.
            </div>
          </div>

          {/* Lever 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Repeat className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">2. Retention Compounding Moat</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Improving Day-7 user onboarding to trim monthly churn by 1.5% (from {formatPercent(churn)} to {formatPercent(simulatedReducedChurn)}).
            </p>
            <div className="rounded-lg bg-blue-50/80 p-2 text-[11px] text-blue-900 font-medium">
              Impact: LTV expands by{" "}
              {ltvDelta !== null && ltvDelta > 0
                ? `+${formatCurrency(ltvDelta, curr)} per customer`
                : "substantial margin"}{" "}
              without spending an extra dime on paid ad channels.
            </div>
          </div>

          {/* Lever 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <ArrowUpRight className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">3. Expansion &amp; Tiering Architecture</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Introduce usage-based add-ons or secondary seat tiers to target 3.0%+ monthly account expansion.
            </p>
            <div className="rounded-lg bg-purple-50/80 p-2 text-[11px] text-purple-900 font-medium">
              Impact: Creates net-negative churn dynamics where expansion revenue from retained accounts outpaces lost gross profit from churning cohorts.
            </div>
          </div>
        </div>
      </div>

      {/* Formula Documentation & Accounting Reference */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <BookOpen className="h-3.5 w-3.5 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Mathematical Invariants &amp; Accounting Definitions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span className="font-bold text-slate-900">Customer Acquisition Cost (CAC)</span>
            <p className="font-mono text-[11px] text-slate-700">
              CAC = (Monthly Marketing Spend + Fixed Acquisition Ops) ÷ New Customers
            </p>
            <p className="text-[10px] text-slate-400">
              Includes digital ad spend, agency fees, and sales tooling. Guaranteed division-by-zero protection.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 space-y-1">
            <span className="font-bold text-slate-900">CAC Payback Duration</span>
            <p className="font-mono text-[11px] text-slate-700">
              Payback = CAC ÷ (ARPU × Gross Margin %)
            </p>
            <p className="text-[10px] text-slate-400">
              Number of monthly billing cycles required to fully offset customer acquisition outlay through gross profit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
