"""
VentureIQ Engine - Customer Movement Bridge
Deterministic customer transition calculation.
"""
from typing import Tuple
from app.engine.models import ModelEngineInputs, AcquisitionMode


def calculate_customer_movement(
    opening_customers: float,
    inputs: ModelEngineInputs,
    month_index: int
) -> Tuple[float, float, float, float]:
    """
    Computes (churned_customers, new_customers, closing_customers, avg_active_customers)
    for a single month.
    
    Invariants:
    - Churned customers cannot exceed opening customers.
    - Closing customers = max(0.0, opening - churned + new).
    - Avg active customers = (opening + closing) / 2.
    """
    # 1. Churn calculation based on opening customer base
    churn_rate = max(0.0, min(1.0, inputs.customer_churn_rate))
    churned_customers = min(opening_customers, opening_customers * churn_rate)

    # 2. Acquisition calculation based on chosen mode
    if inputs.acquisition_mode == AcquisitionMode.LEAD_BASED:
        conv_rate = max(0.0, min(1.0, inputs.lead_conversion_rate))
        lead_acquired = inputs.monthly_leads * conv_rate
        new_customers = inputs.organic_new_customers + lead_acquired
    else:  # BUDGET_BASED
        if inputs.target_cac > 0:
            paid_acquired = inputs.acquisition_budget / inputs.target_cac
        else:
            paid_acquired = 0.0
        new_customers = inputs.organic_new_customers + paid_acquired

    new_customers = max(0.0, new_customers)

    # 3. Closing customers
    closing_customers = max(0.0, opening_customers - churned_customers + new_customers)

    # 4. Average active customers during the month
    avg_active_customers = (opening_customers + closing_customers) / 2.0

    return churned_customers, new_customers, closing_customers, avg_active_customers
