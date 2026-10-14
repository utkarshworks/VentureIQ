"use client";

import React, { useState } from "react";
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
  Briefcase,
  DollarSign,
  ChevronRight,
  Coins,
  ShieldAlert,
  Layers,
  HelpCircle,
} from "lucide-react";

import { FormattedNumberInput } from "@/components/FormattedNumberInput";
import { PercentageInput } from "@/components/PercentageInput";
import { StrategicHelpPriority } from "@/lib/advisoryEngine";
import { convertAmount } from "@/lib/currencyConverter";
import Link from "next/link";
import { CookiePreferencesModal } from "@/components/CookiePreferencesModal";

interface CompanyAssessmentWizardProps {
  initialInputs: ModelEngineInputs;
  initialDecisionGoal: string;
  initialHelpPriority?: StrategicHelpPriority;
  onComplete: (
    completedInputs: ModelEngineInputs,
    decisionGoal: string,
    helpPriority: StrategicHelpPriority
  ) => void;
}

export const CompanyAssessmentWizard: React.FC<CompanyAssessmentWizardProps> = ({
  initialInputs,
  initialDecisionGoal,
  initialHelpPriority = "runway_preservation",
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState<boolean>(false);

  // Step 1: Company Profile, Industry, Funding & Horizon
  const [companyName, setCompanyName] = useState<string>("");
  const [profileType, setProfileType] = useState<"B2B" | "B2C" | "D2C">("B2B");
  const [businessType, setBusinessType] = useState<string>("");
  const [fundingStructure, setFundingStructure] = useState<"bootstrapped" | "funded">("bootstrapped");
  const [fundingStage, setFundingStage] = useState<string>("seed");
  const [businessModelArch, setBusinessModelArch] = useState<string>("subscription");
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
  const [currentCac, setCurrentCac] = useState<string>("");
  const [targetCac, setTargetCac] = useState<string>("");
  const [acquisitionBudget, setAcquisitionBudget] = useState<string>("");
  const [organicCustomers, setOrganicCustomers] = useState<string>("");
  const [churnRate, setChurnRate] = useState<string>("");
  const [customerLifetimeMonths, setCustomerLifetimeMonths] = useState<string>("");
  const [expansionRate, setExpansionRate] = useState<string>("");

  // Step 4: Cost Structure & Operating Expenses (Direct COGS + OpEx)
  const [paymentProcRate, setPaymentProcRate] = useState<string>("");
  const [hostingFixedCost, setHostingFixedCost] = useState<string>("");
  const [variableHostingPerCust, setVariableHostingPerCust] = useState<string>("");
  const [variableApiPerCust, setVariableApiPerCust] = useState<string>("");
  const [variableServicingPerCust, setVariableServicingPerCust] = useState<string>("");
  const [variableCogs, setVariableCogs] = useState<string>("");

  const [monthlyPayroll, setMonthlyPayroll] = useState<string>("");
  const [fixedOpex, setFixedOpex] = useState<string>("");
  const [fixedMarketingOps, setFixedMarketingOps] = useState<string>("");

  // Step 5: What do you need help with? (Strategic Priority & Decision Focus)
  const [helpPriority, setHelpPriority] = useState<StrategicHelpPriority>(initialHelpPriority);
  const [customGoalNote, setCustomGoalNote] = useState<string>(initialDecisionGoal || "");

  // Real-time currency conversion for all monetary inputs in wizard
  const handleAssessmentCurrencyChange = (newCurr: CurrencyCode) => {
    if (newCurr === currency) return;
    const convert = (val: string, precision: "auto" | "round" | "cents" = "auto") => {
      if (!val || !val.trim()) return val;
      const num = Number(val);
      if (isNaN(num) || num === 0) return val;
      return String(convertAmount(num, currency, newCurr, precision));
    };

    setCurrency(newCurr);
    setArpu((prev) => convert(prev, "auto"));
    setCashBalance((prev) => convert(prev, "round"));
    setMinReserve((prev) => convert(prev, "round"));
    setCostPerLead((prev) => convert(prev, "auto"));
    setAcquisitionBudget((prev) => convert(prev, "round"));
    setCurrentCac((prev) => convert(prev, "auto"));
    setTargetCac((prev) => convert(prev, "auto"));
    setHostingFixedCost((prev) => convert(prev, "round"));
    setVariableHostingPerCust((prev) => convert(prev, "auto"));
    setVariableApiPerCust((prev) => convert(prev, "auto"));
    setVariableServicingPerCust((prev) => convert(prev, "auto"));
    setFixedOpex((prev) => convert(prev, "round"));
    setFixedMarketingOps((prev) => convert(prev, "round"));
    setMonthlyPayroll((prev) => convert(prev, "round"));
  };

  // Two-way synchronization between Monthly Churn Rate and Customer Lifetime Months
  const handleMonthlyChurnChange = (val: string) => {
    setChurnRate(val);
    const num = Number(val);
    if (num > 0) {
      const pct = num > 1 ? num / 100 : num;
      const lifetime = Math.round((1 / pct) * 10) / 10;
      setCustomerLifetimeMonths(String(lifetime));
    } else {
      setCustomerLifetimeMonths("");
    }
  };

  const handleLifetimeMonthsChange = (val: string) => {
    setCustomerLifetimeMonths(val);
    const num = Number(val);
    if (num > 0) {
      const churnDecimal = parseFloat((1 / num).toFixed(6));
      setChurnRate(String(churnDecimal));
    } else {
      setChurnRate("");
    }
  };

  // Restore existing data from localStorage if available so retaking assessment preserves work
  React.useEffect(() => {
    try {
      const savedInputsRaw = localStorage.getItem("ventureiq_user_inputs");
      if (savedInputsRaw) {
        const saved = JSON.parse(savedInputsRaw);
        if (saved.currency) setCurrency(saved.currency);
        if (saved.company_name && saved.company_name !== "My Venture") setCompanyName(saved.company_name);
        if (saved.initial_paying_customers) setCustomers(String(saved.initial_paying_customers));
        if (saved.arpu) setArpu(String(saved.arpu));
        if (saved.initial_cash_balance) setCashBalance(String(saved.initial_cash_balance));
        if (saved.minimum_cash_reserve) setMinReserve(String(saved.minimum_cash_reserve));
        if (saved.monthly_leads) setMonthlyLeads(String(saved.monthly_leads));
        if (saved.lead_conversion_rate) setLeadConversionRate(String(saved.lead_conversion_rate));
        if (saved.cost_per_lead) setCostPerLead(String(saved.cost_per_lead));
        if (saved.target_cac) setTargetCac(String(saved.target_cac));
        if (saved.acquisition_budget) setAcquisitionBudget(String(saved.acquisition_budget));
        if (saved.organic_new_customers) setOrganicCustomers(String(saved.organic_new_customers));
        if (saved.customer_churn_rate) {
          const churnNum = Number(saved.customer_churn_rate);
          setChurnRate(String(churnNum));
          if (churnNum > 0) {
            setCustomerLifetimeMonths(String(Math.round((1 / churnNum) * 10) / 10));
          }
        }
        if (saved.expansion_rate) setExpansionRate(String(saved.expansion_rate));

        if (saved.payment_processing_rate) setPaymentProcRate(String(saved.payment_processing_rate));
        if (saved.hosting_fixed_cost) setHostingFixedCost(String(saved.hosting_fixed_cost));
        if (saved.hosting_cost_per_customer) setVariableHostingPerCust(String(saved.hosting_cost_per_customer));
        if (saved.servicing_cost_per_customer) setVariableServicingPerCust(String(saved.servicing_cost_per_customer));
        if (saved.fixed_opex) setFixedOpex(String(saved.fixed_opex));
        if (saved.fixed_marketing_ops) setFixedMarketingOps(String(saved.fixed_marketing_ops));
        if (saved.hiring_roles?.[0]?.monthly_salary) setMonthlyPayroll(String(saved.hiring_roles[0].monthly_salary));
      }
      const savedLifetime = localStorage.getItem("ventureiq_lifetime_months");
      if (savedLifetime) setCustomerLifetimeMonths(savedLifetime);

      const savedGoal = localStorage.getItem("ventureiq_decision_goal");
      if (savedGoal) setCustomGoalNote(savedGoal);
      const savedHelp = localStorage.getItem("ventureiq_help_priority");
      if (savedHelp) setHelpPriority(savedHelp as StrategicHelpPriority);
    } catch {}
  }, []);


  // Business Type Options in requested order: SaaS, IT & Tech Services, Mobile App, Consumer Product, D2C, Other
  const businessTypes = [
    { id: "SaaS", label: "SaaS" },
    { id: "IT & Tech Services", label: "IT & Tech Services" },
    { id: "Mobile App", label: "Mobile App" },
    { id: "Consumer Product", label: "Consumer Product" },
    { id: "D2C", label: "D2C" },
    { id: "Other", label: "Other" },
  ];

  // Simplified Business Model Architecture Options (Clear, intuitive & founder-friendly)
  const businessModelOptions = [
    {
      id: "subscription",
      label: "Recurring Subscription",
      sublabel: "Predictable monthly or annual membership / recurring plans (SaaS, Memberships)",
      coreType: "b2b_saas",
    },
    {
      id: "ecommerce_sales",
      label: "Direct Product Sales / E-Commerce",
      sublabel: "Physical or digital products sold per order (D2C, Skincare, Retail, Consumer Goods)",
      coreType: "b2c_subscription",
    },
    {
      id: "client_retainer",
      label: "Client Retainers & Services",
      sublabel: "Monthly retainers or project contracts (Agencies, Consulting, IT & Tech Services)",
      coreType: "subscription_services",
    },
    {
      id: "usage_consumption",
      label: "Usage-Based / Pay-As-You-Go",
      sublabel: "Billed by volume, credits, or units consumed (APIs, Cloud, Logistics)",
      coreType: "b2b_saas",
    },
    {
      id: "marketplace_take_rate",
      label: "Marketplace & Commission",
      sublabel: "Platform commission or take rate fee per completed transaction",
      coreType: "b2c_subscription",
    },
  ];

  // Funding Stage Options
  const fundingStages = [
    { id: "pre_seed", label: "Pre-Seed" },
    { id: "seed", label: "Seed" },
    { id: "series_a", label: "Series A" },
    { id: "series_b", label: "Series B+" },
    { id: "angel_grants", label: "Angel / Grants" },
  ];

  // Profile Selection: Only sets profile type, no auto-selection of business type and no popup notification
  const handleSelectProfileType = (type: "B2B" | "B2C" | "D2C") => {
    setProfileType(type);
  };

  const handleFinalSubmit = () => {
    const rawPayroll = Number(monthlyPayroll) || 0;
    const selectedModel =
      businessModelOptions.find((b) => b.id === businessModelArch)?.coreType ||
      (businessModelArch === "d2c_retention" || businessModelArch === "marketplace"
        ? "b2c_subscription"
        : businessModelArch === "productized_agency"
        ? "subscription_services"
        : "b2b_saas");

    const numCustomers = Number(customers) || 0;
    const numArpu = Number(arpu) || 0;
    const numCash = Number(cashBalance) || 0;
    const numMinReserve = minReserve ? Number(minReserve) : 0;

    const numLeads = Number(monthlyLeads) || 0;
    const numConv = leadConversionRate ? Number(leadConversionRate) : 0;
    const numCostPerLead = Number(costPerLead) || 0;
    const numBudget = Number(acquisitionBudget) || 0;
    const numCurrentCac = Number(currentCac) || 0;
    const numTargetCac = Number(targetCac) || numCurrentCac || 0;
    const numOrganic = Number(organicCustomers) || 0;
    const numChurn = Number(churnRate) || (Number(customerLifetimeMonths) > 0 ? 1 / Number(customerLifetimeMonths) : 0);
    const computedMonthlyChurn = numChurn > 1 ? numChurn / 100 : numChurn;

    const numExpansion = expansionRate ? Number(expansionRate) : 0;

    const numProcRate = paymentProcRate ? (Number(paymentProcRate) > 1 ? Number(paymentProcRate) / 100 : Number(paymentProcRate)) : 0.025;
    const numHostingFixed = Number(hostingFixedCost) || 0;
    const numHostingPerCust = Number(variableHostingPerCust) || 0;
    const numApiPerCust = Number(variableApiPerCust) || 0;
    const numServicingPerCust = Number(variableServicingPerCust) || 0;
    const numFixedOpex = Number(fixedOpex) || 0;
    const numFixedMktOps = Number(fixedMarketingOps) || 0;

    const defaultGoals: Record<StrategicHelpPriority, string> = {
      runway_preservation: "Extend liquid operating runway beyond 18 months and preserve safety reserve floor.",
      unit_economics: "Drive LTV:CAC ratio above 3.5x and compress CAC payback period under 12 months.",
      scale_acquisition: `Scale ARR run rate to ${currency === "INR" ? "₹1 Crore" : "$1 Million"} within 12 months with disciplined CAC.`,
      break_even: "Achieve operating cash flow break-even by covering all payroll and fixed overheads.",
      fundraising: "Achieve institutional venture readiness with top-quartile SaaS metrics and 18-month cash buffer.",
      custom_goal: "Establish venture baseline financial model & runway.",
    };

    const finalGoal =
      customGoalNote.trim() ||
      defaultGoals[helpPriority] ||
      (numArpu > 0
        ? `Reach ${currency === "INR" ? "₹1 Crore" : "$1 Million"} ARR run rate with sustainable cash runway.`
        : "Establish venture baseline financial model & runway.");

    const updatedInputs: ModelEngineInputs = {
      ...initialInputs,
      company_name: companyName.trim() || "My Venture",
      business_model: selectedModel as BusinessModelType,
      currency,
      planning_horizon: 12,

      initial_paying_customers: numCustomers,
      arpu: numArpu,
      initial_cash_balance: numCash,
      minimum_cash_reserve: numMinReserve,

      acquisition_mode: acquisitionMode,
      monthly_leads: numLeads,
      lead_conversion_rate: numConv,
      cost_per_lead: numCostPerLead,
      acquisition_budget: numBudget,
      target_cac: numTargetCac,
      organic_new_customers: numOrganic,
      customer_churn_rate: Math.round(computedMonthlyChurn * 10000) / 10000,
      expansion_rate: numExpansion,

      fixed_opex: numFixedOpex,
      payment_processing_rate: numProcRate,
      hosting_fixed_cost: numHostingFixed,
      hosting_cost_per_customer: numHostingPerCust,
      servicing_cost_per_customer: numApiPerCust + numServicingPerCust,
      fixed_marketing_ops: numFixedMktOps,
      contraction_rate: 0,

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

    // Save assessment data locally so dashboard and future sessions compute on this verified data
    try {
      localStorage.setItem("ventureiq_user_inputs", JSON.stringify(updatedInputs));
      localStorage.setItem("ventureiq_lifetime_months", customerLifetimeMonths);
      localStorage.setItem("ventureiq_decision_goal", finalGoal);
      localStorage.setItem("ventureiq_help_priority", helpPriority);
      localStorage.setItem("ventureiq_assessment_completed", "true");
    } catch (e) {
      console.warn("Could not save assessment to localStorage:", e);
    }

    onComplete(updatedInputs, finalGoal, helpPriority);
  };

  const helpPriorityOptions: { id: StrategicHelpPriority; title: string; subtitle: string; icon: any }[] = [
    {
      id: "runway_preservation",
      title: "Extend Cash Runway & Capital Preservation",
      subtitle: "Protect safety cash floor, eliminate net burn, and avoid emergency bridge dilution.",
      icon: Coins,
    },
    {
      id: "unit_economics",
      title: "Optimize Unit Economics & LTV:CAC",
      subtitle: "Accelerate CAC payback velocity under 12 months, widen gross margins, and plug churn leakage.",
      icon: TrendingUp,
    },
    {
      id: "scale_acquisition",
      title: "Scale Acquisition & Top-Line ARR Growth",
      subtitle: "Maximize monthly customer additions, optimize lead conversion funnels, and test ad budgets.",
      icon: Target,
    },
    {
      id: "break_even",
      title: "Achieve Operating Cash Break-Even",
      subtitle: "Identify the exact customer count and ARPU needed for contribution margin to cover fixed payroll.",
      icon: CheckCircle2,
    },
    {
      id: "fundraising",
      title: "Investor Due Diligence & Series Readiness",
      subtitle: "Benchmark venture metrics (Rule of 40, LTV:CAC > 3x, gross margins > 70%) for institutional checks.",
      icon: Briefcase,
    },
    {
      id: "custom_goal",
      title: "Custom Strategic Objective",
      subtitle: "Specify a custom milestone target (e.g. achieve break-even or expand customer base with disciplined spend).",
      icon: Layers,
    },
  ];

  const stepsList = [
    { num: 1, label: "Profile & Stage" },
    { num: 2, label: "Revenue & Base" },
    { num: 3, label: "Growth & Retention" },
    { num: 4, label: "Costs & Team" },
    { num: 5, label: "Decision Focus" },
  ];

  // Conditional Business Archetypes
  const isD2C =
    profileType === "D2C" ||
    businessType === "D2C" ||
    businessType === "Consumer Product" ||
    businessModelArch === "ecommerce_sales";

  const isServices =
    businessType === "IT & Tech Services" ||
    businessModelArch === "client_retainer";

  const isSaaSOrApp = !isD2C && !isServices;

  // Tailored Step 3 Retention Grid Labels & Helpers
  const retentionLabels = isD2C
    ? {
        churnRate: "Monthly Customer Drop-off Rate",
        churnHelper: "Percentage of buyers who do not reorder monthly",
        churnPlaceholder: "e.g. 10.0%",
        lifetime: "Customer Reorder Lifespan (Months)",
        lifetimeHelper: "Average reorder duration (1 ÷ Drop-off)",
        lifetimePlaceholder: "e.g. 10",
        organic: "Organic / Repeat Orders / Mo",
        organicHelper: "Word-of-mouth & direct organic orders",
        organicPlaceholder: "e.g. 25",
        expansion: "Repeat Basket Expansion %",
        expansionHelper: "Net monthly increase in repeat order basket size",
        expansionPlaceholder: "e.g. 5.0%",
      }
    : isServices
    ? {
        churnRate: "Monthly Client Attrition Rate",
        churnHelper: "Percentage of retainer clients lost each month",
        churnPlaceholder: "e.g. 2.0%",
        lifetime: "Avg Client Engagement (Months)",
        lifetimeHelper: "Expected contract duration (1 ÷ Attrition)",
        lifetimePlaceholder: "e.g. 50",
        organic: "Client Referrals / Mo",
        organicHelper: "Unpaid client referrals & incoming inbound",
        organicPlaceholder: "e.g. 2",
        expansion: "Monthly Retainer Expansion Rate",
        expansionHelper: "Net monthly upsell / scope expansions",
        expansionPlaceholder: "e.g. 3.0%",
      }
    : {
        churnRate: "Monthly Customer Churn Rate",
        churnHelper: "Percentage of customers lost each month",
        churnPlaceholder: "e.g. 2.5%",
        lifetime: "Avg Customer Lifetime (Months)",
        lifetimeHelper: "Expected retention duration (1 ÷ Churn)",
        lifetimePlaceholder: "e.g. 40",
        organic: "Organic Customers / Mo",
        organicHelper: "Word-of-mouth & unpaid referrals",
        organicPlaceholder: "e.g. 15",
        expansion: "Monthly Expansion Rate",
        expansionHelper: "Net monthly upsell / expansion",
        expansionPlaceholder: "e.g. 1.5%",
      };

  // Dynamic calculations for preview
  const numCust = Number(customers) || 0;
  const numPrice = Number(arpu) || 0;
  const currentMrr = numCust * numPrice;
  const currentArr = currentMrr * 12;

  // Step 3 Live Churn & LTV Preview
  const numChurn = Number(churnRate) || (Number(customerLifetimeMonths) > 0 ? 1 / Number(customerLifetimeMonths) : 0);
  const effectiveMonthlyChurnPct = numChurn > 1 ? numChurn / 100 : numChurn;
  const impliedCustomerLifetimeMonths =
    Number(customerLifetimeMonths) > 0
      ? Number(customerLifetimeMonths)
      : effectiveMonthlyChurnPct > 0
      ? Math.min(120, Math.round((1 / effectiveMonthlyChurnPct) * 10) / 10)
      : 36;

  // Step 4 COGS & OpEx Preview
  const numProcRate = paymentProcRate ? (Number(paymentProcRate) > 1 ? Number(paymentProcRate) / 100 : Number(paymentProcRate)) : 0.025;
  const numHostingFixed = Number(hostingFixedCost) || 0;
  const numHostingPerCust = Number(variableHostingPerCust) || 0;
  const numApiPerCust = Number(variableApiPerCust) || 0;
  const numServicingPerCust = Number(variableServicingPerCust) || 0;
  const totalVariableCogsPerCust = numHostingPerCust + numApiPerCust + numServicingPerCust + (numPrice * numProcRate);
  const impliedGrossMarginPct = numPrice > 0 ? Math.max(0, (numPrice - totalVariableCogsPerCust) / numPrice) : 0.8;
  const monthlyGrossProfitPerCust = numPrice * impliedGrossMarginPct;
  const impliedCustomerLtv = Math.round(monthlyGrossProfitPerCust * impliedCustomerLifetimeMonths);

  const numCac = Number(currentCac) || Number(targetCac) || (Number(costPerLead) > 0 && Number(leadConversionRate) > 0 ? Math.round(Number(costPerLead) / (Number(leadConversionRate) > 1 ? Number(leadConversionRate) / 100 : Number(leadConversionRate))) : 0);
  const impliedLtvToCac = numCac > 0 && impliedCustomerLtv > 0 ? (impliedCustomerLtv / numCac).toFixed(1) : null;

  const numPay = Number(monthlyPayroll) || 0;
  const numOp = Number(fixedOpex) || 0;
  const numMktOps = Number(fixedMarketingOps) || 0;
  const numAcq =
    acquisitionMode === "lead_based"
      ? (Number(monthlyLeads) || 0) * (Number(costPerLead) || 0)
      : Number(acquisitionBudget) || 0;

  const totalMonthlyCogs = numHostingFixed + (numCust * (numHostingPerCust + numApiPerCust + numServicingPerCust)) + (currentMrr * numProcRate);
  const currentMonthlyBurnEstimate = totalMonthlyCogs + numPay + numOp + numMktOps + numAcq;
  const numBankCash = Number(cashBalance) || 0;
  const netMonthlyDeficit = currentMonthlyBurnEstimate - currentMrr;
  const roughRunwayMonths =
    numBankCash > 0 && netMonthlyDeficit > 0
      ? (numBankCash / netMonthlyDeficit).toFixed(1) + " Mos"
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
              Answer 5 sections to build your live financial model &amp; strategic risk analysis
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
          </div>
        </div>


        {/* Step Progress Stepper */}
        {/* Desktop: 5-column grid */}
        <div className="hidden sm:grid sm:grid-cols-5 gap-2">
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

        {/* Mobile: Compact modern stepper bar */}
        <div className="sm:hidden rounded-2xl border border-slate-200 bg-white p-3 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">
              Step 0{currentStep} of 05: <span className="text-emerald-700">{stepsList[currentStep - 1].label}</span>
            </span>
            <div className="flex items-center gap-1">
              {stepsList.map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentStep === s.num
                      ? "w-5 bg-slate-900"
                      : currentStep > s.num
                      ? "w-2.5 bg-emerald-500"
                      : "w-2.5 bg-slate-200"
                  }`}
                  title={`Go to Step ${s.num}`}
                  aria-label={`Go to Step ${s.num}`}
                />
              ))}
            </div>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Assessment Card */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {businessModelOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setBusinessModelArch(opt.id)}
                        className={`rounded-xl border p-3 text-left text-xs transition-all ${
                          businessModelArch === opt.id
                            ? "bg-slate-900 text-white border-slate-900 font-semibold shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                        }`}
                      >
                        <div className="font-bold">{opt.label}</div>
                        <div
                          className={`text-[11px] mt-0.5 leading-snug ${
                            businessModelArch === opt.id ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {opt.sublabel}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operating Currency */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700">Operating Currency</label>
                  <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                    {(["INR", "USD", "EUR", "GBP"] as CurrencyCode[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleAssessmentCurrencyChange(c)}
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
              </div>
            </div>
          )}

          {/* STEP 2: Baseline Revenue & Customers */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                  <span>
                    {isD2C
                      ? "Step 2: Revenue Baseline, Orders & Treasury"
                      : isServices
                      ? "Step 2: Revenue Baseline & Active Client Retainers"
                      : "Step 2: Baseline Revenue, Customers & Cash Position"}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  {isD2C
                    ? "Enter your average order value (AOV), active monthly purchasing orders, and available bank reserves."
                    : isServices
                    ? "Enter your average retainer or project fee, active client accounts, and bank reserves."
                    : "Where does your venture stand today? Enter active customers, monthly price per unit, and available cash."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    {isD2C
                      ? "Monthly Active Orders / Buyers"
                      : isServices
                      ? "Active Retainer Clients / Accounts"
                      : "Current Paying Customers (Accounts)"}
                  </label>
                  <div className="mt-1.5">
                    <FormattedNumberInput
                      value={customers}
                      onChange={setCustomers}
                      placeholder={
                        isD2C
                          ? "e.g. 250 orders / mo"
                          : isServices
                          ? "e.g. 12 clients"
                          : "Enter paying customer count"
                      }
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isD2C
                      ? "Total completed orders or active buyers per month"
                      : isServices
                      ? "Total ongoing retainer client accounts"
                      : "Active recurring subscription or paying clients"}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    {isD2C
                      ? `Average Order Value / AOV (${currency} / order)`
                      : isServices
                      ? `Average Monthly Retainer / Project Fee (${currency} / client / mo)`
                      : `Monthly Price / ARPU (${currency} / user / month)`}
                  </label>
                  <div className="mt-1.5">
                    <FormattedNumberInput
                      isCurrency={true}
                      currency={currency}
                      value={arpu}
                      onChange={setArpu}
                      placeholder={
                        isD2C
                          ? `e.g. ${currency === "INR" ? "1,250" : "35"}`
                          : isServices
                          ? `e.g. ${currency === "INR" ? "75,000" : "1,500"}`
                          : "Enter monthly price per customer"
                      }
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isD2C
                      ? "Average gross checkout size / basket value per order"
                      : isServices
                      ? "Average monthly billings or retainer per client account"
                      : "Average revenue generated per paying account monthly"}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    {isD2C
                      ? `Current Liquid Bank Balance (${currency})`
                      : isServices
                      ? `Current Operating Bank Balance (${currency})`
                      : `Current Bank Cash Balance (${currency})`}
                  </label>
                  <div className="mt-1.5">
                    <FormattedNumberInput
                      isCurrency={true}
                      currency={currency}
                      value={cashBalance}
                      onChange={setCashBalance}
                      placeholder="Enter liquid bank cash"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isD2C
                      ? "Total available capital in bank for operations and inventory"
                      : "Total available operating treasury funds"}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    {isD2C
                      ? `Minimum Working Capital Buffer (${currency})`
                      : `Minimum Safety Reserve Floor (${currency})`}
                  </label>
                  <div className="mt-1.5">
                    <FormattedNumberInput
                      isCurrency={true}
                      currency={currency}
                      value={minReserve}
                      onChange={setMinReserve}
                      placeholder="Enter safety reserve floor"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isD2C
                      ? "Reserve required for inventory replenishment and operating float"
                      : "Threshold below which VentureIQ flags solvency alerts"}
                  </span>
                </div>
              </div>

              {/* Live Baseline Preview */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {isD2C
                      ? "Calculated Monthly Sales (GMV)"
                      : isServices
                      ? "Calculated Monthly Retainer Billings"
                      : "Calculated Monthly Revenue (MRR)"}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(currentMrr, currency, false)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {isD2C
                      ? "Annualized Sales Run Rate"
                      : isServices
                      ? "Annualized Billing Run Rate"
                      : "Starting ARR Run Rate"}
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {formatCurrency(currentArr, currency, true)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">
                    {isD2C ? "Available Working Capital Cushion" : "Operational Cash Cushion"}
                  </span>
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
                    {isD2C
                      ? "Traffic & Store Funnel (Visitors / Store Conversion %)"
                      : isServices
                      ? "Sales Pipeline & Inbound Proposals"
                      : "Lead-Based Funnel (Inbound / Sales)"}
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
                    {isD2C
                      ? "Paid Ad Performance Budget (Meta / Google Ads)"
                      : isServices
                      ? "Dedicated Business Development Budget"
                      : "Paid Performance Budget (Ads / Channels)"}
                  </button>
                </div>

                {acquisitionMode === "lead_based" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        {isD2C
                          ? "Monthly Store Visitors / Clicks"
                          : isServices
                          ? "Monthly Qualified Inbound Leads"
                          : "Monthly Lead Volume"}
                      </label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          value={monthlyLeads}
                          onChange={setMonthlyLeads}
                          placeholder={
                            isD2C
                              ? "e.g. 10,000 visitors"
                              : isServices
                              ? "e.g. 25 leads"
                              : "Enter monthly leads"
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <PercentageInput
                        label={
                          isD2C
                            ? "Store Conversion Rate % (Visitors to Buyers)"
                            : isServices
                            ? "Proposal to Contract Close Rate %"
                            : "Lead Conversion Rate"
                        }
                        value={leadConversionRate}
                        onChange={setLeadConversionRate}
                        placeholderPercent={isD2C ? "e.g. 2.5%" : isServices ? "e.g. 15.0%" : "e.g. 3.5%"}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        {isD2C
                          ? `Cost Per Visitor / CPC (${currency})`
                          : isServices
                          ? `Cost Per Qualified Lead (${currency})`
                          : `Cost Per Lead (${currency})`}
                      </label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={costPerLead}
                          onChange={setCostPerLead}
                          placeholder={
                            isD2C
                              ? "e.g. 15"
                              : isServices
                              ? "e.g. 2,500"
                              : "Enter cost per lead"
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Current Blended CAC ({currency})</label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={currentCac}
                          onChange={setCurrentCac}
                          placeholder={
                            Number(costPerLead) > 0 && Number(leadConversionRate) > 0
                              ? `Est. ${Math.round(Number(costPerLead) / Number(leadConversionRate))}`
                              : "Enter current CAC"
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        {isD2C ? `Target CAC / Cost per First Order (${currency})` : `Target CAC (${currency})`}
                      </label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={targetCac}
                          onChange={setTargetCac}
                          placeholder="Enter target CAC"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        {isD2C
                          ? `Monthly Paid Ad Budget (${currency})`
                          : isServices
                          ? `Monthly Sales & Marketing Budget (${currency})`
                          : `Monthly Marketing Spend (${currency})`}
                      </label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={acquisitionBudget}
                          onChange={setAcquisitionBudget}
                          placeholder="Enter monthly acquisition budget"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Current Blended CAC ({currency})</label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={currentCac}
                          onChange={setCurrentCac}
                          placeholder="Enter current blended CAC"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        {isD2C ? `Target CAC / Cost per First Order (${currency})` : `Target CAC (${currency})`}
                      </label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={targetCac}
                          onChange={setTargetCac}
                          placeholder="Enter target CAC"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Retention Dynamics (4 Fields Grid: Monthly Churn, Lifetime, Organic Customers, Expansion) */}
                <div className="space-y-3 border-t border-slate-100 pt-3">
                  <div className="space-y-0.5">
                    <label className="text-xs font-semibold text-slate-800 block">
                      {isD2C
                        ? "Customer Reorder, Retention & Basket Expansion"
                        : isServices
                        ? "Client Retainer Retention & Scope Expansion"
                        : "Customer Retention & Growth Dynamics"}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {isD2C
                        ? "Configure repeat order dynamics. Monthly drop-off and customer reorder lifespan calculate dynamically in sync."
                        : isServices
                        ? "Configure client retention profile. Monthly client attrition and contract engagement lifetime calculate dynamically in sync."
                        : "Configure your retention profile. Monthly churn rate and average customer lifetime calculate dynamically in sync."}
                    </p>
                  </div>

                  {/* Fully Aligned 4-Card Retention Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
                    {/* Card 1: Churn / Drop-off Rate */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="min-h-[2.5rem] flex items-start text-xs font-semibold text-slate-800 leading-tight">
                        {retentionLabels.churnRate}
                      </div>
                      <div className="my-1.5 h-10 flex items-center">
                        <PercentageInput
                          value={churnRate}
                          onChange={handleMonthlyChurnChange}
                          placeholderPercent={retentionLabels.churnPlaceholder}
                          className="w-full"
                        />
                      </div>
                      <div className="min-h-[2.25rem] text-[10px] text-slate-400 leading-tight flex items-start">
                        {retentionLabels.churnHelper}
                      </div>
                    </div>

                    {/* Card 2: Customer Lifetime Months */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="min-h-[2.5rem] flex items-start text-xs font-semibold text-slate-800 leading-tight">
                        {retentionLabels.lifetime}
                      </div>
                      <div className="my-1.5 h-10 flex items-center">
                        <FormattedNumberInput
                          value={customerLifetimeMonths}
                          onChange={handleLifetimeMonthsChange}
                          placeholder={retentionLabels.lifetimePlaceholder}
                          className="w-full"
                        />
                      </div>
                      <div className="min-h-[2.25rem] text-[10px] text-slate-400 leading-tight flex items-start">
                        {retentionLabels.lifetimeHelper}
                      </div>
                    </div>

                    {/* Card 3: Organic Customers */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="min-h-[2.5rem] flex items-start text-xs font-semibold text-slate-800 leading-tight">
                        {retentionLabels.organic}
                      </div>
                      <div className="my-1.5 h-10 flex items-center">
                        <FormattedNumberInput
                          value={organicCustomers}
                          onChange={setOrganicCustomers}
                          placeholder={retentionLabels.organicPlaceholder}
                          className="w-full"
                        />
                      </div>
                      <div className="min-h-[2.25rem] text-[10px] text-slate-400 leading-tight flex items-start">
                        {retentionLabels.organicHelper}
                      </div>
                    </div>

                    {/* Card 4: Expansion Rate */}
                    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                      <div className="min-h-[2.5rem] flex items-start text-xs font-semibold text-slate-800 leading-tight">
                        {retentionLabels.expansion}
                      </div>
                      <div className="my-1.5 h-10 flex items-center">
                        <PercentageInput
                          value={expansionRate}
                          onChange={setExpansionRate}
                          placeholderPercent={retentionLabels.expansionPlaceholder}
                          className="w-full"
                        />
                      </div>
                      <div className="min-h-[2.25rem] text-[10px] text-slate-400 leading-tight flex items-start">
                        {retentionLabels.expansionHelper}
                      </div>
                    </div>
                  </div>

                  {/* Live Unit Economics & LTV Preview Card */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                        {isD2C ? "Implied Reorder Lifespan" : "Implied Retention Lifetime"}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {impliedCustomerLifetimeMonths} {isD2C ? "Months / Cycles" : "Months"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                        {isD2C ? "Unit GP / Order" : isServices ? "Monthly GP / Client" : "Monthly GP / Customer"}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(monthlyGrossProfitPerCust, currency, false)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                        Calculated Customer LTV
                      </span>
                      <span className="text-sm font-extrabold text-emerald-700">
                        {formatCurrency(impliedCustomerLtv, currency, true)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                        Projected LTV : CAC
                      </span>
                      <span className={`text-sm font-extrabold ${impliedLtvToCac && Number(impliedLtvToCac) >= 3 ? "text-emerald-700" : impliedLtvToCac ? "text-amber-700" : "text-slate-400"}`}>
                        {impliedLtvToCac ? `${impliedLtvToCac}x` : "Awaiting CAC"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Cost Structure & Team */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-emerald-600" />
                  <span>Step 4: Cost of Goods Sold (COGS) &amp; Operating Expenses</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Provide your direct delivery COGS per account and fixed operating expenses so VentureIQ computes exact gross margins, contribution margins, and net burn.
                </p>
              </div>

              {/* Sub-Section A: Direct Cost of Goods Sold (COGS) */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {isD2C
                        ? "Direct Cost of Goods Sold (COGS), Packaging & Shipping"
                        : isServices
                        ? "Direct Client Delivery, Tooling & Contractor COGS"
                        : "Direct Cost of Goods Sold (COGS) & Variable Delivery"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isD2C
                        ? "Costs directly tied to manufacturing products, order packaging, courier fulfillment, and payment gateway"
                        : isServices
                        ? "Direct contractor costs, client workspace software seats, and payment/invoicing fees"
                        : "Costs directly tied to hosting, processing payments, and servicing accounts"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {isD2C ? "Product Margin Drivers" : isServices ? "Service Margin Drivers" : "Gross Margin Drivers"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  <div>
                    <PercentageInput
                      label={
                        isD2C
                          ? "Payment Gateway & Merchant Fee Rate"
                          : isServices
                          ? "Invoicing & Payment Processing Rate"
                          : "Payment Gateway Processing Fee"
                      }
                      value={paymentProcRate}
                      onChange={setPaymentProcRate}
                      placeholderPercent="e.g. 2.5%"
                      helperText={
                        isD2C
                          ? "Shopify Payments / Razorpay / Stripe transaction fee"
                          : isServices
                          ? "Payment processing & bank wire fee"
                          : "Stripe / Razorpay transaction fee"
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {isD2C
                        ? `Product Unit Manufacturing Cost (${currency} / unit)`
                        : isServices
                        ? `Contractor & Direct Delivery Cost (${currency} / client / mo)`
                        : `Variable Cloud Compute (${currency} / user / mo)`}
                    </label>
                    <div className="mt-1.5">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={currency}
                        value={variableHostingPerCust}
                        onChange={setVariableHostingPerCust}
                        placeholder={
                          isD2C
                            ? "e.g. 250 (Formulation & bottling)"
                            : isServices
                            ? "e.g. 15,000"
                            : "Enter cloud compute / user"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isD2C
                        ? "Direct cost of raw materials, formulation & bottling per unit"
                        : isServices
                        ? "Direct contractor or dedicated billable personnel allocation"
                        : "Storage & compute scaling per customer"}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {isD2C
                        ? `Packaging & Courier Shipping (${currency} / order)`
                        : isServices
                        ? `Client Software Licenses (${currency} / client / mo)`
                        : `Customer Support & Servicing (${currency} / user / mo)`}
                    </label>
                    <div className="mt-1.5">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={currency}
                        value={variableServicingPerCust}
                        onChange={setVariableServicingPerCust}
                        placeholder={
                          isD2C
                            ? "e.g. 80 (3PL, packaging, courier delivery)"
                            : isServices
                            ? "e.g. 3,500"
                            : "Enter customer support / user"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isD2C
                        ? "Pick-and-pack, courier shipping & packaging per order"
                        : isServices
                        ? "Figma, GitHub, AWS accounts dedicated to client"
                        : "Dedicated CSM & support delivery"}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {isD2C
                        ? `Fixed Warehouse & Storage Facility Rent (${currency} / mo)`
                        : isServices
                        ? `Fixed Dev Infrastructure & Tooling (${currency} / mo)`
                        : `Fixed Cloud / Server Base Hosting (${currency} / mo)`}
                    </label>
                    <div className="mt-1.5">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={currency}
                        value={hostingFixedCost}
                        onChange={setHostingFixedCost}
                        placeholder={
                          isD2C
                            ? "e.g. 35,000"
                            : isServices
                            ? "e.g. 25,000"
                            : "Enter base server cost"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isD2C
                        ? "Baseline monthly warehouse rent or 3PL storage minimum"
                        : isServices
                        ? "Jira, Slack, internal dev servers & agency tools"
                        : "Baseline database & server cluster"}
                    </span>
                  </div>

                  {!isD2C && !isServices && (
                    <div>
                      <label className="text-xs font-semibold text-slate-700">
                        Third-Party APIs &amp; Tokens ({currency} / user / mo)
                      </label>
                      <div className="mt-1.5">
                        <FormattedNumberInput
                          isCurrency={true}
                          currency={currency}
                          value={variableApiPerCust}
                          onChange={setVariableApiPerCust}
                          placeholder="Enter API & token COGS"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">LLM inference, data feeds, external APIs</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Section B: Operating Expenses (OpEx) & Overhead */}
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Operating Expenses (OpEx) &amp; Team Payroll
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isD2C
                        ? "Fixed monthly business overheads, warehouse & operations team compensation"
                        : "Fixed monthly business overheads and team compensation"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    Net Burn Drivers
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {isD2C
                        ? `Core Operations, Fulfillment & Marketing Payroll (${currency})`
                        : `Total Monthly Team Payroll (${currency})`}
                    </label>
                    <div className="mt-1.5">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={currency}
                        value={monthlyPayroll}
                        onChange={setMonthlyPayroll}
                        placeholder={
                          isD2C ? "e.g. 1,50,000" : "Enter monthly payroll"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isD2C
                        ? "Warehouse, operations, marketing & admin salaries"
                        : "Salaries + employer payroll taxes"}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {isD2C
                        ? `Fixed Operating Overheads (${currency} / mo)`
                        : isServices
                        ? `Fixed Agency Overheads (${currency} / mo)`
                        : `Fixed G&A Overheads (${currency} / mo)`}
                    </label>
                    <div className="mt-1.5">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={currency}
                        value={fixedOpex}
                        onChange={setFixedOpex}
                        placeholder={
                          isD2C
                            ? "e.g. 50,000"
                            : isServices
                            ? "e.g. 40,000"
                            : "Enter fixed G&A overhead"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isD2C
                        ? "Shopify apps, office rent, software tools, legal & accounting"
                        : isServices
                        ? "Office rent, legal, accounting, team SaaS tools"
                        : "Office rent, software tools, legal, audit"}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">
                      {isD2C
                        ? `Brand, Photoshoots & Creative Ops (${currency} / mo)`
                        : isServices
                        ? `Sales & Business Development Ops (${currency} / mo)`
                        : `Marketing & Sales Operations (${currency} / mo)`}
                    </label>
                    <div className="mt-1.5">
                      <FormattedNumberInput
                        isCurrency={true}
                        currency={currency}
                        value={fixedMarketingOps}
                        onChange={setFixedMarketingOps}
                        placeholder={
                          isD2C
                            ? "e.g. 30,000"
                            : isServices
                            ? "e.g. 20,000"
                            : "Enter marketing ops budget"
                        }
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {isD2C
                        ? "Influencer retainers, photoshoots & creative production"
                        : isServices
                        ? "Outbound sales tools, pitch materials, conferences"
                        : "CRM tooling, retainers (outside ad spend)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 4 Live Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                    {isD2C ? "Total Variable COGS / Order" : isServices ? "Total Variable Delivery / Client" : "Total Variable COGS / Customer"}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(totalVariableCogsPerCust, currency, false)} {isD2C ? "/ order" : "/ mo"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                    {isD2C ? "Product Gross Margin" : "Implied Gross Margin"}
                  </span>
                  <span className={`text-sm font-extrabold ${impliedGrossMarginPct >= 0.7 ? "text-emerald-700" : impliedGrossMarginPct >= 0.5 ? "text-amber-700" : "text-rose-700"}`}>
                    {(impliedGrossMarginPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                    Estimated Monthly Outflows
                  </span>
                  <span className="text-sm font-extrabold text-rose-600">
                    {formatCurrency(currentMonthlyBurnEstimate, currency, false)} / mo
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-semibold uppercase tracking-wider">
                    Estimated Net Runway
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700">{roughRunwayMonths}</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: What do you need help with? */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Strategic Decision &amp; Advisory Objective</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900 tracking-tight">
                  What strategic problem do you need help solving?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Choose your venture&apos;s current highest priority. All dashboard recommendations, situation flags, triggers, and sensitivity tests will align directly to this goal.
                </p>
              </div>

              {/* 6 Help Priority Option Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {helpPriorityOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = helpPriority === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setHelpPriority(opt.id as StrategicHelpPriority)}
                      className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-1 ring-emerald-500"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold transition-colors ${
                            isSelected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">{opt.title}</span>
                            {isSelected && (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {opt.subtitle}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Goal Specifics or Notes */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Specific Target, Decision or Milestone Context (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Included in executive audit</span>
                </label>
                <textarea
                  rows={3}
                  value={customGoalNote}
                  onChange={(e) => setCustomGoalNote(e.target.value)}
                  placeholder="e.g., We have 14 months of runway and need to double ARR to ₹1.2 Cr before our next seed extension in Q3, or evaluate hiring 2 SDRs vs increasing Google ads."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
                />
                <span className="text-[10px] text-slate-400 block">
                  The advisory engine uses this context alongside your unit economics to produce tailored recommendations and contingency flags.
                </span>
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
      <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span>Deterministic Financial Invariant Engine • 100% Client-Side Simulation • No Data Sent to Third Parties</span>
        <div className="flex items-center gap-3">
          <Link href="/privacy" className="hover:text-slate-600 transition-colors underline underline-offset-2">
            Cookie &amp; Privacy Policy
          </Link>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsCookieModalOpen(true)}
            className="hover:text-slate-600 transition-colors"
          >
            Manage Cookies
          </button>
        </div>
      </footer>

      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
        onSavePreferences={() => setIsCookieModalOpen(false)}
      />
    </div>
  );
};
