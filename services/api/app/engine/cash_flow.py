"""
VentureIQ Engine - Cash Flow & Runway Module
Tracks monthly beginning cash, cash inflows, outflows, ending cash, and runway reserve breaches.
"""
from typing import Tuple
from app.engine.models import ModelEngineInputs


def calculate_monthly_cash_flow(
    beginning_cash: float,
    month_index: int,
    mrr: float,
    cogs: float,
    total_opex: float,
    inputs: ModelEngineInputs
) -> Tuple[float, float, float, float, float, bool, bool]:
    """
    Computes:
    (cash_inflows, cash_outflows, net_cash_flow, ending_cash, net_burn,
     is_cash_reserve_breached, is_cash_negative)
     
    Reconciliation Invariants:
    - ending_cash == beginning_cash + net_cash_flow
    - net_burn == max(0.0, -net_cash_flow)
    """
    # 1. Cash Inflows: Customer collections + any financing injections in month_index
    customer_collections = mrr * max(0.0, min(1.0, inputs.cash_collection_rate))
    
    financing_inflows = 0.0
    for event in inputs.financing_events:
        if event.month == month_index:
            financing_inflows += event.amount

    cash_inflows = customer_collections + financing_inflows

    # 2. Cash Outflows: COGS + Operating Expenses
    cash_outflows = cogs + total_opex

    # 3. Net Cash Flow
    net_cash_flow = cash_inflows - cash_outflows

    # 4. Ending Cash Balance
    ending_cash = beginning_cash + net_cash_flow

    # 5. Net Burn
    net_burn = max(0.0, -net_cash_flow)

    # 6. Reserve & Solvency Checks
    is_cash_reserve_breached = ending_cash < inputs.minimum_cash_reserve
    is_cash_negative = ending_cash < 0.0

    return (
        cash_inflows,
        cash_outflows,
        net_cash_flow,
        ending_cash,
        net_burn,
        is_cash_reserve_breached,
        is_cash_negative,
    )

