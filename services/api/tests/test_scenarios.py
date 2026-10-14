"""
Unit Tests for Multi-Scenario Engine (Base, Optimistic, Downside, Custom).
"""
import pytest
from app.engine.models import ModelEngineInputs
from app.engine.scenarios import (
    ScenarioConfig,
    ScenarioType,
    compare_scenarios,
    get_default_optimistic_overrides,
    get_default_downside_overrides,
)


def test_scenario_comparison_hierarchy():
    """Optimistic scenario should yield higher ARR and cash than Downside scenario."""
    base_inputs = ModelEngineInputs(
        initial_paying_customers=50.0,
        arpu=3000.0,
        monthly_leads=1000.0,
        lead_conversion_rate=0.03,
        customer_churn_rate=0.03,
        planning_horizon=12,
    )

    opt_overrides = get_default_optimistic_overrides(base_inputs)
    down_overrides = get_default_downside_overrides(base_inputs)

    scenarios = [
        ScenarioConfig(id="base", name="Base Case", scenario_type=ScenarioType.BASE, overrides={}),
        ScenarioConfig(id="opt", name="Optimistic Case", scenario_type=ScenarioType.OPTIMISTIC, overrides=opt_overrides),
        ScenarioConfig(id="down", name="Downside Case", scenario_type=ScenarioType.DOWNSIDE, overrides=down_overrides),
    ]

    result = compare_scenarios(base_inputs, scenarios)

    assert len(result.scenarios) == 3
    base_m = next(s for s in result.scenarios if s.scenario_id == "base")
    opt_m = next(s for s in result.scenarios if s.scenario_id == "opt")
    down_m = next(s for s in result.scenarios if s.scenario_id == "down")

    # Invariants: Optimistic ARR > Base ARR > Downside ARR
    assert opt_m.month_12_arr > base_m.month_12_arr
    assert base_m.month_12_arr > down_m.month_12_arr

    # Optimistic Ending Cash > Downside Ending Cash
    assert opt_m.ending_cash > down_m.ending_cash

    # Verify differing assumptions dictionary captures differences
    assert "opt" in result.differing_assumptions
    assert "arpu" in result.differing_assumptions["opt"]
    assert "customer_churn_rate" in result.differing_assumptions["opt"]
