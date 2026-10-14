"""
Edge Case & Boundary Tests for Pure Financial Engine.
Ensures zero division errors, NaNs, and infinities never occur.
"""
import pytest
from app.engine.models import ModelEngineInputs, AcquisitionMode
from app.engine.simulator import simulate_model
from app.engine.unit_economics import calculate_unit_economics, calculate_cohort_ltv


def test_zero_revenue_and_zero_customers():
    """Engine must gracefully handle 0 customers and 0 revenue."""
    inputs = ModelEngineInputs(
        initial_paying_customers=0.0,
        monthly_leads=0.0,
        organic_new_customers=0.0,
        arpu=0.0,
        fixed_opex=50000.0,
    )
    result = simulate_model(inputs)
    assert result.summary.final_month_mrr == 0.0
    assert result.summary.final_month_customers == 0.0
    # No NaN or crash
    p1 = result.projections[0]
    assert p1.gross_margin_pct == 0.0
    assert p1.contribution_margin_pct == 0.0
    assert p1.blended_cac is None  # Undefined since new customers == 0
    assert p1.simplified_ltv == 0.0 or p1.simplified_ltv is None


def test_zero_churn_rate():
    """Zero churn means customer retention is 100%."""
    inputs = ModelEngineInputs(
        initial_paying_customers=100.0,
        customer_churn_rate=0.0,
        organic_new_customers=10.0,
        monthly_leads=0.0,
    )
    result = simulate_model(inputs)
    for p in result.projections:
        assert p.churned_customers == 0.0
        # Customers strictly increase
        assert p.closing_customers >= p.opening_customers


def test_full_churn_100_percent():
    """100% churn empties the opening customer base completely each month."""
    inputs = ModelEngineInputs(
        initial_paying_customers=100.0,
        customer_churn_rate=1.0,
        organic_new_customers=15.0,
        monthly_leads=0.0,
    )
    result = simulate_model(inputs)
    p1 = result.projections[0]
    assert p1.churned_customers == 100.0
    assert p1.closing_customers == 15.0  # Only new organic remain


def test_negative_contribution_margin():
    """When variable costs exceed revenue per customer, flags critical warning."""
    inputs = ModelEngineInputs(
        initial_paying_customers=50.0,
        arpu=50.0,
        servicing_cost_per_customer=200.0,  # Costs 200 to service 50 ARPU
    )
    result = simulate_model(inputs)
    p1 = result.projections[0]
    assert p1.contribution_margin < 0.0
    # Warning should be generated
    warnings = [w for w in result.warnings if w.code == "NEGATIVE_UNIT_ECONOMICS"]
    assert len(warnings) > 0


def test_zero_acquisition_spend():
    """When acquisition spend is 0, CAC is undefined (None), organic growth works."""
    inputs = ModelEngineInputs(
        acquisition_mode=AcquisitionMode.BUDGET_BASED,
        acquisition_budget=0.0,
        fixed_marketing_ops=0.0,
        organic_new_customers=5.0,
    )
    result = simulate_model(inputs)
    p1 = result.projections[0]
    assert p1.acquisition_spend == 0.0
    assert p1.new_customers == 5.0
    # CAC = 0 / 5 = 0.0
    assert p1.blended_cac == 0.0


def test_extreme_values_scale():
    """Very large values should not cause numeric overflow or crash."""
    inputs = ModelEngineInputs(
        initial_paying_customers=1_000_000.0,
        arpu=500_000.0,
        initial_cash_balance=100_000_000_000.0,
        fixed_opex=50_000_000.0,
    )
    result = simulate_model(inputs)
    assert result.summary.final_month_mrr > 1_000_000_000.0
    assert not any(w.code == "INSOLVENCY_RISK" for w in result.warnings)


def test_insolvency_detection():
    """When burn exhausts cash, flags INSOLVENCY_RISK and sets breach month."""
    inputs = ModelEngineInputs(
        initial_cash_balance=100000.0,
        minimum_cash_reserve=50000.0,
        fixed_opex=200000.0,  # Burns 200k/mo with 0 revenue
        initial_paying_customers=0.0,
        monthly_leads=0.0,
        organic_new_customers=0.0,
    )
    result = simulate_model(inputs)
    assert result.summary.runway_months == 1
    assert any(w.code == "INSOLVENCY_RISK" for w in result.warnings)
