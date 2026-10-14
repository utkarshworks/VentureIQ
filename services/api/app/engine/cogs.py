"""
VentureIQ Engine - COGS & Direct Cost Module
Calculates direct delivery costs, Gross Profit, and Contribution Margins.
"""
from typing import Tuple
from app.engine.models import ModelEngineInputs


def calculate_cogs_and_margins(
    mrr: float,
    avg_active_customers: float,
    inputs: ModelEngineInputs
) -> Tuple[float, float, float, float, float, float, float, float]:
    """
    Computes direct delivery costs and profitability margins:
    Returns:
    (payment_processing_cost, hosting_cost, servicing_cost, cogs,
     gross_profit, gross_margin_pct, contribution_margin, contribution_margin_pct)
     
    Safety Invariants:
    - If MRR == 0, margins % are 0.0 (no division by zero).
    - Gross Profit = MRR - COGS.
    - Contribution Margin = MRR - Direct Variable Costs.
    """
    # 1. Direct variable payment gateway costs (e.g. 2.5% Stripe/Razorpay)
    proc_rate = max(0.0, min(1.0, inputs.payment_processing_rate))
    payment_processing_cost = mrr * proc_rate

    # 2. Infrastructure & Hosting
    hosting_cost = (
        max(0.0, inputs.hosting_fixed_cost)
        + (avg_active_customers * max(0.0, inputs.hosting_cost_per_customer))
    )

    # 3. Direct customer servicing
    servicing_cost = avg_active_customers * max(0.0, inputs.servicing_cost_per_customer)

    # 4. Total COGS
    cogs = payment_processing_cost + hosting_cost + servicing_cost

    # 5. Gross Profit & Gross Margin %
    gross_profit = mrr - cogs
    if mrr > 0.0:
        gross_margin_pct = gross_profit / mrr
    else:
        gross_margin_pct = 0.0

    # 6. Contribution Margin (Revenue - direct marginal variable costs)
    # Direct variable costs include payment processing and per-customer costs
    direct_variable_costs = (
        payment_processing_cost
        + (avg_active_customers * max(0.0, inputs.hosting_cost_per_customer))
        + servicing_cost
    )
    contribution_margin = mrr - direct_variable_costs
    if mrr > 0.0:
        contribution_margin_pct = contribution_margin / mrr
    else:
        contribution_margin_pct = 0.0

    return (
        payment_processing_cost,
        hosting_cost,
        servicing_cost,
        cogs,
        gross_profit,
        gross_margin_pct,
        contribution_margin,
        contribution_margin_pct,
    )

