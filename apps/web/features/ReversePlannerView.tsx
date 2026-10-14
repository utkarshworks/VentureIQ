"use client";

import React, { useState } from "react";
import { ModelEngineInputs, ReversePlanResult } from "@/types/model";
import { runReversePlan } from "@/lib/api";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import {
  Target,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  BookmarkPlus,
  Loader2,
} from "lucide-react";

interface ReversePlannerViewProps {
  baseInputs: ModelEngineInputs;
  onApplyAssumptions: (newInputs: Partial<ModelEngineInputs>) => void;
  onSaveAsScenario: (name: string, overrides: Record<string, number>) => void;
}

export const ReversePlannerView: React.FC<ReversePlannerViewProps> = ({
  baseInputs,
  onApplyAssumptions,
  onSaveAsScenario,
}) => {
  const curr = baseInputs.currency;

  // Planner Config State
  const [goal, setGoal] = useState<string>("target_arr_run_rate");
  const [targetValue, setTargetValue] = useState<number>(10000000); // Default ₹1 Crore ARR
  const [targetMonth, setTargetMonth] = useState<number>(12);
  const [minReserve, setMinReserve] = useState<number>(baseInputs.minimum_cash_reserve);
  const [maxBudget, setMaxBudget] = useState<number>(baseInputs.initial_cash_balance);

  // Adjustable Variables & Bounds State
  const [enablePrice, setEnablePrice] = useState<boolean>(true);
  const [minPrice, setMinPrice] = useState<number>(2000);
  const [maxPrice, setMaxPrice] = useState<number>(6000);

  const [enableConversion, setEnableConversion] = useState<boolean>(true);
  const [minConv, setMinConv] = useState<number>(0.02);
  const [maxConv, setMaxConv] = useState<number>(0.07);

  const [enableChurn, setEnableChurn] = useState<boolean>(true);
  const [minChurn, setMinChurn] = useState<number>(0.015);
  const [maxChurn, setMaxChurn] = useState<number>(0.04);

  const [enableMarketing, setEnableMarketing] = useState<boolean>(true);
  const [minMarketing, setMinMarketing] = useState<number>(150000);
  const [maxMarketing, setMaxMarketing] = useState<number>(450000);

  // Solver Execution State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ReversePlanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scenarioSavedSuccess, setScenarioSavedSuccess] = useState<boolean>(false);

  const handleSolve = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setScenarioSavedSuccess(false);

    const adjustableVars: { name: string; min_value: number; max_value: number }[] = [];
    if (enablePrice) {
      adjustableVars.push({ name: "arpu", min_value: minPrice, max_value: maxPrice });
    }
    if (enableConversion) {
      adjustableVars.push({ name: "lead_conversion_rate", min_value: minConv, max_value: maxConv });
    }
    if (enableChurn) {
      adjustableVars.push({ name: "customer_churn_rate", min_value: minChurn, max_value: maxChurn });
    }
    if (enableMarketing) {
      adjustableVars.push({
        name: baseInputs.acquisition_mode === "lead_based" ? "cost_per_lead" : "acquisition_budget",
        min_value: minMarketing,
        max_value: maxMarketing,
      });
    }

    if (adjustableVars.length === 0) {
      setErrorMsg("Please enable at least one adjustable decision variable for the optimizer.");
      setIsLoading(false);
      return;
    }

    try {
      const planRes = await runReversePlan(baseInputs, {
        goal,
        target_value: targetValue,
        target_month: targetMonth,
        minimum_cash_reserve: minReserve,
        max_allowable_cash_deficit: maxBudget,
        adjustable_variables: adjustableVars,
      });
      setResult(planRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute reverse planning solver.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveScenario = () => {
    if (!result) return;
    const name = `Reverse Plan: ${formatCurrency(result.target_value, curr, true)} @ M${targetMonth}`;
    onSaveAsScenario(name, result.solution_assumptions);
    setScenarioSavedSuccess(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Deterministic Reverse Planner</h2>
              <span className="rounded-md bg-emerald-200/60 px-2 py-0.5 text-xs font-semibold text-emerald-900">
                SciPy Constrained Optimization
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Work backward from your milestone target. Specify your desired ARR, cash budget, and acceptable operational bounds.
              VentureIQ uses bounded numerical optimization to identify commercially plausible assumption combinations.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Target & Constraints Configuration */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Goal Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Milestone Objective
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Target Objective</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="target_arr_run_rate">Target ARR Run Rate</option>
                  <option value="target_mrr">Target MRR (Monthly)</option>
                  <option value="operating_break_even">Reach Operating Break-Even</option>
                  <option value="revenue_within_cash_budget">Maximize Revenue within Cash Budget</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-slate-700">Target Value</label>
                  {curr === "INR" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTargetValue(5000000)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-600"
                      >
                        ₹50L
                      </button>
                      <button
                        onClick={() => setTargetValue(10000000)}
                        className="text-[10px] bg-emerald-100 hover:bg-emerald-200 rounded px-1.5 py-0.5 font-medium text-emerald-800"
                      >
                        ₹1 Cr
                      </button>
                      <button
                        onClick={() => setTargetValue(25000000)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-600"
                      >
                        ₹2.5 Cr
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Formatted: {formatCurrency(targetValue, curr, false)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Target Month</label>
                  <input
                    type="number"
                    min={1}
                    max={36}
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700">Min Cash Reserve</label>
                  <input
                    type="number"
                    value={minReserve}
                    onChange={(e) => setMinReserve(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Adjustable Variable Bounds Panel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              2. Plausible Operational Bounds
            </h3>
            <p className="text-[11px] text-slate-500">
              The optimizer is strictly restricted to these ranges to prevent mathematically trivial but commercially unrealistic solutions (e.g. 100% conversion or zero churn).
            </p>

            <div className="space-y-4 divide-y divide-slate-100">
              {/* ARPU / Price */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={enablePrice}
                      onChange={(e) => setEnablePrice(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Monthly Price (ARPU)</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Base: {formatCurrency(baseInputs.arpu, curr)}
                  </span>
                </div>
                {enablePrice && (
                  <div className="grid grid-cols-2 gap-2 pl-5">
                    <div>
                      <span className="text-[10px] text-slate-400">Min ({curr})</span>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Max ({curr})</span>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Conversion Rate */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={enableConversion}
                      onChange={(e) => setEnableConversion(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Lead Conversion Rate</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Base: {formatPercent(baseInputs.lead_conversion_rate)}
                  </span>
                </div>
                {enableConversion && (
                  <div className="grid grid-cols-2 gap-2 pl-5">
                    <div>
                      <span className="text-[10px] text-slate-400">Min (e.g. 0.02 = 2%)</span>
                      <input
                        type="number"
                        step={0.005}
                        value={minConv}
                        onChange={(e) => setMinConv(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Max (e.g. 0.08 = 8%)</span>
                      <input
                        type="number"
                        step={0.005}
                        value={maxConv}
                        onChange={(e) => setMaxConv(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Churn Rate */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={enableChurn}
                      onChange={(e) => setEnableChurn(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Monthly Churn Rate</span>
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Base: {formatPercent(baseInputs.customer_churn_rate)}
                  </span>
                </div>
                {enableChurn && (
                  <div className="grid grid-cols-2 gap-2 pl-5">
                    <div>
                      <span className="text-[10px] text-slate-400">Min (e.g. 0.015 = 1.5%)</span>
                      <input
                        type="number"
                        step={0.005}
                        value={minChurn}
                        onChange={(e) => setMinChurn(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Max (e.g. 0.05 = 5%)</span>
                      <input
                        type="number"
                        step={0.005}
                        value={maxChurn}
                        onChange={(e) => setMaxChurn(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSolve}
              disabled={isLoading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Optimizing Bounded Parameters...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Solve Reverse Plan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Optimizer Output & Solution Feasibility */}
        <div className="lg:col-span-7 space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {!result && !isLoading && !errorMsg && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Ready to Solve</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Configure your target milestone on the left and click &quot;Solve Reverse Plan&quot; to determine feasibility and optimal assumptions.
              </p>
            </div>
          )}

          {result && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Feasibility Status Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {result.feasible ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                      <XCircle className="h-6 w-6" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {result.feasible ? "Feasible Solution Identified" : "Milestone Target Infeasible"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Status: <span className="font-mono font-medium">{result.status}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400">Achieved @ Month {targetMonth}</span>
                  <p className="text-lg font-bold text-slate-900">
                    {formatCurrency(result.achieved_target_value, curr, false)}
                  </p>
                </div>
              </div>

              {/* Infeasibility Reason (if applicable) */}
              {!result.feasible && result.infeasibility_reason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-900">
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Infeasibility Bottleneck Diagnostic</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    {result.infeasibility_reason}
                  </p>
                </div>
              )}

              {/* Solved Assumption Parameters Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Proposed Assumptions vs. Baseline
                </h4>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Variable</th>
                        <th className="py-2.5 px-3 text-right">Base Assumption</th>
                        <th className="py-2.5 px-3 text-right">Proposed Solution</th>
                        <th className="py-2.5 px-3 text-right">Required Shift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(result.solution_assumptions).map(([key, solVal]) => {
                        const baseVal = result.base_assumptions[key] ?? 0;
                        const isRate = key.endsWith("_rate");
                        const delta = solVal - baseVal;
                        return (
                          <tr key={key} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-medium text-slate-800 capitalize">
                              {key.replace(/_/g, " ")}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-500">
                              {isRate ? formatPercent(baseVal) : formatCurrency(baseVal, curr)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                              {isRate ? formatPercent(solVal) : formatCurrency(solVal, curr)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                              {delta > 0 ? `+` : ""}
                              {isRate ? `${(delta * 100).toFixed(1)}%` : formatCurrency(delta, curr)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Consequences of Solution */}
              <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div>
                  <span className="text-[11px] text-slate-500">Ending Cash</span>
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrency(result.ending_cash, curr, true)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Min Cash Balance</span>
                  <p
                    className={`text-sm font-bold ${
                      result.min_cash_balance >= minReserve ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatCurrency(result.min_cash_balance, curr, true)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500">Peak Deficit</span>
                  <p className="text-sm font-bold text-slate-900">
                    {formatCurrency(result.peak_cash_deficit, curr, true)}
                  </p>
                </div>
              </div>

              {/* Binding Constraints */}
              {result.binding_constraints.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Active Binding Constraints:
                  </span>
                  <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
                    {result.binding_constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleSaveScenario}
                  disabled={scenarioSavedSuccess}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm disabled:bg-emerald-700"
                >
                  <BookmarkPlus className="h-4 w-4" />
                  <span>
                    {scenarioSavedSuccess ? "Saved to Scenarios!" : "Save Solution as Scenario"}
                  </span>
                </button>
                <button
                  onClick={() => onApplyAssumptions(result.solution_assumptions)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                >
                  <span>Apply to Current Model</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
