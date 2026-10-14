"use client";

import React, { useState, useRef } from "react";
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
  CheckCircle2,
  FileUp,
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
  const [tab, setTab] = useState<"quick_form" | "paste_text" | "upload_pdf">("quick_form");

  // Form State
  const [companyName, setCompanyName] = useState<string>(currentInputs.company_name);
  const [currency, setCurrency] = useState<CurrencyCode>(currentInputs.currency);
  const [businessModel, setBusinessModel] = useState<BusinessModelType>(currentInputs.business_model);
  const [customers, setCustomers] = useState<number>(currentInputs.initial_paying_customers || 35);
  const [arpu, setArpu] = useState<number>(currentInputs.arpu || 3000);
  const [cashBalance, setCashBalance] = useState<number>(currentInputs.initial_cash_balance || 2500000);
  const [minReserve, setMinReserve] = useState<number>(currentInputs.minimum_cash_reserve || 500000);
  const [churnRate, setChurnRate] = useState<number>(currentInputs.customer_churn_rate || 0.03);
  const [monthlyMarketing, setMonthlyMarketing] = useState<number>(currentInputs.acquisition_budget || 200000);
  const [customDecision, setCustomDecision] = useState<string>(
    "Reach ₹1 Crore ARR run rate within 12 months with ₹25 Lakh budget."
  );

  // Paste Text & File Upload State
  const [pastedText, setPastedText] = useState<string>("");
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Presets
  const handleSelectPreset = (presetType: "seed_b2b" | "bootstrapped" | "b2c" | "enterprise") => {
    if (presetType === "seed_b2b") {
      setCompanyName("CloudFlow Analytics");
      setCurrency("INR");
      setBusinessModel("b2b_saas");
      setCustomers(45);
      setArpu(4000);
      setCashBalance(3500000);
      setMinReserve(700000);
      setChurnRate(0.025);
      setMonthlyMarketing(250000);
      setCustomDecision("Target ₹1.5 Crore ARR in 12 months with ₹35 Lakh budget.");
    } else if (presetType === "bootstrapped") {
      setCompanyName("QuickMetrics B2B");
      setCurrency("INR");
      setBusinessModel("b2b_saas");
      setCustomers(120);
      setArpu(2000);
      setCashBalance(1200000);
      setMinReserve(300000);
      setChurnRate(0.02);
      setMonthlyMarketing(80000);
      setCustomDecision("Can we achieve break-even within 6 months without external funding?");
    } else if (presetType === "b2c") {
      setCompanyName("ProFit Mobile App");
      setCurrency("INR");
      setBusinessModel("b2c_subscription");
      setCustomers(850);
      setArpu(499);
      setCashBalance(1800000);
      setMinReserve(400000);
      setChurnRate(0.06);
      setMonthlyMarketing(300000);
      setCustomDecision("Evaluate marketing scale from ₹3L to ₹6L per month.");
    } else {
      setCompanyName("EnterpriseGrid");
      setCurrency("USD");
      setBusinessModel("b2b_saas");
      setCustomers(10);
      setArpu(1500); // $1500/mo = $18k ACV
      setCashBalance(400000);
      setMinReserve(80000);
      setChurnRate(0.01);
      setMonthlyMarketing(25000);
      setCustomDecision("Reach $1M ARR within 18 months with $400K cash budget.");
    }
    setExtractionNotice("Preset applied to form!");
  };

  // Heuristic extractor for text content (pasted or uploaded)
  const extractMetricsFromRawText = (rawContent: string, sourceLabel: string) => {
    const text = rawContent.toLowerCase();
    let extractedCount = 0;

    // Currency heuristic
    if (text.includes("dollar") || text.includes("$") || text.includes("usd")) {
      setCurrency("USD");
      extractedCount++;
    } else if (text.includes("₹") || text.includes("inr") || text.includes("rupee") || text.includes("lakh") || text.includes("crore")) {
      setCurrency("INR");
      extractedCount++;
    } else if (text.includes("€") || text.includes("eur") || text.includes("euro")) {
      setCurrency("EUR");
      extractedCount++;
    }

    // Company Name heuristic
    const nameMatch = rawContent.match(/(?:company|startup|name|project)[:\s]+([A-Za-z0-9\s]{3,25})/i);
    if (nameMatch && nameMatch[1]) {
      setCompanyName(nameMatch[1].trim());
      extractedCount++;
    }

    // Customer count heuristic
    const custMatch = text.match(/(\d+)\s*(?:paying\s*)?(?:customers|clients|accounts|users|subscribers)/);
    if (custMatch) {
      setCustomers(parseInt(custMatch[1], 10));
      extractedCount++;
    }

    // Price / ARPU heuristic
    const arpuMatch = text.match(/(?:₹|\$|€|rs\.?|inr)?\s*(\d{2,6})\s*(?:\/|per|\s)*(?:month|mo|cust|user|arpu|seat)/);
    if (arpuMatch) {
      setArpu(parseInt(arpuMatch[1], 10));
      extractedCount++;
    }

    // Cash balance heuristic
    const cashLakhMatch = text.match(/(?:cash|bank|balance|reserve)[\s\w:]*(\d+(?:\.\d+)?)\s*(?:lakh|l)/);
    if (cashLakhMatch) {
      const lakhs = parseFloat(cashLakhMatch[1]);
      setCashBalance(Math.round(lakhs * 100000));
      setMinReserve(Math.round(lakhs * 20000));
      extractedCount++;
    } else {
      const cashMatch = text.match(/(?:cash|bank|balance|reserve)[\s\w:]*(\d{4,9})/);
      if (cashMatch) {
        const cashVal = parseInt(cashMatch[1], 10);
        setCashBalance(cashVal);
        setMinReserve(Math.round(cashVal * 0.2));
        extractedCount++;
      }
    }

    // Churn rate heuristic
    const churnMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:monthly\s*)?churn/);
    if (churnMatch) {
      setChurnRate(parseFloat(churnMatch[1]) / 100);
      extractedCount++;
    }

    // Marketing spend heuristic
    const mktMatch = text.match(/(?:marketing|ad\s*spend|acquisition)[\s\w:]*(\d{4,8})/);
    if (mktMatch) {
      setMonthlyMarketing(parseInt(mktMatch[1], 10));
      extractedCount++;
    }

    // Decision goal extraction
    const decisionMatch = text.match(/(?:goal|target|decision|objective)[:\s]+([^\n.]{15,120})/i);
    if (decisionMatch && decisionMatch[1]) {
      setCustomDecision(decisionMatch[1].trim());
      extractedCount++;
    } else if (rawContent.length > 20) {
      setCustomDecision(rawContent.slice(0, 100).trim() + "...");
    }

    setExtractionNotice(`Successfully parsed ${sourceLabel}: updated ${extractedCount} parameters. Review below.`);
    setTab("quick_form");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      extractMetricsFromRawText(content, file.name);
    };

    // Read as text (covers .txt, .md, .csv, and extracts raw text strings from PDF)
    reader.readAsText(file);
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
      minimum_cash_reserve: Number(minReserve),
      customer_churn_rate: Number(churnRate),
      acquisition_budget: Number(monthlyMarketing),
      monthly_leads: Math.round(Number(monthlyMarketing) / 200),
    };

    onSubmit(updatedInputs, customDecision);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Simulate Your Startup</h3>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  Interactive Model Intake
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Input your startup actuals, upload pitch deck notes, and define the strategic decision to simulate
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
            <span className="text-[11px] font-semibold text-slate-600">Quick Portfolio Profiles:</span>
            <span className="text-[10px] text-slate-400">1-click sample business models</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset("seed_b2b")}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800 text-[11px]">Seed B2B SaaS</div>
              <div className="text-[10px] text-slate-500">₹4k ARPU • 45 Cust</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("bootstrapped")}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800 text-[11px]">Bootstrapped</div>
              <div className="text-[10px] text-slate-500">₹2k ARPU • 120 Cust</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("b2c")}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800 text-[11px]">B2C Mobile App</div>
              <div className="text-[10px] text-slate-500">₹499 ARPU • 850 Cust</div>
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset("enterprise")}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-left hover:bg-emerald-50 hover:border-emerald-300 transition-all text-xs"
            >
              <div className="font-semibold text-slate-800 text-[11px]">Enterprise Tier</div>
              <div className="text-[10px] text-slate-500">$1.5k/mo • 10 Cust</div>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl border border-slate-200 bg-slate-100/70 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab("quick_form")}
            className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
              tab === "quick_form" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Structured Inputs
          </button>
          <button
            type="button"
            onClick={() => setTab("paste_text")}
            className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
              tab === "paste_text" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Paste Pitch Notes
          </button>
          <button
            type="button"
            onClick={() => setTab("upload_pdf")}
            className={`flex-1 rounded-lg py-1.5 font-semibold transition-all ${
              tab === "upload_pdf" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upload Document / PDF
          </button>
        </div>

        {/* Extraction Feedback Banner */}
        {extractionNotice && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{extractionNotice}</span>
          </div>
        )}

        {/* TAB 1: Structured Form */}
        {tab === "quick_form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Monthly ARPU ({currency} / customer / mo)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={arpu}
                  onChange={(e) => setArpu(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Cash in Bank ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={cashBalance}
                  onChange={(e) => setCashBalance(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Minimum Cash Reserve Floor ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={minReserve}
                  onChange={(e) => setMinReserve(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Monthly Customer Churn Rate (e.g. 0.03 = 3%)
                </label>
                <input
                  type="number"
                  step={0.005}
                  min={0}
                  max={0.5}
                  required
                  value={churnRate}
                  onChange={(e) => setChurnRate(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Monthly Marketing Budget ({currency})
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={monthlyMarketing}
                  onChange={(e) => setMonthlyMarketing(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="col-span-2 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span>The Strategic Decision / Goal You Want to Simulate:</span>
                </label>
                <input
                  type="text"
                  value={customDecision}
                  onChange={(e) => setCustomDecision(e.target.value)}
                  placeholder="e.g. Reach ₹1 Crore ARR run rate within 12 months with ₹25L cash budget"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Run & Calculate Button */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
              >
                <span>Apply to Model & Run Simulation</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: Paste Notes Text */}
        {tab === "paste_text" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Paste your company pitch notes, metrics, or financial summary below. Our heuristic extractor will parse your customer counts, pricing, cash reserves, and target milestones:
            </p>
            <textarea
              rows={6}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. 'We are an AI SaaS startup with 45 paying customers paying ₹4,000/month. We have ₹35 Lakhs in the bank and spend ₹2.5 Lakhs on marketing with 2.5% churn. Our primary objective is to reach ₹1.5 Crore ARR within 12 months without running out of cash.'"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
            />
            <button
              type="button"
              onClick={() => extractMetricsFromRawText(pastedText, "pasted text")}
              disabled={!pastedText.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Extract Metrics into Simulation Form</span>
            </button>
          </div>
        )}

        {/* TAB 3: Upload Document / PDF */}
        {tab === "upload_pdf" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Upload your startup pitch deck, business summary, or financial brief (PDF, TXT, or Markdown) to automatically extract inputs:
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-emerald-500 hover:bg-emerald-50/30 transition-all cursor-pointer space-y-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mx-auto">
                <FileUp className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800">
                  {uploadedFileName ? uploadedFileName : "Click or drag document to upload"}
                </p>
                <p className="text-[11px] text-slate-400">Supports PDF, TXT, MD, CSV documents</p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.md,.csv,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedFileName && (
              <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">{uploadedFileName}</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-semibold">Ready for extraction</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
