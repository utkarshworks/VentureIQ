"use client";

import React, { useState } from "react";
import { ModelEngineInputs, BusinessModelType, CurrencyCode } from "@/types/model";
import { formatCurrency } from "@/lib/formatters";
import {
  Sparkles,
  Building2,
  FileText,
  Upload,
  ArrowRight,
  X,
  Target,
  Users,
  TrendingUp,
} from "lucide-react";

interface CompanyIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInputs: ModelEngineInputs;
  onSubmit: (newInputs: ModelEngineInputs, decisionGoalText?: string) => void;
}

export const CompanyIntakeModal: React.FC<CompanyIntakeModalProps> = ({
  isOpen,
  onClose,
  currentInputs,
  onSubmit,
}) => {
  const [tab, setTab] = useState<"quick_form" | "paste_text">("quick_form");

  // Form State
  const [companyName, setCompanyName] = useState<string>(currentInputs.company_name);
  const [currency, setCurrency] = useState<CurrencyCode>(currentInputs.currency);
  const [businessModel, setBusinessModel] = useState<BusinessModelType>(currentInputs.business_model);
  const [customers, setCustomers] = useState<number>(currentInputs.initial_paying_customers || 35);
  const [arpu, setArpu] = useState<number>(currentInputs.arpu || 3000);
  const [cashBalance, setCashBalance] = useState<number>(currentInputs.initial_cash_balance || 2500000);
  const [churnRate, setChurnRate] = useState<number>(currentInputs.customer_churn_rate || 0.03);
  const [monthlyMarketing, setMonthlyMarketing] = useState<number>(currentInputs.acquisition_budget || 200000);
  const [decisionType, setDecisionType] = useState<string>("reverse_arr");
  const [customDecision, setCustomDecision] = useState<string>(
    "Can we reach ₹1 Crore ARR within 12 months with a ₹25 Lakh budget?"
  );

  // Paste Text State
  const [pastedText, setPastedText] = useState<string>("");

  if (!isOpen) return null;

  // Preset Handlers
  const handleSelectPreset = (presetType: "seed_b2b" | "bootstrapped" | "b2c") => {
    if (presetType === "seed_b2b") {
      setCompanyName("CloudFlow Analytics");
      setCurrency("INR");
      setBusinessModel("b2b_saas");
      setCustomers(45);
      setArpu(4000);
      setCashBalance(3500000); // ₹35L
      setChurnRate(0.025);
      setMonthlyMarketing(250000);
      setCustomDecision("Target ₹1.5 Crore ARR in 12 months while keeping ₹8 Lakh cash reserve.");
    } else if (presetType === "bootstrapped") {
      setCompanyName("QuickMetrics B2B");
      setCurrency("INR");
      setBusinessModel("b2b_saas");
      setCustomers(120);
      setArpu(2000);
      setCashBalance(1200000); // ₹12L
      setChurnRate(0.02);
      setMonthlyMarketing(80000);
      setCustomDecision("Can we afford to hire 2 developers without external funding?");
    } else {
      setCompanyName("ProFit Mobile App");
      setCurrency("INR");
      setBusinessModel("b2c_subscription");
      setCustomers(850);
      setArpu(499);
      setCashBalance(1800000);
      setChurnRate(0.06);
      setMonthlyMarketing(300000);
      setCustomDecision("Evaluate marketing scale from ₹3L to ₹6L per month.");
    }
  };

  // Heuristic extractor for pasted company text
  const handleParsePastedText = () => {
    const text = pastedText.toLowerCase();

    // Extract numbers heuristics
    const custMatch = text.match(/(\d+)\s*(paying\s*)?customers/);
    if (custMatch) setCustomers(parseInt(custMatch[1], 10));

    const arpuMatch = text.match(/(₹|\$|rs\.?|inr)?\s*(\d{2,6})\s*(\/|per|\s)*(month|mo|cust|user|arpu)/);
    if (arpuMatch) setArpu(parseInt(arpuMatch[2], 10));

    const cashMatch = text.match(/(cash|bank|balance|reserve)[\s\w:]*(\d{5,9})/);
    if (cashMatch) setCashBalance(parseInt(cashMatch[2], 10));

    setCustomDecision(pastedText.slice(0, 120));
    setTab("quick_form");
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedInputs: ModelEngineInputs = {
      ...currentInputs,
      company_name: companyName || "My Startup",
      currency,
      business_model: businessModel,
      initial_paying_customers: Number(customers),
      arpu: Number(arpu),
      initial_cash_balance: Number(cashBalance),
      customer_churn_rate: Number(churnRate),
      acquisition_budget: Number(monthlyMarketing),
      monthly_leads: Math.round(Number(monthlyMarketing) / 200),
      minimum_cash_reserve: Math.round(Number(cashBalance) * 0.2),
    };

    onSubmit(updatedInputs, customDecision);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Company Data & Decision Simulation Intake
              </h3>
              <p className="text-[11px] text-slate-500">
                Input your startup actuals and the financial decision you want to evaluate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Quick Portfolio Presets:</span>
            <span className="text-[10px] text-slate-400">One-click sample profiles</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset("seed_b2b")}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800">Seed B2B SaaS</div>
              <div className="text-[10px] text-slate-500">₹4k ARPU • 45 Cust • ₹35L Cash</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("bootstrapped")}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800">Bootstrapped B2B</div>
              <div className="text-[10px] text-slate-500">₹2k ARPU • 120 Cust • ₹12L Cash</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("b2c")}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800">B2C Subscription</div>
              <div className="text-[10px] text-slate-500">₹499 ARPU • 850 Cust • 6% Churn</div>
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("quick_form")}
            className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
              tab === "quick_form" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Structured Input Form
          </button>
          <button
            type="button"
            onClick={() => setTab("paste_text")}
            className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
              tab === "paste_text" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Paste Pitch / Notes Text
          </button>
        </div>

        {tab === "paste_text" ? (
          <div className="space-y-3">
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste company summary or notes here... (e.g. 'We are an AI SaaS startup with 50 paying customers paying ₹3500/month. We have ₹25 Lakhs in bank and spend ₹1.5 Lakhs on marketing with 3% churn. We want to see if we can reach ₹1 Crore ARR within 12 months.')"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={handleParsePastedText}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Extract Metrics into Form</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                >
                  <option value="INR">₹ INR (Indian Rupee)</option>
                  <option value="USD">$ USD (US Dollar)</option>
                  <option value="EUR">€ EUR (Euro)</option>
                  <option value="GBP">£ GBP (British Pound)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Current Paying Customers
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={customers}
                  onChange={(e) => setCustomers(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Monthly Price (ARPU in {currency})
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={arpu}
                  onChange={(e) => setArpu(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Current Cash Balance ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Monthly Churn Rate (e.g. 0.03 = 3%)
                </label>
                <input
                  type="number"
                  step={0.005}
                  min={0}
                  max={0.5}
                  required
                  value={churnRate}
                  onChange={(e) => setChurnRate(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-medium text-slate-700">
                  Monthly Marketing / Acquisition Spend ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={monthlyMarketing}
                  onChange={(e) => setMonthlyMarketing(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium"
                />
              </div>

              <div className="col-span-2 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span>The Strategic Decision You Want to Simulate:</span>
                </label>
                <input
                  type="text"
                  value={customDecision}
                  onChange={(e) => setCustomDecision(e.target.value)}
                  placeholder="e.g. Reach ₹1 Crore ARR run rate within 12 months with ₹25L cash budget"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
            >
              <span>Generate Financial Model & Decision Brief</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
