"""
VentureIQ Engine - Multi-Scenario Planning Module
Evaluates Base, Optimistic, Downside, and Custom Scenarios using a shared financial engine.
"""
from typing import Dict, List, Any, Optional
from enum import Enum
from pydantic import BaseModel, Field

from app.engine.models import ModelEngineInputs, EngineSimulationResult
from app.engine.simulator import simulate_model


class ScenarioType(str, Enum):
    BASE = "base"
    OPTIMISTIC = "optimistic"
    DOWNSIDE = "downside"
    CUSTOM = "custom"


class ScenarioConfig(BaseModel):
    id: str
    name: str
    scenario_type: ScenarioType
    description: Optional[str] = None
    overrides: Dict[str, Any] = Field(default_factory=dict)


class ScenarioMetricSummary(BaseModel):
    scenario_id: str
    scenario_name: str
    scenario_type: ScenarioType
    month_12_mrr: float
    month_12_arr: float
    month_12_customers: float
    ending_cash: float
    peak_cash_deficit: float
    runway_status: str
    break_even_month: Optional[int] = None
    gross_margin_pct: float
    contribution_margin_pct: float
    blended_cac: Optional[float] = None
    simplified_ltv: Optional[float] = None
    ltv_to_cac_ratio: Optional[float] = None
    cac_payback_months: Optional[float] = None


class ScenarioComparisonResult(BaseModel):
    scenarios: List[ScenarioMetricSummary]
    differing_assumptions: Dict[str, Dict[str, Any]]
    monthly_trajectories: Dict[str, List[Dict[str, Any]]]


def get_default_optimistic_overrides(base_inputs: ModelEngineInputs) -> Dict[str, Any]:
    """Generates standard optimistic adjustments."""
    return {
        "lead_conversion_rate": round(min(1.0, base_inputs.lead_conversion_rate * 1.25), 4),
        "customer_churn_rate": round(max(0.005, base_inputs.customer_churn_rate * 0.80), 4),
        "arpu": round(base_inputs.arpu * 1.10, 2),
        "cost_per_lead": round(base_inputs.cost_per_lead * 0.85, 2),
    }


def get_default_downside_overrides(base_inputs: ModelEngineInputs) -> Dict[str, Any]:
    """Generates standard downside adjustments."""
    return {
        "lead_conversion_rate": round(max(0.005, base_inputs.lead_conversion_rate * 0.75), 4),
        "customer_churn_rate": round(min(0.50, base_inputs.customer_churn_rate * 1.30), 4),
        "arpu": round(base_inputs.arpu * 0.90, 2),
        "cost_per_lead": round(base_inputs.cost_per_lead * 1.25, 2),
    }


def evaluate_scenario(
    base_inputs: ModelEngineInputs,
    overrides: Dict[str, Any],
) -> EngineSimulationResult:
    """Applies overrides to base inputs and executes pure simulate_model()."""
    base_dict = base_inputs.model_dump()
    for key, val in overrides.items():
        if key in base_dict and val is not None:
            base_dict[key] = val
    scenario_inputs = ModelEngineInputs(**base_dict)
    return simulate_model(scenario_inputs)


def compare_scenarios(
    base_inputs: ModelEngineInputs,
    scenarios: List[ScenarioConfig],
) -> ScenarioComparisonResult:
    """
    Executes and reconciles multiple scenarios through the single unified financial engine.
    """
    summaries: List[ScenarioMetricSummary] = []
    differing_assumptions: Dict[str, Dict[str, Any]] = {}
    monthly_trajectories: Dict[str, List[Dict[str, Any]]] = {}

    base_dict = base_inputs.model_dump()

    for sc in scenarios:
        sim = evaluate_scenario(base_inputs, sc.overrides)
        last_p = sim.projections[-1]

        summary = ScenarioMetricSummary(
            scenario_id=sc.id,
            scenario_name=sc.name,
            scenario_type=sc.scenario_type,
            month_12_mrr=last_p.mrr,
            month_12_arr=last_p.arr_run_rate,
            month_12_customers=last_p.closing_customers,
            ending_cash=last_p.ending_cash,
            peak_cash_deficit=sim.summary.peak_cash_deficit,
            runway_status=sim.summary.runway_status,
            break_even_month=sim.summary.break_even_month,
            gross_margin_pct=sim.summary.average_gross_margin_pct,
            contribution_margin_pct=sim.summary.average_contribution_margin_pct,
            blended_cac=last_p.blended_cac,
            simplified_ltv=last_p.simplified_ltv,
            ltv_to_cac_ratio=last_p.ltv_to_cac_ratio,
            cac_payback_months=last_p.cac_payback_months,
        )
        summaries.append(summary)

        # Record monthly projections for charts
        monthly_trajectories[sc.id] = [
            {
                "month_index": p.month_index,
                "period": p.period,
                "mrr": p.mrr,
                "arr_run_rate": p.arr_run_rate,
                "closing_customers": p.closing_customers,
                "ending_cash": p.ending_cash,
                "net_burn": p.net_burn,
            }
            for p in sim.projections
        ]

        # Record differing assumptions
        diff_for_sc: Dict[str, Any] = {}
        for k, v in sc.overrides.items():
            if k in base_dict and base_dict[k] != v:
                diff_for_sc[k] = {"scenario_value": v, "base_value": base_dict[k]}
        differing_assumptions[sc.id] = diff_for_sc

    return ScenarioComparisonResult(
        scenarios=summaries,
        differing_assumptions=differing_assumptions,
        monthly_trajectories=monthly_trajectories,
    )

