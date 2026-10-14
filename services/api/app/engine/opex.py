"""
VentureIQ Engine - OpEx & Headcount Module
Calculates monthly payroll, acquisition marketing spend, and overhead expenses.
"""
from typing import Tuple
from app.engine.models import ModelEngineInputs, AcquisitionMode


def calculate_opex_and_payroll(
    month_index: int,
    gross_profit: float,
    inputs: ModelEngineInputs
) -> Tuple[float, float, float, float, float]:
    """
    Computes:
    (payroll_cost, acquisition_spend, fixed_opex, total_opex, operating_profit)
    
    Headcount Logic:
    - Roles active only when month_index >= role.start_month.
    - Base salary compounds annually if annual_increase_rate > 0.
    - Employer burden rate (taxes, benefits, insurance) is applied on top.
    """
    # 1. Payroll calculation
    payroll_cost = 0.0
    for role in inputs.hiring_roles:
        if month_index >= role.start_month:
            years_active = (month_index - role.start_month) // 12
            salary = role.monthly_salary * ((1.0 + role.annual_increase_rate) ** years_active)
            total_role_monthly = (
                role.headcount
                * salary
                * (1.0 + role.employer_burden_rate)
            )
            payroll_cost += total_role_monthly

    # 2. Acquisition Spend
    if inputs.acquisition_mode == AcquisitionMode.LEAD_BASED:
        acquisition_spend = (
            (inputs.monthly_leads * inputs.cost_per_lead)
            + inputs.fixed_marketing_ops
        )
    else:  # BUDGET_BASED
        acquisition_spend = inputs.acquisition_budget + inputs.fixed_marketing_ops

    # 3. Fixed OpEx (rent, legal, software, other)
    fixed_opex = inputs.fixed_opex

    # 4. Total OpEx
    total_opex = payroll_cost + acquisition_spend + fixed_opex

    # 5. Operating Profit (EBIT / Net Operating Income)
    operating_profit = gross_profit - total_opex

    return payroll_cost, acquisition_spend, fixed_opex, total_opex, operating_profit

