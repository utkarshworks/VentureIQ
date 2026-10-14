"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ModelEngineInputs, BusinessModelType, EngineSimulationResult } from "@/types/model";
import { DEFAULT_SAAS_MODEL } from "@/lib/defaultModel";
import { simulateModelLocally, isModelEmpty } from "@/lib/engine";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";
import {
  Sliders,
  RotateCcw,
  Check,
  Sparkles,
  Zap,
  TrendingUp,
  Lightbulb,
  Building2,
  DollarSign,
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { PercentageInput } from "@/components/PercentageInput";

interface ModelEditorViewProps {
  inputs: ModelEngineInputs;
  onUpdateInputs: (inputs: ModelEngineInputs) => void;
  result?: EngineSimulationResult;
  onOpenAI?: (query?: string) => void;
}

export const ModelEditorView: React.FC<ModelEditorViewProps> = ({
  inputs,
  onUpdateInputs,
  result,
  onOpenAI,
}) => {
  const [formState, setFormState] = useState<ModelEngineInputs>(inputs);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync with upstream inputs when assessment completes or currency changes
  useEffect(() => {
    setFormState(inputs);
  }, [inputs]);

  const handleChange = (field: keyof ModelEngineInputs, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setSavedSuccess(false);
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateInputs(formState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setFormState(DEFAULT_SAAS_MODEL);
    onUpdateInputs(DEFAULT_SAAS_MODEL);
  };

  const curr = formState.currency;
  const isEmpty = isModelEmpty(formState);

  // Live simulation of current form state for instantaneous diagnostic feedback
  const liveResult = useMemo(() => simulateModelLocally(formState), [formState]);
  const activeResult = result || liveResult;
  const { summary, projections } = activeResult;

  // Operating leverage & break-even calculations
  const baselinePayroll = projections[0]?.payroll_cost || 0;
  const totalFixedCosts = formState.fixed_opex + formState.hosting_fixed_cost + baselinePayroll;
  const cmPct = summary.average_contribution_margin_pct;
  const breakEvenMrr = projections[0]?.break_even_revenue;
  const isDefaultAlive =
    summary.break_even_month !== null &&
    summary.ending_cash >= formState.minimum_cash_reserve;

  return (
    <form onSubmit={handleApply} className="space-y-6">
      {/* View Header with Advisor CTA */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Financial Assumptions &amp; Operating Architecture</h2>
          <p className="text-xs text-slate-500">
            Define baseline parameters. Every change directly recalibrates the deterministic model engine and operating leverage profile.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAI && (
            <button
              type="button"
              onClick={() =>
                onOpenAI(
                  "Evaluate our financial architecture, fixed vs variable cost structure, and operating break-even hurdle. How can we optimize our operating leverage?"
                )
              }
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-all shadow-sm ring-1 ring-slate-800"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>Consult Advisor on Financial Model</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
          >
            {savedSuccess ? <Check className="h-4 w-4" /> : <Sliders className="h-3.5 w-3.5" />}
            <span>{savedSuccess ? "Applied Successfully!" : "Recalculate Model"}</span>
          </button>
        </div>
      </div>

      {/* OPERATING LEVERAGE & FINANCIAL EQUILIBRIUM DIAGNOSTIC */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Operating Break-Even Hurdle</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty || !breakEvenMrr ? "N/A" : formatCurrency(breakEvenMrr, curr, true)}
          </div>
          <p className="text-[11px] text-slate-500">
            {breakEvenMrr ? "Monthly revenue needed to cover fixed base" : "Contribution margin deficit"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Fixed Cost Baseline / Month</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty ? "N/A" : formatCurrency(totalFixedCosts, curr, true)}
          </div>
          <p className="text-[11px] text-slate-500">
            Fixed OpEx + Hosting + Payroll
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Break-Even Timing</span>
          <div className="text-xl font-bold text-slate-900">
            {isEmpty
              ? "N/A"
              : summary.break_even_month
              ? `Month ${summary.break_even_month}`
              : "> 12 Months"}
          </div>
          <p className="text-[11px] text-slate-500">
            {summary.break_even_month
              ? "Operating profit turns positive"
              : "Deficit through Month 12"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-1">
          <span className="text-xs font-medium text-slate-500">Financial Equilibrium Status</span>
          <div className="text-base font-bold text-slate-900 truncate">
            {isEmpty
              ? "N/A"
              : isDefaultAlive
              ? "Default Alive"
              : summary.break_even_month
              ? "Capital Strained"
              : "Deficit Trajectory"}
          </div>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
              isEmpty
                ? "bg-slate-100 text-slate-600"
                : isDefaultAlive
                ? "bg-emerald-100 text-emerald-800"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isDefaultAlive ? "Self-Sustaining" : "Requires Runway"}
          </span>
        </div>
      </div>

      {/* STRATEGIC INTERPRETATION: COST ARCHITECTURE & LEVERAGE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Live Operating Leverage Interpretation &amp; Solvency Trajectory
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Structural Synthesis
          </span>
        </div>

        {isEmpty ? (
          <p className="text-xs text-slate-500 py-3 italic">
            Configure financial parameters below to inspect dynamic operating leverage, break-even hurdles, and default-alive trajectory.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Operating Leverage Profile</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                With a contribution margin of {formatPercent(cmPct)}, every {formatCurrency(100, curr)} of new MRR generates {formatCurrency(100 * cmPct, curr)} in gross operating surplus. To cover your fixed monthly commitments of {formatCurrency(totalFixedCosts, curr, true)}, the business requires {breakEvenMrr ? formatCurrency(breakEvenMrr, curr, true) : "N/A"} in monthly recurring collections.
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Trajectory Diagnosis</span>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isDefaultAlive
                  ? `Your active model reaches cash-flow positive in Month ${summary.break_even_month} while maintaining ending cash at ${formatCurrency(summary.ending_cash, curr, true)}. The company is mathematically Default Alive.`
                  : summary.break_even_month
                  ? `Operating break-even is achieved in Month ${summary.break_even_month}, but peak cash deficit reaches ${formatCurrency(summary.peak_cash_deficit, curr, true)}. Additional capital buffer or cost deferrals are required.`
                  : `Current growth rate and unit margins do not reach operating break-even within the 12-month horizon. Ending cash is projected at ${formatCurrency(summary.ending_cash, curr, true)}.`}
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Required Break-Even Customers</span>
              <div className="text-sm font-bold text-slate-900">
                {breakEvenMrr && formState.arpu > 0
                  ? `${Math.ceil(breakEvenMrr / formState.arpu)} Active Accounts`
                  : "N/A"}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                At your current ARPU of {formatCurrency(formState.arpu, curr)}/mo, reaching {breakEvenMrr && formState.arpu > 0 ? Math.ceil(breakEvenMrr / formState.arpu) : "N/A"} active customers will make the company self-sustaining.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* INPUT CONFIGURATION SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Business Metadata & Opening Balances */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            1. Company Profile &amp; Balances
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                value={formState.company_name}
                onChange={(e) => handleChange("company_name", e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Business Model</label>
              <select
                value={formState.business_model}
                onChange={(e) => handleChange("business_model", e.target.value as BusinessModelType)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              >
                <option value="b2b_saas">B2B SaaS</option>
                <option value="b2c_subscription">B2C Subscription</option>
                <option value="subscription_services">Subscription Services</option>
                <option value="recurring_digital">Recurring Digital</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Planning Horizon</label>
              <select
                value={formState.planning_horizon}
                onChange={(e) => handleChange("planning_horizon", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              >
                <option value={12}>12 Months (1 Year)</option>
                <option value={18}>18 Months (1.5 Years)</option>
                <option value={24}>24 Months (2 Years)</option>
                <option value={36}>36 Months (3 Years)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Opening Paying Customers</label>
              <div className="mt-1">
                <FormattedNumberInput
                  value={formState.initial_paying_customers}
                  onChange={(val) => handleChange("initial_paying_customers", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Opening Cash Balance ({curr})</label>
              <div className="mt-1">
                <FormattedNumberInput
                  isCurrency={true}
                  currency={curr}
                  value={formState.initial_cash_balance}
                  onChange={(val) => handleChange("initial_cash_balance", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Minimum Cash Reserve Hurdle ({curr})</label>
              <div className="mt-1">
                <FormattedNumberInput
                  isCurrency={true}
                  currency={curr}
                  value={formState.minimum_cash_reserve}
                  onChange={(val) => handleChange("minimum_cash_reserve", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Revenue Engine & Customer Retention */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            2. Revenue Engine &amp; Retention
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Average Revenue / User ({curr})</label>
              <div className="mt-1">
                <FormattedNumberInput
                  isCurrency={true}
                  currency={curr}
                  value={formState.arpu}
                  onChange={(val) => handleChange("arpu", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>

            <div>
              <PercentageInput
                label="Monthly Churn Rate (%)"
                value={formState.customer_churn_rate}
                onChange={(val) => handleChange("customer_churn_rate", Number(val) || 0)}
                placeholderPercent="e.g. 5%"
                compact={true}
              />
            </div>

            <div>
              <PercentageInput
                label="Monthly Expansion Rate (%)"
                value={formState.expansion_rate}
                onChange={(val) => handleChange("expansion_rate", Number(val) || 0)}
                placeholderPercent="e.g. 1.5%"
                compact={true}
              />
            </div>

            <div>
              <PercentageInput
                label="Monthly Contraction Rate (%)"
                value={formState.contraction_rate}
                onChange={(val) => handleChange("contraction_rate", Number(val) || 0)}
                placeholderPercent="e.g. 0.5%"
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Customer Acquisition Funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Customer Acquisition Engine
            </h3>
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleChange("acquisition_mode", "lead_based")}
                className={`rounded px-2 py-0.5 font-medium transition-all ${
                  formState.acquisition_mode === "lead_based"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Lead Funnel
              </button>
              <button
                type="button"
                onClick={() => handleChange("acquisition_mode", "budget_based")}
                className={`rounded px-2 py-0.5 font-medium transition-all ${
                  formState.acquisition_mode === "budget_based"
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Target CAC
              </button>
            </div>
          </div>

          {formState.acquisition_mode === "lead_based" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Monthly Leads</label>
                <div className="mt-1">
                  <FormattedNumberInput
                    value={formState.monthly_leads}
                    onChange={(val) => handleChange("monthly_leads", Number(val) || 0)}
                    placeholder="0"
                    compact={true}
                  />
                </div>
              </div>

              <div>
                <PercentageInput
                  label="Lead-to-Customer Conv (%)"
                  value={formState.lead_conversion_rate}
                  onChange={(val) => handleChange("lead_conversion_rate", Number(val) || 0)}
                  placeholderPercent="e.g. 3.5%"
                  compact={true}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Cost Per Lead ({curr})</label>
                <div className="mt-1">
                  <FormattedNumberInput
                    isCurrency={true}
                    currency={curr}
                    value={formState.cost_per_lead}
                    onChange={(val) => handleChange("cost_per_lead", Number(val) || 0)}
                    placeholder="0"
                    compact={true}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Organic Customers / Month</label>
                <div className="mt-1">
                  <FormattedNumberInput
                    value={formState.organic_new_customers}
                    onChange={(val) => handleChange("organic_new_customers", Number(val) || 0)}
                    placeholder="0"
                    compact={true}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Monthly Marketing Budget ({curr})</label>
                <div className="mt-1">
                  <FormattedNumberInput
                    isCurrency={true}
                    currency={curr}
                    value={formState.acquisition_budget}
                    onChange={(val) => handleChange("acquisition_budget", Number(val) || 0)}
                    placeholder="0"
                    compact={true}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Target CAC ({curr})</label>
                <div className="mt-1">
                  <FormattedNumberInput
                    isCurrency={true}
                    currency={curr}
                    value={formState.target_cac}
                    onChange={(val) => handleChange("target_cac", Number(val) || 0)}
                    placeholder="0"
                    compact={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: COGS & Operating Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            4. Direct Delivery COGS &amp; Overhead
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <PercentageInput
                label="Payment Gateway Fee (%)"
                value={formState.payment_processing_rate}
                onChange={(val) => handleChange("payment_processing_rate", Number(val) || 0)}
                placeholderPercent="e.g. 2.5%"
                compact={true}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Fixed Hosting / Cloud ({curr})</label>
              <div className="mt-1">
                <FormattedNumberInput
                  isCurrency={true}
                  currency={curr}
                  value={formState.hosting_fixed_cost}
                  onChange={(val) => handleChange("hosting_fixed_cost", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Servicing Cost / Cust ({curr})</label>
              <div className="mt-1">
                <FormattedNumberInput
                  isCurrency={true}
                  currency={curr}
                  value={formState.servicing_cost_per_customer}
                  onChange={(val) => handleChange("servicing_cost_per_customer", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Fixed OpEx Overhead ({curr}/mo)</label>
              <div className="mt-1">
                <FormattedNumberInput
                  isCurrency={true}
                  currency={curr}
                  value={formState.fixed_opex}
                  onChange={(val) => handleChange("fixed_opex", Number(val) || 0)}
                  placeholder="0"
                  compact={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT THESIS ANGLES & FINANCIAL ARCHITECTURE PLAYBOOK */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Financial Architecture: Strategic Theses
            </h3>
          </div>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
            Operating Playbook
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <Scale className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">1. Fixed Overhead Containment</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Keep non-payroll fixed OpEx under 18% of monthly cash burn.
            </p>
            <div className="rounded-lg bg-emerald-50/80 p-2 text-[11px] text-emerald-900 font-medium">
              Impact: Lowering fixed overhead by {formatCurrency(Math.max(1000, formState.fixed_opex * 0.25), curr, true)} drops the monthly break-even hurdle by {formatCurrency(Math.max(1000, formState.fixed_opex * 0.25) / Math.max(0.1, cmPct), curr, true)}.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">2. Negative Working Capital Float</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Collect subscription revenues on Day 0 while negotiating Net-30 payment terms with hosting and software vendors.
            </p>
            <div className="rounded-lg bg-blue-50/80 p-2 text-[11px] text-blue-900 font-medium">
              Impact: Operates the business on vendor float rather than equity treasury, extending runway without dilution.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 hover:border-emerald-300 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-slate-900">3. Gross Margin Compression Defense</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Direct delivery costs (payment gateways, hosting, support) compound as customer count scales.
            </p>
            <div className="rounded-lg bg-purple-50/80 p-2 text-[11px] text-purple-900 font-medium">
              Impact: A 5% improvement in contribution margin compresses the required break-even customer volume by ~18%.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sticky/Action Bar for Convenient Recalculation on Mobile & Desktop */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-500 text-center sm:text-left">
          Modifications instantly recalculate your 12-month balance sheet &amp; solvency horizon.
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
          >
            {savedSuccess ? <Check className="h-4 w-4" /> : <Sliders className="h-3.5 w-3.5" />}
            <span>{savedSuccess ? "Applied Successfully!" : "Recalculate Model"}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
