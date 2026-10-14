"use client";

import React, { useMemo } from "react";
import { ModelEngineInputs } from "@/types/model";
import { simulateModelLocally } from "@/lib/engine";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Layers,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ScenariosViewProps {
  baseInputs: ModelEngineInputs;
  customScenarios?: Record<string, Record<string, any>>;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  baseInputs,
  customScenarios = {},
}) => {
  const curr = baseInputs.currency;

  // Compute Base Case
  const baseResult = useMemo(() => simulateModelLocally(baseInputs), [baseInputs]);

  // Compute Default Optimistic Case
  const optInputs = useMemo<ModelEngineInputs>(() => {
    return {
      ...baseInputs,
      lead_conversion_rate: Math.min(1.0, baseInputs.lead_conversion_rate * 1.25),
      customer_churn_rate: Math.max(0.005, baseInputs.customer_churn_rate * 0.8),
      arpu: baseInputs.arpu * 1.1,
      cost_per_lead: baseInputs.cost_per_lead * 0.85,
    };
  }, [baseInputs]);
  const optResult = useMemo(() => simulateModelLocally(optInputs), [optInputs]);

  // Compute Default Downside Case
  const downInputs = useMemo<ModelEngineInputs>(() => {
    return {
      ...baseInputs,
      lead_conversion_rate: Math.max(0.005, baseInputs.lead_conversion_rate * 0.75),
      customer_churn_rate: Math.min(0.5, baseInputs.customer_churn_rate * 1.3),
      arpu: baseInputs.arpu * 0.9,
      cost_per_lead: baseInputs.cost_per_lead * 1.25,
    };
  }, [baseInputs]);
  const downResult = useMemo(() => simulateModelLocally(downInputs), [downInputs]);

  // Trajectory Comparison Chart Data
  const chartData = useMemo(() => {
    return baseResult.projections.map((p, idx) => ({
      period: p.period,
      base_arr: p.arr_run_rate,
      opt_arr: optResult.projections[idx]?.arr_run_rate ?? 0,
      down_arr: downResult.projections[idx]?.arr_run_rate ?? 0,
      base_cash: p.ending_cash,
      opt_cash: optResult.projections[idx]?.ending_cash ?? 0,
      down_cash: downResult.projections[idx]?.ending_cash ?? 0,
    }));
  }, [baseResult, optResult, downResult]);

  const scenariosList = [
    {
      name: "Optimistic Case",
      type: "optimistic",
      result: optResult,
      badge: "+25% Conv / -20% Churn",
      color: "text-emerald-700",
    },
    {
      name: "Base Case",
      type: "base",
      result: baseResult,
      badge: "Current Model",
      color: "text-slate-900",
    },
    {
      name: "Downside Case",
      type: "downside",
      result: downResult,
      badge: "-25% Conv / +30% Churn",
      color: "text-rose-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Multi-Scenario Planning & Comparison</h2>
        <p className="text-xs text-slate-500">
          Compare Base, Optimistic, and Downside cases. Every scenario runs through the exact same deterministic financial engine.
        </p>
      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Financial Comparison Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Metric</th>
                <th className="py-3 px-3 text-right">
                  <div className="text-slate-900 font-bold">Base Case</div>
                  <div className="text-[10px] text-slate-500 font-normal">Current Baseline</div>
                </th>
                <th className="py-3 px-3 text-right">
                  <div className="text-emerald-700 font-bold">Optimistic Case</div>
                  <div className="text-[10px] text-emerald-600 font-normal">+Growth / Margin</div>
                </th>
                <th className="py-3 px-3 text-right">
                  <div className="text-rose-700 font-bold">Downside Case</div>
                  <div className="text-[10px] text-rose-600 font-normal">Headwinds / Churn</div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Month 12 ARR Run Rate</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                  {formatCurrency(baseResult.summary.final_month_arr, curr, true)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                  {formatCurrency(optResult.summary.final_month_arr, curr, true)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                  {formatCurrency(downResult.summary.final_month_arr, curr, true)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Month 12 MRR</td>
                <td className="py-2.5 px-3 text-right text-slate-800">
                  {formatCurrency(baseResult.summary.final_month_mrr, curr, true)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700">
                  {formatCurrency(optResult.summary.final_month_mrr, curr, true)}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700">
                  {formatCurrency(downResult.summary.final_month_mrr, curr, true)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Closing Customers</td>
                <td className="py-2.5 px-3 text-right text-slate-800">
                  {formatNumber(baseResult.summary.final_month_customers)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700">
                  {formatNumber(optResult.summary.final_month_customers)}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700">
                  {formatNumber(downResult.summary.final_month_customers)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Ending Cash Balance</td>
                <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">
                  {formatCurrency(baseResult.summary.ending_cash, curr, true)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                  {formatCurrency(optResult.summary.ending_cash, curr, true)}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700 font-semibold">
                  {formatCurrency(downResult.summary.ending_cash, curr, true)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Cash Runway Status</td>
                <td className="py-2.5 px-3 text-right text-slate-700">
                  {baseResult.summary.runway_status}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700">
                  {optResult.summary.runway_status}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                  {downResult.summary.runway_status}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Blended CAC</td>
                <td className="py-2.5 px-3 text-right text-slate-800">
                  {formatCurrency(baseResult.summary.blended_cac_final, curr)}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700">
                  {formatCurrency(optResult.summary.blended_cac_final, curr)}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700">
                  {formatCurrency(downResult.summary.blended_cac_final, curr)}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">LTV : CAC Ratio</td>
                <td className="py-2.5 px-3 text-right text-slate-800">
                  {baseResult.summary.ltv_to_cac_ratio_final
                    ? `${baseResult.summary.ltv_to_cac_ratio_final.toFixed(1)}x`
                    : "N/A"}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700 font-semibold">
                  {optResult.summary.ltv_to_cac_ratio_final
                    ? `${optResult.summary.ltv_to_cac_ratio_final.toFixed(1)}x`
                    : "N/A"}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700 font-medium">
                  {downResult.summary.ltv_to_cac_ratio_final
                    ? `${downResult.summary.ltv_to_cac_ratio_final.toFixed(1)}x`
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium text-slate-800">Operating Break-Even</td>
                <td className="py-2.5 px-3 text-right text-slate-800">
                  {baseResult.summary.break_even_month
                    ? `Month ${baseResult.summary.break_even_month}`
                    : "Beyond Horizon"}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-700">
                  {optResult.summary.break_even_month
                    ? `Month ${optResult.summary.break_even_month}`
                    : "Beyond Horizon"}
                </td>
                <td className="py-2.5 px-3 text-right text-rose-700">
                  {downResult.summary.break_even_month
                    ? `Month ${downResult.summary.break_even_month}`
                    : "Beyond Horizon"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Scenario ARR Trajectory Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            ARR Trajectory Comparison
          </h3>
          <span className="text-xs text-slate-400">Monthly Run Rate</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(val) => formatCurrency(val, curr, true)}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val), curr, false), ""]}
                labelStyle={{ fontWeight: "bold", color: "#0f172a" }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="opt_arr"
                name="Optimistic Case"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="base_arr"
                name="Base Case"
                stroke="#0f172a"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="down_arr"
                name="Downside Case"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
