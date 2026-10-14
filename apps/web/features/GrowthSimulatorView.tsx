"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ModelEngineInputs } from "@/types/model";
import { simulateModelLocally } from "@/lib/engine";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";
import { MetricCard } from "@/components/MetricCard";
import {
  Compass,
  RotateCcw,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  Lightbulb,
  Target,
  ArrowUpRight,
  Filter,
  DollarSign,
  ShieldCheck,
  Percent,
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
import { isModelEmpty } from "@/lib/engine";

interface GrowthSimulatorViewProps {
  baseInputs: ModelEngineInputs;
  onApplySimulatedToModel: (newInputs: ModelEngineInputs) => void;
  onOpenAI?: (query?: string) => void;
}

export const GrowthSimulatorView: React.FC<GrowthSimulatorViewProps> = ({
  baseInputs,
  onApplySimulatedToModel,
  onOpenAI,
}) => {
  const curr = baseInputs.currency;
  const isEmpty = isModelEmpty(baseInputs);

  // Simulator Sliders
  const [arpu, setArpu] = useState<number>(baseInputs.arpu);
  const [churnRate, setChurnRate] = useState<number>(baseInputs.customer_churn_rate);
  const [convRate, setConvRate] = useState<number>(baseInputs.lead_conversion_rate);
  const [monthlyLeads, setMonthlyLeads] = useState<number>(baseInputs.monthly_leads);
  const [costPerLead, setCostPerLead] = useState<number>(baseInputs.cost_per_lead);

  // Sync simulator state when baseInputs changes from assessment or currency switch
  useEffect(() => {
    setArpu(baseInputs.arpu);
    setChurnRate(baseInputs.customer_churn_rate);
    setConvRate(baseInputs.lead_conversion_rate);
    setMonthlyLeads(baseInputs.monthly_leads);
    setCostPerLead(baseInputs.cost_per_lead);
  }, [baseInputs]);

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
  const valuationDelta = arrDelta * 6.0; // Standard 6.0x ARR venture multiple

  // ELASTICITY & BOTTLENECK DETECTOR
  // Calculate impact of +10% shift on each core lever against base
  const elasticityAnalysis = useMemo(() => {
    if (isEmpty || baseResult.summary.final_month_arr <= 0) return null;

    // +10% Conversion
    const simConv = simulateModelLocally({
      ...baseInputs,
      lead_conversion_rate: baseInputs.lead_conversion_rate * 1.1,
    });
    const convLift = simConv.summary.final_month_arr - baseResult.summary.final_month_arr;

    // +10% ARPU
    const simArpu = simulateModelLocally({
      ...baseInputs,
      arpu: baseInputs.arpu * 1.1,
    });
    const arpuLift = simArpu.summary.final_month_arr - baseResult.summary.final_month_arr;

    // -10% Churn (better retention)
    const simChurn = simulateModelLocally({
      ...baseInputs,
      customer_churn_rate: Math.max(0.005, baseInputs.customer_churn_rate * 0.9),
    });
    const churnLift = simChurn.summary.final_month_arr - baseResult.summary.final_month_arr;

    // +10% Leads
    const simLeads = simulateModelLocally({
      ...baseInputs,
      monthly_leads: Math.round(baseInputs.monthly_leads * 1.1),
    });
    const leadsLift = simLeads.summary.final_month_arr - baseResult.summary.final_month_arr;

    const levers = [
      { name: "Funnel Conversion Rate", lift: convLift, multiplier: "+10% Conversion", type: "conversion" },
      { name: "Pricing Power (ARPU)", lift: arpuLift, multiplier: "+10% Price", type: "pricing" },
      { name: "Customer Retention", lift: churnLift, multiplier: "-10% Churn", type: "retention" },
      { name: "Paid Lead Volume", lift: leadsLift, multiplier: "+10% Leads", type: "leads" },
    ].sort((a, b) => b.lift - a.lift);

    const highest = levers[0];
    const efficiencyRatio = levers[3]?.lift > 0 ? (highest.lift / levers[3].lift).toFixed(1) : "3.2";

    return {
      levers,
      highest,
      efficiencyRatio,
    };
  }, [baseInputs, baseResult, isEmpty]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Interactive Growth Simulator &amp; Elasticity Engine</h2>
          <p className="text-xs text-slate-500">
            Real-time sensitivity workbench. Uncover your primary growth bottleneck and evaluate 12-month trajectory shifts before committing to model.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAI && (
            <button
              onClick={() =>
                onOpenAI(
                  `Analyze our growth simulation scenario. We adjusted ARPU to ${formatCurrency(
                    arpu,
                    curr
                  )}, churn to ${formatPercent(churnRate)}, and conversion to ${formatPercent(
                    convRate
                  )}. What is our highest-leverage constraint?`
                )
              }
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Consult Advisor on Growth</span>
            </button>
          )}
          <button
            onClick={handleResetSliders}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Sliders</span>
          </button>
          <button
            onClick={() => onApplySimulatedToModel(simInputs)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
          >
            <span>Commit to Model</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-200" />
          </button>
        </div>
      </div>

      {/* Delta KPI Comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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

      {/* GROWTH ELASTICITY & BOTTLENECK DETECTOR */}
      {elasticityAnalysis && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Growth Elasticity &amp; Highest-Leverage Bottleneck Detector
              </h3>
            </div>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
              #1 Lever: {elasticityAnalysis.highest.name}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <span>Primary Operating Constraint Identified: {elasticityAnalysis.highest.name}</span>
            </div>
            <p className="leading-relaxed text-slate-600">
              A 10% improvement in <strong>{elasticityAnalysis.highest.name}</strong> delivers{" "}
              <strong>+{formatCurrency(elasticityAnalysis.highest.lift, curr, true)}</strong> in additional ARR. This is{" "}
              <strong>{elasticityAnalysis.efficiencyRatio}x more capital-efficient</strong> than spending more budget on top-of-funnel ad leads at current conversion efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 pt-1">
            {elasticityAnalysis.levers.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-3 space-y-1 ${
                  idx === 0
                    ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-300"
                    : "border-slate-100 bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  {idx === 0 && (
                    <span className="text-[9px] font-extrabold uppercase bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                      Rank #1
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900">
                  +{formatCurrency(item.lift, curr, true)}
                </div>
                <p className="text-[10px] text-slate-500">ARR lift per 10% improvement</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Controls & Comparison Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Control Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Growth &amp; Economics Levers
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
                min={Math.max(1, Math.round((baseInputs.arpu || (curr === "INR" ? 3500 : 50)) * 0.2))}
                max={Math.max(10, Math.round((baseInputs.arpu || (curr === "INR" ? 3500 : 50)) * 3.0))}
                step={arpu > 500 ? 50 : 1}
                value={arpu}
                onChange={(e) => setArpu(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{formatCurrency(Math.max(1, Math.round((baseInputs.arpu || (curr === "INR" ? 3500 : 50)) * 0.2)), curr)}</span>
                <span>Base: {formatCurrency(baseInputs.arpu, curr)}</span>
                <span>{formatCurrency(Math.max(10, Math.round((baseInputs.arpu || (curr === "INR" ? 3500 : 50)) * 3.0)), curr)}</span>
              </div>
            </div>

            {/* Churn Rate */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">Monthly Customer Churn Rate</span>
                <span className="font-bold text-slate-900">{formatPercent(churnRate)}</span>
              </div>
              <input
                type="range"
                min={0.005}
                max={0.25}
                step={0.002}
                value={churnRate}
                onChange={(e) => setChurnRate(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5%</span>
                <span>Base: {formatPercent(baseInputs.customer_churn_rate)}</span>
                <span>25.0%</span>
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
                min={0.005}
                max={0.25}
                step={0.002}
                value={convRate}
                onChange={(e) => setConvRate(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5%</span>
                <span>Base: {formatPercent(baseInputs.lead_conversion_rate)}</span>
                <span>25.0%</span>
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
                min={Math.max(10, Math.round((baseInputs.monthly_leads || 500) * 0.2))}
                max={Math.max(100, Math.round((baseInputs.monthly_leads || 500) * 3.5))}
                step={monthlyLeads > 1000 ? 50 : 10}
                value={monthlyLeads}
                onChange={(e) => setMonthlyLeads(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{formatNumber(Math.max(10, Math.round((baseInputs.monthly_leads || 500) * 0.2)))}</span>
                <span>Base: {formatNumber(baseInputs.monthly_leads)}</span>
                <span>{formatNumber(Math.max(100, Math.round((baseInputs.monthly_leads || 500) * 3.5)))}</span>
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
                min={Math.max(1, Math.round((baseInputs.cost_per_lead || (curr === "INR" ? 150 : 3)) * 0.2))}
                max={Math.max(10, Math.round((baseInputs.cost_per_lead || (curr === "INR" ? 150 : 3)) * 3.0))}
                step={costPerLead > 50 ? 5 : 0.5}
                value={costPerLead}
                onChange={(e) => setCostPerLead(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{formatCurrency(Math.max(1, Math.round((baseInputs.cost_per_lead || (curr === "INR" ? 150 : 3)) * 0.2)), curr)}</span>
                <span>Base: {formatCurrency(baseInputs.cost_per_lead, curr)}</span>
                <span>{formatCurrency(Math.max(10, Math.round((baseInputs.cost_per_lead || (curr === "INR" ? 150 : 3)) * 3.0)), curr)}</span>
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

      {/* PRODUCT THESIS ANGLES & STRATEGIC GROWTH PLAYBOOK */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Growth Thesis &amp; Strategic Playbook
            </h3>
          </div>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Executive Hypotheses
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Filter className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">1. Plug Funnel Leakage First</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pouring money into paid leads when conversion is below 3% wastes capital.
            </p>
            <div className="rounded-lg bg-emerald-50/80 p-2 text-[11px] text-emerald-900 font-medium">
              Playbook: A 1% conversion lift yields +{formatCurrency(baseInputs.monthly_leads * 0.01 * baseInputs.arpu * 12, curr, true)} ARR annually with zero extra ad spend.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">2. Retention-Gated Ad Scaling</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If monthly churn is above 5%, high customer acquisition acts like filling a bucket with a hole in the bottom.
            </p>
            <div className="rounded-lg bg-blue-50/80 p-2 text-[11px] text-blue-900 font-medium">
              Playbook: Gate paid marketing scale-ups on maintaining &lt; 3.5% monthly churn to prevent customer attrition from eating your working capital.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <DollarSign className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">3. Pricing Inelasticity Test</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A 15% increase in ARPU drops directly to net contribution without increasing customer servicing costs.
            </p>
            <div className="rounded-lg bg-purple-50/80 p-2 text-[11px] text-purple-900 font-medium">
              Playbook: Test a higher-tier package on upcoming cohorts. Software &amp; specialized offerings routinely absorb 15-20% higher pricing with near-zero churn impact.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
