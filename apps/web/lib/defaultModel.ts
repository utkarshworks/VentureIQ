import { ModelEngineInputs } from "@/types/model";

export const DEFAULT_SAAS_MODEL: ModelEngineInputs = {
  company_name: "ApexCloud SaaS",
  business_model: "b2b_saas",
  currency: "INR",
  start_date: "2026-01",
  planning_horizon: 12,

  initial_paying_customers: 40,
  initial_cash_balance: 3500000, // ₹35 Lakh
  minimum_cash_reserve: 800000,  // ₹8 Lakh

  arpu: 3500, // ₹3,500/mo
  expansion_rate: 0.015,
  contraction_rate: 0.005,

  customer_churn_rate: 0.025, // 2.5% monthly

  acquisition_mode: "lead_based",
  monthly_leads: 1200,
  lead_conversion_rate: 0.035, // 3.5%
  cost_per_lead: 180,
  acquisition_budget: 250000,
  target_cac: 6000,
  organic_new_customers: 3,
  fixed_marketing_ops: 25000,

  payment_processing_rate: 0.025, // 2.5% Razorpay/Stripe
  hosting_fixed_cost: 20000,
  hosting_cost_per_customer: 15,
  servicing_cost_per_customer: 40,

  fixed_opex: 120000, // ₹1.2L overhead

  hiring_roles: [
    {
      role_title: "Full Stack Engineer",
      department: "Engineering",
      headcount: 1,
      monthly_salary: 85000,
      employer_burden_rate: 0.15,
      start_month: 2,
      annual_increase_rate: 0.08,
    },
    {
      role_title: "Growth Marketer",
      department: "Marketing",
      headcount: 1,
      monthly_salary: 70000,
      employer_burden_rate: 0.15,
      start_month: 4,
      annual_increase_rate: 0.05,
    },
    {
      role_title: "Customer Success Lead",
      department: "Support",
      headcount: 1,
      monthly_salary: 50000,
      employer_burden_rate: 0.15,
      start_month: 6,
      annual_increase_rate: 0.05,
    },
  ],
  financing_events: [],
  cash_collection_rate: 1.0,
};

