"use client";

import React, { useState } from "react";
import { ModelEngineInputs, BusinessModelType, CurrencyCode, AcquisitionMode } from "@/types/model";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { Sliders, RotateCcw, Check } from "lucide-react";
import { DEFAULT_SAAS_MODEL } from "@/lib/defaultModel";

interface ModelEditorViewProps {
  inputs: ModelEngineInputs;
  onUpdateInputs: (inputs: ModelEngineInputs) => void;
}

export const ModelEditorView: React.FC<ModelEditorViewProps> = ({
  inputs,
  onUpdateInputs,
}) => {
  const [formState, setFormState] = useState<ModelEngineInputs>(inputs);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

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

  return (
    <form onSubmit={handleApply} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Financial Assumptions & Configuration</h2>
          <p className="text-xs text-slate-500">
            Define baseline parameters. Every change directly recalibrates the deterministic model engine.
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Business Metadata & Opening Balances */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            1. Company Profile & Balances
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
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
              <input
                type="number"
                min={0}
                value={formState.initial_paying_customers}
                onChange={(e) => handleChange("initial_paying_customers", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Opening Cash Balance ({curr})</label>
              <input
                type="number"
                min={0}
                value={formState.initial_cash_balance}
                onChange={(e) => handleChange("initial_cash_balance", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-medium text-slate-700">Minimum Cash Reserve Buffer ({curr})</label>
              <input
                type="number"
                min={0}
                value={formState.minimum_cash_reserve}
                onChange={(e) => handleChange("minimum_cash_reserve", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Threshold below which the engine raises a cash runway reserve breach warning.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Retention */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            2. Pricing, Churn & Expansion
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Monthly Price (ARPU in {curr})</label>
              <input
                type="number"
                min={0}
                value={formState.arpu}
                onChange={(e) => handleChange("arpu", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Monthly Customer Churn Rate</label>
              <input
                type="number"
                step={0.001}
                min={0}
                max={1}
                value={formState.customer_churn_rate}
                onChange={(e) => handleChange("customer_churn_rate", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Current: {formatPercent(formState.customer_churn_rate)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Monthly Expansion Rate</label>
              <input
                type="number"
                step={0.001}
                min={0}
                max={1}
                value={formState.expansion_rate}
                onChange={(e) => handleChange("expansion_rate", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Current: {formatPercent(formState.expansion_rate)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Monthly Contraction Rate</label>
              <input
                type="number"
                step={0.001}
                min={0}
                max={1}
                value={formState.contraction_rate}
                onChange={(e) => handleChange("contraction_rate", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Current: {formatPercent(formState.contraction_rate)}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Customer Acquisition Funnel */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              3. Customer Acquisition Engine
            </h3>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleChange("acquisition_mode", "lead_based")}
                className={`rounded px-2 py-0.5 font-medium ${
                  formState.acquisition_mode === "lead_based"
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-500"
                }`}
              >
                Lead-Based
              </button>
              <button
                type="button"
                onClick={() => handleChange("acquisition_mode", "budget_based")}
                className={`rounded px-2 py-0.5 font-medium ${
                  formState.acquisition_mode === "budget_based"
                    ? "bg-white text-slate-900 shadow-sm font-semibold"
                    : "text-slate-500"
                }`}
              >
                Budget-Based
              </button>
            </div>
          </div>

          {formState.acquisition_mode === "lead_based" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Monthly Leads Volume</label>
                <input
                  type="number"
                  min={0}
                  value={formState.monthly_leads}
                  onChange={(e) => handleChange("monthly_leads", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Lead-to-Paid Conversion Rate</label>
                <input
                  type="number"
                  step={0.001}
                  min={0}
                  max={1}
                  value={formState.lead_conversion_rate}
                  onChange={(e) => handleChange("lead_conversion_rate", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Current: {formatPercent(formState.lead_conversion_rate)}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Cost Per Lead ({curr})</label>
                <input
                  type="number"
                  min={0}
                  value={formState.cost_per_lead}
                  onChange={(e) => handleChange("cost_per_lead", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">Organic New Customers / Mo</label>
                <input
                  type="number"
                  min={0}
                  value={formState.organic_new_customers}
                  onChange={(e) => handleChange("organic_new_customers", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700">Monthly Marketing Budget ({curr})</label>
                <input
                  type="number"
                  min={0}
                  value={formState.acquisition_budget}
                  onChange={(e) => handleChange("acquisition_budget", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700">Target CAC ({curr})</label>
                <input
                  type="number"
                  min={1}
                  value={formState.target_cac}
                  onChange={(e) => handleChange("target_cac", Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: COGS & Operating Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            4. Direct Delivery COGS & Overhead
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Payment Gateway Fee (%)</label>
              <input
                type="number"
                step={0.001}
                min={0}
                max={0.2}
                value={formState.payment_processing_rate}
                onChange={(e) => handleChange("payment_processing_rate", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Current: {formatPercent(formState.payment_processing_rate)}
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Fixed Hosting / Cloud ({curr})</label>
              <input
                type="number"
                min={0}
                value={formState.hosting_fixed_cost}
                onChange={(e) => handleChange("hosting_fixed_cost", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Servicing Cost / Cust ({curr})</label>
              <input
                type="number"
                min={0}
                value={formState.servicing_cost_per_customer}
                onChange={(e) => handleChange("servicing_cost_per_customer", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Fixed OpEx Overhead ({curr}/mo)</label>
              <input
                type="number"
                min={0}
                value={formState.fixed_opex}
                onChange={(e) => handleChange("fixed_opex", Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
