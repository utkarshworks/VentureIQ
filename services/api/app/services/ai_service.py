"""
VentureIQ AI Explanation Layer
Generates qualitative narrative insights based strictly on deterministic model outputs.
Does not perform financial calculations or generate unverified forecasts.
"""
from typing import Dict, Any, Optional
import json
from app.core.config import settings
from app.engine.models import EngineSimulationResult


def generate_rule_based_explanation(sim_result: EngineSimulationResult) -> str:
    """Deterministic fallback explanation when external LLM is not configured."""
    summary = sim_result.summary
    curr = sim_result.inputs.currency.value
    p12 = sim_result.projections[-1]
    
    parts = []
    parts.append(
        f"**Summary of Trajectory:** Under your current assumptions, {sim_result.inputs.company_name} is projected "
        f"to reach an ARR run rate of {curr} {summary.final_month_arr:,.0f} by Month {sim_result.inputs.planning_horizon}, "
        f"with {summary.final_month_customers:,.0f} active customers."
    )
    
    if summary.ending_cash < sim_result.inputs.minimum_cash_reserve:
        parts.append(
            f"**Cash Solvency Warning:** Your runway is constrained. Cash falls below your minimum reserve threshold "
            f"of {curr} {sim_result.inputs.minimum_cash_reserve:,.0f} in Month {summary.runway_months}. "
            f"You will experience a peak capital deficit of {curr} {summary.peak_cash_deficit:,.0f}."
        )
    else:
        parts.append(
            f"**Cash Position:** Your cash reserves remain healthy throughout the {sim_result.inputs.planning_horizon}-month horizon, "
            f"ending at {curr} {summary.ending_cash:,.0f}."
        )

    if summary.break_even_month:
        parts.append(f"**Profitability:** Operating break-even is achieved in Month {summary.break_even_month}.")
    else:
        parts.append(
            f"**Profitability:** The business remains in an investment/burn phase throughout the horizon, requiring external capital or margin expansion to reach break-even."
        )

    if summary.ltv_to_cac_ratio_final:
        ratio = summary.ltv_to_cac_ratio_final
        if ratio >= 3.0:
            parts.append(f"**Unit Economics:** LTV:CAC stands at {ratio:.1f}x with a payback of {summary.cac_payback_final:.1f} months, indicating strong acquisition efficiency.")
        else:
            parts.append(f"**Unit Economics:** LTV:CAC is {ratio:.1f}x. Increasing pricing, reducing churn, or optimizing cost per lead would improve capital efficiency.")

    return "\n\n".join(parts)


async def explain_model_results(
    sim_result: EngineSimulationResult,
    user_query: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Produces narrative analysis. Calls Gemini API if GEMINI_API_KEY is configured,
    otherwise uses deterministic rule-based analysis.
    """
    fallback_text = generate_rule_based_explanation(sim_result)
    
    if not settings.GEMINI_API_KEY:
        return {
            "source": "deterministic_rule_engine",
            "explanation": fallback_text,
            "disclaimer": "AI explanations strictly interpret deterministic model outputs.",
        }

    try:
        from google import genai
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        context_payload = {
            "company_name": sim_result.inputs.company_name,
            "planning_horizon": sim_result.inputs.planning_horizon,
            "currency": sim_result.inputs.currency.value,
            "final_arr": sim_result.summary.final_month_arr,
            "final_customers": sim_result.summary.final_month_customers,
            "ending_cash": sim_result.summary.ending_cash,
            "peak_deficit": sim_result.summary.peak_cash_deficit,
            "runway_status": sim_result.summary.runway_status,
            "break_even_month": sim_result.summary.break_even_month,
            "ltv_to_cac": sim_result.summary.ltv_to_cac_ratio_final,
            "cac_payback": sim_result.summary.cac_payback_final,
            "warnings": [w.message for w in sim_result.warnings],
        }

        system_instruction = (
            "You are VentureIQ's Financial Explainer. You provide crisp, objective insights for startup founders. "
            "NEVER invent numbers or calculate new financial projections. Always cite the provided model outputs."
        )
        prompt = f"Model Data: {json.dumps(context_payload)}\nUser Question: {user_query or 'Summarize key drivers and risks.'}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"system_instruction": system_instruction},
        )
        return {
            "source": "gemini_api",
            "explanation": response.text,
            "disclaimer": "AI explanations strictly interpret deterministic model outputs.",
        }
    except Exception as e:
        return {
            "source": "deterministic_rule_engine",
            "explanation": fallback_text,
            "disclaimer": f"Fell back to rule engine: {str(e)}",
        }
