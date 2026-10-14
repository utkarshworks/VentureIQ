"use client";

import React, { useState } from "react";
import { ModelEngineInputs, HiringRole, FinancingEvent, EngineSimulationResult } from "@/types/model";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/formatters";
import {
  Users,
  Plus,
  Trash2,
  DollarSign,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  Scale,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { PercentageInput } from "@/components/PercentageInput";
import { isModelEmpty } from "@/lib/engine";

interface CashFlowHiringViewProps {
  inputs: ModelEngineInputs;
  result: EngineSimulationResult;
  onUpdateInputs: (newInputs: ModelEngineInputs) => void;
  onOpenAI?: (query?: string) => void;
}

export const CashFlowHiringView: React.FC<CashFlowHiringViewProps> = ({
  inputs,
  result,
  onUpdateInputs,
  onOpenAI,
}) => {
  const curr = inputs.currency;
  const isEmpty = isModelEmpty(inputs);

  const [roles, setRoles] = useState<HiringRole[]>(inputs.hiring_roles || []);
  const [financingEvents, setFinancingEvents] = useState<FinancingEvent[]>(inputs.financing_events || []);

  // Sync state when inputs change from assessment completion or currency conversion
  React.useEffect(() => {
    setRoles(inputs.hiring_roles || []);
    setFinancingEvents(inputs.financing_events || []);
  }, [inputs]);

  const handleAddRole = () => {
    const newRole: HiringRole = {
      role_title: "Account Executive",
      department: "Sales",
      headcount: 1,
      monthly_salary: curr === "INR" ? 60000 : 2500,
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
      amount: curr === "INR" ? 2500000 : 50000,
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

  // Diagnostic calculations
  const totalHeadcount = roles.reduce((acc, r) => acc + (Number(r.headcount) || 0), 0);
  const finalMonthPayroll = result.projections[result.projections.length - 1]?.payroll_cost || 0;
  const finalMonthTotalOutflows = result.projections[result.projections.length - 1]?.cash_outflows || 1;
  const payrollBurnBurden = (finalMonthPayroll / Math.max(1, finalMonthTotalOutflows)) * 100;
  const arrPerFte = totalHeadcount > 0 ? result.summary.final_month_arr / totalHeadcount : 0;
  const finalMonthGrossProfit = result.projections[result.projections.length - 1]?.gross_profit || 0;
  const payrollCoveragePct = finalMonthPayroll > 0 ? (finalMonthGrossProfit / finalMonthPayroll) * 100 : 0;

  // 12-month total planned payroll outlay across all roles
  const total12MonthPayroll = result.projections.reduce((sum, p) => sum + p.payroll_cost, 0);

  return (
    <div className="space-y-6">
      {/* Header with Advisor Prompt */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Headcount, Payroll &amp; Cash Flow Architecture</h2>
          <p className="text-xs text-slate-500">
            Model headcount additions, employer burden, capital injections, and organizational leverage with deterministic solvency testing.
          </p>
        </div>
        {onOpenAI && (
          <button
            onClick={() =>
              onOpenAI(
                "Evaluate our headcount expansion schedule, payroll burn ratio, and cash runway. What revenue triggers should gate our next hiring batch?"
              )
            }
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-800"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Consult Advisor on Hiring &amp; Cash Flow</span>
          </button>
        )}
      </div>

      {/* Primary KPI Diagnostics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Total Planned Headcount</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty ? "N/A" : `${totalHeadcount} FTEs`}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span>{roles.length} Distinct Roles</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Payroll Burn Burden Ratio</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty || finalMonthTotalOutflows <= 0 ? "N/A" : `${payrollBurnBurden.toFixed(1)}%`}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-semibold ${
                payrollBurnBurden > 65
                  ? "text-rose-600"
                  : payrollBurnBurden >= 40
                  ? "text-emerald-600"
                  : "text-blue-600"
              }`}
            >
              {payrollBurnBurden > 65
                ? "High Fixed Burden"
                : payrollBurnBurden >= 40
                ? "Balanced Venture"
                : "Asset-Light"}
            </span>
            <span className="text-slate-400">of Outflows</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">ARR Productivity per FTE</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty || totalHeadcount === 0 ? "N/A" : formatCurrency(arrPerFte, curr, true)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-semibold ${
                arrPerFte > (curr === "INR" ? 1200000 : 150000)
                  ? "text-emerald-600"
                  : arrPerFte > (curr === "INR" ? 600000 : 75000)
                  ? "text-blue-600"
                  : "text-amber-600"
              }`}
            >
              {arrPerFte > (curr === "INR" ? 1200000 : 150000)
                ? "High Scale Efficiency"
                : arrPerFte > (curr === "INR" ? 600000 : 75000)
                ? "Progressing Leverage"
                : "Pre-Productivity"}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Payroll Gross Profit Coverage</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty || finalMonthPayroll === 0 ? "N/A" : `${Math.min(999, Math.round(payrollCoveragePct))}%`}
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-semibold ${
                payrollCoveragePct >= 100
                  ? "text-emerald-600"
                  : payrollCoveragePct >= 50
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}
            >
              {payrollCoveragePct >= 100
                ? "Self-Funding"
                : `${(100 - payrollCoveragePct).toFixed(0)}% Burn-Funded`}
            </span>
          </div>
        </div>
      </div>

      {/* STRATEGIC INTERPRETATION: HEADCOUNT EFFICIENCY & SOLVENCY DIAGNOSTIC */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Headcount Interpretation &amp; Structural Leverage Analysis
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Workforce Diagnosis
          </span>
        </div>

        {isEmpty ? (
          <p className="text-xs text-slate-500 py-3 italic">
            Complete the company intake assessment to view real-time headcount productivity benchmarks and organizational risk diagnosis.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Cost Structure Flexibility</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {payrollBurnBurden > 65
                  ? `At ${payrollBurnBurden.toFixed(0)}% of monthly spend, your cost structure is dominated by fixed payroll commitments. If customer conversion slows, monthly burn cannot be reduced without downsizing employees.`
                  : `Payroll represents ${payrollBurnBurden.toFixed(0)}% of monthly outlays. This balanced ratio gives you operational breathing room to scale or pause discretionary growth spend as customer demand dictates.`}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Self-Funding Trajectory</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {payrollCoveragePct >= 100
                  ? `Gross margin generated by customers covers 100%+ of monthly team salaries by Month 12. Your core organization is self-sustaining without dilutive cash injections.`
                  : `Customer gross profit covers ${Math.round(payrollCoveragePct)}% of salaries by Month 12. The remaining ${Math.max(0, Math.round(100 - payrollCoveragePct))}% is funded directly by treasury burn (${formatCurrency(Math.max(0, finalMonthPayroll - finalMonthGrossProfit), curr)}/mo deficit).`}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Total 12-Month Payroll Outlay</span>
              <div className="text-sm font-bold text-slate-900">
                {formatCurrency(total12MonthPayroll, curr, true)}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consolidated salary plus employer taxes ({formatCurrency(total12MonthPayroll, curr, true)}) represents your largest capital commitment over the next 12 months.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cash Runway Graph */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Projected Cash Balance vs. Minimum Reserve</h3>
            <p className="text-xs text-slate-500">
              Evaluates whether planned hiring schedules cause cash reserves to breach solvency limits.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
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

      {/* PRODUCT THESIS ANGLES & ORGANIZATIONAL LEVERS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Product &amp; Organizational Thesis: Strategic Levers
            </h3>
          </div>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Founder Operating Levers
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">1. Revenue-Gated Hiring Triggers</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Never hire on arbitrary calendar dates (e.g. &quot;Month 4&quot;). Anchor all headcount triggers to verified ARR milestones.
            </p>
            <div className="rounded-lg bg-emerald-50/80 p-2 text-[11px] text-emerald-900 font-medium">
              Action: Gate AE and Marketing hires on hitting {formatCurrency(Math.max(100000, result.summary.final_month_arr * 0.4), curr, true)} ARR and reaching 85%+ rep quota capacity.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Scale className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">2. Variable Contractor Buffer</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use contractors for non-core development and lead generation to eliminate employer burden taxes (15%) and severance liability.
            </p>
            <div className="rounded-lg bg-blue-50/80 p-2 text-[11px] text-blue-900 font-medium">
              Action: Preserves cash runway during exploratory phases while maintaining option to convert high performers to FTEs upon funding or PMF validation.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">3. Burn Multiple Guardrails</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keep your Burn Multiple (Net Burn ÷ Net New ARR added) under 1.8x.
            </p>
            <div className="rounded-lg bg-purple-50/80 p-2 text-[11px] text-purple-900 font-medium">
              Action: If quarterly burn multiple exceeds 2.2x, freeze non-revenue headcount additions immediately to avoid burning through the runway buffer.
            </div>
          </div>
        </div>
      </div>

      {/* Headcount Roster Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Headcount &amp; Planned Hiring Events</h3>
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
                    <div className="w-16 ml-auto">
                      <FormattedNumberInput
                        compact={true}
                        value={r.headcount}
                        onChange={(val) => handleRoleChange(idx, "headcount", Number(val) || 1)}
                        placeholder="1"
                        className="text-right font-medium"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="w-28 ml-auto">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={curr}
                        compact={true}
                        value={r.monthly_salary}
                        onChange={(val) => handleRoleChange(idx, "monthly_salary", Number(val) || 0)}
                        placeholder="0"
                        className="text-right font-semibold"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="w-24 ml-auto">
                      <PercentageInput
                        compact={true}
                        value={r.employer_burden_rate}
                        onChange={(val) => handleRoleChange(idx, "employer_burden_rate", Number(val) || 0)}
                        placeholderPercent="15%"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="w-16 ml-auto">
                      <FormattedNumberInput
                        compact={true}
                        value={r.start_month}
                        onChange={(val) => handleRoleChange(idx, "start_month", Math.max(1, Number(val) || 1))}
                        placeholder="1"
                        className="text-right font-medium"
                      />
                    </div>
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
            <h3 className="text-sm font-semibold text-slate-800">Financing Injections &amp; Capital Rounds</h3>
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
