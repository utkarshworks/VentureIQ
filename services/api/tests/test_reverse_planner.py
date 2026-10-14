"""
Unit & Feasibility Tests for Reverse Planning Engine.
Tests both feasible goals and mathematically/operationally infeasible goals.
"""
import pytest
from app.engine.models import ModelEngineInputs, AcquisitionMode
from app.engine.reverse_planner import (
    solve_reverse_plan,
    ReversePlanRequest,
    OptimizationGoal,
    AdjustableVariableConfig,
)


def test_reverse_planner_feasible_target_arr():
    """
    Test case: Founder wants ₹1 Crore ARR run rate in 12 months.
    Current Base: ₹3,000 ARPU, 3% conversion, ₹2.5L budget.
    Allows ARPU [₹2,500, ₹6,000], conversion [2%, 8%], churn [1.5%, 4%].
    """
    base_inputs = ModelEngineInputs(
        initial_paying_customers=50.0,
        initial_cash_balance=3000000.0,
        minimum_cash_reserve=500000.0,
        arpu=3000.0,
        customer_churn_rate=0.03,
        acquisition_mode=AcquisitionMode.LEAD_BASED,
        monthly_leads=1500.0,
        lead_conversion_rate=0.03,
        cost_per_lead=150.0,
    )

    request = ReversePlanRequest(
        goal=OptimizationGoal.TARGET_ARR_RUN_RATE,
        target_value=10000000.0,  # ₹1 Crore
        target_month=12,
        minimum_cash_reserve=500000.0,
        adjustable_variables=[
            AdjustableVariableConfig(name="arpu", min_value=3000.0, max_value=6000.0),
            AdjustableVariableConfig(name="lead_conversion_rate", min_value=0.02, max_value=0.08),
            AdjustableVariableConfig(name="customer_churn_rate", min_value=0.015, max_value=0.04),
        ],
    )

    result = solve_reverse_plan(base_inputs, request)

    assert result.feasible is True
    assert result.independent_verification_passed is True
    # Achieved ARR >= 98% of 10,000,000
    assert result.achieved_target_value >= 9800000.0
    # Min cash balance >= minimum reserve
    assert result.min_cash_balance >= 500000.0
    # Values are within requested bounds
    assert 3000.0 <= result.solution_assumptions["arpu"] <= 6000.0
    assert 0.02 <= result.solution_assumptions["lead_conversion_rate"] <= 0.08
    assert 0.015 <= result.solution_assumptions["customer_churn_rate"] <= 0.04


def test_reverse_planner_infeasible_target():
    """
    Target ₹50 Crore (500,000,000) ARR run rate in 12 months with low leads and tight price cap.
    Must return feasible: False and provide clear diagnostic reasoning.
    """
    base_inputs = ModelEngineInputs(
        initial_paying_customers=10.0,
        initial_cash_balance=500000.0,
        minimum_cash_reserve=100000.0,
        arpu=1000.0,
        acquisition_mode=AcquisitionMode.LEAD_BASED,
        monthly_leads=200.0,
        lead_conversion_rate=0.02,
        cost_per_lead=100.0,
    )

    request = ReversePlanRequest(
        goal=OptimizationGoal.TARGET_ARR_RUN_RATE,
        target_value=500000000.0,  # ₹50 Crore (Impossible)
        target_month=12,
        minimum_cash_reserve=100000.0,
        adjustable_variables=[
            AdjustableVariableConfig(name="arpu", min_value=1000.0, max_value=2500.0),
            AdjustableVariableConfig(name="lead_conversion_rate", min_value=0.01, max_value=0.04),
        ],
    )

    result = solve_reverse_plan(base_inputs, request)

    assert result.feasible is False
    assert result.infeasibility_reason is not None
    assert len(result.binding_constraints) > 0
    # Independent verification flag remains true because simulation ran cleanly
    assert result.independent_verification_passed is True
