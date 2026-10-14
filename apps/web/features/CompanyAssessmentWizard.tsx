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
  Loader2,
  Coins,
  ShieldAlert,
  Layers,
  HelpCircle,
} from "lucide-react";

interface CompanyAssessmentWizardProps {
  initialInputs: ModelEngineInputs;
  initialDecisionGoal: string;
  onComplete: (completedInputs: ModelEngineInputs, decisionGoal: string) => void;
}

export const CompanyAssessmentWizard: React.FC<CompanyAssessmentWizardProps> = ({
  initialInputs,
  initialDecisionGoal,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Company Profile, Industry, Funding & Horizon
  const [companyName, setCompanyName] = useState<string>("");
  const [profileType, setProfileType] = useState<"B2B" | "B2C" | "D2C">("B2B");
  const [businessType, setBusinessType] = useState<string>("SaaS");
  const [fundingStructure, setFundingStructure] = useState<"bootstrapped" | "funded">("bootstrapped");
  const [fundingStage, setFundingStage] = useState<string>("seed");
  const [businessModelArch, setBusinessModelArch] = useState<string>("recurring_saas");
  const [currency, setCurrency] = useState<CurrencyCode>("INR");
  const [planningHorizon, setPlanningHorizon] = useState<number>(12);

  // Step 2: Baseline Revenue, Customers & Cash
  const [customers, setCustomers] = useState<string>("");
  const [arpu, setArpu] = useState<string>("");
  const [cashBalance, setCashBalance] = useState<string>("");
  const [minReserve, setMinReserve] = useState<string>("");

  // Step 3: Growth, Acquisition & Retention
  const [acquisitionMode, setAcquisitionMode] = useState<AcquisitionMode>("lead_based");
  const [monthlyLeads, setMonthlyLeads] = useState<string>("");
  const [leadConversionRate, setLeadConversionRate] = useState<string>("");
  const [costPerLead, setCostPerLead] = useState<string>("");
  const [acquisitionBudget, setAcquisitionBudget] = useState<string>("");
  const [targetCac, setTargetCac] = useState<string>("");
  const [organicCustomers, setOrganicCustomers] = useState<string>("");
  const [churnRate, setChurnRate] = useState<string>("");
  const [expansionRate, setExpansionRate] = useState<string>("");

  // Step 4: Operating Expenses & Team Structure
  const [monthlyPayroll, setMonthlyPayroll] = useState<string>("");
  const [fixedOpex, setFixedOpex] = useState<string>("");
  const [paymentProcRate, setPaymentProcRate] = useState<string>("");
  const [variableCogs, setVariableCogs] = useState<string>("");

  // Extracted decision goal from deck if present
  const [extractedDecisionGoal, setExtractedDecisionGoal] = useState<string>(initialDecisionGoal || "");

  // Document/Deck Parser State
  const [showDocExtractor, setShowDocExtractor] = useState<boolean>(false);
  const [pastedText, setPastedText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [extractorNotification, setExtractorNotification] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business Type Options
  const businessTypes = [
    { id: "SaaS", label: "SaaS" },
    { id: "IT & Tech Services", label: "IT & Tech Services" },
    { id: "Consumer Product", label: "Consumer Product" },
    { id: "Mobile App", label: "Mobile App" },
    { id: "E-Commerce / D2C Brand", label: "E-Commerce / D2C" },
    { id: "AI & DeepTech", label: "AI & DeepTech" },
    { id: "Other", label: "Other" },
  ];

  // Business Model Architecture Options
  const businessModelOptions = [
    { id: "recurring_saas", label: "Recurring Subscription (SaaS / Membership)", coreType: "b2b_saas" },
    { id: "usage_based", label: "Usage-Based / Consumption Model", coreType: "b2b_saas" },
    { id: "tiered_recurring", label: "Tiered Recurring + Implementation Fees", coreType: "b2b_saas" },
    { id: "marketplace", label: "Transactional Marketplace", coreType: "b2c_subscription" },
    { id: "d2c_retention", label: "Direct-to-Consumer (Repeat Purchase / Retention)", coreType: "b2c_subscription" },
    { id: "productized_agency", label: "Retainer / Productized Agency", coreType: "subscription_services" },
  ];

  // Funding Stage Options
  const fundingStages = [
    { id: "pre_seed", label: "Pre-Seed" },
    { id: "seed", label: "Seed" },
    { id: "series_a", label: "Series A" },
    { id: "series_b", label: "Series B+" },
    { id: "angel_grants", label: "Angel / Grants" },
  ];

  // 1-Click Profile Selection (B2B, B2C, D2C)
  const handleSelectProfileType = (type: "B2B" | "B2C" | "D2C") => {
    setProfileType(type);
    if (type === "B2B") {
      setBusinessType("SaaS");
      setBusinessModelArch("recurring_saas");
      setAcquisitionMode("lead_based");
      setExtractorNotification("Profile configured for B2B Enterprise / SaaS.");
    } else if (type === "B2C") {
      setBusinessType("Mobile App");
      setBusinessModelArch("recurring_saas");
      setAcquisitionMode("budget_based");
      setExtractorNotification("Profile configured for B2C Consumer Subscription.");
    } else {
      setBusinessType("E-Commerce / D2C Brand");
      setBusinessModelArch("d2c_retention");
      setAcquisitionMode("budget_based");
      setExtractorNotification("Profile configured for Direct-to-Consumer (D2C).");
    }
  };

  // Populate wizard from parsed payload
  const applyExtractedData = (data: any, method: string, sourceLabel: string, count: number) => {
    if (data.company_name) setCompanyName(data.company_name);
    if (data.profile_type && ["B2B", "B2C", "D2C"].includes(data.profile_type)) {
      setProfileType(data.profile_type);
    }
    if (data.business_type) setBusinessType(data.business_type);
    if (data.funding_structure) setFundingStructure(data.funding_structure);
    if (data.funding_stage) setFundingStage(data.funding_stage);
    if (data.currency && ["INR", "USD", "EUR", "GBP"].includes(data.currency)) {
      setCurrency(data.currency as CurrencyCode);
    }
    if (data.planning_horizon) setPlanningHorizon(data.planning_horizon);

    if (data.initial_paying_customers !== undefined && data.initial_paying_customers !== null) {
      setCustomers(String(data.initial_paying_customers));
    }
    if (data.arpu !== undefined && data.arpu !== null) {
      setArpu(String(data.arpu));
    }
    if (data.initial_cash_balance !== undefined && data.initial_cash_balance !== null) {
      setCashBalance(String(data.initial_cash_balance));
    }
    if (data.minimum_cash_reserve !== undefined && data.minimum_cash_reserve !== null) {
      setMinReserve(String(data.minimum_cash_reserve));
    }

    if (data.acquisition_mode) setAcquisitionMode(data.acquisition_mode);
    if (data.monthly_leads !== undefined && data.monthly_leads !== null) setMonthlyLeads(String(data.monthly_leads));
    if (data.lead_conversion_rate !== undefined && data.lead_conversion_rate !== null) {
      setLeadConversionRate(String(data.lead_conversion_rate));
    }
    if (data.cost_per_lead !== undefined && data.cost_per_lead !== null) setCostPerLead(String(data.cost_per_lead));
    if (data.acquisition_budget !== undefined && data.acquisition_budget !== null) {
      setAcquisitionBudget(String(data.acquisition_budget));
    }
    if (data.target_cac !== undefined && data.target_cac !== null) setTargetCac(String(data.target_cac));
    if (data.customer_churn_rate !== undefined && data.customer_churn_rate !== null) {
      setChurnRate(String(data.customer_churn_rate));
    }
    if (data.expansion_rate !== undefined && data.expansion_rate !== null) {
      setExpansionRate(String(data.expansion_rate));
    }

    if (data.monthly_payroll !== undefined && data.monthly_payroll !== null) {
      setMonthlyPayroll(String(data.monthly_payroll));
    }
    if (data.fixed_opex !== undefined && data.fixed_opex !== null) {
      setFixedOpex(String(data.fixed_opex));
    }
    if (data.decision_goal) setExtractedDecisionGoal(data.decision_goal);

    const engineName = method === "gemini-2.5-flash" ? "Google Gemini 2.5 Flash" : "VentureIQ Document Parser";
    setExtractorNotification(`Successfully extracted ${count || "key"} financial parameters from ${sourceLabel} via ${engineName}.`);
    setShowDocExtractor(false);
  };

  // Call `/api/ai/parse-deck` with pasted text
  const handleParsePastedText = async () => {
    if (!pastedText.trim()) return;
    setIsParsing(true);
    try {
      const res = await fetch("/api/ai/parse-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pastedText }),
      });
      const json = await res.json();
      if (json.success && json.extractedData) {
        applyExtractedData(json.extractedData, json.method, "Pasted Notes", json.fieldsCount);
      } else {
        setExtractorNotification("Could not parse parameters. Please fill in the questions directly.");
      }
    } catch (err: any) {
      setExtractorNotification(`Document analysis notice: ${err?.message || "Please check connection"}`);
    } finally {
      setIsParsing(false);
    }
  };

  // Call `/api/ai/parse-deck` with uploaded file (PDF / Text / CSV / MD)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
        // Strip data URI header: "data:application/pdf;base64,"
        const base64Index = result.indexOf(";base64,");
        const fileBase64 = base64Index !== -1 ? result.substring(base64Index + 8) : result;

        const res = await fetch("/api/ai/parse-deck", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64,
            fileName: file.name,
            mimeType: file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "text/plain"),
          }),
        });

        const json = await res.json();
        if (json.success && json.extractedData) {
          applyExtractedData(json.extractedData, json.method, file.name, json.fieldsCount);
        } else {
          setExtractorNotification(`Could not extract parameters from ${file.name}. Please enter your details below.`);
        }
      } catch (err: any) {
        setExtractorNotification(`Failed to upload ${file.name}: ${err?.message || "Error"}`);
      } finally {
        setIsParsing(false);
      }
    };

    reader.readAsDataURL(file);
  };

  // Convert entered values to numerical simulation model
  const handleFinalSubmit = () => {
    const rawPayroll = Number(monthlyPayroll) || 0;
    const selectedModel = businessModelOptions.find((b) => b.id === businessModelArch)?.coreType || "b2b_saas";

    const numCustomers = Number(customers) || 0;
    const numArpu = Number(arpu) || 0;
    const numCash = Number(cashBalance) || 0;
    const numMinReserve = minReserve ? Number(minReserve) : Math.round(numCash * 0.2);

    const numLeads = Number(monthlyLeads) || 0;
    const numConv = leadConversionRate ? Number(leadConversionRate) : 0.035;
    const numCostPerLead = Number(costPerLead) || 0;
    const numBudget = Number(acquisitionBudget) || 0;
    const numTargetCac = Number(targetCac) || (numCostPerLead > 0 && numConv > 0 ? Math.round(numCostPerLead / numConv) : 6000);
    const numOrganic = Number(organicCustomers) || 0;
    const numChurn = churnRate ? Number(churnRate) : 0.025;
    const numExpansion = expansionRate ? Number(expansionRate) : 0.015;

    const numFixedOpex = Number(fixedOpex) || 0;
    const numProcRate = paymentProcRate ? Number(paymentProcRate) : 0.025;
    const numVariableCogs = Number(variableCogs) || 0;

    const goal =
      extractedDecisionGoal.trim() ||
      `Reach ${currency === "INR" ? "₹1 Crore" : "$1 Million"} ARR run rate with sustainable cash runway.`;

    const updatedInputs: ModelEngineInputs = {
      ...initialInputs,
      company_name: companyName.trim() || "My Venture",
      business_model: selectedModel as BusinessModelType,
      currency,
      planning_horizon: Number(planningHorizon) || 12,

      initial_paying_customers: numCustomers,
      arpu: numArpu > 0 ? numArpu : 1,
      initial_cash_balance: numCash,
      minimum_cash_reserve: numMinReserve,

      acquisition_mode: acquisitionMode,
      monthly_leads: numLeads,
      lead_conversion_rate: numConv,
      cost_per_lead: numCostPerLead,
      acquisition_budget: numBudget,
      target_cac: numTargetCac > 0 ? numTargetCac : 1,
      organic_new_customers: numOrganic,
      customer_churn_rate: numChurn,
      expansion_rate: numExpansion,

      fixed_opex: numFixedOpex,
      payment_processing_rate: numProcRate,
      hosting_cost_per_customer: Math.round(numVariableCogs * 0.4),
      servicing_cost_per_customer: Math.round(numVariableCogs * 0.6),

      // Model active team payroll as a unified operational organizational unit
      hiring_roles:
        rawPayroll > 0
          ? [
              {
                role_title: "Core Operations Team",
                department: "Consolidated Operations",
                headcount: 1,
                monthly_salary: rawPayroll,
                employer_burden_rate: 0.1,
                start_month: 1,
                annual_increase_rate: 0.05,
              },
            ]
          : [],
      financing_events: [],
    };

    onComplete(updatedInputs, goal);
  };

  const stepsList = [
    { num: 1, label: "Profile & Stage" },
    { num: 2, label: "Revenue & Base" },
    { num: 3, label: "Growth & Retention" },
    { num: 4, label: "Costs & Team" },
  ];

  // Dynamic calculations for preview
  const numCust = Number(customers) || 0;
  const numPrice = Number(arpu) || 0;
  const currentMrr = numCust * numPrice;
  const currentArr = currentMrr * 12;

  const numPay = Number(monthlyPayroll) || 0;
  const numOp = Number(fixedOpex) || 0;
  const numAcq =
    acquisitionMode === "lead_based"
      ? (Number(monthlyLeads) || 0) * (Number(costPerLead) || 0)
      : Number(acquisitionBudget) || 0;
  const currentMonthlyBurnEstimate = numPay + numOp + numAcq;
  const numBankCash = Number(cashBalance) || 0;
  const roughRunwayMonths =
    numBankCash > 0 && currentMonthlyBurnEstimate > currentMrr
      ? (numBankCash / (currentMonthlyBurnEstimate - currentMrr)).toFixed(1) + " Mos"
      : numBankCash > 0
      ? "Breakeven / Positive"
      : "Enter cash details";

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
                Founders Financial Intake Assessment
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Answer 4 sections to build your live financial model &amp; strategic risk analysis
            </p>
          </div>
        </div>
      </header>

      {/* Main Assessment Container */}
      <main className="max-w-4xl mx-auto w-full py-8 space-y-6 flex-1">
        {/* Profile Selector & AI Deck Parser Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700">Company Profile:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["B2B", "B2C", "D2C"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handleSelectProfileType(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all border ${
                  profileType === p
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setShowDocExtractor(!showDocExtractor)}
              className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all ml-auto sm:ml-2"
            >
              <FileUp className="h-3.5 w-3.5" />
              <span>Paste Notes / Upload Deck</span>
            </button>
          </div>
        </div>

        {/* Pitch Deck / Document Extractor Dropdown */}
        {showDocExtractor && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/70 p-5 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-700" />
                Intelligent Pitch Deck &amp; Notes Parser
              </span>
              <button
                onClick={() => setShowDocExtractor(false)}
                className="text-xs text-slate-500 hover:text-slate-900 font-medium"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Upload your startup pitch deck (PDF) or paste rough executive notes. VentureIQ extracts all financial parameters directly into the assessment.
            </p>

            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste notes here, e.g.: 'We are an AI SaaS startup with 45 paying customers at ₹4,000/mo. We have ₹35 Lakh in bank, 2.5% churn, ₹2.5L marketing spend. Goal is to hit ₹1.5 Cr ARR in 12 months with ₹35L budget.'"
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleParsePastedText}
                disabled={isParsing || !pastedText.trim()}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition-all disabled:opacity-50 shadow-sm"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Extracting Parameters...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extract from Pasted Notes</span>
                  </>
                )}
              </button>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-purple-300 bg-white px-4 py-2.5 text-xs font-semibold text-purple-700 hover:bg-purple-50 cursor-pointer transition-all shadow-sm"
              >
                <FileUp className="h-3.5 w-3.5" />
                <span>Upload Pitch Deck (PDF, TXT, MD, CSV)</span>
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
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="font-semibold">{extractorNotification}</span>
          </div>
        )}

        {/* Step Progress Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stepsList.map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                currentStep === s.num
                  ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                  : currentStep > s.num
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  currentStep === s.num ? "text-slate-300" : "text-slate-400"
                }`}
              >
                Step 0{s.num}
              </span>
              <span className="text-xs font-semibold truncate w-full">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Assessment Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* STEP 1: Company Profile, Business Type, Funding & Model */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <span>Step 1: Company Identity, Type of Business &amp; Funding Stage</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Provide your venture&apos;s legal name, core industry category, and capital structure.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Company Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Company / Startup Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Type of Business / Industry Section */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Type of Business / Industry</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {businessTypes.map((bt) => (
                      <button
                        key={bt.id}
                        type="button"
                        onClick={() => setBusinessType(bt.id)}
                        className={`rounded-xl border p-2.5 text-xs text-center font-medium transition-all ${
                          businessType === bt.id
                            ? "bg-slate-900 text-white border-slate-900 font-bold shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funding Structure: Bootstrapped vs Funded */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Funding Structure</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFundingStructure("bootstrapped")}
                      className={`rounded-xl border p-3 text-left transition-all text-xs ${
                        fundingStructure === "bootstrapped"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold">Bootstrapped</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                        Self-funded, operating on customer revenue &amp; positive unit economics
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFundingStructure("funded")}
                      className={`rounded-xl border p-3 text-left transition-all text-xs ${
                        fundingStructure === "funded"
                          ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="font-bold">Funded Startup</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-normal">
                        Backed by institutional venture capital, angel syndicates, or grants
                      </div>
                    </button>
                  </div>
                </div>

                {/* If Funded: Stage Selection */}
                {fundingStructure === "funded" && (
                  <div className="sm:col-span-2 space-y-2 animate-in fade-in duration-150">
                    <label className="text-xs font-semibold text-slate-700">Current Funding Stage</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {fundingStages.map((stage) => (
                        <button
                          key={stage.id}
                          type="button"
                          onClick={() => setFundingStage(stage.id)}
                          className={`rounded-xl border p-2 text-xs text-center font-medium transition-all ${
                            fundingStage === stage.id
                              ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {stage.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Model Architecture Options */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Business Model Architecture</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {businessModelOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBusinessModelArch(opt.id)}
                        className={`rounded-xl border p-3 text-left text-xs transition-all ${
                          businessModelArch === opt.id
                            ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operating Currency */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Operating Currency</label>
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

                {/* Planning Horizon */}
                <div>
                  <label className="text-xs font-semibold text-slate-700">Simulation Horizon</label>
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
                  Where does your venture stand today? Enter active customers, monthly price per unit, and available cash.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Current Paying Customers (Accounts)</label>
                  <input
                    type="number"
                    min={0}
                    value={customers}
                    onChange={(e) => setCustomers(e.target.value)}
                    placeholder="Enter paying customer count"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Active recurring subscription or paying clients</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Monthly Price / ARPU ({currency} / user / month)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={arpu}
                    onChange={(e) => setArpu(e.target.value)}
                    placeholder="Enter monthly price per customer"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Average revenue generated per paying account monthly</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Current Bank Cash Balance ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={cashBalance}
                    onChange={(e) => setCashBalance(e.target.value)}
                    placeholder="Enter liquid bank cash"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Total available operating treasury funds</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Minimum Safety Reserve Floor ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={minReserve}
                    onChange={(e) => setMinReserve(e.target.value)}
                    placeholder="Enter safety reserve floor"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Threshold below which VentureIQ flags solvency alerts</span>
                </div>
              </div>

              {/* Live Baseline Preview */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Calculated Monthly Revenue (MRR)</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(currentMrr, currency, false)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Starting ARR Run Rate</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {formatCurrency(currentArr, currency, true)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Operational Cash Cushion</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(Math.max(0, (Number(cashBalance) || 0) - (Number(minReserve) || 0)), currency, true)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Growth Engine & Retention */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span>Step 3: Growth Engine, CAC &amp; Churn Dynamics</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select your primary acquisition method and define your retention profile.
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
                    Lead-Based Funnel (Inbound / Sales)
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
                    Paid Performance Budget (Ads / Channels)
                  </button>
                </div>

                {acquisitionMode === "lead_based" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Monthly Lead Volume</label>
                      <input
                        type="number"
                        min={0}
                        value={monthlyLeads}
                        onChange={(e) => setMonthlyLeads(e.target.value)}
                        placeholder="Enter monthly leads"
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
                        min={0}
                        max={1}
                        value={leadConversionRate}
                        onChange={(e) => setLeadConversionRate(e.target.value)}
                        placeholder="Enter conversion rate (e.g. 0.035)"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Cost Per Lead ({currency})</label>
                      <input
                        type="number"
                        min={0}
                        value={costPerLead}
                        onChange={(e) => setCostPerLead(e.target.value)}
                        placeholder="Enter cost per lead"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Current Blended CAC ({currency})</label>
                      <input
                        type="number"
                        min={0}
                        value={targetCac}
                        onChange={(e) => setTargetCac(e.target.value)}
                        placeholder={
                          Number(costPerLead) > 0 && Number(leadConversionRate) > 0
                            ? `Est. ${Math.round(Number(costPerLead) / Number(leadConversionRate))}`
                            : "Enter current CAC"
                        }
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Monthly Marketing Spend ({currency})</label>
                      <input
                        type="number"
                        min={0}
                        value={acquisitionBudget}
                        onChange={(e) => setAcquisitionBudget(e.target.value)}
                        placeholder="Enter monthly acquisition budget"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Current Blended CAC ({currency})</label>
                      <input
                        type="number"
                        min={0}
                        value={targetCac}
                        onChange={(e) => setTargetCac(e.target.value)}
                        placeholder="Enter current blended CAC"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-emerald-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Monthly Customer Churn Rate</label>
                    <input
                      type="number"
                      step={0.005}
                      min={0}
                      max={0.5}
                      value={churnRate}
                      onChange={(e) => setChurnRate(e.target.value)}
                      placeholder="Enter churn rate (e.g. 0.025 = 2.5%)"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">e.g. 0.025 = 2.5% monthly customer churn</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Organic New Customers / Mo</label>
                    <input
                      type="number"
                      min={0}
                      value={organicCustomers}
                      onChange={(e) => setOrganicCustomers(e.target.value)}
                      placeholder="Enter organic customer count"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Word-of-mouth &amp; unpaid referrals</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Monthly Expansion Rate</label>
                    <input
                      type="number"
                      step={0.005}
                      min={0}
                      max={0.5}
                      value={expansionRate}
                      onChange={(e) => setExpansionRate(e.target.value)}
                      placeholder="Enter expansion rate (e.g. 0.015)"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">e.g. 0.015 = 1.5% net monthly upsell</span>
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
                  <span>Step 4: Operating Expenses &amp; Team Payroll</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Configure monthly payroll, fixed operational overheads, and variable delivery costs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Total Monthly Team Payroll ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyPayroll}
                    onChange={(e) => setMonthlyPayroll(e.target.value)}
                    placeholder="Enter monthly team payroll"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Combined salaries + employer taxes for active operational team
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Fixed Monthly OpEx Overhead ({currency})</label>
                  <input
                    type="number"
                    min={0}
                    value={fixedOpex}
                    onChange={(e) => setFixedOpex(e.target.value)}
                    placeholder="Enter fixed monthly overhead"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Rent, software tooling, legal, accounting</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Payment Processing Fee Rate</label>
                  <input
                    type="number"
                    step={0.005}
                    min={0}
                    max={0.1}
                    value={paymentProcRate}
                    onChange={(e) => setPaymentProcRate(e.target.value)}
                    placeholder="Enter fee rate (e.g. 0.025 = 2.5%)"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Gateway transaction rate (e.g. Stripe / Razorpay)</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Variable COGS &amp; Cloud per Account ({currency} / user / mo)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={variableCogs}
                    onChange={(e) => setVariableCogs(e.target.value)}
                    placeholder="Enter variable cloud & support cost"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Direct infrastructure, API calls &amp; support</span>
                </div>
              </div>

              {/* Estimated Monthly Outflow Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Estimated Monthly Operating Burn</span>
                  <span className="text-sm font-extrabold text-rose-600">
                    {formatCurrency(currentMonthlyBurnEstimate, currency, false)} / mo
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Estimated Net Runway</span>
                  <span className="text-sm font-extrabold text-emerald-700">{roughRunwayMonths}</span>
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
              <div />
            )}

            {currentStep < 4 ? (
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
