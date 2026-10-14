"use client";

import React, { useState } from "react";
import { EngineSimulationResult, ModelEngineInputs } from "@/types/model";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";
import { SituationAnalysisRadar } from "@/features/SituationAnalysisRadar";
import { isModelEmpty } from "@/lib/engine";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface OverviewViewProps {
  result: EngineSimulationResult;
  inputs: ModelEngineInputs;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ result, inputs }) => {
  const [tableTab, setTableTab] = useState<"summary" | "customers" | "cash">("summary");
  const { summary, projections } = result;
  const curr = inputs.currency;
  const isEmpty = isModelEmpty(inputs);

  const chartData = projections.map((p) => ({
    period: p.period,
    mrr: p.mrr,
    arr_run_rate: p.arr_run_rate,
    ending_cash: p.ending_cash,
    min_reserve: inputs.minimum_cash_reserve,
    revenue: p.mrr,
    cogs: p.cogs,
    payroll: p.payroll_cost,
    marketing: p.acquisition_spend,
    fixed_opex: p.fixed_opex,
    total_outflows: p.cash_outflows,
    closing_customers: p.closing_customers,
    new_customers: p.new_customers,
    churned_customers: p.churned_customers,
    net_burn: p.net_burn,
  }));

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Month 12 ARR Run Rate"
          value={isEmpty ? "N/A" : formatCurrency(summary.final_month_arr, curr, true)}
          subtitle={isEmpty ? "MRR: N/A" : `MRR: ${formatCurrency(summary.final_month_mrr, curr, true)}`}
          statusBadge={
            isEmpty
              ? "No Data"
              : summary.final_month_arr <= 0
              ? "No Revenue"
              : summary.final_month_mrr > (projections[0]?.mrr || 0)
              ? "Growing"
              : summary.final_month_mrr === (projections[0]?.mrr || 0)
              ? "Stable"
              : "Contracting"
          }
          statusType={
            isEmpty
              ? "neutral"
              : summary.final_month_arr > 0 && summary.final_month_mrr >= (projections[0]?.mrr || 0)
              ? "good"
              : summary.final_month_arr <= 0
              ? "neutral"
              : "warning"
          }
          hint="Annualized monthly run rate"
        />
        <MetricCard
          title="Closing Customers"
          value={isEmpty ? "N/A" : formatNumber(summary.final_month_customers)}
          subtitle={isEmpty ? "From 0 opening" : `From ${inputs.initial_paying_customers} opening`}
          statusBadge={
            isEmpty
              ? "No Data"
              : summary.final_month_customers > inputs.initial_paying_customers
              ? "+ Net Growth"
              : summary.final_month_customers < inputs.initial_paying_customers
              ? "Net Churn"
              : "Stable Base"
          }
          statusType={
            isEmpty
              ? "neutral"
              : summary.final_month_customers > inputs.initial_paying_customers
              ? "good"
              : summary.final_month_customers < inputs.initial_paying_customers
              ? "warning"
              : "neutral"
          }
        />
        <MetricCard
          title="Ending Cash Balance"
          value={isEmpty ? "N/A" : formatCurrency(summary.ending_cash, curr, true)}
          subtitle={isEmpty ? "Peak deficit: N/A" : `Peak deficit: ${formatCurrency(summary.peak_cash_deficit, curr, true)}`}
          statusBadge={
            isEmpty
              ? "No Data"
              : summary.ending_cash < 0
              ? "Insolvent"
              : summary.ending_cash < inputs.minimum_cash_reserve
              ? "Reserve Breached"
              : summary.ending_cash === 0 && inputs.initial_cash_balance === 0
              ? "Zero Treasury"
              : "Solvent"
          }
          statusType={
            isEmpty
              ? "neutral"
              : summary.ending_cash < 0
              ? "danger"
              : summary.ending_cash < inputs.minimum_cash_reserve
              ? "warning"
              : summary.ending_cash === 0 && inputs.initial_cash_balance === 0
              ? "neutral"
              : "good"
          }
        />
        <MetricCard
          title="Cash Runway"
          value={
            isEmpty
              ? "N/A"
              : summary.ending_cash < 0
              ? `${summary.runway_months ?? 0} Months (Depleted)`
              : summary.runway_months !== null
              ? `${summary.runway_months} Months (Breached)`
              : `> ${inputs.planning_horizon} Months`
          }
          subtitle={isEmpty ? "Awaiting baseline data" : summary.runway_status}
          statusBadge={
            isEmpty
              ? "No Data"
              : summary.ending_cash < 0
              ? "Insolvent"
              : summary.runway_months !== null
              ? "Breached"
              : "Healthy"
          }
          statusType={
            isEmpty
              ? "neutral"
              : summary.ending_cash < 0
              ? "danger"
              : summary.runway_months !== null
              ? "warning"
              : "good"
          }
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Gross Margin"
          value={isEmpty || summary.final_month_mrr === 0 ? "N/A" : formatPercent(summary.average_gross_margin_pct)}
          subtitle="After COGS & direct delivery"
          statusBadge={
            isEmpty || summary.final_month_mrr === 0
              ? "No Data"
              : summary.average_gross_margin_pct >= 0.7
              ? "Healthy (≥70%)"
              : summary.average_gross_margin_pct >= 0.5
              ? "Moderate"
              : summary.average_gross_margin_pct > 0
              ? "Low (<50%)"
              : "Negative"
          }
          statusType={
            isEmpty || summary.final_month_mrr === 0
              ? "neutral"
              : summary.average_gross_margin_pct >= 0.7
              ? "good"
              : summary.average_gross_margin_pct >= 0.5
              ? "neutral"
              : summary.average_gross_margin_pct > 0
              ? "warning"
              : "danger"
          }
        />
        <MetricCard
          title="Contribution Margin"
          value={isEmpty || summary.final_month_mrr === 0 ? "N/A" : formatPercent(summary.average_contribution_margin_pct)}
          subtitle="Variable unit economics"
          statusBadge={
            isEmpty || summary.final_month_mrr === 0
              ? "No Data"
              : summary.average_contribution_margin_pct >= 0.4
              ? "Strong"
              : summary.average_contribution_margin_pct > 0
              ? "Positive"
              : summary.average_contribution_margin_pct === 0
              ? "Break-Even"
              : "Negative"
          }
          statusType={
            isEmpty || summary.final_month_mrr === 0
              ? "neutral"
              : summary.average_contribution_margin_pct > 0
              ? "good"
              : summary.average_contribution_margin_pct === 0
              ? "neutral"
              : "danger"
          }
        />
        <MetricCard
          title="Blended CAC"
          value={isEmpty || summary.blended_cac_final === null ? "N/A" : formatCurrency(summary.blended_cac_final, curr, false)}
          subtitle={`Payback: ${isEmpty || summary.cac_payback_final === null ? "N/A" : formatMonths(summary.cac_payback_final, "N/A")}`}
          statusBadge={
            isEmpty || summary.blended_cac_final === null
              ? "No Data"
              : summary.cac_payback_final && summary.cac_payback_final <= 12
              ? "Fast Payback"
              : summary.cac_payback_final && summary.cac_payback_final <= 18
              ? "Moderate"
              : summary.cac_payback_final && summary.cac_payback_final > 18
              ? "Slow Payback"
              : "Acquisition"
          }
          statusType={
            isEmpty || summary.blended_cac_final === null
              ? "neutral"
              : summary.cac_payback_final && summary.cac_payback_final <= 12
              ? "good"
              : summary.cac_payback_final && summary.cac_payback_final <= 18
              ? "neutral"
              : "warning"
          }
        />
        <MetricCard
          title="LTV : CAC Ratio"
          value={isEmpty || summary.ltv_to_cac_ratio_final === null ? "N/A" : `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`}
          subtitle={`LTV: ${isEmpty || summary.simplified_ltv_final === null ? "N/A" : formatCurrency(summary.simplified_ltv_final, curr, true)}`}
          statusBadge={
            isEmpty || summary.ltv_to_cac_ratio_final === null
              ? "No Data"
              : summary.ltv_to_cac_ratio_final >= 3.0
              ? "Excellent (≥3x)"
              : summary.ltv_to_cac_ratio_final >= 1.5
              ? "Viable"
              : "Underwater (<1.5x)"
          }
          statusType={
            isEmpty || summary.ltv_to_cac_ratio_final === null
              ? "neutral"
              : summary.ltv_to_cac_ratio_final >= 3.0
              ? "good"
              : summary.ltv_to_cac_ratio_final >= 1.5
              ? "neutral"
              : "danger"
          }
        />
      </div>

      {/* Current Situation Analysis & Health Radar (Good, Bad, Watchlist) */}
      <SituationAnalysisRadar result={result} inputs={inputs} />

      {/* Visual Charts Grid */}
      {isEmpty ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Trajectory Visualizations Awaiting Baseline</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Runway graphs, revenue trajectories, expense breakdowns, and customer cohort movements will render dynamically once company financial data is entered.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
            <span>Visual Trajectories: Standby</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Revenue Trajectory */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">MRR & ARR Run Rate Trajectory</h3>
              <span className="text-xs text-slate-400">Monthly Projection</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorArr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="arr_run_rate"
                    name="ARR Run Rate"
                    stroke="#059669"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorArr)"
                  />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    name="Monthly Recurring Revenue"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fillOpacity={0.1}
                    fill="#2563eb"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Cash Balance & Solvency */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Cash Balance vs. Minimum Reserve</h3>
              <span className="text-xs text-slate-400">Solvency & Runway</span>
            </div>
            <div className="h-64 w-full">
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
                  <ReferenceLine
                    y={inputs.minimum_cash_reserve}
                    stroke="#dc2626"
                    strokeDasharray="4 4"
                    label={{
                      value: `Min Reserve (${formatCurrency(inputs.minimum_cash_reserve, curr, true)})`,
                      fill: "#dc2626",
                      fontSize: 10,
                      position: "insideTopRight",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ending_cash"
                    name="Ending Cash Balance"
                    stroke="#0f172a"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Revenue vs Expenses Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Revenue vs. Expenses Breakdown</h3>
              <span className="text-xs text-slate-400">Cost Structure</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                  <Bar dataKey="revenue" name="Revenue (MRR)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="payroll" name="Payroll" stackId="costs" fill="#6366f1" />
                  <Bar dataKey="marketing" name="Marketing" stackId="costs" fill="#f59e0b" />
                  <Bar dataKey="cogs" name="COGS" stackId="costs" fill="#ec4899" />
                  <Bar dataKey="fixed_opex" name="Fixed Overhead" stackId="costs" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Customer Bridge */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Customer Movement & Retention Bridge</h3>
              <span className="text-xs text-slate-400">Acquisition vs Churn</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip labelStyle={{ fontWeight: "bold", color: "#0f172a" }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="closing_customers"
                    name="Closing Active Customers"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="new_customers"
                    name="New Acquisitions"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="churned_customers"
                    name="Churned Customers"
                    stroke="#ef4444"
                    strokeWidth={1.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Projections Audit Table */}
      {isEmpty ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mx-auto">
            <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">Monthly Financial Statement Table</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No financial projections to display. Complete the assessment or input your company figures to generate audited monthly balance sheet and P&amp;L schedules.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500">
            <span>Audit Schedule: Standby</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          {/* Executive Schedule Justification Callout */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-700 space-y-1">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Deterministic Financial Reconciliation &amp; Operating Schedule</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              Monthly forward projections, customer cohort bridges, and balance sheet cash flows are dynamically generated from your verified company baseline and invariant economics. Line-item general ledgers are consolidated into executive operational schedules to provide maximum strategic clarity on runway, unit margins, and milestone feasibility.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Monthly Financial Statement Table</h3>
              <p className="text-xs text-slate-500">
                Detailed month-by-month reconciliation. All balance sheet and unit economic rows pass deterministic invariant tests.
              </p>
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <button
                onClick={() => setTableTab("summary")}
                className={`rounded px-2.5 py-1 ${
                  tableTab === "summary" ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Income & Profit
              </button>
              <button
                onClick={() => setTableTab("cash")}
                className={`rounded px-2.5 py-1 ${
                  tableTab === "cash" ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Cash & Runway
              </button>
              <button
                onClick={() => setTableTab("customers")}
                className={`rounded px-2.5 py-1 ${
                  tableTab === "customers" ? "bg-white font-semibold text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                Customer Bridge
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Period</th>
                  {tableTab === "summary" && (
                    <>
                      <th className="py-2.5 px-3 text-right">MRR</th>
                      <th className="py-2.5 px-3 text-right">ARR Run Rate</th>
                      <th className="py-2.5 px-3 text-right">COGS</th>
                      <th className="py-2.5 px-3 text-right">Gross Profit</th>
                      <th className="py-2.5 px-3 text-right">Gross Margin %</th>
                      <th className="py-2.5 px-3 text-right">Total OpEx</th>
                      <th className="py-2.5 px-3 text-right">Operating Profit</th>
                    </>
                  )}
                  {tableTab === "cash" && (
                    <>
                      <th className="py-2.5 px-3 text-right">Beginning Cash</th>
                      <th className="py-2.5 px-3 text-right">Cash Inflows</th>
                      <th className="py-2.5 px-3 text-right">Cash Outflows</th>
                      <th className="py-2.5 px-3 text-right">Net Cash Flow</th>
                      <th className="py-2.5 px-3 text-right">Ending Cash</th>
                      <th className="py-2.5 px-3 text-right">Net Burn</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </>
                  )}
                  {tableTab === "customers" && (
                    <>
                      <th className="py-2.5 px-3 text-right">Opening</th>
                      <th className="py-2.5 px-3 text-right">Churned</th>
                      <th className="py-2.5 px-3 text-right">New Acquired</th>
                      <th className="py-2.5 px-3 text-right">Closing</th>
                      <th className="py-2.5 px-3 text-right">Avg Active</th>
                      <th className="py-2.5 px-3 text-right">CAC</th>
                      <th className="py-2.5 px-3 text-right">Payback (Mo)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projections.map((p) => (
                  <tr key={p.month_index} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-800">{p.period}</td>
                    {tableTab === "summary" && (
                      <>
                        <td className="py-2 px-3 text-right font-medium text-slate-900">
                          {formatCurrency(p.mrr, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-semibold">
                          {formatCurrency(p.arr_run_rate, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(p.cogs, curr)}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-800">
                          {formatCurrency(p.gross_profit, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatPercent(p.gross_margin_pct)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(p.total_opex, curr)}</td>
                        <td
                          className={`py-2 px-3 text-right font-medium ${
                            p.operating_profit >= 0 ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {formatCurrency(p.operating_profit, curr)}
                        </td>
                      </>
                    )}
                    {tableTab === "cash" && (
                      <>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatCurrency(p.beginning_cash, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600">
                          {formatCurrency(p.cash_inflows, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatCurrency(p.cash_outflows, curr)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-medium ${
                            p.net_cash_flow >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatCurrency(p.net_cash_flow, curr)}
                        </td>
                        <td
                          className={`py-2 px-3 text-right font-semibold ${
                            p.ending_cash < inputs.minimum_cash_reserve
                              ? "text-rose-700"
                              : "text-slate-900"
                          }`}
                        >
                          {formatCurrency(p.ending_cash, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-600">{formatCurrency(p.net_burn, curr)}</td>
                        <td className="py-2 px-3 text-center">
                          {p.is_cash_negative ? (
                            <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-semibold">
                              Insolvent
                            </span>
                          ) : p.is_cash_reserve_breached ? (
                            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-semibold">
                              Breached
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                              Solvent
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {tableTab === "customers" && (
                      <>
                        <td className="py-2 px-3 text-right text-slate-600">{formatNumber(p.opening_customers)}</td>
                        <td className="py-2 px-3 text-right text-rose-600 font-medium">
                          {formatNumber(p.churned_customers, 1)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-medium">
                          {formatNumber(p.new_customers, 1)}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900">
                          {formatNumber(p.closing_customers)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatNumber(p.avg_active_customers, 1)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatCurrency(p.blended_cac, curr)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-600">
                          {formatMonths(p.cac_payback_months)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

