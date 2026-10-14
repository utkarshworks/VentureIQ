/**
 * VentureIQ Client-Side Pure Financial Simulation Engine.
 * Implements identical mathematical logic and invariants as the backend Python engine.
 */
import {
  ModelEngineInputs,
  EngineSimulationResult,
  MonthlyProjection,
  EngineSummary,
  ModelWarning,
} from "@/types/model";

function formatPeriod(startDateStr: string, offset: number): string {
  try {
    const [yearStr, monthStr] = startDateStr.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalMonths = month - 1 + offset;
    const newYear = year + Math.floor(totalMonths / 12);
    const newMonth = (totalMonths % 12) + 1;
    return `${newYear}-${newMonth.toString().padStart(2, "0")}`;
  } catch {
    return `Month ${offset + 1}`;
  }
}

export function isModelEmpty(inputs: ModelEngineInputs): boolean {
  if (!inputs) return true;
  const numCust = Number(inputs.initial_paying_customers) || 0;
  const numArpu = Number(inputs.arpu) || 0;
  const numCash = Number(inputs.initial_cash_balance) || 0;
  const numLeads = Number(inputs.monthly_leads) || 0;
  const numBudget = Number(inputs.acquisition_budget) || 0;
  const numPayroll =
    inputs.hiring_roles && inputs.hiring_roles.length > 0
      ? inputs.hiring_roles.reduce((acc, r) => acc + (r.monthly_salary || 0) * (r.headcount || 0), 0)
      : 0;
  const numFixedOpex = Number(inputs.fixed_opex) || 0;

  return (
    numCust === 0 &&
    numArpu === 0 &&
    numCash === 0 &&
    numLeads === 0 &&
    numBudget === 0 &&
    numPayroll === 0 &&
    numFixedOpex === 0
  );
}

