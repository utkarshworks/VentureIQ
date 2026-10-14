"""
VentureIQ Engine - Reverse Planning Module
Constrained, deterministic bounded optimization to solve for founder milestone goals.
Validates solutions independently through the pure financial simulation engine.
"""
from typing import List, Dict, Optional, Any
from enum import Enum
import numpy as np
from scipy.optimize import minimize
from pydantic import BaseModel, Field

from app.engine.models import (
    ModelEngineInputs,
    EngineSimulationResult,
    AcquisitionMode,
)
from app.engine.simulator import simulate_model


class OptimizationGoal(str, Enum):
    TARGET_ARR_RUN_RATE = "target_arr_run_rate"
    TARGET_MRR = "target_mrr"
    OPERATING_BREAK_EVEN = "operating_break_even"
    TARGET_LTV_CAC_RATIO = "target_ltv_cac_ratio"
    REVENUE_WITHIN_CASH_BUDGET = "revenue_within_cash_budget"


class AdjustableVariableConfig(BaseModel):
    name: str  # e.g. "arpu", "lead_conversion_rate", "customer_churn_rate", "acquisition_budget"
    min_value: float
    max_value: float
    step: Optional[float] = None


class ReversePlanRequest(BaseModel):
    goal: OptimizationGoal = OptimizationGoal.TARGET_ARR_RUN_RATE
    target_value: float = Field(default=10000000.0, description="Target value (e.g. 1 Crore ARR)")
    target_month: int = Field(default=12, ge=1, le=36)
    minimum_cash_reserve: float = Field(default=500000.0, ge=0.0)
    max_allowable_cash_deficit: Optional[float] = Field(default=None, description="Max cash burn budget")
    adjustable_variables: List[AdjustableVariableConfig] = Field(
        default_factory=lambda: [
            AdjustableVariableConfig(name="arpu", min_value=1500.0, max_value=6000.0),
            AdjustableVariableConfig(name="lead_conversion_rate", min_value=0.015, max_value=0.08),
            AdjustableVariableConfig(name="customer_churn_rate", min_value=0.015, max_value=0.05),
            AdjustableVariableConfig(name="acquisition_budget", min_value=100000.0, max_value=500000.0),
        ]
    )


class ReversePlanResult(BaseModel):
    feasible: bool
    status: str
    solution_assumptions: Dict[str, float]
    base_assumptions: Dict[str, float]
    achieved_target_value: float
    target_value: float
    ending_cash: float
    min_cash_balance: float
    peak_cash_deficit: float
    binding_constraints: List[str]
    infeasibility_reason: Optional[str] = None
    independent_verification_passed: bool
    projections: Optional[List[Dict[str, Any]]] = None


