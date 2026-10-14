"use client";

import React, { useState } from "react";
import { ModelEngineInputs, HiringRole, FinancingEvent, EngineSimulationResult } from "@/types/model";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Users, Plus, Trash2, DollarSign, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface CashFlowHiringViewProps {
  inputs: ModelEngineInputs;
  result: EngineSimulationResult;
  onUpdateInputs: (newInputs: ModelEngineInputs) => void;
}

export const CashFlowHiringView: React.FC<CashFlowHiringViewProps> = ({
  inputs,
  result,
  onUpdateInputs,
}) => {
  const curr = inputs.currency;

  const [roles, setRoles] = useState<HiringRole[]>(inputs.hiring_roles);
  const [financingEvents, setFinancingEvents] = useState<FinancingEvent[]>(inputs.financing_events);

  const handleAddRole = () => {
    const newRole: HiringRole = {
      role_title: "Account Executive",
      department: "Sales",
      headcount: 1,
      monthly_salary: 60000,
      employer_burden_rate: 0.15,
      start_month: 3,
      annual_increase_rate: 0.05,
    };
    const updated = [...roles, newRole];
    setRoles(updated);
    onUpdateInputs({ ...inputs, hiring_roles: updated });
  };

  const handleRemoveRole = (idx: number) => {
    const updated = roles.filter((_, i) => i !== idx);
    setRoles(updated);
    onUpdateInputs({ ...inputs, hiring_roles: updated });
  };

  const handleRoleChange = (idx: number, field: keyof HiringRole, val: any) => {
    const updated = [...roles];
    updated[idx] = { ...updated[idx], [field]: val };
    setRoles(updated);
    onUpdateInputs({ ...inputs, hiring_roles: updated });
  };

  const handleAddFinancing = () => {
    const newEvent: FinancingEvent = {
      month: 6,
      amount: 2500000, // ₹25L
      name: "Seed Investment Round",
    };
    const updated = [...financingEvents, newEvent];
    setFinancingEvents(updated);
    onUpdateInputs({ ...inputs, financing_events: updated });
  };

  const handleRemoveFinancing = (idx: number) => {
    const updated = financingEvents.filter((_, i) => i !== idx);
    setFinancingEvents(updated);
    onUpdateInputs({ ...inputs, financing_events: updated });
  };

  const chartData = result.projections.map((p) => ({
    period: p.period,
    ending_cash: p.ending_cash,
    min_reserve: inputs.minimum_cash_reserve,
    net_burn: p.net_burn,
    payroll: p.payroll_cost,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Headcount, Payroll & Cash Flow Planner</h2>
        <p className="text-xs text-slate-500">
          Model hiring events with employer burden taxes and start dates. Schedule equity or debt financing injections.
        </p>
      </div>

      {/* Cash Runway Graph */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Projected Cash Balance vs. Minimum Reserve</h3>
          <span className="text-xs text-slate-400">
            {result.summary.runway_status}
          </span>
        </div>
        <div className="h-56 w-full">
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
                name="Ending Cash"
                stroke="#0f172a"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Headcount Roster Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Headcount & Planned Hiring Events</h3>
            <p className="text-xs text-slate-500">
              Each role begins contributing to monthly payroll in its specified start month.
            </p>
          </div>
          <button
            onClick={handleAddRole}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Hire</span>
          </button>
        </div>

        <div className="overflow-x-auto border rounded-xl border-slate-200">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Role Title</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-right">Headcount</th>
                <th className="py-2.5 px-3 text-right">Monthly Salary ({curr})</th>
                <th className="py-2.5 px-3 text-right">Employer Burden %</th>
                <th className="py-2.5 px-3 text-right">Start Month</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roles.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/70">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={r.role_title}
                      onChange={(e) => handleRoleChange(idx, "role_title", e.target.value)}
                      className="w-full rounded border border-slate-200 bg-white p-1 text-xs font-medium"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={r.department}
                      onChange={(e) => handleRoleChange(idx, "department", e.target.value)}
                      className="w-28 rounded border border-slate-200 bg-white p-1 text-xs"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min={1}
                      value={r.headcount}
                      onChange={(e) => handleRoleChange(idx, "headcount", Number(e.target.value))}
                      className="w-16 rounded border border-slate-200 bg-white p-1 text-xs text-right font-medium"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={r.monthly_salary}
                      onChange={(e) => handleRoleChange(idx, "monthly_salary", Number(e.target.value))}
                      className="w-28 rounded border border-slate-200 bg-white p-1 text-xs text-right font-semibold"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step={0.01}
                      min={0}
                      max={0.5}
                      value={r.employer_burden_rate}
                      onChange={(e) => handleRoleChange(idx, "employer_burden_rate", Number(e.target.value))}
                      className="w-20 rounded border border-slate-200 bg-white p-1 text-xs text-right"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min={1}
                      max={inputs.planning_horizon}
                      value={r.start_month}
                      onChange={(e) => handleRoleChange(idx, "start_month", Number(e.target.value))}
                      className="w-16 rounded border border-slate-200 bg-white p-1 text-xs text-right font-medium"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      onClick={() => handleRemoveRole(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove role"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financing Events Schedule */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Financing Injections & Capital Rounds</h3>
            <p className="text-xs text-slate-500">
              Cash injections occurring in a specific month increase cash receipts and extend runway.
            </p>
          </div>
          <button
            onClick={handleAddFinancing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Inflow Event</span>
          </button>
        </div>

        {financingEvents.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No financing events scheduled. Business relies strictly on customer receipts and initial cash balance.
          </p>
        ) : (
          <div className="overflow-x-auto border rounded-xl border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Round / Injection Name</th>
                  <th className="py-2.5 px-3 text-right">Inflow Month</th>
                  <th className="py-2.5 px-3 text-right">Cash Amount ({curr})</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {financingEvents.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 font-medium text-slate-800">{f.name}</td>
                    <td className="py-2 px-3 text-right font-medium">Month {f.month}</td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-700">
                      {formatCurrency(f.amount, curr)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveFinancing(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
