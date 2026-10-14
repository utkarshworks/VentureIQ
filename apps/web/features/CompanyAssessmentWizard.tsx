"use client";

import React, { useState, useRef } from "react";
import {
  ModelEngineInputs,
  BusinessModelType,
  CurrencyCode,
  AcquisitionMode,
} from "@/types/model";
import { formatCurrency } from "@/lib/formatters";
import {
  Building2,
  Target,
  Users,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  FileText,
  FileUp,
  Briefcase,
  DollarSign,
  ChevronRight,
  SlidersHorizontal,
} from "lucide-react";

interface CompanyAssessmentWizardProps {
  initialInputs: ModelEngineInputs;
  initialDecisionGoal: string;
  onComplete: (completedInputs: ModelEngineInputs, decisionGoal: string) => void;
  onSkipToDemo: () => void;
}

export const CompanyAssessmentWizard: React.FC<CompanyAssessmentWizardProps> = ({
  initialInputs,
  initialDecisionGoal,
  onComplete,
  onSkipToDemo,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Company Profile & Horizon
  const [companyName, setCompanyName] = useState<string>(initialInputs.company_name || "");
  const [businessModel, setBusinessModel] = useState<BusinessModelType>(initialInputs.business_model || "b2b_saas");
  const [currency, setCurrency] = useState<CurrencyCode>(initialInputs.currency || "INR");
  const [planningHorizon, setPlanningHorizon] = useState<number>(initialInputs.planning_horizon || 12);

  // Step 2: Baseline Revenue & Customers
  const [customers, setCustomers] = useState<number>(initialInputs.initial_paying_customers ?? 40);
  const [arpu, setArpu] = useState<number>(initialInputs.arpu ?? 3500);
  const [cashBalance, setCashBalance] = useState<number>(initialInputs.initial_cash_balance ?? 3500000);
  const [minReserve, setMinReserve] = useState<number>(initialInputs.minimum_cash_reserve ?? 800000);

  // Step 3: Growth, Acquisition & Churn
  const [acquisitionMode, setAcquisitionMode] = useState<AcquisitionMode>(initialInputs.acquisition_mode || "lead_based");
  const [monthlyLeads, setMonthlyLeads] = useState<number>(initialInputs.monthly_leads ?? 1200);
  const [leadConversionRate, setLeadConversionRate] = useState<number>(initialInputs.lead_conversion_rate ?? 0.035);
  const [costPerLead, setCostPerLead] = useState<number>(initialInputs.cost_per_lead ?? 180);
  const [acquisitionBudget, setAcquisitionBudget] = useState<number>(initialInputs.acquisition_budget ?? 250000);
  const [targetCac, setTargetCac] = useState<number>(initialInputs.target_cac ?? 6000);
  const [organicCustomers, setOrganicCustomers] = useState<number>(initialInputs.organic_new_customers ?? 3);
  const [churnRate, setChurnRate] = useState<number>(initialInputs.customer_churn_rate ?? 0.025);
  const [expansionRate, setExpansionRate] = useState<number>(initialInputs.expansion_rate ?? 0.015);

  // Step 4: Cost Structure & Team
  const [monthlyPayroll, setMonthlyPayroll] = useState<number>(205000);
  const [fixedOpex, setFixedOpex] = useState<number>(initialInputs.fixed_opex ?? 120000);
  const [paymentProcRate, setPaymentProcRate] = useState<number>(initialInputs.payment_processing_rate ?? 0.025);
  const [hostingPerCustomer, setHostingPerCustomer] = useState<number>(initialInputs.hosting_cost_per_customer ?? 15);
  const [servicingPerCustomer, setServicingPerCustomer] = useState<number>(initialInputs.servicing_cost_per_customer ?? 40);

  // Step 5: Strategic Milestone & Reverse-Planning Decision Goal
  const [decisionPreset, setDecisionPreset] = useState<string>("target_arr");
  const [decisionGoalText, setDecisionGoalText] = useState<string>(
    initialDecisionGoal || "Reach ₹1 Crore ARR run rate within 12 months with ₹25 Lakh budget."
  );

  // Document/Notes Heuristic Extraction State
  const [showDocExtractor, setShowDocExtractor] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>("");
  const [extractorNotification, setExtractorNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1-Click Profile Presets
  const handleApplyPreset = (type: "seed_b2b" | "bootstrapped" | "b2c" | "enterprise") => {
    if (type === "seed_b2b") {
      setCompanyName("CloudFlow Analytics");
      setCurrency("INR");
      setBusinessModel("b2b_saas");
      setPlanningHorizon(12);
      setCustomers(45);
      setArpu(4000);
      setCashBalance(3500000);
      setMinReserve(700000);
      setAcquisitionMode("lead_based");
      setMonthlyLeads(1400);
      setLeadConversionRate(0.035);
      setCostPerLead(180);
      setAcquisitionBudget(250000);
      setChurnRate(0.025);
      setMonthlyPayroll(210000);
      setFixedOpex(120000);
      setDecisionGoalText("Target ₹1.5 Crore ARR in 12 months with ₹35 Lakh budget.");
    } else if (type === "bootstrapped") {
      setCompanyName("QuickMetrics B2B");
      setCurrency("INR");
      setBusinessModel("b2b_saas");
      setPlanningHorizon(12);
      setCustomers(120);
      setArpu(2000);
      setCashBalance(1200000);
      setMinReserve(300000);
      setAcquisitionMode("lead_based");
      setMonthlyLeads(800);
      setLeadConversionRate(0.04);
      setCostPerLead(100);
      setAcquisitionBudget(80000);
      setChurnRate(0.02);
      setMonthlyPayroll(150000);
      setFixedOpex(60000);
      setDecisionGoalText("Can we achieve operating break-even within 6 months without external funding?");
    } else if (type === "b2c") {
      setCompanyName("ProFit Mobile");
      setCurrency("INR");
      setBusinessModel("b2c_subscription");
      setPlanningHorizon(12);
      setCustomers(850);
      setArpu(499);
      setCashBalance(1800000);
      setMinReserve(400000);
      setAcquisitionMode("budget_based");
      setAcquisitionBudget(300000);
      setTargetCac(1200);
      setChurnRate(0.06);
      setMonthlyPayroll(180000);
      setFixedOpex(90000);
      setDecisionGoalText("Evaluate marketing scale from ₹3L to ₹6L per month while keeping ₹4L reserve.");
    } else {
      setCompanyName("EnterpriseGrid");
      setCurrency("USD");
      setBusinessModel("b2b_saas");
      setPlanningHorizon(18);
      setCustomers(12);
      setArpu(1800);
      setCashBalance(450000);
      setMinReserve(90000);
      setAcquisitionMode("lead_based");
      setMonthlyLeads(250);
      setLeadConversionRate(0.05);
      setCostPerLead(120);
      setAcquisitionBudget(30000);
      setChurnRate(0.01);
      setMonthlyPayroll(35000);
      setFixedOpex(15000);
      setDecisionGoalText("Reach $1M ARR within 18 months with $450K cash budget.");
    }
    setExtractorNotification("Profile preset applied across all assessment steps!");
  };

  // Heuristic Extractor from pasted text or uploaded document
  const handleExtractFromText = (text: string, sourceLabel: string) => {
    const raw = text.toLowerCase();
    let fieldsCount = 0;

    if (raw.includes("dollar") || raw.includes("$") || raw.includes("usd")) {
      setCurrency("USD");
      fieldsCount++;
    } else if (raw.includes("₹") || raw.includes("inr") || raw.includes("rupee") || raw.includes("lakh") || raw.includes("crore")) {
      setCurrency("INR");
      fieldsCount++;
    }

    const nameMatch = text.match(/(?:company|startup|name|project)[:\s]+([A-Za-z0-9\s]{3,25})/i);
    if (nameMatch && nameMatch[1]) {
      setCompanyName(nameMatch[1].trim());
      fieldsCount++;
    }

    const custMatch = raw.match(/(\d+)\s*(?:paying\s*)?(?:customers|clients|accounts|users|subscribers)/);
    if (custMatch) {
      setCustomers(parseInt(custMatch[1], 10));
      fieldsCount++;
    }

    const arpuMatch = raw.match(/(?:₹|\$|€|rs\.?|inr)?\s*(\d{2,6})\s*(?:\/|per|\s)*(?:month|mo|cust|user|arpu|seat)/);
    if (arpuMatch) {
      setArpu(parseInt(arpuMatch[1], 10));
      fieldsCount++;
    }

    const cashLakhMatch = raw.match(/(?:cash|bank|balance|reserve)[\s\w:]*(\d+(?:\.\d+)?)\s*(?:lakh|l)/);
    if (cashLakhMatch) {
      const lakhs = parseFloat(cashLakhMatch[1]);
      setCashBalance(Math.round(lakhs * 100000));
      setMinReserve(Math.round(lakhs * 20000));
      fieldsCount++;
    } else {
      const cashMatch = raw.match(/(?:cash|bank|balance|reserve)[\s\w:]*(\d{4,9})/);
      if (cashMatch) {
        const cashVal = parseInt(cashMatch[1], 10);
        setCashBalance(cashVal);
        setMinReserve(Math.round(cashVal * 0.2));
        fieldsCount++;
      }
    }

    const churnMatch = raw.match(/(\d+(?:\.\d+)?)\s*%\s*(?:monthly\s*)?churn/);
    if (churnMatch) {
      setChurnRate(parseFloat(churnMatch[1]) / 100);
      fieldsCount++;
    }

    const decisionMatch = text.match(/(?:goal|target|decision|objective)[:\s]+([^\n.]{15,120})/i);
    if (decisionMatch && decisionMatch[1]) {
      setDecisionGoalText(decisionMatch[1].trim());
      fieldsCount++;
    }

    setExtractorNotification(`Parsed ${fieldsCount} parameters from ${sourceLabel}. Check steps below.`);
    setShowDocExtractor(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      handleExtractFromText(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleFinalSubmit = () => {
    const calculatedPayroll = Math.max(0, monthlyPayroll);
    const updatedInputs: ModelEngineInputs = {
      ...initialInputs,
      company_name: companyName.trim() || "My Startup",
      business_model: businessModel,
      currency,
      planning_horizon: Number(planningHorizon),

      initial_paying_customers: Number(customers),
      arpu: Number(arpu),
      initial_cash_balance: Number(cashBalance),
      minimum_cash_reserve: Number(minReserve),

      acquisition_mode: acquisitionMode,
      monthly_leads: Number(monthlyLeads),
      lead_conversion_rate: Number(leadConversionRate),
      cost_per_lead: Number(costPerLead),
      acquisition_budget: Number(acquisitionBudget),
      target_cac: Number(targetCac),
      organic_new_customers: Number(organicCustomers),
      customer_churn_rate: Number(churnRate),
      expansion_rate: Number(expansionRate),

      fixed_opex: Number(fixedOpex),
      payment_processing_rate: Number(paymentProcRate),
      hosting_cost_per_customer: Number(hostingPerCustomer),
      servicing_cost_per_customer: Number(servicingPerCustomer),

      hiring_roles: [
        {
          role_title: "Core Team",
          department: "Operations",
          headcount: 1,
          monthly_salary: calculatedPayroll,
          employer_burden_rate: 0.1,
          start_month: 1,
          annual_increase_rate: 0.05,
        },
      ],
    };

    onComplete(updatedInputs, decisionGoalText);
  };

  const stepsList = [
    { num: 1, label: "Company Profile" },
    { num: 2, label: "Revenue & Base" },
    { num: 3, label: "Growth & Retention" },
    { num: 4, label: "Costs & Team" },
    { num: 5, label: "Strategic Decision" },
  ];

  // Dynamic calculations for preview
  const currentMrr = customers * arpu;
  const currentArr = currentMrr * 12;
  const currentMonthlyBurnEstimate = monthlyPayroll + fixedOpex + (acquisitionMode === "lead_based" ? monthlyLeads * costPerLead : acquisitionBudget);
  const roughRunwayMonths = cashBalance > 0 && currentMonthlyBurnEstimate > currentMrr ? (cashBalance / (currentMonthlyBurnEstimate - currentMrr)).toFixed(1) : "Healthy (> 24M)";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm font-bold">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-900">VentureIQ</span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                Company Intake Assessment
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Answer 5 quick sections to build your live financial model &amp; reverse-planning solver
            </p>
          </div>
        </div>

        <button
          onClick={onSkipToDemo}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors underline underline-offset-4"
        >
          Skip to Demo Dashboard &rarr;
        </button>
      </header>

      {/* Main Assessment Container */}
      <main className="max-w-4xl mx-auto w-full py-8 space-y-6 flex-1">
        {/* Quick Profiles Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">
              Quick 1-Click Profiles:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset("seed_b2b")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all"
            >
              Seed B2B SaaS
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("bootstrapped")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all"
            >
              Bootstrapped B2B
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("b2c")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all"
            >
              B2C Mobile App
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("enterprise")}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-all"
            >
              Enterprise Tier
            </button>
            <button
              type="button"
              onClick={() => setShowDocExtractor(!showDocExtractor)}
              className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 transition-all"
            >
              <FileUp className="h-3 w-3" />
              <span>Paste Notes / Upload Deck</span>
            </button>
          </div>
        </div>

        {/* Notes / Document Extractor Panel */}
        {showDocExtractor && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-4 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                Paste Pitch Summary or Upload Document
              </span>
              <button
                onClick={() => setShowDocExtractor(false)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="e.g. 'We are an AI SaaS startup called CloudFlow with 45 paying customers paying ₹4,000/month. We have ₹35 Lakhs in the bank, 2.5% churn, and spend ₹2.5L on marketing. We want to see if we can reach ₹1.5 Crore ARR in 12 months.'"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleExtractFromText(pastedText, "pasted notes")}
                disabled={!pastedText.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-700 transition-all disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Auto-Fill Assessment Steps</span>
              </button>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-900 cursor-pointer underline font-medium"
              >
                <FileUp className="h-3.5 w-3.5" />
                <span>Or upload file (PDF, TXT, MD)</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.txt,.md,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Extractor Notification */}
        {extractorNotification && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{extractorNotification}</span>
          </div>
        )}

        {/* Step Progress Stepper */}
        <div className="grid grid-cols-5 gap-2">
          {stepsList.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                currentStep === s.num
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : currentStep > s.num
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider ${currentStep === s.num ? "text-emerald-100" : "text-slate-400"}`}>
                Step 0{s.num}
              </span>
              <span className="text-xs font-semibold truncate w-full">
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Assessment Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* STEP 1: Company Profile & Horizon */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <span>Step 1: Company Identity &amp; Planning Horizon</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Define your venture&apos;s name, operational model, and the timeline you are forecasting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Company / Startup Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. ApexCloud Technologies"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Operating Currency
                  </label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {(["INR", "USD", "EUR", "GBP"] as CurrencyCode[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`rounded-xl py-2.5 text-xs font-bold transition-all border ${
                          currency === c
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {c === "INR" ? "₹ INR" : c === "USD" ? "$ USD" : c === "EUR" ? "€ EUR" : "£ GBP"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Business Model Architecture
                  </label>
                  <select
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value as BusinessModelType)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="b2b_saas">B2B SaaS (Software as a Service)</option>
                    <option value="b2c_subscription">B2C Subscription (Mobile / Consumer)</option>
                    <option value="subscription_services">Subscription-Based Services / Productized Agency</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Planning Horizon (Simulation Length)
                  </label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {[12, 18, 24, 36].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPlanningHorizon(m)}
                        className={`rounded-xl py-2.5 text-xs font-semibold transition-all border ${
                          planningHorizon === m
                            ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {m} Mos
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Baseline Revenue & Customers */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <span>Step 2: Baseline Revenue, Customers &amp; Cash Position</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Where does your startup stand today? Input current paying customers, monthly pricing, and bank cash.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Current Paying Customers (Accounts)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={customers}
                    onChange={(e) => setCustomers(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Active paying subscription accounts</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Monthly Price / ARPU ({currency} / user / month)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={arpu}
                    onChange={(e) => setArpu(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Average revenue generated per customer per month</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Current Bank Cash Balance ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={cashBalance}
                    onChange={(e) => setCashBalance(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Total liquid cash available for operations</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Minimum Safety Reserve Floor ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={minReserve}
                    onChange={(e) => setMinReserve(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Threshold below which VentureIQ raises solvency alerts</span>
                </div>
              </div>

              {/* Live Baseline Preview */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Calculated Starting MRR</span>
                  <span className="text-sm font-extrabold text-slate-900">{formatCurrency(currentMrr, currency, false)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Starting ARR Run Rate</span>
                  <span className="text-sm font-extrabold text-emerald-700">{formatCurrency(currentArr, currency, true)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Liquid Net Runway Buffer</span>
                  <span className="text-sm font-extrabold text-slate-900">{formatCurrency(Math.max(0, cashBalance - minReserve), currency, true)}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Growth, Acquisition & Churn */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span>Step 3: Growth Engine, CAC &amp; Churn Dynamics</span>
                </h2>
                <p className="text-xs text-slate-500">
                  How does your funnel work? How fast do you acquire and retain customers?
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setAcquisitionMode("lead_based")}
                    className={`flex-1 rounded-lg py-2 font-semibold transition-all ${
                      acquisitionMode === "lead_based"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Lead-Based Funnel (Inbound / SDRs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAcquisitionMode("budget_based")}
                    className={`flex-1 rounded-lg py-2 font-semibold transition-all ${
                      acquisitionMode === "budget_based"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Paid Acquisition Budget (Ads / Performance)
                  </button>
                </div>

                {acquisitionMode === "lead_based" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Monthly Lead Volume
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={monthlyLeads}
                        onChange={(e) => setMonthlyLeads(parseInt(e.target.value, 10) || 0)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Lead Conversion Rate (e.g. 0.035 = 3.5%)
                      </label>
                      <input
                        type="number"
                        step={0.005}
                        min={0.001}
                        max={1}
                        value={leadConversionRate}
                        onChange={(e) => setLeadConversionRate(parseFloat(e.target.value) || 0.01)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Cost Per Lead ({currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={costPerLead}
                        onChange={(e) => setCostPerLead(parseInt(e.target.value, 10) || 0)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Monthly Acquisition Budget ({currency})
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={acquisitionBudget}
                        onChange={(e) => setAcquisitionBudget(parseInt(e.target.value, 10) || 0)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Target Blended CAC ({currency})
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={targetCac}
                        onChange={(e) => setTargetCac(parseInt(e.target.value, 10) || 1)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Monthly Customer Churn Rate
                    </label>
                    <input
                      type="number"
                      step={0.005}
                      min={0}
                      max={0.5}
                      value={churnRate}
                      onChange={(e) => setChurnRate(parseFloat(e.target.value) || 0)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">e.g. 0.025 = 2.5% monthly attrition</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Organic New Customers / Mo
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={organicCustomers}
                      onChange={(e) => setOrganicCustomers(parseInt(e.target.value, 10) || 0)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Word-of-mouth &amp; organic referrals</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      Monthly Expansion Rate (Upsells)
                    </label>
                    <input
                      type="number"
                      step={0.005}
                      min={0}
                      max={0.5}
                      value={expansionRate}
                      onChange={(e) => setExpansionRate(parseFloat(e.target.value) || 0)}
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">e.g. 0.015 = 1.5% net expansion</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Cost Structure & Team */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  <span>Step 4: Operating Expenses &amp; Team Structure</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configure monthly payroll, fixed overheads, and variable delivery/hosting costs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Total Monthly Team Payroll ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyPayroll}
                    onChange={(e) => setMonthlyPayroll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Salaries + employer contributions for active staff</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Fixed Monthly OpEx Overhead ({currency})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={fixedOpex}
                    onChange={(e) => setFixedOpex(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Rent, software tooling, legal, accounting</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Payment Processing Fee Rate
                  </label>
                  <input
                    type="number"
                    step={0.005}
                    min={0}
                    max={0.1}
                    value={paymentProcRate}
                    onChange={(e) => setPaymentProcRate(parseFloat(e.target.value) || 0)}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">e.g. 0.025 = 2.5% for Stripe / Razorpay</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Variable COGS &amp; Cloud per Customer ({currency} / user / mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={hostingPerCustomer + servicingPerCustomer}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setHostingPerCustomer(Math.round(val * 0.4));
                      setServicingPerCustomer(Math.round(val * 0.6));
                    }}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Direct infrastructure, API calls &amp; support per active account</span>
                </div>
              </div>

              {/* Estimated Monthly Outflow Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Estimated Monthly Operating Burn</span>
                  <span className="text-sm font-extrabold text-rose-600">{formatCurrency(currentMonthlyBurnEstimate, currency, false)} / mo</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Estimated Runway Buffer</span>
                  <span className="text-sm font-extrabold text-emerald-700">{roughRunwayMonths}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Strategic Milestone & Reverse-Planning Objective */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-600" />
                  <span>Step 5: Define Your Strategic Milestone Goal</span>
                </h2>
                <p className="text-xs text-slate-500">
                  What core business milestone or financial decision should VentureIQ reverse-engineer and stress-test?
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700">
                  Select a Strategic Focus Preset:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionPreset("target_arr");
                      setDecisionGoalText(`Reach ${currency === "INR" ? "₹1 Crore" : "$1 Million"} ARR run rate within 12 months with ${currency === "INR" ? "₹25 Lakh" : "$300K"} cash budget.`);
                    }}
                    className={`rounded-xl border p-3 text-left transition-all text-xs ${
                      decisionPreset === "target_arr"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold">ARR Target Milestone</div>
                    <div className="text-[11px] text-slate-500 mt-1 font-normal">
                      Reverse-engineer price, conversion, and marketing needed to hit 12-month ARR.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionPreset("break_even");
                      setDecisionGoalText("Determine the exact customer count and CAC efficiency required to achieve operating break-even.");
                    }}
                    className={`rounded-xl border p-3 text-left transition-all text-xs ${
                      decisionPreset === "break_even"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold">Operating Break-Even</div>
                    <div className="text-[11px] text-slate-500 mt-1 font-normal">
                      Find minimum paying volume to cover total payroll and overheads without external funding.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDecisionPreset("hiring");
                      setDecisionGoalText("Can we afford to hire 2 software engineers in Q2 without breaching our minimum safety cash reserve?");
                    }}
                    className={`rounded-xl border p-3 text-left transition-all text-xs ${
                      decisionPreset === "hiring"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold">Headcount Expansion</div>
                    <div className="text-[11px] text-slate-500 mt-1 font-normal">
                      Test payroll capacity and runway safety before making new hires.
                    </div>
                  </button>
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Your Specific Strategic Decision Statement:
                  </label>
                  <textarea
                    rows={3}
                    value={decisionGoalText}
                    onChange={(e) => setDecisionGoalText(e.target.value)}
                    placeholder="e.g. Reach ₹1.5 Crore ARR in 12 months with ₹30 Lakh budget while keeping ₹8 Lakh cash reserve."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    This decision will appear on your top dashboard banner, reverse-planning solver, and in the generated executive PDF brief.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous Step</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSkipToDemo}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
              >
                Cancel and use sample company
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
              >
                <span>Continue to Step 0{currentStep + 1}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-xs font-extrabold text-white hover:bg-slate-800 transition-all shadow-md"
              >
                <Sparkles className="h-4 w-4 text-emerald-400" />
                <span>Build Financial Engine &amp; Open Dashboard</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
        Deterministic Financial Invariant Engine • 100% Client-Side Simulation • No Data Sent to Third Parties
      </footer>
    </div>
  );
};