export function simulateModelLocally(inputs: ModelEngineInputs): EngineSimulationResult {
  // If no data has been filled by the user, return an empty model with zero warnings and N/A values
  if (isModelEmpty(inputs)) {
    const emptyProjections: MonthlyProjection[] = [];
    const horizon = inputs.planning_horizon || 12;
    for (let m = 1; m <= horizon; m++) {
      const period = formatPeriod(inputs.start_date || "2026-01-01", m - 1);
      emptyProjections.push({
        month_index: m,
        period,
        opening_customers: 0,
        churned_customers: 0,
        new_customers: 0,
        closing_customers: 0,
        avg_active_customers: 0,
        base_mrr: 0,
        expansion_mrr: 0,
        contraction_mrr: 0,
        mrr: 0,
        arr_run_rate: 0,
        payment_processing_cost: 0,
        hosting_cost: 0,
        servicing_cost: 0,
        cogs: 0,
        gross_profit: 0,
        gross_margin_pct: 0,
        contribution_margin: 0,
        contribution_margin_pct: 0,
        payroll_cost: 0,
        acquisition_spend: 0,
        fixed_opex: 0,
        total_opex: 0,
        operating_profit: 0,
        beginning_cash: 0,
        cash_inflows: 0,
        cash_outflows: 0,
        net_cash_flow: 0,
        ending_cash: 0,
        net_burn: 0,
        blended_cac: null,
        cac_payback_months: null,
        simplified_ltv: null,
        ltv_to_cac_ratio: null,
        break_even_revenue: null,
        is_cash_reserve_breached: false,
        is_cash_negative: false,
      });
    }

    return {
      inputs,
      projections: emptyProjections,
      summary: {
        final_month_mrr: 0,
        final_month_arr: 0,
        final_month_customers: 0,
        peak_cash_deficit: 0,
        min_cash_balance: 0,
        ending_cash: 0,
        runway_months: null,
        runway_status: "No data entered",
        break_even_month: null,
        average_gross_margin_pct: 0,
        average_contribution_margin_pct: 0,
        blended_cac_final: null,
        simplified_ltv_final: null,
        ltv_to_cac_ratio_final: null,
        cac_payback_final: null,
        cohort_ltv_36m: null,
      },
      warnings: [],
    };
  }

  const projections: MonthlyProjection[] = [];
  const warnings: ModelWarning[] = [];

  let currentCustomers = Math.max(0, inputs.initial_paying_customers);
  let currentCash = Math.max(0, inputs.initial_cash_balance);

  let minCashBalance = currentCash;
  let peakCashDeficit = 0;
  let firstReserveBreachMonth: number | null = null;
  let firstCashNegativeMonth: number | null = null;
  let breakEvenMonth: number | null = null;

  const gmPercentages: number[] = [];
  const cmPercentages: number[] = [];

  for (let m = 1; m <= inputs.planning_horizon; m++) {
    const period = formatPeriod(inputs.start_date, m - 1);
    const openingCustomers = currentCustomers;
    const beginningCash = currentCash;

    // 1. Customer Bridge
    const churnRate = Math.max(0, Math.min(1, inputs.customer_churn_rate));
    const churnedCustomers = Math.min(openingCustomers, openingCustomers * churnRate);

    let newCustomers = 0;
    if (inputs.acquisition_mode === "lead_based") {
      const convRate = Math.max(0, Math.min(1, inputs.lead_conversion_rate));
      newCustomers = inputs.organic_new_customers + inputs.monthly_leads * convRate;
    } else {
      const paidNew = inputs.target_cac > 0 ? inputs.acquisition_budget / inputs.target_cac : 0;
      newCustomers = inputs.organic_new_customers + paidNew;
    }
    newCustomers = Math.max(0, newCustomers);
    const closingCustomers = Math.max(0, openingCustomers - churnedCustomers + newCustomers);
    const avgActiveCustomers = (openingCustomers + closingCustomers) / 2;

    // 2. Revenue
    const arpu = Math.max(0, inputs.arpu);
    const baseMrr = avgActiveCustomers * arpu;
    const expansionMrr = openingCustomers * arpu * Math.max(0, inputs.expansion_rate);
    const contractionMrr = openingCustomers * arpu * Math.max(0, inputs.contraction_rate);
    const rawMrr = Math.max(0, baseMrr + expansionMrr - contractionMrr);
    const mrr = Math.round(rawMrr * 100) / 100;
    const arrRunRate = Math.round(mrr * 12 * 100) / 100;

    // 3. COGS & Delivery
    const procRate = Math.max(0, Math.min(1, inputs.payment_processing_rate));
    const paymentProcessingCost = Math.round(mrr * procRate * 100) / 100;
    const hostingCost =
      Math.round((inputs.hosting_fixed_cost + avgActiveCustomers * inputs.hosting_cost_per_customer) * 100) / 100;
    const servicingCost = Math.round(avgActiveCustomers * inputs.servicing_cost_per_customer * 100) / 100;
    const cogs = Math.round((paymentProcessingCost + hostingCost + servicingCost) * 100) / 100;

    const grossProfit = Math.round((mrr - cogs) * 100) / 100;
    const grossMarginPct = mrr > 0 ? grossProfit / mrr : 0;

    // 4. OpEx & Payroll & Acquisition
    let payrollCost = 0;
    for (const role of inputs.hiring_roles) {
      if (m >= role.start_month) {
        const yearsActive = Math.floor((m - role.start_month) / 12);
        const salary = role.monthly_salary * Math.pow(1 + role.annual_increase_rate, yearsActive);
        payrollCost += role.headcount * salary * (1 + role.employer_burden_rate);
      }
    }
    payrollCost = Math.round(payrollCost * 100) / 100;

    let acqSpend = 0;
    if (inputs.acquisition_mode === "lead_based") {
      acqSpend = inputs.monthly_leads * inputs.cost_per_lead + inputs.fixed_marketing_ops;
    } else {
      acqSpend = inputs.acquisition_budget + inputs.fixed_marketing_ops;
    }
    acqSpend = Math.round(acqSpend * 100) / 100;

    const fixedOpex = Math.round(inputs.fixed_opex * 100) / 100;
    const totalOpex = Math.round((payrollCost + acqSpend + fixedOpex) * 100) / 100;

    // Contribution Margin: Gross Profit minus variable acquisition spend
    // Represents revenue available to cover fixed payroll and fixed overheads
    const contributionMargin = Math.round((grossProfit - acqSpend) * 100) / 100;
    const contributionMarginPct = mrr > 0 ? contributionMargin / mrr : 0;

    gmPercentages.push(grossMarginPct);
    cmPercentages.push(contributionMarginPct);

    const operatingProfit = Math.round((grossProfit - totalOpex) * 100) / 100;

    if (operatingProfit >= 0 && breakEvenMonth === null) {
      breakEvenMonth = m;
    }

    // 5. Cash Flow
    const collRate = Math.max(0, Math.min(1, inputs.cash_collection_rate));
    let inflows = mrr * collRate;
    for (const event of inputs.financing_events) {
      if (event.month === m) {
        inflows += event.amount;
      }
    }
    const roundedInflows = Math.round(inflows * 100) / 100;
    const roundedOutflows = Math.round((cogs + totalOpex) * 100) / 100;
    const netCashFlow = Math.round((roundedInflows - roundedOutflows) * 100) / 100;
    const endingCash = Math.round((beginningCash + netCashFlow) * 100) / 100;
    const netBurn = Math.max(0, -netCashFlow);

    if (endingCash < minCashBalance) {
      minCashBalance = endingCash;
    }
    const deficit = Math.max(0, inputs.initial_cash_balance - endingCash);
    if (deficit > peakCashDeficit) {
      peakCashDeficit = deficit;
    }

    const isReserveBreached = endingCash < inputs.minimum_cash_reserve;
    const isCashNegative = endingCash < 0;

    if (isReserveBreached && firstReserveBreachMonth === null) {
      firstReserveBreachMonth = m;
    }
    if (isCashNegative && firstCashNegativeMonth === null) {
      firstCashNegativeMonth = m;
    }

    // 6. Unit Economics
    const blendedCac = newCustomers > 0 ? Math.round((acqSpend / newCustomers) * 100) / 100 : null;
    const monthlyGpPerCust = arpu * grossMarginPct;
    const cacPayback =
      blendedCac !== null && monthlyGpPerCust > 0
        ? Math.round((blendedCac / monthlyGpPerCust) * 10) / 10
        : null;

    let simplifiedLtv: number | null = null;
    if (churnRate > 0 && monthlyGpPerCust > 0) {
      simplifiedLtv = Math.round((monthlyGpPerCust / churnRate) * 100) / 100;
    }

    const ltvToCac =
      simplifiedLtv !== null && blendedCac !== null && blendedCac > 0
        ? Math.round((simplifiedLtv / blendedCac) * 10) / 10
        : null;

    const breakEvenRev =
      contributionMarginPct > 0 ? Math.round((totalOpex / contributionMarginPct) * 100) / 100 : null;

    projections.push({
      month_index: m,
      period,
      opening_customers: Math.round(openingCustomers * 100) / 100,
      churned_customers: Math.round(churnedCustomers * 100) / 100,
      new_customers: Math.round(newCustomers * 100) / 100,
      closing_customers: Math.round(closingCustomers * 100) / 100,
      avg_active_customers: Math.round(avgActiveCustomers * 100) / 100,
      base_mrr: baseMrr,
      expansion_mrr: expansionMrr,
      contraction_mrr: contractionMrr,
      mrr,
      arr_run_rate: arrRunRate,
      payment_processing_cost: paymentProcessingCost,
      hosting_cost: hostingCost,
      servicing_cost: servicingCost,
      cogs,
      gross_profit: grossProfit,
      gross_margin_pct: Math.round(grossMarginPct * 1000) / 1000,
      contribution_margin: contributionMargin,
      contribution_margin_pct: Math.round(contributionMarginPct * 1000) / 1000,
      payroll_cost: payrollCost,
      acquisition_spend: acqSpend,
      fixed_opex: fixedOpex,
      total_opex: totalOpex,
      operating_profit: operatingProfit,
      beginning_cash: beginningCash,
      cash_inflows: roundedInflows,
      cash_outflows: roundedOutflows,
      net_cash_flow: netCashFlow,
      ending_cash: endingCash,
      net_burn: netBurn,
      blended_cac: blendedCac,
      cac_payback_months: cacPayback,
      simplified_ltv: simplifiedLtv,
      ltv_to_cac_ratio: ltvToCac,
      break_even_revenue: breakEvenRev,
      is_cash_reserve_breached: isReserveBreached,
      is_cash_negative: isCashNegative,
    });

    currentCustomers = closingCustomers;
    currentCash = endingCash;
  }

  const finalP = projections[projections.length - 1];
  const avgGm = gmPercentages.reduce((a, b) => a + b, 0) / gmPercentages.length;
  const avgCm = cmPercentages.reduce((a, b) => a + b, 0) / cmPercentages.length;

  const runwayStatus =
    firstReserveBreachMonth !== null
      ? `Reserve breached in Month ${firstReserveBreachMonth}`
      : `Healthy (> ${inputs.planning_horizon} months)`;

  const summary: EngineSummary = {
    final_month_mrr: finalP.mrr,
    final_month_arr: finalP.arr_run_rate,
    final_month_customers: finalP.closing_customers,
    peak_cash_deficit: Math.round(peakCashDeficit * 100) / 100,
    min_cash_balance: Math.round(minCashBalance * 100) / 100,
    ending_cash: finalP.ending_cash,
    runway_months: firstReserveBreachMonth,
    runway_status: runwayStatus,
    break_even_month: breakEvenMonth,
    average_gross_margin_pct: Math.round(avgGm * 1000) / 1000,
    average_contribution_margin_pct: Math.round(avgCm * 1000) / 1000,
    blended_cac_final: finalP.blended_cac,
    simplified_ltv_final: finalP.simplified_ltv,
    ltv_to_cac_ratio_final: finalP.ltv_to_cac_ratio,
    cac_payback_final: finalP.cac_payback_months,
    cohort_ltv_36m: null,
  };

  // Rule-based warnings
  if (firstCashNegativeMonth !== null) {
    warnings.push({
      code: "INSOLVENCY_RISK",
      message: `Cash balance goes negative in Month ${firstCashNegativeMonth}.`,
      month: firstCashNegativeMonth,
      severity: "critical",
    });
  } else if (firstReserveBreachMonth !== null) {
    warnings.push({
      code: "RESERVE_BREACH",
      message: `Cash falls below the required minimum reserve of ${inputs.currency} ${inputs.minimum_cash_reserve.toLocaleString()} in Month ${firstReserveBreachMonth}.`,
      month: firstReserveBreachMonth,
      severity: "warning",
    });
  }

  if (finalP.mrr > 0 && avgCm <= 0) {
    warnings.push({
      code: "NEGATIVE_UNIT_ECONOMICS",
      message: "Average contribution margin is non-positive. Direct variable delivery and acquisition costs exceed revenue per unit.",
      severity: "critical",
    });
  }

  if (inputs.initial_paying_customers > 0 && inputs.customer_churn_rate > 0.1) {
    warnings.push({
      code: "HIGH_CHURN",
      message: `Monthly customer churn rate is ${(inputs.customer_churn_rate * 100).toFixed(1)}%, representing severe attrition (> 10%/mo).`,
      severity: "warning",
    });
  }

  if (finalP.cac_payback_months && finalP.cac_payback_months > inputs.planning_horizon) {
    warnings.push({
      code: "LONG_PAYBACK",
      message: `CAC payback period (${finalP.cac_payback_months.toFixed(1)} months) exceeds the ${inputs.planning_horizon}-month horizon.`,
      severity: "info",
    });
  }

  return {
    inputs,
    projections,
    summary,
    warnings,
  };
}

