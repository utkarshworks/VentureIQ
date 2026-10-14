import { EngineSimulationResult, ModelEngineInputs } from "@/types/model";
import { formatCurrency } from "@/lib/formatters";
import { StrategicHelpPriority } from "@/lib/advisoryEngine";
import { isModelEmpty } from "@/lib/engine";

export interface SignalItem {
  id: string;
  type: "good" | "bad" | "warning";
  category: "Capital & Runway" | "Unit Economics" | "Retention & Churn" | "Growth & Payback";
  title: string;
  metricValue: string;
  summary: string;
  recommendation: string;
  isGoalPriority?: boolean;
}

export interface HealthAuditResult {
  isEmpty: boolean;
  signals: SignalItem[];
  goodSignals: SignalItem[];
  badSignals: SignalItem[];
  warningSignals: SignalItem[];
  goalPrioritySignals: SignalItem[];
  overallGrade: { label: string; color: string; sub: string };
  quantifiedTargets: {
    estimatedMonthlyBurn: number;
    target18MBurn: number;
    requiredBurnCut: number;
    currentRunway: number;
    requiredCapitalBridge: number;
    currentLtv: number;
    currentCac: number;
    currentLtvCac: number;
    targetCacFor35x: number;
    requiredCacCut: number;
    impliedLifetime: number;
    effectiveGm: number;
    targetArpuFor35x: number;
    requiredArpuExpansion: number;
    current12MArr: number;
    targetArr: number;
    targetTotalCustomers: number;
    endingCustomers: number;
    requiredCustomerAddsDelta: number;
    requiredMonthlyLeads: number;
    requiredLeadsDelta: number;
    totalFixedOverhead: number;
    cmPct: number;
    cmPerCustomer: number;
    requiredBreakEvenAccounts: number;
    customerAccountShortfall: number;
    requiredAdditionalMrr: number;
    runwayGap: number;
    ltvGap: number;
    gmGap: number;
    effectiveConv: number;
  };
}

