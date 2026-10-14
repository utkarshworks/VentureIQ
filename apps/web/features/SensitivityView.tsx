"use client";

import React, { useState, useMemo } from "react";
import { ModelEngineInputs } from "@/types/model";
import { simulateModelLocally } from "@/lib/engine";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { TrendingDown, Sliders, Layers } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

interface SensitivityViewProps {
  baseInputs: ModelEngineInputs;
}

export const SensitivityView: React.FC<SensitivityViewProps> = ({ baseInputs }) => {
  const curr = baseInputs.currency;

  const [oneVarName, setOneVarName] = useState<string>("arpu");
  const [twoVarX, setTwoVarX] = useState<string>("arpu");
  const [twoVarY, setTwoVarY] = useState<string>("lead_conversion_rate");

  // 1-Variable Sweep Computation
  const oneVarData = useMemo(() => {
    const steps = [-0.3, -0.2, -0.1, 0.0, 0.1, 0.2, 0.3];
    const baseVal = (baseInputs as any)[oneVarName] ?? 1.0;

    return steps.map((delta) => {
      let perturbed = baseVal * (1 + delta);
      if (oneVarName.endsWith("_rate")) {
        perturbed = Math.max(0, Math.min(1, perturbed));
      } else {
        perturbed = Math.max(0, perturbed);
      }
      const testInputs = { ...baseInputs, [oneVarName]: perturbed };
      const sim = simulateModelLocally(testInputs);
      return {
        stepLabel: `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(0)}%`,
        inputValue: perturbed,
        arr_run_rate: sim.summary.final_month_arr,
        ending_cash: sim.summary.ending_cash,
      };
    });
  }, [baseInputs, oneVarName]);

  // Tornado Ranking Computation
  const tornadoData = useMemo(() => {
    const drivers = [
      { key: "arpu", label: "Monthly Price (ARPU)" },
      { key: "customer_churn_rate", label: "Customer Churn" },
      { key: "lead_conversion_rate", label: "Lead Conversion Rate" },
      { key: "monthly_leads", label: "Monthly Leads" },
      { key: "cost_per_lead", label: "Cost Per Lead" },
      { key: "fixed_opex", label: "Fixed OpEx Overhead" },
    ];

    const baseSim = simulateModelLocally(baseInputs);
    const baseArr = baseSim.summary.final_month_arr;

    const list = drivers.map((d) => {
      const baseVal = (baseInputs as any)[d.key] ?? 1.0;

      // -20%
      let lowVal = baseVal * 0.8;
      if (d.key.endsWith("_rate")) lowVal = Math.max(0, Math.min(1, lowVal));
      const simLow = simulateModelLocally({ ...baseInputs, [d.key]: lowVal });

      // +20%
      let highVal = baseVal * 1.2;
      if (d.key.endsWith("_rate")) highVal = Math.max(0, Math.min(1, highVal));
      const simHigh = simulateModelLocally({ ...baseInputs, [d.key]: highVal });

      const lowArr = simLow.summary.final_month_arr;
      const highArr = simHigh.summary.final_month_arr;
      const spread = Math.abs(highArr - lowArr);

      return {
        label: d.label,
        spread,
        lowArr,
        highArr,
        baseArr,
      };
    });

    list.sort((a, b) => b.spread - a.spread);
    return list;
  }, [baseInputs]);

  // 2-Variable Matrix Grid Computation
  const twoVarMatrix = useMemo(() => {
    const steps = [0.8, 0.9, 1.0, 1.1, 1.2];
    const baseValX = (baseInputs as any)[twoVarX] ?? 1.0;
    const baseValY = (baseInputs as any)[twoVarY] ?? 1.0;

    const xVals = steps.map((m) => {
      let v = baseValX * m;
      if (twoVarX.endsWith("_rate")) v = Math.max(0, Math.min(1, v));
      return v;
    });

    const yVals = steps.map((m) => {
      let v = baseValY * m;
      if (twoVarY.endsWith("_rate")) v = Math.max(0, Math.min(1, v));
      return v;
    });

    const grid = yVals.map((vy) => {
      return xVals.map((vx) => {
        const testInputs = { ...baseInputs, [twoVarX]: vx, [twoVarY]: vy };
        const sim = simulateModelLocally(testInputs);
        return sim.summary.final_month_arr;
      });
    });

    return { xVals, yVals, grid };
  }, [baseInputs, twoVarX, twoVarY]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Driver Sensitivity & Elasticity Analysis</h2>
        <p className="text-xs text-slate-500">
          Identify which assumptions matter most. Evaluate single-variable sweeps, cross-elasticity grids, and Tornado leverage rankings.
        </p>
      </div>

      {/* Tornado Ranking Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Tornado Chart: Relative Elasticity Ranking (±20% Shift on ARR)
          </h3>
          <span className="text-xs text-slate-400">Ranked by Outcome Spread</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tornadoData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 120, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickFormatter={(val) => formatCurrency(val, curr, true)}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 11, fill: "#334155" }}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val), curr, false), "ARR Spread"]}
              />
              <Bar dataKey="spread" fill="#059669" radius={[0, 4, 4, 0]}>
                {tornadoData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#059669" : index === 1 ? "#10b981" : "#64748b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1-Variable Sensitivity Curve */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              One-Variable Sweep (±30%)
            </h3>
            <select
              value={oneVarName}
              onChange={(e) => setOneVarName(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
            >
              <option value="arpu">Monthly Price (ARPU)</option>
              <option value="customer_churn_rate">Customer Churn Rate</option>
              <option value="lead_conversion_rate">Lead Conversion Rate</option>
              <option value="monthly_leads">Monthly Leads</option>
              <option value="cost_per_lead">Cost Per Lead</option>
              <option value="fixed_opex">Fixed Overhead</option>
            </select>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={oneVarData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stepLabel" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => formatCurrency(val, curr, true)}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(Number(val), curr, false), "ARR Run Rate"]}
                />
                <Line
                  type="monotone"
                  dataKey="arr_run_rate"
                  name="Month 12 ARR"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Variable Cross Elasticity Matrix Grid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Two-Variable Cross Sensitivity Matrix
            </h3>
            <span className="text-[11px] text-slate-400">Month 12 ARR</span>
          </div>

          <div className="flex gap-3 text-xs">
            <div className="flex-1">
              <span className="text-[10px] text-slate-500">Horizontal Axis (X):</span>
              <select
                value={twoVarX}
                onChange={(e) => setTwoVarX(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs"
              >
                <option value="arpu">Price (ARPU)</option>
                <option value="lead_conversion_rate">Lead Conversion</option>
                <option value="monthly_leads">Leads</option>
              </select>
            </div>
            <div className="flex-1">
              <span className="text-[10px] text-slate-500">Vertical Axis (Y):</span>
              <select
                value={twoVarY}
                onChange={(e) => setTwoVarY(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs"
              >
                <option value="lead_conversion_rate">Lead Conversion</option>
                <option value="customer_churn_rate">Churn Rate</option>
                <option value="cost_per_lead">Cost Per Lead</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2 px-2 text-left">Y \ X</th>
                  {twoVarMatrix.xVals.map((vx, i) => (
                    <th key={i} className="py-2 px-2">
                      {twoVarX.endsWith("_rate") ? formatPercent(vx) : formatCurrency(vx, curr, true)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {twoVarMatrix.yVals.map((vy, yIdx) => (
                  <tr key={yIdx}>
                    <td className="py-2 px-2 font-semibold text-slate-700 text-left bg-slate-50/50">
                      {twoVarY.endsWith("_rate") ? formatPercent(vy) : formatCurrency(vy, curr, true)}
                    </td>
                    {twoVarMatrix.grid[yIdx].map((cellArr, xIdx) => (
                      <td
                        key={xIdx}
                        className="py-2 px-2 font-medium text-slate-900 hover:bg-emerald-50 transition-colors"
                      >
                        {formatCurrency(cellArr, curr, true)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
