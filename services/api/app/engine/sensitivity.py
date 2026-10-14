"""
VentureIQ Engine - Sensitivity Analysis Module
Provides 1-variable sweeps, 2-variable matrix tables, and Tornado chart elasticity rankings.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.engine.models import ModelEngineInputs
from app.engine.simulator import simulate_model


class OneVarSensitivityPoint(BaseModel):
    percent_delta: float  # e.g. -0.20 for -20%
    input_value: float
    month_12_arr: float
    month_12_mrr: float
    ending_cash: float
    peak_cash_deficit: float
    runway_status: str
    ltv_to_cac_ratio: Optional[float] = None


class OneVarSensitivityResult(BaseModel):
    variable_name: str
    base_value: float
    outcome_metric: str
    data_points: List[OneVarSensitivityPoint]


class TwoVarSensitivityResult(BaseModel):
    var_x_name: str
    var_x_values: List[float]
    var_y_name: str
    var_y_values: List[float]
    metric_name: str
    # 2D grid: matrix[y_idx][x_idx]
    matrix: List[List[float]]


class TornadoDriverItem(BaseModel):
    driver_name: str
    display_name: str
    base_value: float
    low_input_value: float
    high_input_value: float
    low_outcome: float
    high_outcome: float
    spread: float  # abs(high_outcome - low_outcome)
    elasticity_rank: int


class TornadoSensitivityResult(BaseModel):
    outcome_metric: str
    base_outcome: float
    drivers: List[TornadoDriverItem]


def run_one_var_sensitivity(
    base_inputs: ModelEngineInputs,
    variable_name: str,
    percent_steps: Optional[List[float]] = None,
) -> OneVarSensitivityResult:
    """
    Sweeps a single variable while holding all other inputs strictly constant.
    """
    if percent_steps is None:
        percent_steps = [-0.30, -0.20, -0.10, 0.0, 0.10, 0.20, 0.30]

    base_dict = base_inputs.model_dump()
    base_val = float(base_dict.get(variable_name, 0.0))

    points: List[OneVarSensitivityPoint] = []

    for delta in percent_steps:
        # Compute perturbed value
        if variable_name.endswith("_rate"):
            # Percent rates: clamp to [0.0, 1.0]
            val = max(0.0, min(1.0, base_val * (1.0 + delta)))
        else:
            val = max(0.0, base_val * (1.0 + delta))

        inputs_copy = base_dict.copy()
        inputs_copy[variable_name] = val
        sim_res = simulate_model(ModelEngineInputs(**inputs_copy))

        m12 = sim_res.projections[-1]
        points.append(
            OneVarSensitivityPoint(
                percent_delta=delta,
                input_value=round(val, 4),
                month_12_arr=m12.arr_run_rate,
                month_12_mrr=m12.mrr,
                ending_cash=m12.ending_cash,
                peak_cash_deficit=sim_res.summary.peak_cash_deficit,
                runway_status=sim_res.summary.runway_status,
                ltv_to_cac_ratio=m12.ltv_to_cac_ratio,
            )
        )

    return OneVarSensitivityResult(
        variable_name=variable_name,
        base_value=base_val,
        outcome_metric="arr_run_rate",
        data_points=points,
    )


def run_two_var_sensitivity(
    base_inputs: ModelEngineInputs,
    var_x: str,
    var_y: str,
    metric_name: str = "month_12_arr",
    num_steps: int = 5,
) -> TwoVarSensitivityResult:
    """
    Generates a 2D matrix comparing cross-elasticity of two business drivers.
    """
    base_dict = base_inputs.model_dump()
    base_x = float(base_dict.get(var_x, 1.0))
    base_y = float(base_dict.get(var_y, 1.0))

    # Multipliers e.g. 0.8, 0.9, 1.0, 1.1, 1.2
    multipliers = [1.0 + (i - num_steps // 2) * 0.10 for i in range(num_steps)]

    x_vals = []
    for m in multipliers:
        v = base_x * m
        if var_x.endswith("_rate"):
            v = max(0.0, min(1.0, v))
        else:
            v = max(0.0, v)
        x_vals.append(round(v, 4))

    y_vals = []
    for m in multipliers:
        v = base_y * m
        if var_y.endswith("_rate"):
            v = max(0.0, min(1.0, v))
        else:
            v = max(0.0, v)
        y_vals.append(round(v, 4))

    grid: List[List[float]] = []
    for vy in y_vals:
        row: List[float] = []
        for vx in x_vals:
            inputs_copy = base_dict.copy()
            inputs_copy[var_x] = vx
            inputs_copy[var_y] = vy
            sim = simulate_model(ModelEngineInputs(**inputs_copy))
            if metric_name == "ending_cash":
                out_val = sim.summary.ending_cash
            elif metric_name == "peak_cash_deficit":
                out_val = sim.summary.peak_cash_deficit
            else:  # default month_12_arr
                out_val = sim.summary.final_month_arr
            row.append(round(out_val, 2))
        grid.append(row)

    return TwoVarSensitivityResult(
        var_x_name=var_x,
        var_x_values=x_vals,
        var_y_name=var_y,
        var_y_values=y_vals,
        metric_name=metric_name,
        matrix=grid,
    )


def run_tornado_analysis(
    base_inputs: ModelEngineInputs,
    outcome_metric: str = "month_12_arr",
    perturbation_pct: float = 0.20,
) -> TornadoSensitivityResult:
    """
    Ranks drivers by their impact on an outcome metric using symmetric perturbations.
    Generates data for Tornado charts.
    """
    drivers = [
        ("arpu", "Monthly Price (ARPU)"),
        ("customer_churn_rate", "Customer Churn Rate"),
        ("lead_conversion_rate", "Lead Conversion Rate"),
        ("monthly_leads", "Lead Generation Volume"),
        ("cost_per_lead", "Cost Per Lead"),
        ("fixed_opex", "Fixed Operating Expenses"),
    ]

    base_sim = simulate_model(base_inputs)
    if outcome_metric == "ending_cash":
        base_out = base_sim.summary.ending_cash
    else:
        base_out = base_sim.summary.final_month_arr

    base_dict = base_inputs.model_dump()
    items: List[TornadoDriverItem] = []

    for key, display in drivers:
        base_val = float(base_dict.get(key, 0.0))
        # Low (-20%)
        low_val = base_val * (1.0 - perturbation_pct)
        # High (+20%)
        high_val = base_val * (1.0 + perturbation_pct)

        if key.endswith("_rate"):
            low_val = max(0.0, min(1.0, low_val))
            high_val = max(0.0, min(1.0, high_val))
        else:
            low_val = max(0.0, low_val)
            high_val = max(0.0, high_val)

        # Low simulation
        d_low = base_dict.copy()
        d_low[key] = low_val
        sim_low = simulate_model(ModelEngineInputs(**d_low))
        out_low = (
            sim_low.summary.ending_cash
            if outcome_metric == "ending_cash"
            else sim_low.summary.final_month_arr
        )

        # High simulation
        d_high = base_dict.copy()
        d_high[key] = high_val
        sim_high = simulate_model(ModelEngineInputs(**d_high))
        out_high = (
            sim_high.summary.ending_cash
            if outcome_metric == "ending_cash"
            else sim_high.summary.final_month_arr
        )

        spread = abs(out_high - out_low)
        items.append(
            TornadoDriverItem(
                driver_name=key,
                display_name=display,
                base_value=round(base_val, 4),
                low_input_value=round(low_val, 4),
                high_input_value=round(high_val, 4),
                low_outcome=round(out_low, 2),
                high_outcome=round(out_high, 2),
                spread=round(spread, 2),
                elasticity_rank=0,
            )
        )

    # Sort descending by spread (highest impact first)
    items.sort(key=lambda x: x.spread, reverse=True)
    for rank, it in enumerate(items, 1):
        it.elasticity_rank = rank

    return TornadoSensitivityResult(
        outcome_metric=outcome_metric,
        base_outcome=round(base_out, 2),
        drivers=items,
    )