export function computeHealthAudit(
  inputs: ModelEngineInputs,
  result: EngineSimulationResult,
  helpPriority: StrategicHelpPriority = "runway_preservation"
): HealthAuditResult {
  const curr = inputs.currency;
  const summary = result.summary;
  const projections = result.projections;

  if (isModelEmpty(inputs)) {
    return {
      isEmpty: true,
      signals: [],
      goodSignals: [],
      badSignals: [],
      warningSignals: [],
      goalPrioritySignals: [],
      overallGrade: {
        label: "Awaiting Assessment Data",
        color: "text-slate-600 bg-slate-100 border-slate-200",
        sub: "Complete intake questionnaire to run dynamic health diagnostics.",
      },
      quantifiedTargets: {
        estimatedMonthlyBurn: 0,
        target18MBurn: 0,
        requiredBurnCut: 0,
        currentRunway: 0,
        requiredCapitalBridge: 0,
        currentLtv: 0,
        currentCac: 0,
        currentLtvCac: 0,
        targetCacFor35x: 0,
        requiredCacCut: 0,
        impliedLifetime: 0,
        effectiveGm: 0,
        targetArpuFor35x: 0,
        requiredArpuExpansion: 0,
        current12MArr: 0,
        targetArr: 0,
        targetTotalCustomers: 0,
        endingCustomers: 0,
        requiredCustomerAddsDelta: 0,
        requiredMonthlyLeads: 0,
        requiredLeadsDelta: 0,
        totalFixedOverhead: 0,
        cmPct: 0,
        cmPerCustomer: 0,
        requiredBreakEvenAccounts: 0,
        customerAccountShortfall: 0,
        requiredAdditionalMrr: 0,
        runwayGap: 0,
        ltvGap: 0,
        gmGap: 0,
        effectiveConv: 0,
      },
    };
  }

  // Dynamic Priority Gap & Improvement Quantifications
  const firstMonthOutflows = projections[0]?.cash_outflows || 0;
  const firstMonthInflows = projections[0]?.cash_inflows || 0;
  const estimatedMonthlyBurn = Math.max(0, firstMonthOutflows - firstMonthInflows);
  const target18MBurn = (inputs.initial_cash_balance || 0) > 0 ? Math.round((inputs.initial_cash_balance || 0) / 18) : 0;
  const requiredBurnCut = Math.max(0, estimatedMonthlyBurn - target18MBurn);
  const currentRunway = summary.runway_months !== null ? summary.runway_months : inputs.planning_horizon;
  const requiredCapitalBridge = summary.runway_months !== null ? Math.max(0, Math.round((18 - summary.runway_months) * Math.max(1, estimatedMonthlyBurn))) : 0;

  const currentLtv = summary.simplified_ltv_final || 0;
  const currentCac = summary.blended_cac_final || 0;
  const currentLtvCac = summary.ltv_to_cac_ratio_final || (currentCac > 0 && currentLtv > 0 ? currentLtv / currentCac : 0);
  const targetCacFor35x = currentLtv > 0 ? Math.round(currentLtv / 3.5) : 0;
  const requiredCacCut = Math.max(0, currentCac - targetCacFor35x);
  const impliedLifetime = inputs.customer_churn_rate > 0 ? Math.min(60, Math.round(1 / inputs.customer_churn_rate)) : 36;
  const effectiveGm = summary.average_gross_margin_pct > 0 ? summary.average_gross_margin_pct : 0.75;
  const targetArpuFor35x = currentCac > 0 && effectiveGm > 0 && impliedLifetime > 0 ? Math.round((currentCac * 3.5) / (effectiveGm * impliedLifetime)) : 0;
  const requiredArpuExpansion = Math.max(0, targetArpuFor35x - inputs.arpu);

  const current12MArr = summary.final_month_arr;
  const targetArr = current12MArr > 0 ? current12MArr * 2 : (curr === "INR" ? 10000000 : 1000000);
  const targetMonthlyRevenue = targetArr / 12;
  const targetTotalCustomers = inputs.arpu > 0 ? Math.ceil(targetMonthlyRevenue / inputs.arpu) : 0;
  const endingCustomers = projections[projections.length - 1]?.closing_customers || 0;
  const requiredCustomerAddsDelta = Math.max(0, targetTotalCustomers - endingCustomers);
  const effectiveConv = inputs.lead_conversion_rate > 0 ? (inputs.lead_conversion_rate > 1 ? inputs.lead_conversion_rate / 100 : inputs.lead_conversion_rate) : 0.035;
  const requiredMonthlyLeads = Math.ceil((targetTotalCustomers / 12) / effectiveConv);
  const requiredLeadsDelta = Math.max(0, requiredMonthlyLeads - inputs.monthly_leads);

  const totalFixedOverhead = (inputs.hiring_roles?.[0]?.monthly_salary || 0) + (inputs.fixed_opex || 0) + (inputs.fixed_marketing_ops || 0) + (inputs.hosting_fixed_cost || 0);
  const cmPct = summary.average_contribution_margin_pct > 0 ? summary.average_contribution_margin_pct : (effectiveGm * 0.8);
  const cmPerCustomer = inputs.arpu * cmPct;
  const requiredBreakEvenAccounts = cmPerCustomer > 0 ? Math.ceil(totalFixedOverhead / cmPerCustomer) : 0;
  const customerAccountShortfall = Math.max(0, requiredBreakEvenAccounts - (inputs.initial_paying_customers || 0));
  const requiredAdditionalMrr = customerAccountShortfall * inputs.arpu;

  const runwayGap = Math.max(0, 18 - currentRunway);
  const ltvGap = summary.ltv_to_cac_ratio_final !== null ? Math.max(0, Math.round((3.0 - summary.ltv_to_cac_ratio_final) * 10) / 10) : 0;
  const gmGap = Math.max(0, Math.round((0.70 - summary.average_gross_margin_pct) * 1000) / 10);

  const signals: SignalItem[] = [];

  // 1. Capital & Runway Evaluation
  const hasCash = (inputs.initial_cash_balance || 0) > 0;
  const hasOutflows = projections.some((p) => p.cash_outflows > 0);

  if (hasCash) {
    const isReserveBreached = summary.ending_cash < inputs.minimum_cash_reserve || summary.runway_months !== null;
    if (isReserveBreached) {
      signals.push({
        id: "runway_breach",
        type: "bad",
        category: "Capital & Runway",
        title: "Safety Cash Reserve Breached",
        metricValue: summary.runway_months ? `Month ${summary.runway_months}` : "Deficit",
        summary: `Projected cash balance drops below your safety floor (${formatCurrency(
          inputs.minimum_cash_reserve,
          curr,
          true
        )}). Operations risk severe insolvency under current burn rate.`,
        recommendation: `Trim monthly net burn by ${formatCurrency(requiredBurnCut, curr, false)}/mo or secure ${formatCurrency(requiredCapitalBridge, curr, true)} in bridge financing before Month ${
          summary.runway_months ?? 1
        } to reach the 18-month solvency buffer.`,
        isGoalPriority: helpPriority === "runway_preservation" || helpPriority === "break_even",
      });
    } else {
      signals.push({
        id: "runway_solvent",
        type: "good",
        category: "Capital & Runway",
        title: "Fully Funded & Solvent Operating Runway",
        metricValue: `> ${inputs.planning_horizon} Months`,
        summary: `Ending liquid treasury (${formatCurrency(
          summary.ending_cash,
          curr,
          true
        )}) comfortably exceeds minimum safety reserve (${formatCurrency(
          inputs.minimum_cash_reserve,
          curr,
          true
        )}) through the full simulation.`,
        recommendation:
          "Operations are capital-stable; you have autonomy to reinvest operating cash flow into growth without emergency dilution pressure.",
        isGoalPriority: helpPriority === "runway_preservation" || helpPriority === "fundraising",
      });
    }
  } else if (hasOutflows) {
    signals.push({
      id: "runway_zero_cash",
      type: "bad",
      category: "Capital & Runway",
      title: "Zero Operating Cash Treasury",
      metricValue: "0 Cash",
      summary: "Your venture has active monthly cash outflows but zero initial liquid cash balance recorded.",
      recommendation: "Record initial cash treasury reserves or model imminent financing events to ensure solvency.",
      isGoalPriority: true,
    });
  }

  // 2. Unit Economics (LTV : CAC) Evaluation
  if (summary.ltv_to_cac_ratio_final !== null) {
    if (summary.ltv_to_cac_ratio_final >= 3.0) {
      signals.push({
        id: "ltv_cac_high",
        type: "good",
        category: "Unit Economics",
        title: "Strong LTV : CAC Multiple",
        metricValue: `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`,
        summary: `Customer lifetime value significantly outpaces acquisition cost, well above the 3.0x venture viability benchmark.`,
        recommendation:
          "High unit efficiency indicates you can afford to aggressively scale paid and outbound acquisition budgets.",
        isGoalPriority: helpPriority === "unit_economics" || helpPriority === "scale_acquisition" || helpPriority === "fundraising",
      });
    } else if (summary.ltv_to_cac_ratio_final < 2.0) {
      signals.push({
        id: "ltv_cac_low",
        type: "bad",
        category: "Unit Economics",
        title: "Sub-Optimal Unit Economics (< 2.0x)",
        metricValue: `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`,
        summary: `Customer acquisition cost is unsustainably close to gross lifetime revenue. Customer additions may deplete cash faster than they generate value.`,
        recommendation: `Compress blended CAC by ${formatCurrency(requiredCacCut, curr, false)} (a ${currentCac > 0 ? Math.round((requiredCacCut / currentCac) * 100) : 0}% reduction) or increase ARPU by ${formatCurrency(requiredArpuExpansion, curr, false)}/mo to achieve target 3.5x LTV:CAC.`,
        isGoalPriority: helpPriority === "unit_economics" || helpPriority === "fundraising",
      });
    } else {
      signals.push({
        id: "ltv_cac_moderate",
        type: "warning",
        category: "Unit Economics",
        title: "Moderate Unit Economics (2.0x – 3.0x)",
        metricValue: `${summary.ltv_to_cac_ratio_final.toFixed(1)}x`,
        summary: `Unit economics are marginally viable, but leave limited cushion if customer acquisition costs rise or churn increases.`,
        recommendation: `Lift LTV:CAC multiple from ${currentLtvCac.toFixed(1)}x to ≥ 3.5x by optimizing conversion rate and trimming CAC by ${formatCurrency(requiredCacCut, curr, false)}.`,
        isGoalPriority: helpPriority === "unit_economics",
      });
    }
  }

  // 3. Gross Margin Evaluation
  if (summary.final_month_mrr > 0) {
    if (summary.average_gross_margin_pct >= 0.75) {
      signals.push({
        id: "margin_high",
        type: "good",
        category: "Unit Economics",
        title: "Superior Gross Margin (> 75%)",
        metricValue: `${(summary.average_gross_margin_pct * 100).toFixed(1)}%`,
        summary: `Direct cloud hosting, payment processing, and variable servicing absorb only ${(
          (1 - summary.average_gross_margin_pct) *
          100
        ).toFixed(1)}% of revenue.`,
        recommendation:
          "High gross margin yields strong operating gross profit to support team payroll and marketing.",
        isGoalPriority: helpPriority === "unit_economics" || helpPriority === "break_even" || helpPriority === "fundraising",
      });
    } else if (summary.average_gross_margin_pct < 0.6) {
      signals.push({
        id: "margin_low",
        type: "bad",
        category: "Unit Economics",
        title: "High Delivery Cost / Compressed Gross Margin",
        metricValue: `${(summary.average_gross_margin_pct * 100).toFixed(1)}%`,
        summary: `Variable hosting and direct costs consume over 40% of customer receipts, putting downward pressure on contribution margin.`,
        recommendation: `Reduce third-party API and variable compute costs per account to expand gross margin from ${(summary.average_gross_margin_pct * 100).toFixed(1)}% to ≥ 75%, generating +${formatCurrency(Math.round(inputs.arpu * 0.2), curr, false)} in gross profit per account.`,
        isGoalPriority: helpPriority === "unit_economics" || helpPriority === "break_even",
      });
    }
  }

  // 4. CAC Payback Period Evaluation
  if (summary.cac_payback_final !== null && summary.cac_payback_final > 0) {
    if (summary.cac_payback_final <= 12) {
      signals.push({
        id: "payback_fast",
        type: "good",
        category: "Growth & Payback",
        title: "Rapid CAC Payback Velocity (< 12 Mos)",
        metricValue: `${summary.cac_payback_final.toFixed(1)} Months`,
        summary: `Acquisition spend is fully recovered in under a year, creating fast working capital recycling.`,
        recommendation:
          "Fast capital recycling allows reinvesting cash flow back into marketing repeatedly within the same fiscal year.",
        isGoalPriority: helpPriority === "scale_acquisition" || helpPriority === "unit_economics",
      });
    } else if (summary.cac_payback_final > 18) {
      signals.push({
        id: "payback_slow",
        type: "bad",
        category: "Growth & Payback",
        title: "Sluggish Working Capital Payback (> 18 Mos)",
        metricValue: `${summary.cac_payback_final.toFixed(1)} Months`,
        summary: `Taking over 18 months to recover marketing expenditure creates heavy working capital drag and elevates churn exposure.`,
        recommendation: `Offer annual upfront billing with a 15% discount to collect ${formatCurrency(Math.round(inputs.arpu * 10), curr, false)} upfront per account, compressing payback below 12 months.`,
        isGoalPriority: helpPriority === "scale_acquisition" || helpPriority === "unit_economics" || helpPriority === "runway_preservation",
      });
    } else {
      signals.push({
        id: "payback_moderate",
        type: "warning",
        category: "Growth & Payback",
        title: "Moderate Payback Duration (12–18 Mos)",
        metricValue: `${summary.cac_payback_final.toFixed(1)} Months`,
        summary: `Capital payback is standard for enterprise contracts, but requires adequate liquid cash buffer to float upfront sales costs.`,
        recommendation:
          "Introduce expansion upsells early in the customer lifecycle to accelerate cash payback.",
        isGoalPriority: helpPriority === "scale_acquisition",
      });
    }
  }

  // 5. Customer Retention & Churn Evaluation
  if (inputs.initial_paying_customers > 0 || summary.final_month_customers > 0) {
    if (inputs.customer_churn_rate <= 0.02) {
      signals.push({
        id: "churn_low",
        type: "good",
        category: "Retention & Churn",
        title: "Strong Customer Retention (≤ 2.0% Churn)",
        metricValue: `${(inputs.customer_churn_rate * 100).toFixed(1)}% / mo`,
        summary: `Low monthly customer decay minimizes revenue leakage and lets organic and paid additions compound ARR.`,
        recommendation:
          "High customer retention makes this an opportune time to launch expansion tiers and cross-sells.",
        isGoalPriority: helpPriority === "unit_economics" || helpPriority === "scale_acquisition",
      });
    } else if (inputs.customer_churn_rate >= 0.04) {
      signals.push({
        id: "churn_high",
        type: "bad",
        category: "Retention & Churn",
        title: "Severe Customer Attrition (≥ 4.0% Churn)",
        metricValue: `${(inputs.customer_churn_rate * 100).toFixed(1)}% / mo`,
        summary: `Monthly attrition of ${(inputs.customer_churn_rate * 100).toFixed(
          1
        )}% leaks over 38% of your customer base annually, creating an expensive treadmill.`,
        recommendation:
          "Conduct customer retention audits and address onboarding friction before scaling acquisition spend.",
        isGoalPriority: helpPriority === "unit_economics" || helpPriority === "runway_preservation",
      });
    } else {
      signals.push({
        id: "churn_moderate",
        type: "warning",
        category: "Retention & Churn",
        title: "Moderate Churn Decay (2% – 4% / mo)",
        metricValue: `${(inputs.customer_churn_rate * 100).toFixed(1)}% / mo`,
        summary: `Attrition is within average early-stage ranges, but compound churn will become a growth bottleneck as account volume increases.`,
        recommendation:
          "Implement automated health scoring to flag at-risk accounts before cancellation notices.",
        isGoalPriority: helpPriority === "unit_economics",
      });
    }
  }

  // 6. Target CAC Benchmark Evaluation
  if (inputs.target_cac && inputs.target_cac > 0 && summary.blended_cac_final !== null) {
    if (summary.blended_cac_final > inputs.target_cac) {
      signals.push({
        id: "cac_target_breached",
        type: "bad",
        category: "Growth & Payback",
        title: "Blended CAC Exceeds Target Ceiling",
        metricValue: `${formatCurrency(summary.blended_cac_final, curr, false)} > Target ${formatCurrency(inputs.target_cac, curr, false)}`,
        summary: `Actual acquisition cost of ${formatCurrency(summary.blended_cac_final, curr, false)} exceeds your defined target of ${formatCurrency(inputs.target_cac, curr, false)}.`,
        recommendation: `Blended CAC of ${formatCurrency(summary.blended_cac_final, curr, false)} exceeds target by ${formatCurrency(summary.blended_cac_final - inputs.target_cac, curr, false)}. Lift lead conversion rate from ${(effectiveConv * 100).toFixed(1)}% to ${((inputs.cost_per_lead / inputs.target_cac) * 100).toFixed(1)}% to restore unit acquisition discipline.`,
        isGoalPriority: helpPriority === "scale_acquisition" || helpPriority === "unit_economics",
      });
    } else {
      signals.push({
        id: "cac_target_met",
        type: "good",
        category: "Growth & Payback",
        title: "Acquisition Cost Beats Target",
        metricValue: `${formatCurrency(summary.blended_cac_final, curr, false)} ≤ Target ${formatCurrency(inputs.target_cac, curr, false)}`,
        summary: `Acquisition cost is performing within your targeted budget ceiling of ${formatCurrency(inputs.target_cac, curr, false)}.`,
        recommendation: "Maintain channel discipline while testing incremental budget expansion to accelerate ARR.",
        isGoalPriority: helpPriority === "scale_acquisition" || helpPriority === "unit_economics",
      });
    }
  }

  // 7. Break-Even & Profitability Evaluation
  if (summary.final_month_mrr > 0 || projections.some((p) => p.total_opex > 0)) {
    if (summary.break_even_month !== null) {
      signals.push({
        id: "breakeven_reached",
        type: "good",
        category: "Capital & Runway",
        title: "Operating Break-Even Achieved",
        metricValue: `Month ${summary.break_even_month}`,
        summary: `Revenue covers all operational overhead and payroll starting in Month ${summary.break_even_month}, achieving cash self-sufficiency.`,
        recommendation:
          "Reaching cash flow positivity dramatically reduces fundraising risk and maximizes founder leverage.",
        isGoalPriority: helpPriority === "break_even" || helpPriority === "runway_preservation",
      });
    } else {
      signals.push({
        id: "breakeven_unreached",
        type: "warning",
        category: "Capital & Runway",
        title: "Operating Burn Throughout Planning Horizon",
        metricValue: `No Break-Even`,
        summary: `Business remains net cash-flow negative across all ${inputs.planning_horizon} months under current growth velocity.`,
        recommendation: `Add +${customerAccountShortfall} paying customers (+${formatCurrency(requiredAdditionalMrr, curr, false)}/mo MRR) to cover fixed overhead of ${formatCurrency(totalFixedOverhead, curr, false)}/mo and achieve operating break-even.`,
        isGoalPriority: helpPriority === "break_even" || helpPriority === "runway_preservation",
      });
    }
  }

  // 8. Institutional Series Readiness
  if (summary.final_month_arr > 0 && helpPriority === "fundraising") {
    const isRuleOf40 = (summary.average_gross_margin_pct >= 0.7) && (summary.ending_cash >= inputs.minimum_cash_reserve);
    if (isRuleOf40) {
      signals.push({
        id: "fundraising_traction",
        type: "good",
        category: "Capital & Runway",
        title: "Institutional Venture Due Diligence Ready",
        metricValue: "Top Quartile Metrics",
        summary: "Gross margin > 70% and fully protected runway satisfy standard institutional venture criteria for extension or series rounds.",
        recommendation: `Runway of ${currentRunway} months and LTV:CAC of ${currentLtvCac.toFixed(1)}x provide a strong quantitative baseline for institutional due diligence.`,
        isGoalPriority: true,
      });
    }
  }

  // Sort: Goal priority signals first
  signals.sort((a, b) => {
    if (a.isGoalPriority && !b.isGoalPriority) return -1;
    if (!a.isGoalPriority && b.isGoalPriority) return 1;
    return 0;
  });

  const goodSignals = signals.filter((s) => s.type === "good");
  const badSignals = signals.filter((s) => s.type === "bad");
  const warningSignals = signals.filter((s) => s.type === "warning");
  const goalPrioritySignals = signals.filter((s) => s.isGoalPriority);

  const overallGrade =
    badSignals.length === 0
      ? { label: "Grade A • Strong & Resilient", color: "text-emerald-700 bg-emerald-50 border-emerald-200", sub: "Venture fundamentals and solvency buffer are protected across all stress vectors." }
      : badSignals.length <= 2
      ? { label: "Grade B • Actionable Vulnerabilities", color: "text-amber-800 bg-amber-50 border-amber-200", sub: `${badSignals.length} high-severity risk factors require proactive CFO intervention.` }
      : { label: "Grade C • High Solvency or Unit Risk", color: "text-rose-700 bg-rose-50 border-rose-200", sub: `${badSignals.length} critical red flags detected. Immediate capital conservation or pricing restructuring required.` };

  return {
    isEmpty: false,
    signals,
    goodSignals,
    badSignals,
    warningSignals,
    goalPrioritySignals,
    overallGrade,
    quantifiedTargets: {
      estimatedMonthlyBurn,
      target18MBurn,
      requiredBurnCut,
      currentRunway,
      requiredCapitalBridge,
      currentLtv,
      currentCac,
      currentLtvCac,
      targetCacFor35x,
      requiredCacCut,
      impliedLifetime,
      effectiveGm,
      targetArpuFor35x,
      requiredArpuExpansion,
      current12MArr,
      targetArr,
      targetTotalCustomers,
      endingCustomers,
      requiredCustomerAddsDelta,
      requiredMonthlyLeads,
      requiredLeadsDelta,
      totalFixedOverhead,
      cmPct,
      cmPerCustomer,
      requiredBreakEvenAccounts,
      customerAccountShortfall,
      requiredAdditionalMrr,
      runwayGap,
      ltvGap,
      gmGap,
      effectiveConv,
    },
  };
}
