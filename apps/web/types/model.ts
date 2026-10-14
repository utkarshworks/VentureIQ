/**
 * VentureIQ Frontend TypeScript Data Definitions.
 */

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP";
export type BusinessModelType = "b2b_saas" | "b2c_subscription" | "subscription_services" | "recurring_digital";
export type AcquisitionMode = "lead_based" | "budget_based";

export interface HiringRole {
  role_title: string;
  department: string;
  headcount: number;
  monthly_salary: number;
  employer_burden_rate: number;
  start_month: number;
  annual_increase_rate: number;
}

export interface FinancingEvent {
  month: number;
  amount: number;
  name: string;
}

export interface ModelEngineInputs {
  company_name: string;
  business_model: BusinessModelType;
  currency: CurrencyCode;
  start_date: string;
  planning_horizon: number;

  // Balances
  initial_paying_customers: number;
  initial_cash_balance: number;
  minimum_cash_reserve: number;

  // Revenue
  arpu: number;
  expansion_rate: number;
  contraction_rate: number;

  // Retention
  customer_churn_rate: number;

  // Acquisition
  acquisition_mode: AcquisitionMode;
  monthly_leads: number;
  lead_conversion_rate: number;
  cost_per_lead: number;
  acquisition_budget: number;
  target_cac: number;
  organic_new_customers: number;
  fixed_marketing_ops: number;

  // COGS
  payment_processing_rate: number;
  hosting_fixed_cost: number;
  hosting_cost_per_customer: number;
  servicing_cost_per_customer: number;

  // OpEx
  fixed_opex: number;

  // Headcount & Financing
  hiring_roles: HiringRole[];
  financing_events: FinancingEvent[];
  cash_collection_rate: number;
}

export interface MonthlyProjection {
  month_index: number;
  period: string;

  opening_customers: number;
  churned_customers: number;
  new_customers: number;
  closing_customers: number;
  avg_active_customers: number;

  base_mrr: number;
  expansion_mrr: number;
  contraction_mrr: number;
  mrr: number;
  arr_run_rate: number;

  payment_processing_cost: number;
  hosting_cost: number;
  servicing_cost: number;
  cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  contribution_margin: number;
  contribution_margin_pct: number;

  payroll_cost: number;
  acquisition_spend: number;
  fixed_opex: number;
  total_opex: number;
  operating_profit: number;

  beginning_cash: number;
  cash_inflows: number;
  cash_outflows: number;
  net_cash_flow: number;
  ending_cash: number;
  net_burn: number;

  blended_cac: number | null;
  cac_payback_months: number | null;
  simplified_ltv: number | null;
  ltv_to_cac_ratio: number | null;
  break_even_revenue: number | null;

  is_cash_reserve_breached: boolean;
  is_cash_negative: boolean;
}

export interface EngineSummary {
  final_month_mrr: number;
  final_month_arr: number;
  final_month_customers: number;
  peak_cash_deficit: number;
  min_cash_balance: number;
  ending_cash: number;
  runway_months: number | null;
  runway_status: string;
  break_even_month: number | null;
  average_gross_margin_pct: number;
  average_contribution_margin_pct: number;
  blended_cac_final: number | null;
  simplified_ltv_final: number | null;
  ltv_to_cac_ratio_final: number | null;
  cac_payback_final: number | null;
  cohort_ltv_36m: number | null;
}

export interface ModelWarning {
  code: string;
  message: string;
  month?: number | null;
  severity: "info" | "warning" | "critical";
}

export interface EngineSimulationResult {
  inputs: ModelEngineInputs;
  projections: MonthlyProjection[];
  summary: EngineSummary;
  warnings: ModelWarning[];
}

export interface ScenarioMetricSummary {
  scenario_id: string;
  scenario_name: string;
  scenario_type: "base" | "optimistic" | "downside" | "custom";
  month_12_mrr: number;
  month_12_arr: number;
  month_12_customers: number;
  ending_cash: number;
  peak_cash_deficit: number;
  runway_status: string;
  break_even_month: number | null;
  gross_margin_pct: number;
  contribution_margin_pct: number;
  blended_cac: number | null;
  simplified_ltv: number | null;
  ltv_to_cac_ratio: number | null;
  cac_payback_months: number | null;
}

export interface ScenarioComparisonResult {
  scenarios: ScenarioMetricSummary[];
  differing_assumptions: Record<string, Record<string, { scenario_value: any; base_value: any }>>;
  monthly_trajectories: Record<string, any[]>;
}

export interface ReversePlanRequest {
  goal: string;
  target_value: number;
  target_month: number;
  minimum_cash_reserve: number;
  max_allowable_cash_deficit?: number | null;
  adjustable_variables: {
    name: string;
    min_value: number;
    max_value: number;
  }[];
}

export interface ReversePlanResult {
  feasible: boolean;
  status: string;
  solution_assumptions: Record<string, number>;
  base_assumptions: Record<string, number>;
  achieved_target_value: number;
  target_value: number;
  ending_cash: number;
  min_cash_balance: number;
  peak_cash_deficit: number;
  binding_constraints: string[];
  infeasibility_reason?: string | null;
  independent_verification_passed: boolean;
  projections?: MonthlyProjection[] | null;
}

