"use client";

import React from "react";
import { EngineSimulationResult, ModelEngineInputs } from "@/types/model";
import { formatCurrency, formatPercent, formatMonths } from "@/lib/formatters";
import { MetricCard } from "@/components/MetricCard";
import { isModelEmpty } from "@/lib/engine";
import {
  Calculator,
  ShieldCheck,
  Zap,
  BookOpen,
} from "lucide-react";

interface UnitEconomicsViewProps {
  result: EngineSimulationResult;
  inputs: ModelEngineInputs;
}

export const UnitEconomicsView: React.FC<UnitEconomicsViewProps> = ({
  result,
  inputs,
}) => {
  const { summary } = result;
  const curr = inputs.currency;
  const isEmpty = isModelEmpty(inputs);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Unit Economics & Customer Efficiency</h2>
        <p className="text-xs text-slate-500">
          Rigorous analysis of unit viability. Ratios are calculated deterministically with full division-by-zero protection.
        </p>
      </div>

      {/* Primary Efficiency Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Customer Acquisition Cost"
          value={isEmpty || summary.blended_cac_final === null ? "N/A" : formatCurrency(summary.blended_cac_final, curr)}
          subtitle="Acquisition Spend ÷ New Customers"
          statusBadge={isEmpty || summary.blended_cac_final === null ? "No Data" : "Blended CAC"}
          statusType="neutral"
        />
        <MetricCard
          title="CAC Payback Period"
          value={isEmpty || summary.cac_payback_final === null ? "N/A" : formatMonths(summary.cac_payback_final)}
          subtitle="Months to recover acquisition cost"
          statusBadge={
            isEmpty || summary.cac_payback_final === null
              ? "No Data"
              : summary.cac_payback_final <= 12
              ? "Fast (< 12m)"
              : "Slow"
          }
          statusType={
            isEmpty || summary.cac_payback_final === null
              ? "neutral"
              : summary.cac_payback_final <= 12
              ? "good"
              : "warning"
          }
        />
        <MetricCard
          title="Simplified LTV"
          value={isEmpty || summary.simplified_ltv_final === null ? "N/A" : formatCurrency(summary.simplified_ltv_final, curr, true)}
          subtitle="(ARPU × Gross Margin) ÷ Churn"
          statusBadge={isEmpty || summary.simplified_ltv_final === null ? "No Data" : "Customer Value"}
          statusType={isEmpty || summary.simplified_ltv_final === null ? "neutral" : "good"}
        />
        <MetricCard
          title="LTV : CAC Ratio"
          value={
            isEmpty || summary.ltv_to_cac_ratio_final === null
              ? "N/A"
              : `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`
          }
          subtitle="Benchmark: > 3.0x is sustainable"
          statusBadge={
            isEmpty || summary.ltv_to_cac_ratio_final === null
              ? "No Data"
              : summary.ltv_to_cac_ratio_final >= 3.0
              ? "Healthy"
              : "At Risk"
          }
          statusType={
            isEmpty || summary.ltv_to_cac_ratio_final === null
              ? "neutral"
              : summary.ltv_to_cac_ratio_final >= 3.0
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
              ? "Break-Even"
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

      {/* Formula Documentation & Methodology Reference */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="h-4 w-4 text-slate-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Mathematical Definitions & Accounting Conventions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 leading-relaxed">
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
              <span className="font-bold text-slate-900">Customer Acquisition Cost (CAC)</span>
              <p className="font-mono text-[11px] text-slate-700">
                CAC = Total Acquisition Spend ÷ New Customers Acquired
              </p>
              <p className="text-[11px] text-slate-500">
                Includes marketing budget/lead generation costs plus fixed marketing operations. If new customers acquired is 0, CAC is explicitly flagged as undefined (None).
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
              <span className="font-bold text-slate-900">CAC Payback Period</span>
              <p className="font-mono text-[11px] text-slate-700">
                Payback = CAC ÷ (ARPU × Gross Margin %)
              </p>
              <p className="text-[11px] text-slate-500">
                Calculates the exact months required for the gross profit generated by a customer to recover their acquisition expense.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
              <span className="font-bold text-slate-900">Simplified Lifetime Value (LTV)</span>
              <p className="font-mono text-[11px] text-slate-700">
                LTV = (ARPU × Gross Margin %) ÷ Monthly Customer Churn Rate
              </p>
              <p className="text-[11px] text-slate-500">
                Assumes constant geometric retention and constant gross margin. When churn is 0%, LTV is flagged as horizon-capped to avoid false infinity representation.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
              <span className="font-bold text-slate-900">Contribution Margin Percentage</span>
              <p className="font-mono text-[11px] text-slate-700">
                CM % = (MRR - Direct Variable Costs) ÷ MRR
              </p>
              <p className="text-[11px] text-slate-500">
                Direct variable costs include payment gateway processing fees and per-account servicing costs. Fixed hosting and non-headcount overhead are excluded.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

