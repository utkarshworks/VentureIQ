"""
VentureIQ Engine - Revenue Module
Calculates MRR components and ARR run rate.
"""
from typing import Tuple
from app.engine.models import ModelEngineInputs


def calculate_monthly_revenue(
    opening_customers: float,
    avg_active_customers: float,
    inputs: ModelEngineInputs
) -> Tuple[float, float, float, float, float]:
    """
    Computes (base_mrr, expansion_mrr, contraction_mrr, mrr, arr_run_rate)
    
    Formula definitions:
    - Base MRR = avg_active_customers * ARPU
    - Expansion MRR = opening_customers * ARPU * expansion_rate
    - Contraction MRR = opening_customers * ARPU * contraction_rate
    - Net MRR = max(0.0, Base MRR + Expansion MRR - Contraction MRR)
    - ARR Run Rate = Net MRR * 12
    """
    arpu = max(0.0, inputs.arpu)
    base_mrr = avg_active_customers * arpu
    expansion_mrr = opening_customers * arpu * max(0.0, inputs.expansion_rate)
    contraction_mrr = opening_customers * arpu * max(0.0, inputs.contraction_rate)

    mrr = max(0.0, base_mrr + expansion_mrr - contraction_mrr)
    arr_run_rate = mrr * 12.0

    return base_mrr, expansion_mrr, contraction_mrr, mrr, arr_run_rate
