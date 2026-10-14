"""
VentureIQ Pure Financial Engine - Data Models & Types
Zero external framework/database dependencies.
"""
from __future__ import annotations
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class AcquisitionMode(str, Enum):
    LEAD_BASED = "lead_based"
    BUDGET_BASED = "budget_based"


class CurrencyCode(str, Enum):
    INR = "INR"
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"


class BusinessModelType(str, Enum):
    B2B_SAAS = "b2b_saas"
    B2C_SUBSCRIPTION = "b2c_subscription"
    SUBSCRIPTION_SERVICES = "subscription_services"
    RECURRING_DIGITAL = "recurring_digital"


class HiringRoleInput(BaseModel):
    role_title: str
    department: str = "Engineering"
    headcount: int = Field(default=1, ge=1)
    monthly_salary: float = Field(default=0.0, ge=0.0)
    employer_burden_rate: float = Field(default=0.15, ge=0.0, le=1.0)  # e.g. 15% for benefits/tax
    start_month: int = Field(default=1, ge=1)
    annual_increase_rate: float = Field(default=0.0, ge=0.0, le=1.0)


class FinancingEventInput(BaseModel):
    month: int = Field(ge=1)
    amount: float = Field(ge=0.0)
    name: str = "Investment Round"


class ModelEngineInputs(BaseModel):
    # Core Meta
    company_name: str = "My Startup"
    business_model: BusinessModelType = BusinessModelType.B2B_SAAS
    currency: CurrencyCode = CurrencyCode.INR
    start_date: str = "2026-01"
    planning_horizon: int = Field(default=12, ge=1, le=36)

    # Opening Balances
    initial_paying_customers: float = Field(default=0.0, ge=0.0)
    initial_cash_balance: float = Field(default=1000000.0, ge=0.0)
    minimum_cash_reserve: float = Field(default=200000.0, ge=0.0)

    # Pricing & Revenue Dynamics
    arpu: float = Field(default=2500.0, ge=0.0, description="Average monthly recurring revenue per customer")
    expansion_rate: float = Field(default=0.0, ge=0.0, le=1.0, description="Monthly expansion MRR rate % of opening base")
    contraction_rate: float = Field(default=0.0, ge=0.0, le=1.0, description="Monthly contraction MRR rate % of opening base")

    # Retention & Churn
    customer_churn_rate: float = Field(default=0.03, ge=0.0, le=1.0, description="Monthly customer churn rate")

    # Acquisition Engine
    acquisition_mode: AcquisitionMode = AcquisitionMode.LEAD_BASED
    monthly_leads: float = Field(default=1000.0, ge=0.0)
    lead_conversion_rate: float = Field(default=0.03, ge=0.0, le=1.0)
    cost_per_lead: float = Field(default=200.0, ge=0.0)
    acquisition_budget: float = Field(default=200000.0, ge=0.0)
    target_cac: float = Field(default=6000.0, ge=0.0)
    organic_new_customers: float = Field(default=2.0, ge=0.0)
    fixed_marketing_ops: float = Field(default=30000.0, ge=0.0)

    # Cost of Goods Sold (COGS) / Delivery Costs
    payment_processing_rate: float = Field(default=0.025, ge=0.0, le=1.0)  # e.g. 2.5% Stripe/Razorpay
    hosting_fixed_cost: float = Field(default=25000.0, ge=0.0)
    hosting_cost_per_customer: float = Field(default=15.0, ge=0.0)
    servicing_cost_per_customer: float = Field(default=50.0, ge=0.0)

    # Operating Expenses (Non-headcount)
    fixed_opex: float = Field(default=100000.0, ge=0.0, description="Rent, SaaS tools, legal, accounting, etc.")

    # Headcount & Financing
    hiring_roles: List[HiringRoleInput] = Field(default_factory=list)
    financing_events: List[FinancingEventInput] = Field(default_factory=list)

    # Advanced collection timing
    cash_collection_rate: float = Field(default=1.0, ge=0.0, le=1.0, description="Portion of revenue collected in current month")


class WarningSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class ModelWarning(BaseModel):
    code: str
    message: str
    month: Optional[int] = None
    severity: WarningSeverity = WarningSeverity.WARNING


class MonthlyProjection(BaseModel):
    month_index: int
    period: str  # e.g. "2026-01"

    # Customer Bridge
    opening_customers: float
    churned_customers: float
    new_customers: float
    closing_customers: float
    avg_active_customers: float

    # Revenue
    base_mrr: float
    expansion_mrr: float
    contraction_mrr: float
    mrr: float
    arr_run_rate: float

    # Direct Costs & Margins
    payment_processing_cost: float
    hosting_cost: float
    servicing_cost: float
    cogs: float
    gross_profit: float
    gross_margin_pct: float
    contribution_margin: float
    contribution_margin_pct: float

    # OpEx Breakdown
    payroll_cost: float
    acquisition_spend: float
    fixed_opex: float
    total_opex: float
    operating_profit: float

    # Cash Flow
    beginning_cash: float
    cash_inflows: float
    cash_outflows: float
    net_cash_flow: float
    ending_cash: float
    net_burn: float

    # Unit Economics
    blended_cac: Optional[float] = None
    cac_payback_months: Optional[float] = None
    simplified_ltv: Optional[float] = None
    ltv_to_cac_ratio: Optional[float] = None
    break_even_revenue: Optional[float] = None

    # Status / Alerts for period
    is_cash_reserve_breached: bool = False
    is_cash_negative: bool = False


class EngineSummary(BaseModel):
    final_month_mrr: float
    final_month_arr: float
    final_month_customers: float
    peak_cash_deficit: float
    min_cash_balance: float
    ending_cash: float
    runway_months: Optional[int] = None  # None if extends beyond horizon
    runway_status: str  # e.g. "Healthy (> 12 mos)", "Breached in Month 7"
    break_even_month: Optional[int] = None
    average_gross_margin_pct: float
    average_contribution_margin_pct: float
    blended_cac_final: Optional[float] = None
    simplified_ltv_final: Optional[float] = None
    ltv_to_cac_ratio_final: Optional[float] = None
    cac_payback_final: Optional[float] = None
    cohort_ltv_36m: Optional[float] = None


class EngineSimulationResult(BaseModel):
    inputs: ModelEngineInputs
    projections: List[MonthlyProjection]
    summary: EngineSummary
    warnings: List[ModelWarning] = Field(default_factory=list)