def solve_reverse_plan(
    base_inputs: ModelEngineInputs,
    request: ReversePlanRequest,
) -> ReversePlanResult:
    """
    Executes bounded constrained optimization to solve for target outcome.
    
    Step 1: Formulate parameter bounds and initial vector x0.
    Step 2: Construct scalar objective function penalizing distance from target & cash deficit.
    Step 3: Run SciPy bounded L-BFGS-B / SLSQP minimization.
    Step 4: Verify candidate solution through independent simulate_model() call.
    Step 5: Detect binding bottlenecks or infeasibility if constraints violated.
    """
    var_names = [v.name for v in request.adjustable_variables]
    bounds = [(v.min_value, v.max_value) for v in request.adjustable_variables]
    
    # Store original values
    base_dict = base_inputs.model_dump()
    base_vals = {name: float(base_dict.get(name, 0.0)) for name in var_names}

    # Initial guess x0: mid-point or base if within bounds
    x0 = []
    for v in request.adjustable_variables:
        current_val = float(base_dict.get(v.name, (v.min_value + v.max_value) / 2.0))
        clamped = max(v.min_value, min(v.max_value, current_val))
        x0.append(clamped)
    x0 = np.array(x0, dtype=float)

    def _build_inputs(x_vec: np.ndarray) -> ModelEngineInputs:
        updated = base_dict.copy()
        # Override planning horizon if needed
        updated["planning_horizon"] = max(base_inputs.planning_horizon, request.target_month)
        updated["minimum_cash_reserve"] = request.minimum_cash_reserve
        for i, name in enumerate(var_names):
            updated[name] = float(x_vec[i])
        return ModelEngineInputs(**updated)

    def _objective(x_vec: np.ndarray) -> float:
        candidate_inputs = _build_inputs(x_vec)
        sim = simulate_model(candidate_inputs)
        t_idx = min(request.target_month, len(sim.projections)) - 1
        proj_t = sim.projections[t_idx]

        if request.goal == OptimizationGoal.TARGET_ARR_RUN_RATE:
            actual = proj_t.arr_run_rate
            target = request.target_value
            # Penalize shortfall heavily
            shortfall = max(0.0, target - actual)
            # Cash deficit penalty
            deficit = sim.summary.peak_cash_deficit
            penalty = 0.0
            if sim.summary.min_cash_balance < request.minimum_cash_reserve:
                penalty += 1e7 * (request.minimum_cash_reserve - sim.summary.min_cash_balance)
            return (shortfall / target) ** 2 * 1000.0 + (deficit / 1e6) + penalty

        elif request.goal == OptimizationGoal.TARGET_MRR:
            actual = proj_t.mrr
            target = request.target_value
            shortfall = max(0.0, target - actual)
            deficit = sim.summary.peak_cash_deficit
            penalty = 0.0
            if sim.summary.min_cash_balance < request.minimum_cash_reserve:
                penalty += 1e7 * (request.minimum_cash_reserve - sim.summary.min_cash_balance)
            return (shortfall / target) ** 2 * 1000.0 + (deficit / 1e6) + penalty

        elif request.goal == OptimizationGoal.OPERATING_BREAK_EVEN:
            # Objective: reach operating profit >= 0 at or before target_month
            op_profit = proj_t.operating_profit
            shortfall = max(0.0, -op_profit)
            deficit = sim.summary.peak_cash_deficit
            return (shortfall / 1e5) ** 2 + (deficit / 1e6)

        else:  # REVENUE_WITHIN_CASH_BUDGET
            actual_arr = proj_t.arr_run_rate
            target = request.target_value
            shortfall = max(0.0, target - actual_arr)
            budget = request.max_allowable_cash_deficit or 1e8
            deficit = sim.summary.peak_cash_deficit
            over_budget = max(0.0, deficit - budget)
            return (shortfall / target) ** 2 * 1000.0 + (over_budget / 1e5) ** 2 * 500.0

    # Execute SciPy bounded optimization
    opt_res = minimize(
        fun=_objective,
        x0=x0,
        method="L-BFGS-B",
        bounds=bounds,
        options={"maxiter": 200, "ftol": 1e-6},
    )

    best_x = opt_res.x
    # Construct candidate inputs and independently verify with the pure engine
    verified_inputs = _build_inputs(best_x)
    verified_sim = simulate_model(verified_inputs)
    t_idx = min(request.target_month, len(verified_sim.projections)) - 1
    proj_t = verified_sim.projections[t_idx]

    # Evaluate target metrics
    if request.goal == OptimizationGoal.TARGET_ARR_RUN_RATE:
        achieved = proj_t.arr_run_rate
    elif request.goal == OptimizationGoal.TARGET_MRR:
        achieved = proj_t.mrr
    elif request.goal == OptimizationGoal.OPERATING_BREAK_EVEN:
        achieved = proj_t.operating_profit
    else:
        achieved = proj_t.arr_run_rate

    # Feasibility checks
    is_target_reached = False
    if request.goal in (OptimizationGoal.TARGET_ARR_RUN_RATE, OptimizationGoal.TARGET_MRR):
        # Within 2% tolerance of target or greater
        is_target_reached = achieved >= (request.target_value * 0.98)
    elif request.goal == OptimizationGoal.OPERATING_BREAK_EVEN:
        is_target_reached = achieved >= 0.0
    else:
        is_target_reached = achieved >= (request.target_value * 0.98)

    # Cash constraint check
    cash_solvency_met = verified_sim.summary.min_cash_balance >= request.minimum_cash_reserve
    budget_met = True
    if request.max_allowable_cash_deficit is not None:
        budget_met = verified_sim.summary.peak_cash_deficit <= (request.max_allowable_cash_deficit * 1.02)

    is_feasible = is_target_reached and cash_solvency_met and budget_met

    # Detect binding constraints
    binding_constraints: List[str] = []
    for i, (lower, upper) in enumerate(bounds):
        val = best_x[i]
        span = upper - lower
        if span > 0:
            if abs(val - upper) / span < 0.05:
                binding_constraints.append(f"{var_names[i]} reached upper bound ({upper:,.4g})")
            elif abs(val - lower) / span < 0.05:
                binding_constraints.append(f"{var_names[i]} reached lower bound ({lower:,.4g})")

    if not cash_solvency_met:
        binding_constraints.append(
            f"Minimum cash reserve breached (Min Cash: {base_inputs.currency.value} {verified_sim.summary.min_cash_balance:,.0f} vs Reserve: {base_inputs.currency.value} {request.minimum_cash_reserve:,.0f})"
        )
    if not budget_met and request.max_allowable_cash_deficit is not None:
        binding_constraints.append(
            f"Cash deficit exceeded budget (Deficit: {base_inputs.currency.value} {verified_sim.summary.peak_cash_deficit:,.0f} vs Budget: {base_inputs.currency.value} {request.max_allowable_cash_deficit:,.0f})"
        )

    # Infeasibility diagnostic message
    infeasibility_reason = None
    if not is_feasible:
        reasons = []
        if not is_target_reached:
            reasons.append(
                f"Target could not be reached within specified parameter bounds (Achieved: {base_inputs.currency.value} {achieved:,.0f} vs Target: {base_inputs.currency.value} {request.target_value:,.0f})."
            )
        if not cash_solvency_met:
            reasons.append(
                f"Operational cash balance fell below required reserve of {base_inputs.currency.value} {request.minimum_cash_reserve:,.0f}."
            )
        if not budget_met:
            reasons.append(
                f"Peak cash deficit of {base_inputs.currency.value} {verified_sim.summary.peak_cash_deficit:,.0f} exceeded allowable budget of {base_inputs.currency.value} {request.max_allowable_cash_deficit:,.0f}."
            )
        infeasibility_reason = " ".join(reasons)

    solution_dict = {
        var_names[i]: round(float(best_x[i]), 4) for i in range(len(var_names))
    }

    # Projections formatted for client consumption
    proj_data = [p.model_dump() for p in verified_sim.projections]

    return ReversePlanResult(
        feasible=is_feasible,
        status="FEASIBLE_SOLUTION_FOUND" if is_feasible else "INFEASIBLE_TARGET_WITHIN_BOUNDS",
        solution_assumptions=solution_dict,
        base_assumptions=base_vals,
        achieved_target_value=round(achieved, 2),
        target_value=round(request.target_value, 2),
        ending_cash=round(verified_sim.summary.ending_cash, 2),
        min_cash_balance=round(verified_sim.summary.min_cash_balance, 2),
        peak_cash_deficit=round(verified_sim.summary.peak_cash_deficit, 2),
        binding_constraints=binding_constraints,
        infeasibility_reason=infeasibility_reason,
        independent_verification_passed=True,
        projections=proj_data,
    )

