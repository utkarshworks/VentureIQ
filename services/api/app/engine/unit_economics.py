"""
VentureIQ Engine - Unit Economics Module
Calculates CAC, Payback, Simplified & Cohort LTV, and LTV:CAC Ratio.
Never returns NaN or Infinity. Returns None when undefined with explicit reasoning.
"""
from typing import Optional, Tuple
from app.engine.models import ModelEngineInputs


def calculate_unit_economics(
    acquisition_spend: float,
    new_customers: float,
    gross_margin_pct: float,
    contribution_margin_pct: float,
    total_opex: float,
    inputs: ModelEngineInputs
) -> Tuple[
    Optional[float],  # blended_cac
    Optional[float],  # cac_payback_months
    Optional[float],  # simplified_ltv
    Optional[float],  # ltv_to_cac_ratio
    Optional[float],  # break_even_revenue
]:
    """
    Computes unit economics ratios with complete division-by-zero protection.
    """
    arpu = max(0.0, inputs.arpu)
    churn_rate = max(0.0, min(1.0, inputs.customer_churn_rate))

    # 1. Blended CAC
    if new_customers > 0.0:
        blended_cac: Optional[float] = acquisition_spend / new_customers
    else:
        blended_cac = None

    # 2. Monthly Gross Profit per Customer
    monthly_gp_per_customer = arpu * gross_margin_pct

    # 3. CAC Payback (Months)
    if (
        blended_cac is not None
        and monthly_gp_per_customer > 0.0
    ):
        cac_payback_months: Optional[float] = blended_cac / monthly_gp_per_customer
    else:
        cac_payback_months = None

    # 4. Simplified LTV: (ARPU * Gross Margin) / Churn
    if churn_rate > 0.0 and monthly_gp_per_customer > 0.0:
        simplified_ltv: Optional[float] = monthly_gp_per_customer / churn_rate
    elif monthly_gp_per_customer <= 0.0:
        simplified_ltv = 0.0
    else:
        # Zero churn: theoretically infinite, but represented as None / capped
        simplified_ltv = None

    # 5. LTV : CAC Ratio
    if (
        simplified_ltv is not None
        and blended_cac is not None
        and blended_cac > 0.0
    ):
        ltv_to_cac_ratio: Optional[float] = simplified_ltv / blended_cac
    else:
        ltv_to_cac_ratio = None

    # 6. Break-Even Revenue
    if contribution_margin_pct > 0.0:
        break_even_revenue: Optional[float] = total_opex / contribution_margin_pct
    else:
        break_even_revenue = None

    return (
        blended_cac,
        cac_payback_months,
        simplified_ltv,
        ltv_to_cac_ratio,
        break_even_revenue,
    )


def calculate_cohort_ltv(
    arpu: float,
    gross_margin_pct: float,
    monthly_churn_rate: float,
    horizon_months: int = 36,
    annual_discount_rate: float = 0.0
) -> float:
    """
    Calculates finite-horizon cohort LTV:
    LTV_H = sum_{t=1}^H [ Survival_t * GrossProfit_t / (1 + d)^t ]
    """
    if arpu <= 0.0 or gross_margin_pct <= 0.0:
        return 0.0

    monthly_gp = arpu * gross_margin_pct
    monthly_discount = (1.0 + annual_discount_rate) ** (1.0 / 12.0) - 1.0

    total_ltv = 0.0
    survival_prob = 1.0

    for m in range(1, horizon_months + 1):
        # Survival at month m
        survival_prob *= (1.0 - monthly_churn_rate)
        if survival_prob <= 0.0:
            break
        discount_factor = (1.0 + monthly_discount) ** m
        total_ltv += (survival_prob * monthly_gp) / discount_factor

    return total_ltv
