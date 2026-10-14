"use client";

import React, { useState } from "react";
import { EngineSimulationResult, ModelEngineInputs } from "@/types/model";
import { MetricCard } from "@/components/MetricCard";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";
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
          value={formatCurrency(summary.final_month_arr, curr, true)}
          subtitle={`MRR: ${formatCurrency(summary.final_month_mrr, curr, true)}`}
          statusBadge="Run Rate"
          statusType="good"
          hint="Annualized monthly run rate"
        />
        <MetricCard
          title="Closing Customers"
          value={formatNumber(summary.final_month_customers)}
          subtitle={`From ${inputs.initial_paying_customers} opening`}
          statusBadge="Paying Base"
          statusType="neutral"
        />
        <MetricCard
          title="Ending Cash Balance"
          value={formatCurrency(summary.ending_cash, curr, true)}
          subtitle={`Peak deficit: ${formatCurrency(summary.peak_cash_deficit, curr, true)}`}
          statusBadge={summary.ending_cash >= inputs.minimum_cash_reserve ? "Solvent" : "At Risk"}
          statusType={summary.ending_cash >= inputs.minimum_cash_reserve ? "good" : "danger"}
        />
        <MetricCard
          title="Cash Runway"
          value={summary.runway_months ? `${summary.runway_months} Months` : `> ${inputs.planning_horizon} Months`}
          subtitle={summary.runway_status}
          statusBadge={summary.runway_months ? "Breached" : "Healthy"}
          statusType={summary.runway_months ? "warning" : "good"}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Gross Margin"
          value={formatPercent(summary.average_gross_margin_pct)}
          subtitle="After COGS & direct delivery"
          statusBadge={summary.average_gross_margin_pct >= 0.7 ? "Healthy" : "Low"}
          statusType={summary.average_gross_margin_pct >= 0.7 ? "good" : "warning"}
        />
        <MetricCard
          title="Contribution Margin"
          value={formatPercent(summary.average_contribution_margin_pct)}
          subtitle="Variable unit economics"
          statusBadge={summary.average_contribution_margin_pct > 0 ? "Positive" : "Negative"}
          statusType={summary.average_contribution_margin_pct > 0 ? "good" : "danger"}
        />
        <MetricCard
          title="Blended CAC"
          value={formatCurrency(summary.blended_cac_final, curr, false)}
          subtitle={`Payback: ${formatMonths(summary.cac_payback_final)}`}
          statusBadge="Acquisition"
          statusType="neutral"
        />
        <MetricCard
          title="LTV : CAC Ratio"
          value={summary.ltv_to_cac_ratio_final ? `${summary.ltv_to_cac_ratio_final.toFixed(1)}x` : "N/A"}
          subtitle={`LTV: ${formatCurrency(summary.simplified_ltv_final, curr, true)}`}
          statusBadge={summary.ltv_to_cac_ratio_final && summary.ltv_to_cac_ratio_final >= 3 ? "Excellent" : "Review"}
          statusType={summary.ltv_to_cac_ratio_final && summary.ltv_to_cac_ratio_final >= 3 ? "good" : "warning"}
        />
      </div>

      {/* Visual Charts Grid */}
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

      {/* Monthly Projections Audit Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
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
    </div>
  );
};

