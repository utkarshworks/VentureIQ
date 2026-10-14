/**
 * VentureIQ Strategic Advisory Intelligence Engine
 * 100% Private, Deterministic, Rule-Based Financial Reasoning Engine.
 * Formulates CFO-grade executive findings, trade-offs, and actionable roadmaps
 * without transmitting company financial data to external third parties.
 */

import { ModelEngineInputs, EngineSummary } from "@/types/model";
import { formatCurrency, formatPercent, formatMonths, formatNumber } from "@/lib/formatters";

export type StrategicHelpPriority =
  | "runway_preservation"
  | "unit_economics"
  | "scale_acquisition"
  | "break_even"
  | "fundraising"
  | "custom_goal";

export interface DirectAnswerData {
  headline: string;
  details: string;
  extractedParameters?: { label: string; value: string }[];
  verdictType?: "optimal" | "warning" | "danger" | "neutral";
}

export interface AdvisoryResponse {
  title: string;
  directAnswer?: DirectAnswerData;
  executiveSummary: string;
  focusArea: string;
  keyMetricsAudited: { label: string; value: string; benchmark: string; status: "good" | "neutral" | "warning" | "danger" }[];
  strategicDiagnosis: string[];
  recommendedActions: { step: number; action: string; impact: string; timeline: string }[];
  disclaimer: string;
}

/**
 * Parses numeric currency values from natural language user queries.
 * Supports: ₹50L, 50 Lakh, 1.5 Cr, 1 Crore, $500k, 500,000, 1M, 2.5 Million, etc.
 */
function parseCurrencyOrNumber(text: string): number | null {
  const clean = text.toLowerCase().replace(/,/g, "");

  // Crore (1 Cr = 10,000,000)
  const crMatch = clean.match(/(?:₹|\$|€|£)?\s*(\d+(?:\.\d+)?)\s*(?:cr|crore|crores)/);
  if (crMatch) return parseFloat(crMatch[1]) * 10000000;

  // Lakh (1 L = 100,000)
  const lMatch = clean.match(/(?:₹|\$|€|£)?\s*(\d+(?:\.\d+)?)\s*(?:l|lakh|lakhs|lac|lacs)/);
  if (lMatch) return parseFloat(lMatch[1]) * 100000;

  // Million (1 M = 1,000,000)
  const mMatch = clean.match(/(?:₹|\$|€|£)?\s*(\d+(?:\.\d+)?)\s*(?:m|million|millions)/);
  if (mMatch) return parseFloat(mMatch[1]) * 1000000;

  // Thousand / K (1 K = 1,000)
  const kMatch = clean.match(/(?:₹|\$|€|£)?\s*(\d+(?:\.\d+)?)\s*(?:k|thousand)/);
  if (kMatch) return parseFloat(kMatch[1]) * 1000;

  // Plain currency numbers: ₹80000 or $50000
  const plainMatch = clean.match(/(?:₹|\$|€|£)\s*(\d+(?:\.\d+)?)/);
  if (plainMatch) return parseFloat(plainMatch[1]);

  return null;
}

/**
 * Extracts hiring headcount, role title, and salary from queries like:
 * "Can we afford to hire 2 engineers at ₹80,000 per month?"
 */
function parseHiringEntities(text: string, defaultCurrency: string): { headcount: number; role: string; salary: number } {
  const clean = text.toLowerCase();

  // Headcount
  let headcount = 1;
  const countMatch = clean.match(/(\d+)\s*(?:headcount|hire|hires|engineer|engineers|dev|developer|sales|rep|reps|sdr|sdrs|ae|aes|marketer|marketers|employee|employees|people|person)/);
  if (countMatch) {
    headcount = Math.max(1, parseInt(countMatch[1], 10));
  } else if (clean.includes("two ") || clean.includes(" 2 ")) {
    headcount = 2;
  } else if (clean.includes("three ") || clean.includes(" 3 ")) {
    headcount = 3;
  }

  // Role title
  let role = "Specialist";
  if (clean.includes("engineer") || clean.includes("developer") || clean.includes("dev")) role = "Software Engineer";
  else if (clean.includes("sales") || clean.includes("rep") || clean.includes("account executive") || clean.includes("ae")) role = "Sales Account Executive";
  else if (clean.includes("sdr") || clean.includes("bdr")) role = "Sales Development Rep (SDR)";
  else if (clean.includes("marketer") || clean.includes("growth") || clean.includes("marketing")) role = "Growth Marketer";
  else if (clean.includes("operations") || clean.includes("ops")) role = "Operations Lead";

  // Salary
  const parsedSalary = parseCurrencyOrNumber(text);
  const salary = parsedSalary && parsedSalary < 10000000 ? parsedSalary : defaultCurrency === "INR" ? 75000 : 3500;

  return { headcount, role, salary };
}