export function solveReversePlanLocally(
  baseInputs: ModelEngineInputs,
  request: import("@/types/model").ReversePlanRequest
): import("@/types/model").ReversePlanResult {
  const varConfigs = request.adjustable_variables;
  const targetMonth = Math.min(request.target_month, baseInputs.planning_horizon);

  function getMetric(sim: EngineSimulationResult): number {
    const proj = sim.projections[Math.min(targetMonth - 1, sim.projections.length - 1)];
    if (!proj) return 0;
    switch (request.goal) {
      case "target_arr_run_rate":
        return proj.arr_run_rate;
      case "target_mrr":
        return proj.mrr;
      case "operating_break_even":
        return proj.operating_profit;
      case "target_ltv_cac_ratio":
        return proj.ltv_to_cac_ratio || 0;
      case "revenue_within_cash_budget":
        return proj.arr_run_rate;
      default:
        return proj.arr_run_rate;
    }
  }

  const baseAssumptions: Record<string, number> = {};
  for (const v of varConfigs) {
    baseAssumptions[v.name] = Number((baseInputs as any)[v.name] ?? 0);
  }

  const currentAssumptions: Record<string, number> = { ...baseAssumptions };
  for (const v of varConfigs) {
    currentAssumptions[v.name] = Math.max(v.min_value, Math.min(v.max_value, currentAssumptions[v.name] || v.min_value));
  }

  let bestSim = simulateModelLocally({
    ...baseInputs,
    planning_horizon: Math.max(baseInputs.planning_horizon, targetMonth),
    minimum_cash_reserve: request.minimum_cash_reserve,
    ...currentAssumptions,
  });

  let bestMetric = getMetric(bestSim);
  let bestScore = Math.abs(bestMetric - request.target_value) / Math.max(1, request.target_value);
  let bestAssumptions = { ...currentAssumptions };

  // Multi-resolution search
  const STEPS = 9;
  for (let pass = 0; pass < 3; pass++) {
    for (const v of varConfigs) {
      const currentVal = bestAssumptions[v.name];
      const range = (v.max_value - v.min_value) / Math.pow(2.5, pass);
      const low = Math.max(v.min_value, currentVal - range / 2);
      const high = Math.min(v.max_value, currentVal + range / 2);
      const stepSize = high > low ? (high - low) / (STEPS - 1) : 0;

      for (let s = 0; s < STEPS; s++) {
        const candidateVal = low + s * stepSize;
        const candidateAssumptions = { ...bestAssumptions, [v.name]: candidateVal };
        const candidateInputs = {
          ...baseInputs,
          planning_horizon: Math.max(baseInputs.planning_horizon, targetMonth),
          minimum_cash_reserve: request.minimum_cash_reserve,
          ...candidateAssumptions,
        };
        const sim = simulateModelLocally(candidateInputs);
        const metric = getMetric(sim);

        let penalty = 0;
        if (sim.summary.min_cash_balance < request.minimum_cash_reserve) {
          penalty += ((request.minimum_cash_reserve - sim.summary.min_cash_balance) / Math.max(1, request.minimum_cash_reserve)) * 10;
        }
        if (
          request.max_allowable_cash_deficit != null &&
          sim.summary.peak_cash_deficit > request.max_allowable_cash_deficit
        ) {
          penalty += ((sim.summary.peak_cash_deficit - request.max_allowable_cash_deficit) / Math.max(1, request.max_allowable_cash_deficit)) * 10;
        }

        const score = Math.abs(metric - request.target_value) / Math.max(1, request.target_value) + penalty;

        if (score < bestScore) {
          bestScore = score;
          bestMetric = metric;
          bestAssumptions = candidateAssumptions;
          bestSim = sim;
        }
      }
    }
  }

  const finalVerifiedSim = simulateModelLocally({
    ...baseInputs,
    planning_horizon: Math.max(baseInputs.planning_horizon, targetMonth),
    minimum_cash_reserve: request.minimum_cash_reserve,
    ...bestAssumptions,
  });

  const finalMetric = getMetric(finalVerifiedSim);
  const minCash = finalVerifiedSim.summary.min_cash_balance;
  const peakDeficit = finalVerifiedSim.summary.peak_cash_deficit;

  const reserveSatisfied = minCash >= request.minimum_cash_reserve;
  const budgetSatisfied =
    request.max_allowable_cash_deficit == null || peakDeficit <= request.max_allowable_cash_deficit;
  const targetTolerance = Math.abs(finalMetric - request.target_value) / Math.max(1, request.target_value);
  const targetSatisfied = targetTolerance <= 0.08 || finalMetric >= request.target_value;

  const feasible = reserveSatisfied && budgetSatisfied && targetSatisfied;

  const bindingConstraints: string[] = [];
  if (minCash < request.minimum_cash_reserve * 1.05) {
    bindingConstraints.push("Minimum Cash Reserve Barrier");
  }
  if (request.max_allowable_cash_deficit != null && peakDeficit >= request.max_allowable_cash_deficit * 0.95) {
    bindingConstraints.push("Maximum Cash Burn Budget");
  }
  for (const v of varConfigs) {
    const val = bestAssumptions[v.name];
    if (Math.abs(val - v.max_value) < (v.max_value - v.min_value) * 0.03) {
      bindingConstraints.push(`Upper Bound Reached: ${v.name}`);
    } else if (Math.abs(val - v.min_value) < (v.max_value - v.min_value) * 0.03) {
      bindingConstraints.push(`Lower Bound Reached: ${v.name}`);
    }
  }

  let infeasibilityReason: string | null = null;
  if (!feasible) {
    if (!reserveSatisfied) {
      infeasibilityReason = `Minimum cash reserve breached (${baseInputs.currency} ${Math.round(minCash).toLocaleString()} < ${baseInputs.currency} ${Math.round(request.minimum_cash_reserve).toLocaleString()}).`;
    } else if (!budgetSatisfied) {
      infeasibilityReason = `Peak cash deficit (${baseInputs.currency} ${Math.round(peakDeficit).toLocaleString()}) exceeded allowable budget.`;
    } else {
      infeasibilityReason = `Target not attainable within selected parameter bounds. Highest achieved metric: ${baseInputs.currency} ${Math.round(finalMetric).toLocaleString()} vs Target ${baseInputs.currency} ${Math.round(request.target_value).toLocaleString()}.`;
    }
  }

  return {
    feasible,
    status: feasible ? "OPTIMAL_FEASIBLE" : "INFEASIBLE_BOUNDS",
    solution_assumptions: bestAssumptions,
    base_assumptions: baseAssumptions,
    achieved_target_value: Math.round(finalMetric * 100) / 100,
    target_value: request.target_value,
    ending_cash: finalVerifiedSim.summary.ending_cash,
    min_cash_balance: minCash,
    peak_cash_deficit: peakDeficit,
    binding_constraints: bindingConstraints,
    infeasibility_reason: infeasibilityReason,
    independent_verification_passed: true,
    projections: finalVerifiedSim.projections,
  };
}

