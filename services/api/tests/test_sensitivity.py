"""
Unit Tests for Sensitivity Analysis Module (1-var, 2-var matrix, Tornado ranking).
"""
import pytest
from app.engine.models import ModelEngineInputs
from app.engine.sensitivity import (
    run_one_var_sensitivity,
    run_two_var_sensitivity,
    run_tornado_analysis,
)


def test_one_variable_sensitivity_monotonicity():
    """Higher ARPU holding everything constant should strictly increase ARR and Ending Cash."""
    base_inputs = ModelEngineInputs(
        initial_paying_customers=50.0,
        arpu=3000.0,
        planning_horizon=12,
    )
    res = run_one_var_sensitivity(base_inputs, "arpu")
    assert len(res.data_points) == 7

    # Check monotonicity
    for i in range(len(res.data_points) - 1):
        assert res.data_points[i].input_value < res.data_points[i + 1].input_value
        assert res.data_points[i].month_12_arr < res.data_points[i + 1].month_12_arr
        assert res.data_points[i].ending_cash < res.data_points[i + 1].ending_cash


def test_two_variable_sensitivity_grid_dimensions():
    """Verify matrix dimensions and values."""
    base_inputs = ModelEngineInputs(
        arpu=2500.0,
        lead_conversion_rate=0.03,
        planning_horizon=12,
    )
    res = run_two_var_sensitivity(base_inputs, "arpu", "lead_conversion_rate", num_steps=5)
    assert len(res.var_x_values) == 5
    assert len(res.var_y_values) == 5
    assert len(res.matrix) == 5
    assert len(res.matrix[0]) == 5
    # High price + High conversion should have higher ARR than Low price + Low conversion
    assert res.matrix[4][4] > res.matrix[0][0]


def test_tornado_analysis_ranking():
    """Tornado analysis should rank drivers by elasticity spread."""
    base_inputs = ModelEngineInputs(
        arpu=3000.0,
        monthly_leads=1000.0,
        lead_conversion_rate=0.03,
        planning_horizon=12,
    )
    res = run_tornado_analysis(base_inputs, outcome_metric="month_12_arr")
    assert len(res.drivers) == 6
    # Drivers must be sorted descending by spread
    for i in range(len(res.drivers) - 1):
        assert res.drivers[i].spread >= res.drivers[i + 1].spread
        assert res.drivers[i].elasticity_rank == i + 1