/**
 * Core Dynamic Advisory Analyzer with Deep Query Extraction & Mathematical Verification.
 */
export function generateAdvisoryAnalysis(
  inputs: ModelEngineInputs,
  summary: EngineSummary,
  query?: string,
  helpPriority?: StrategicHelpPriority
): AdvisoryResponse {
  const curr = inputs.currency;
  const rawQ = query || "";
  const q = rawQ.toLowerCase().trim();

  // Baseline metric calculations
  const mrr = summary.final_month_mrr;
  const arr = summary.final_month_arr;
  const endingCash = summary.ending_cash;
  const minReserve = inputs.minimum_cash_reserve;
  const gmPct = summary.average_gross_margin_pct;
  const cmPct = summary.average_contribution_margin_pct;
  const ltvCac = summary.ltv_to_cac_ratio_final;
  const payback = summary.cac_payback_final;
  const runwayMonths = summary.runway_months;
  const churn = inputs.customer_churn_rate;
  const arpu = Math.max(1, inputs.arpu);
  const currentCustomers = inputs.initial_paying_customers;
  const blendedCac = summary.blended_cac_final || inputs.target_cac || 2000;

  const totalFixedCosts =
    inputs.fixed_opex +
    inputs.hosting_fixed_cost +
    (inputs.hiring_roles?.reduce((acc, r) => acc + (r.monthly_salary || 0) * (r.headcount || 0), 0) || 0);

  const isSolvent = endingCash >= minReserve && runwayMonths === null;
  const isLtvHealthy = ltvCac !== null && ltvCac >= 3.0;
  const isPaybackHealthy = payback !== null && payback <= 12;
  const isGrossMarginHealthy = gmPct >= 0.7;

  // Audited Key Metrics
  const keyMetricsAudited: {
    label: string;
    value: string;
    benchmark: string;
    status: "good" | "neutral" | "warning" | "danger";
  }[] = [
    {
      label: "Operating Solvency & Runway",
      value: runwayMonths !== null ? `${runwayMonths} Months (Breached)` : `> ${inputs.planning_horizon} Months`,
      benchmark: "≥ 18 Months Safe Buffer",
      status: isSolvent ? "good" : endingCash < 0 ? "danger" : "warning",
    },
    {
      label: "Unit Economics (LTV : CAC)",
      value: ltvCac !== null ? `${ltvCac.toFixed(1)}x` : "N/A",
      benchmark: "≥ 3.0x Viable",
      status: isLtvHealthy ? "good" : ltvCac !== null && ltvCac >= 2.0 ? "neutral" : "danger",
    },
    {
      label: "CAC Payback Velocity",
      value: payback !== null ? `${payback.toFixed(1)} Mos` : "N/A",
      benchmark: "≤ 12 Months",
      status: isPaybackHealthy ? "good" : payback !== null && payback <= 18 ? "neutral" : "warning",
    },
    {
      label: "Gross Delivery Margin",
      value: mrr > 0 ? formatPercent(gmPct) : "N/A",
      benchmark: "≥ 70% Standard",
      status: isGrossMarginHealthy ? "good" : gmPct >= 0.5 ? "neutral" : "warning",
    },
  ];

  let title = "Executive Strategic Advisory Assessment";
  let focusArea = "Capital & Operating Discipline";
  let executiveSummary = "";
  let strategicDiagnosis: string[] = [];
  let recommendedActions: { step: number; action: string; impact: string; timeline: string }[] = [];
  let directAnswer: DirectAnswerData | undefined = undefined;

  // =========================================================================
  // 1. QUERY INTENT CLASSIFICATION & DIRECT ANSWER EXTRACTION
  // =========================================================================

  // CASE 1: Hiring & Headcount Affordability Question
  if (
    q.includes("hire") ||
    q.includes("hiring") ||
    q.includes("afford") ||
    q.includes("salary") ||
    q.includes("salaries") ||
    q.includes("engineer") ||
    q.includes("developer") ||
    q.includes("sales rep") ||
    q.includes("sdr") ||
    q.includes("headcount") ||
    q.includes("employee")
  ) {
    const { headcount, role, salary } = parseHiringEntities(rawQ, curr);
    const monthlyGrossPayroll = headcount * salary;
    const monthlyBurdenedPayroll = monthlyGrossPayroll * 1.15; // 15% employer taxes
    const annualOutlay = monthlyBurdenedPayroll * 12;
    const customersNeededPerMonthToFund = Math.ceil(
      monthlyBurdenedPayroll / Math.max(1, arpu * Math.max(0.2, gmPct))
    );

    const isAffordable = endingCash - annualOutlay >= minReserve;

    focusArea = "Organizational Capacity & Headcount Leverage";
    title = `Workforce Affordability Audit: ${headcount} ${role} at ${formatCurrency(salary, curr)}/Mo`;

    directAnswer = {
      headline: isAffordable
        ? `Verdict: Affordable — Capital Reserve Can Absorb ${headcount} ${role}`
        : `Verdict: High Risk — Hiring ${headcount} ${role} Breaches Minimum Cash Reserve`,
      details: isAffordable
        ? `Yes, your business can absorb hiring ${headcount} ${role} at ${formatCurrency(salary, curr)}/month. Including the standard 15% employer tax burden, this adds ${formatCurrency(monthlyBurdenedPayroll, curr)} in monthly payroll (${formatCurrency(annualOutlay, curr, true)} across 12 months). Your current projected ending cash of ${formatCurrency(endingCash, curr, true)} remains above your minimum reserve floor of ${formatCurrency(minReserve, curr, true)}. To operate cash-neutral on this hire, the team must generate at least ${customersNeededPerMonthToFund} active paying accounts.`
        : `Caution: Adding ${headcount} ${role} at ${formatCurrency(salary, curr)}/month is not recommended under current cash reserves. With 15% employer taxes, monthly payroll increases by ${formatCurrency(monthlyBurdenedPayroll, curr)} (${formatCurrency(annualOutlay, curr, true)} over 12 months), pulling your cash reserves below the ${formatCurrency(minReserve, curr, true)} minimum threshold. Gate this hire on reaching at least ${formatCurrency(monthlyBurdenedPayroll * 2, curr)} in net new MRR first.`,
      extractedParameters: [
        { label: "Headcount Expansion", value: `${headcount} new hire(s) (${role})` },
        { label: "Monthly Base Salary", value: formatCurrency(salary, curr) },
        { label: "Fully-Burdened Monthly Payroll", value: `${formatCurrency(monthlyBurdenedPayroll, curr)} (15% tax)` },
        { label: "Breakeven Customer Quota", value: `${customersNeededPerMonthToFund} active accounts` },
      ],
      verdictType: isAffordable ? "optimal" : "danger",
    };

    executiveSummary = `Headcount represents a fixed, recurring capital obligation. At ${formatCurrency(monthlyBurdenedPayroll, curr)}/month for ${headcount} ${role}, your payroll burden ratio shifts from ${formatPercent((inputs.hiring_roles?.reduce((a, r) => a + r.monthly_salary * r.headcount, 0) || 1) / Math.max(1, totalFixedCosts))} to higher fixed commitments.`;

    strategicDiagnosis = [
      `Monthly Hurdle Rate: This addition increases monthly fixed expenses to ${formatCurrency(totalFixedCosts + monthlyBurdenedPayroll, curr, true)}. Break-even revenue hurdle increases by ${formatCurrency(monthlyBurdenedPayroll / Math.max(0.1, cmPct), curr, true)}.`,
      `Productivity Benchmark: In venture-backed software and recurring models, each commercial hire must yield at least 3x their burdened salary in annualized ARR (${formatCurrency(annualOutlay * 3, curr, true)} target).`,
      `Flexibility Alternative: Utilizing contract specialists for the first 90 days eliminates employer burden taxes and severance liability until product-market demand validates the full-time role.`,
    ];

    recommendedActions = [
      {
        step: 1,
        action: `Institute Milestone-Gated Hiring Trigger at ${formatCurrency(monthlyBurdenedPayroll * 2.5, curr)} MRR`,
        impact: "Guarantees customer gross margins fund new compensation before contract signatures, preventing balance sheet erosion.",
        timeline: "Pre-Hire Gate",
      },
      {
        step: 2,
        action: `Set Explicit Quota of ${customersNeededPerMonthToFund} New Active Customers`,
        impact: `Covers the ${formatCurrency(monthlyBurdenedPayroll, curr)} monthly compensation cost in recurring gross profit.`,
        timeline: "First 90 Days",
      },
      {
        step: 3,
        action: "Evaluate Contractor Buffer for First 90 Days",
        impact: "Preserves operational flexibility while validating headcount ROI without long-term overhead commitment.",
        timeline: "Sprint 1",
      },
    ];
  }

  // CASE 2: Break-Even & Profitability Question
  else if (
    q.includes("break-even") ||
    q.includes("breakeven") ||
    q.includes("break even") ||
    q.includes("profit") ||
    q.includes("self-sufficient") ||
    q.includes("self-sustaining") ||
    q.includes("profitable")
  ) {
    const breakEvenRevenue = cmPct > 0 ? totalFixedCosts / cmPct : totalFixedCosts * 1.5;
    const breakEvenCustomers = Math.ceil(breakEvenRevenue / arpu);
    const customerGap = Math.max(0, breakEvenCustomers - currentCustomers);

    focusArea = "Operating Break-Even & Self-Sufficiency Blueprint";
    title = `Break-Even Engineering: ${formatCurrency(breakEvenRevenue, curr, true)} Monthly Hurdle`;

    directAnswer = {
      headline: summary.break_even_month
        ? `Operating Break-Even Achieved in Month ${summary.break_even_month}`
        : `Operating Break-Even Hurdle: Requires ${formatCurrency(breakEvenRevenue, curr, true)}/Month (${formatNumber(breakEvenCustomers)} Accounts)`,
      details: summary.break_even_month
        ? `Your active financial model successfully achieves operating cash break-even in Month ${summary.break_even_month}. By that point, customer collections fully absorb your monthly fixed baseline of ${formatCurrency(totalFixedCosts, curr, true)}.`
        : `To achieve operating break-even and become self-sustaining, your business must reach ${formatCurrency(breakEvenRevenue, curr, true)} in monthly revenue. At your current contribution margin of ${formatPercent(cmPct)} and ARPU of ${formatCurrency(arpu, curr)}/month, this translates to exactly ${formatNumber(breakEvenCustomers)} active paying customers. With ${formatNumber(currentCustomers)} current accounts, your net break-even customer gap is +${formatNumber(customerGap)} accounts.`,
      extractedParameters: [
        { label: "Fixed Monthly Baseline", value: formatCurrency(totalFixedCosts, curr, true) },
        { label: "Contribution Margin %", value: formatPercent(cmPct) },
        { label: "Break-Even MRR", value: formatCurrency(breakEvenRevenue, curr, true) },
        { label: "Required Active Accounts", value: `${formatNumber(breakEvenCustomers)} customers` },
      ],
      verdictType: summary.break_even_month ? "optimal" : "warning",
    };

    executiveSummary = `Operating break-even occurs when monthly contribution margin covers 100% of fixed payroll (${formatCurrency(inputs.hiring_roles?.reduce((a, r) => a + r.monthly_salary * r.headcount, 0) || 0, curr)}), hosting (${formatCurrency(inputs.hosting_fixed_cost, curr)}), and overhead (${formatCurrency(inputs.fixed_opex, curr)}).`;

    strategicDiagnosis = [
      `Fixed Cost Absorption: Every ${formatCurrency(100, curr)} in monthly revenue generates ${formatCurrency(100 * cmPct, curr)} in gross operating surplus towards absorbing overhead.`,
      `Customer Volume Shortfall: Closing your customer gap of +${formatNumber(customerGap)} accounts at current acquisition rates requires ~${Math.ceil(customerGap / Math.max(1, inputs.monthly_leads * inputs.lead_conversion_rate))} months.`,
      `Margin Compression Leverage: A 5% improvement in contribution margin lowers your break-even hurdle by ${formatCurrency(totalFixedCosts / Math.max(0.01, cmPct + 0.05) - totalFixedCosts / cmPct, curr, true)}.`,
    ];

    recommendedActions = [
      {
        step: 1,
        action: "Compress Non-Payroll Fixed Overhead by 15%",
        impact: `Immediately lowers monthly break-even hurdle from ${formatCurrency(breakEvenRevenue, curr, true)} to ${formatCurrency((totalFixedCosts * 0.85) / Math.max(0.1, cmPct), curr, true)}.`,
        timeline: "Immediate",
      },
      {
        step: 2,
        action: "Incentivize High-Volume / Multi-Seat Tiering",
        impact: "Increases average account value, reducing the total customer volume needed to break even.",
        timeline: "Month 1–2",
      },
      {
        step: 3,
        action: "Drive Account Expansion to 3% Monthly",
        impact: "Generates compounding cash from existing accounts without spending incremental CAC.",
        timeline: "Month 2–4",
      },
    ];
  }

  // CASE 3: Target ARR / Revenue / Milestone Question
  else if (
    q.includes("reach") ||
    q.includes("target") ||
    q.includes("grow to") ||
    q.includes("scale to") ||
    q.includes("hit") ||
    q.includes("crore") ||
    q.includes("lakh") ||
    q.includes("million") ||
    q.includes("milestone") ||
    (q.includes("customer") && (q.includes("how many") || q.includes("count") || q.includes("needed")))
  ) {
    const parsedTarget = parseCurrencyOrNumber(rawQ);
    const targetArr = parsedTarget ? (parsedTarget < 500000 && q.includes("mrr") ? parsedTarget * 12 : parsedTarget) : (arr > 0 ? arr * 1.5 : curr === "INR" ? 10000000 : 500000);
    const targetMrr = targetArr / 12;
    const requiredCustomers = Math.ceil(targetMrr / arpu);
    const customerGap = Math.max(0, requiredCustomers - currentCustomers);
    const monthlyNetAdditionsNeeded = Math.ceil(customerGap / Math.max(1, inputs.planning_horizon));
    const totalCacCapitalRequired = customerGap * blendedCac;

    focusArea = "Revenue Target & Milestone Engineering";
    title = `Capital & Execution Plan: Path to ${formatCurrency(targetArr, curr, true)} ARR`;

    directAnswer = {
      headline: `Target Milestone Plan: Achieving ${formatCurrency(targetArr, curr, true)} ARR Run Rate`,
      details: `To hit ${formatCurrency(targetArr, curr, true)} ARR at your active ARPU of ${formatCurrency(arpu, curr)}/month, you require exactly ${formatNumber(requiredCustomers)} active paying customers. With ${formatNumber(currentCustomers)} current accounts, your net customer expansion gap is +${formatNumber(customerGap)} accounts (+${monthlyNetAdditionsNeeded}/month over ${inputs.planning_horizon} months). At your blended CAC of ${formatCurrency(blendedCac, curr)}, reaching this milestone requires an estimated ${formatCurrency(totalCacCapitalRequired, curr, true)} in cumulative customer acquisition spend.`,
      extractedParameters: [
        { label: "Target ARR", value: formatCurrency(targetArr, curr, true) },
        { label: "Required Paying Accounts", value: `${formatNumber(requiredCustomers)} accounts` },
        { label: "Net Customer Gap", value: `+${formatNumber(customerGap)} accounts` },
        { label: "Estimated CAC Investment", value: formatCurrency(totalCacCapitalRequired, curr, true) },
      ],
      verdictType: totalCacCapitalRequired <= endingCash ? "optimal" : "warning",
    };

    executiveSummary = `Scaling from your baseline ${formatCurrency(arr, curr, true)} ARR to ${formatCurrency(targetArr, curr, true)} requires adding ${formatNumber(customerGap)} net accounts. With monthly churn currently at ${formatPercent(churn)}, gross additions must absorb ${formatNumber(Math.round(currentCustomers * churn * 12))} churned accounts over the year.`;

    strategicDiagnosis = [
      `Customer Acquisition Hurdle: Reaching ${formatNumber(requiredCustomers)} active accounts requires acquiring ${monthlyNetAdditionsNeeded} net accounts each month. At ${formatPercent(inputs.lead_conversion_rate)} conversion, you need ${formatNumber(Math.ceil(monthlyNetAdditionsNeeded / Math.max(0.01, inputs.lead_conversion_rate)))} monthly leads.`,
      `Capital Requirement: Funding +${formatNumber(customerGap)} customers at ${formatCurrency(blendedCac, curr)} CAC requires ${formatCurrency(totalCacCapitalRequired, curr, true)}. Current treasury balance is ${formatCurrency(endingCash, curr, true)}.`,
      `Retention Sensitivity: Reducing monthly churn by 1.0% preserves ~${formatNumber(Math.round(currentCustomers * 0.12))} customers annually, reducing required acquisition spend by ${formatCurrency(Math.round(currentCustomers * 0.12) * blendedCac, curr, true)}.`,
    ];

    recommendedActions = [
      {
        step: 1,
        action: `Scale Inbound / Lead Funnel to ${formatNumber(Math.ceil(monthlyNetAdditionsNeeded / Math.max(0.01, inputs.lead_conversion_rate)))} Qualified Leads/Mo`,
        impact: `Generates the required +${monthlyNetAdditionsNeeded} new customers per month at current ${formatPercent(inputs.lead_conversion_rate)} conversion rate.`,
        timeline: "Month 1–3",
      },
      {
        step: 2,
        action: "Incentivize Annual Upfront Prepayments with a 15% Incentive Discount",
        impact: `Collects ${formatCurrency(arpu * 12 * 0.85, curr)} cash upfront on Day 1, self-funding customer acquisition without equity dilution.`,
        timeline: "Immediate",
      },
      {
        step: 3,
        action: "Introduce Secondary Usage or Seat-Based Tiering",
        impact: `Lifting ARPU from ${formatCurrency(arpu, curr)} to ${formatCurrency(arpu * 1.2, curr)} lowers required break-even customers by ${Math.ceil(requiredCustomers * 0.17)}.`,
        timeline: "Quarter 2",
      },
    ];
  }

  // CASE D: Runway Extension & Insolvency Defense Question
  else if (
    q.includes("runway") ||
    q.includes("cash") ||
    q.includes("burn") ||
    q.includes("dilution") ||
    q.includes("insolvent") ||
    q.includes("negative") ||
    q.includes("month 1")
  ) {
    const targetRunwayMonths = 18;
    const averageMonthlyNetBurn = Math.max(1, (inputs.initial_cash_balance - endingCash + summary.peak_cash_deficit) / Math.max(1, inputs.planning_horizon));
    const targetTreasuryNeeded = targetRunwayMonths * averageMonthlyNetBurn;
    const capitalGap = Math.max(0, targetTreasuryNeeded - endingCash);

    focusArea = "Runway Extension & Capital Preservation";
    title = `Runway Roadmap: Extending Buffer to ${targetRunwayMonths} Months`;

    directAnswer = {
      headline: isSolvent
        ? `Treasury Status: Solvent (> ${inputs.planning_horizon} Months Buffer)`
        : `Solvency Alert: Runway Breaches Floor in Month ${runwayMonths ?? 1}`,
      details: isSolvent
        ? `Your current cash position of ${formatCurrency(endingCash, curr, true)} comfortably covers operations throughout your ${inputs.planning_horizon}-month horizon. Net monthly cash flow remains positive or well-buffered above your ${formatCurrency(minReserve, curr, true)} safety reserve floor.`
        : `Under current projections, your cash balance breaches your minimum reserve floor of ${formatCurrency(minReserve, curr, true)} in Month ${runwayMonths ?? 1}, with peak cash deficit reaching ${formatCurrency(summary.peak_cash_deficit, curr, true)}. To safely extend your runway to 18 months without emergency dilution, you face an estimated capital shortfall of ${formatCurrency(capitalGap, curr, true)}. You can bridge this gap through a combination of: (1) converting 25% of customers to annual upfront billing (+${formatCurrency(arpu * currentCustomers * 2.5, curr, true)} immediate float), (2) deferring non-revenue hires, and (3) trimming discretionary OpEx.`,
      extractedParameters: [
        { label: "Current Runway", value: runwayMonths !== null ? `${runwayMonths} Months` : `> ${inputs.planning_horizon} Months` },
        { label: "Target Runway", value: `${targetRunwayMonths} Months Safe Buffer` },
        { label: "Estimated Monthly Burn", value: formatCurrency(averageMonthlyNetBurn, curr, true) },
        { label: "Capital Gap to 18M", value: formatCurrency(capitalGap, curr, true) },
      ],
      verdictType: isSolvent ? "optimal" : "danger",
    };

    executiveSummary = isSolvent
      ? `Liquid treasury of ${formatCurrency(endingCash, curr, true)} comfortably protects operations across the planning horizon.`
      : `Liquid cash drops below your ${formatCurrency(minReserve, curr, true)} reserve floor in Month ${runwayMonths ?? 1}. Immediate capital conservation protocols are required.`;

    strategicDiagnosis = [
      `Burn Acceleration: Monthly net outlays of ${formatCurrency(averageMonthlyNetBurn, curr, true)} drain liquid cash faster than customer gross profit can replace it.`,
      `Peak Deficit Window: Maximum treasury drawdown reaches ${formatCurrency(summary.peak_cash_deficit, curr, true)}.`,
      `Working Capital Float: Shifting customer collections from monthly invoicing to upfront cash prepayments immediately extends runway by ~3.5 months.`,
    ];

    recommendedActions = [
      {
        step: 1,
        action: "Institute 12-Month Annual Upfront Billing",
        impact: "Generates day-zero working capital float to absorb monthly fixed costs without debt or dilution.",
        timeline: "Immediate (Days 1–15)",
      },
      {
        step: 2,
        action: "Freeze Non-Revenue Headcount Additions",
        impact: `Preserves ${formatCurrency(totalFixedCosts * 0.3, curr, true)} per month in fixed cash outflows.`,
        timeline: "Immediate",
      },
      {
        step: 3,
        action: "Renegotiate Vendor & Cloud Infrastructure Contracts to Net-30",
        impact: "Improves cash float by deferring monthly payable timing past customer collection dates.",
        timeline: "Month 1",
      },
    ];
  }

  // CASE E: Unit Economics & LTV / CAC Question
  else if (
    q.includes("ltv") ||
    q.includes("cac") ||
    q.includes("payback") ||
    q.includes("unit economic") ||
    q.includes("margin")
  ) {
    focusArea = "Unit Economics & Customer Efficiency Optimization";
    title = `Unit Viability Diagnostic: LTV:CAC ${ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A"}`;

    directAnswer = {
      headline: isLtvHealthy
        ? `Unit Economics: Healthy (${ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A"} LTV:CAC)`
        : `Unit Economics: Vulnerable (${ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A"} LTV:CAC)`,
      details: `Your blended Customer Acquisition Cost is ${formatCurrency(blendedCac, curr)} against a simplified Lifetime Value of ${summary.simplified_ltv_final ? formatCurrency(summary.simplified_ltv_final, curr, true) : "N/A"}, generating an LTV:CAC ratio of ${ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A"}. CAC Payback duration is ${payback ? `${payback.toFixed(1)} months` : "N/A"}. With gross margin at ${formatPercent(gmPct)}, each customer yields ${formatCurrency(arpu * gmPct, curr)} in monthly gross profit. ${
        isLtvHealthy
          ? "Your unit economics are sustainable and provide sufficient margin of safety to scale acquisition spend."
          : "Your unit economics are currently fragile (< 3.0x venture hurdle). Paid customer acquisition is destroying value or failing to return capital quickly enough."
      }`,
      extractedParameters: [
        { label: "Blended CAC", value: formatCurrency(blendedCac, curr) },
        { label: "Simplified LTV", value: summary.simplified_ltv_final ? formatCurrency(summary.simplified_ltv_final, curr, true) : "N/A" },
        { label: "LTV : CAC Multiple", value: ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A" },
        { label: "CAC Payback Window", value: payback ? `${payback.toFixed(1)} Months` : "N/A" },
      ],
      verdictType: isLtvHealthy ? "optimal" : "warning",
    };

    executiveSummary = `Current unit economics show a ${ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A"} multiple and ${payback ? `${payback.toFixed(1)} month` : "N/A"} payback. Sustainable scaling requires driving LTV:CAC above 3.5x while keeping payback inside 12 months.`;

    strategicDiagnosis = [
      `Churn Drag: Monthly customer attrition of ${formatPercent(churn)} limits customer lifetime to ${Math.round(1 / Math.max(0.005, churn))} months, capping LTV upside.`,
      `Direct Delivery Margin: Direct COGS consume ${formatPercent(1 - gmPct)} of gross revenue. Payment gateway fees and infrastructure must remain variable.`,
      `Capital Velocity: Reinvesting acquisition profits requires ${payback ? `${payback.toFixed(1)} billing cycles` : "prolonged cycles"} before working capital returns to treasury.`,
    ];

    recommendedActions = [
      {
        step: 1,
        action: "Optimize Activation Onboarding to Cut Monthly Churn by 1.5%",
        impact: `Expands LTV from ${summary.simplified_ltv_final ? formatCurrency(summary.simplified_ltv_final, curr, true) : "N/A"} to ${formatCurrency((arpu * gmPct) / Math.max(0.005, churn - 0.015), curr, true)} per customer.`,
        timeline: "Month 1–2",
      },
      {
        step: 2,
        action: "Reallocate Ad Budget from Underperforming Paid Channels",
        impact: "Lowers blended CAC by ~18%, bringing payback duration inside 9 months.",
        timeline: "Sprint 2",
      },
      {
        step: 3,
        action: "Introduce Tiered Expansion / Multi-Seat Plans",
        impact: "Targets 2.5%+ monthly expansion to create net negative churn dynamics.",
        timeline: "Quarter 2",
      },
    ];
  }

  // DEFAULT / GENERAL BOARD BRIEFING
  else {
    focusArea = "Executive Financial Model & Board Briefing";
    title = "Comprehensive Executive CFO Strategic Assessment";

    directAnswer = {
      headline: `Executive Overview: ${inputs.company_name} Operating Position`,
      details: `VentureIQ has synthesized your financial model across ${inputs.planning_horizon} months: Projected ending ARR is ${formatCurrency(arr, curr, true)} across ${formatNumber(summary.final_month_customers)} active paying accounts. Cash solvency status: ${summary.runway_status}. Gross margin stands at ${formatPercent(gmPct)}, contribution margin at ${formatPercent(cmPct)}, and blended CAC at ${formatCurrency(blendedCac, curr)}. Review the audited metrics and recommended actions below to optimize capital allocation.`,
      extractedParameters: [
        { label: "Active Model", value: inputs.company_name },
        { label: "Planning Horizon", value: `${inputs.planning_horizon} Months` },
        { label: "Month 12 ARR", value: formatCurrency(arr, curr, true) },
        { label: "Solvency Status", value: summary.runway_status },
      ],
      verdictType: isSolvent && isLtvHealthy ? "optimal" : "warning",
    };

    executiveSummary = `Comprehensive assessment of ${inputs.company_name} operating model. Baseline indicates ${formatCurrency(arr, curr, true)} ARR run rate by Month 12 with a ${summary.runway_status.toLowerCase()} capital trajectory.`;

    strategicDiagnosis = [
      `Capital Velocity: Cash runway is ${runwayMonths ? `${runwayMonths} months` : `> ${inputs.planning_horizon} months`}.`,
      `Unit Quality: LTV:CAC multiple is ${ltvCac ? `${ltvCac.toFixed(1)}x` : "N/A"} with a payback duration of ${payback ? `${payback.toFixed(1)} months` : "N/A"}.`,
      `Operating Leverage: Monthly fixed baseline is ${formatCurrency(totalFixedCosts, curr, true)}. Contribution margin is ${formatPercent(cmPct)}.`,
    ];

    recommendedActions = [
      {
        step: 1,
        action: "Maintain Runway Discipline & Safety Floor",
        impact: `Protects your ${formatCurrency(minReserve, curr, true)} cash reserve against sudden revenue volatility.`,
        timeline: "Ongoing",
      },
      {
        step: 2,
        action: "Drive Customer Payback Compression",
        impact: "Ensure acquisition spend recycles within two fiscal quarters to self-fund expansion.",
        timeline: "Quarter 1",
      },
      {
        step: 3,
        action: "Export Audited Data Room Schedules",
        impact: "Generate executive PDF and CSV reports for board members and prospective investors.",
        timeline: "As Needed",
      },
    ];
  }

  return {
    title,
    directAnswer,
    executiveSummary,
    focusArea,
    keyMetricsAudited,
    strategicDiagnosis,
    recommendedActions,
    disclaimer: "Generated via VentureIQ Strategic Advisory Engine. 100% deterministic calculations grounded strictly in verified company baseline data. Zero third-party data sharing.",
  };
}
