"use client";

import React, { useState, useMemo } from "react";
import { ModelEngineInputs } from "@/types/model";
import { simulateModelLocally } from "@/lib/engine";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";
import { MetricCard } from "@/components/MetricCard";
import {
  Compass,
  RotateCcw,
  TrendingUp,
  ArrowRight,
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

interface GrowthSimulatorViewProps {
  baseInputs: ModelEngineInputs;
  onApplySimulatedToModel: (newInputs: ModelEngineInputs) => void;
}

export const GrowthSimulatorView: React.FC<GrowthSimulatorViewProps> = ({
  baseInputs,
  onApplySimulatedToModel,
}) => {
  const curr = baseInputs.currency;

  // Simulator Sliders
  const [arpu, setArpu] = useState<number>(baseInputs.arpu);
  const [churnRate, setChurnRate] = useState<number>(baseInputs.customer_churn_rate);
  const [convRate, setConvRate] = useState<number>(baseInputs.lead_conversion_rate);
  const [monthlyLeads, setMonthlyLeads] = useState<number>(baseInputs.monthly_leads);
  const [costPerLead, setCostPerLead] = useState<number>(baseInputs.cost_per_lead);

  // Compute live simulated result instantly
  const simInputs: ModelEngineInputs = useMemo(() => {
    return {
      ...baseInputs,
      arpu,
      customer_churn_rate: churnRate,
      lead_conversion_rate: convRate,
      monthly_leads: monthlyLeads,
      cost_per_lead: costPerLead,
    };
  }, [baseInputs, arpu, churnRate, convRate, monthlyLeads, costPerLead]);

  const baseResult = useMemo(() => simulateModelLocally(baseInputs), [baseInputs]);
  const simResult = useMemo(() => simulateModelLocally(simInputs), [simInputs]);

  // Combined chart data comparing Base vs Simulated Trajectories
  const chartData = useMemo(() => {
    return simResult.projections.map((p, idx) => {
      const baseP = baseResult.projections[idx];
      return {
        period: p.period,
        sim_arr: p.arr_run_rate,
        base_arr: baseP ? baseP.arr_run_rate : 0,
        sim_cash: p.ending_cash,
        base_cash: baseP ? baseP.ending_cash : 0,
        sim_customers: p.closing_customers,
        base_customers: baseP ? baseP.closing_customers : 0,
      };
    });
  }, [simResult, baseResult]);

  const handleResetSliders = () => {
    setArpu(baseInputs.arpu);
    setChurnRate(baseInputs.customer_churn_rate);
    setConvRate(baseInputs.lead_conversion_rate);
    setMonthlyLeads(baseInputs.monthly_leads);
    setCostPerLead(baseInputs.cost_per_lead);
  };

  const arrDelta = simResult.summary.final_month_arr - baseResult.summary.final_month_arr;
  const cashDelta = simResult.summary.ending_cash - baseResult.summary.ending_cash;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Interactive Growth Simulator</h2>
          <p className="text-xs text-slate-500">
            Real-time sensitivity workbench. Tweak levers to observe direct trajectory shifts before updating your model.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetSliders}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Sliders</span>
          </button>
          <button
            onClick={() => onApplySimulatedToModel(simInputs)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <span>Commit Changes to Model</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Delta KPI Comparison */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Simulated Month 12 ARR"
          value={formatCurrency(simResult.summary.final_month_arr, curr, true)}
          subtitle={`Variance: ${arrDelta >= 0 ? "+" : ""}${formatCurrency(arrDelta, curr, true)}`}
          statusBadge={arrDelta >= 0 ? "+Growth" : "-Decline"}
          statusType={arrDelta >= 0 ? "good" : "danger"}
        />
        <MetricCard
          title="Simulated Ending Cash"
          value={formatCurrency(simResult.summary.ending_cash, curr, true)}
          subtitle={`Variance: ${cashDelta >= 0 ? "+" : ""}${formatCurrency(cashDelta, curr, true)}`}
          statusBadge={simResult.summary.ending_cash >= baseInputs.minimum_cash_reserve ? "Solvent" : "Breached"}
          statusType={simResult.summary.ending_cash >= baseInputs.minimum_cash_reserve ? "good" : "danger"}
        />
        <MetricCard
          title="Simulated CAC"
          value={formatCurrency(simResult.summary.blended_cac_final, curr)}
          subtitle={`Payback: ${formatMonths(simResult.summary.cac_payback_final)}`}
          statusBadge="Unit Efficiency"
          statusType="neutral"
        />
        <MetricCard
          title="Simulated LTV : CAC"
          value={
            simResult.summary.ltv_to_cac_ratio_final
              ? `${simResult.summary.ltv_to_cac_ratio_final.toFixed(1)}x`
              : "N/A"
          }
          subtitle={`Base: ${baseResult.summary.ltv_to_cac_ratio_final?.toFixed(1) ?? "N/A"}x`}
          statusBadge={
            simResult.summary.ltv_to_cac_ratio_final && simResult.summary.ltv_to_cac_ratio_final >= 3
              ? "Healthy"
              : "Sub-optimal"
          }
          statusType={
            simResult.summary.ltv_to_cac_ratio_final && simResult.summary.ltv_to_cac_ratio_final >= 3
              ? "good"
              : "warning"
          }
        />
      </div>

      {/* Interactive Controls & Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Control Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Growth & Economics Levers
          </h3>

          <div className="space-y-4">
            {/* ARPU */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Monthly Price (ARPU)</span>
                <span className="font-bold text-slate-900">{formatCurrency(arpu, curr)}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={15000}
                step={250}
                value={arpu}
                onChange={(e) => setArpu(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{formatCurrency(1000, curr)}</span>
                <span>Base: {formatCurrency(baseInputs.arpu, curr)}</span>
                <span>{formatCurrency(15000, curr)}</span>
              </div>
            </div>

            {/* Churn Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Monthly Churn Rate</span>
                <span className="font-bold text-slate-900">{formatPercent(churnRate)}</span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.15}
                step={0.005}
                value={churnRate}
                onChange={(e) => setChurnRate(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5%</span>
                <span>Base: {formatPercent(baseInputs.customer_churn_rate)}</span>
                <span>15.0%</span>
              </div>
            </div>

            {/* Lead Conversion */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Lead Conversion Rate</span>
                <span className="font-bold text-slate-900">{formatPercent(convRate)}</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.12}
                step={0.005}
                value={convRate}
                onChange={(e) => setConvRate(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1.0%</span>
                <span>Base: {formatPercent(baseInputs.lead_conversion_rate)}</span>
                <span>12.0%</span>
              </div>
            </div>

            {/* Monthly Leads */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Monthly Lead Volume</span>
                <span className="font-bold text-slate-900">{formatNumber(monthlyLeads)}</span>
              </div>
              <input
                type="range"
                min={200}
                max={5000}
                step={100}
                value={monthlyLeads}
                onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>200</span>
                <span>Base: {formatNumber(baseInputs.monthly_leads)}</span>
                <span>5,000</span>
              </div>
            </div>

            {/* Cost Per Lead */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Cost Per Lead</span>
                <span className="font-bold text-slate-900">{formatCurrency(costPerLead, curr)}</span>
              </div>
              <input
                type="range"
                min={50}
                max={600}
                step={25}
                value={costPerLead}
                onChange={(e) => setCostPerLead(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{formatCurrency(50, curr)}</span>
                <span>Base: {formatCurrency(baseInputs.cost_per_lead, curr)}</span>
                <span>{formatCurrency(600, curr)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trajectory Comparison Chart */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">
              ARR Trajectory: Simulated vs. Baseline
            </h3>
            <span className="text-xs text-slate-400">Real-Time Recalculation</span>
          </div>

          <div className="h-80 w-full">
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
                  dataKey="sim_arr"
                  name="Simulated ARR Run Rate"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="base_arr"
                  name="Base Model ARR Run Rate"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
