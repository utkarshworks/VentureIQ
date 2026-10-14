"""
VentureIQ Pure Financial Engine - Main Simulator Orchestrator
Executes deterministic monthly financial simulations across the planning horizon.
"""
from typing import List, Optional
from datetime import datetime
from app.engine.models import (
    ModelEngineInputs,
    MonthlyProjection,
    EngineSummary,
    EngineSimulationResult,
    ModelWarning,
    WarningSeverity,
)
from app.engine.customer_bridge import calculate_customer_movement
from app.engine.revenue import calculate_monthly_revenue
from app.engine.cogs import calculate_cogs_and_margins
from app.engine.opex import calculate_opex_and_payroll
from app.engine.unit_economics import calculate_unit_economics, calculate_cohort_ltv
from app.engine.cash_flow import calculate_monthly_cash_flow


def _format_period(start_date_str: str, month_offset: int) -> str:
    """Calculates YYYY-MM period from start_date_str with 0-indexed month offset."""
    try:
        parts = start_date_str.split("-")
        year = int(parts[0])
        month = int(parts[1])
        total_months = month - 1 + month_offset
        new_year = year + (total_months // 12)
        new_month = (total_months % 12) + 1
        return f"{new_year:04d}-{new_month:02d}"
    except Exception:
        return f"Month {month_offset + 1}"


def simulate_model(inputs: ModelEngineInputs) -> EngineSimulationResult:
    """
    Executes a complete, deterministic financial simulation.
    Pure function: No database or network I/O.
    """
    projections: List[MonthlyProjection] = []
    warnings: List[ModelWarning] = []

    # State tracking across months
    current_customers = float(inputs.initial_paying_customers)
    current_cash = float(inputs.initial_cash_balance)

    min_cash_balance = current_cash
    peak_cash_deficit = 0.0
    first_reserve_breach_month: Optional[int] = None
    first_cash_negative_month: Optional[int] = None
    break_even_month: Optional[int] = None

    gm_percentages: List[float] = []
    cm_percentages: List[float] = []

    for m in range(1, inputs.planning_horizon + 1):
        period_str = _format_period(inputs.start_date, m - 1)
        opening_customers = current_customers
        beginning_cash = current_cash

        # 1. Customer Bridge
        churned, new_cust, closing_cust, avg_active = calculate_customer_movement(
            opening_customers=opening_customers,
            inputs=inputs,
            month_index=m,
        )

        # 2. Revenue Engine
        base_mrr, exp_mrr, cont_mrr, mrr, arr_run_rate = calculate_monthly_revenue(
            opening_customers=opening_customers,
            avg_active_customers=avg_active,
            inputs=inputs,
        )

        # 3. Direct Costs & Margins
        (
            proc_cost,
            host_cost,
            serv_cost,
            cogs,
            gross_profit,
            gm_pct,
            contrib_margin,
            cm_pct,
        ) = calculate_cogs_and_margins(
            mrr=mrr,
            avg_active_customers=avg_active,
            inputs=inputs,
        )
        gm_percentages.append(gm_pct)
        cm_percentages.append(cm_pct)

        # 4. OpEx & Headcount
        payroll_cost, acq_spend, fixed_opex, total_opex, operating_profit = (
            calculate_opex_and_payroll(
                month_index=m,
                gross_profit=gross_profit,
                inputs=inputs,
            )
        )

        # Track break-even timing (operating profit >= 0)
        if operating_profit >= 0.0 and break_even_month is None:
            break_even_month = m

        # 5. Cash Flow & Solvency
        (
            cash_inflows,
            cash_outflows,
            net_cash_flow,
            ending_cash,
            net_burn,
            reserve_breached,
            cash_negative,
        ) = calculate_monthly_cash_flow(
            beginning_cash=beginning_cash,
            month_index=m,
            mrr=mrr,
            cogs=cogs,
            total_opex=total_opex,
            inputs=inputs,
        )

        # Track cash balance records
        if ending_cash < min_cash_balance:
            min_cash_balance = ending_cash
        deficit = max(0.0, inputs.initial_cash_balance - ending_cash)
        if deficit > peak_cash_deficit:
            peak_cash_deficit = deficit

        if reserve_breached and first_reserve_breach_month is None:
            first_reserve_breach_month = m
        if cash_negative and first_cash_negative_month is None:
            first_cash_negative_month = m

        # 6. Unit Economics
        (
            blended_cac,
            cac_payback,
            simplified_ltv,
            ltv_to_cac,
            break_even_rev,
        ) = calculate_unit_economics(
            acquisition_spend=acq_spend,
            new_customers=new_cust,
            gross_margin_pct=gm_pct,
            contribution_margin_pct=cm_pct,
            total_opex=total_opex,
            inputs=inputs,
        )

        # Monthly Projection Snapshot
        rounded_mrr = round(mrr, 2)
        rounded_arr = round(rounded_mrr * 12.0, 2)
        rounded_cogs = round(cogs, 2)
        rounded_gross_profit = round(rounded_mrr - rounded_cogs, 2)
        rounded_total_opex = round(total_opex, 2)
        rounded_operating_profit = round(rounded_gross_profit - rounded_total_opex, 2)
        
        rounded_beg_cash = round(beginning_cash, 2)
        rounded_inflows = round(cash_inflows, 2)
        rounded_outflows = round(rounded_cogs + rounded_total_opex, 2)
        rounded_net_cash_flow = round(rounded_inflows - rounded_outflows, 2)
        rounded_ending_cash = round(rounded_beg_cash + rounded_net_cash_flow, 2)
        rounded_net_burn = max(0.0, -rounded_net_cash_flow)

        proj = MonthlyProjection(
            month_index=m,
            period=period_str,
            opening_customers=round(opening_customers, 4),
            churned_customers=round(churned, 4),
            new_customers=round(new_cust, 4),
            closing_customers=round(closing_cust, 4),
            avg_active_customers=round(avg_active, 4),
            base_mrr=round(base_mrr, 2),
            expansion_mrr=round(exp_mrr, 2),
            contraction_mrr=round(cont_mrr, 2),
            mrr=rounded_mrr,
            arr_run_rate=rounded_arr,
            payment_processing_cost=round(proc_cost, 2),
            hosting_cost=round(host_cost, 2),
            servicing_cost=round(serv_cost, 2),
            cogs=rounded_cogs,
            gross_profit=rounded_gross_profit,
            gross_margin_pct=round(gm_pct, 4),
            contribution_margin=round(contrib_margin, 2),
            contribution_margin_pct=round(cm_pct, 4),
            payroll_cost=round(payroll_cost, 2),
            acquisition_spend=round(acq_spend, 2),
            fixed_opex=round(fixed_opex, 2),
            total_opex=rounded_total_opex,
            operating_profit=rounded_operating_profit,
            beginning_cash=rounded_beg_cash,
            cash_inflows=rounded_inflows,
            cash_outflows=rounded_outflows,
            net_cash_flow=rounded_net_cash_flow,
            ending_cash=rounded_ending_cash,
            net_burn=round(rounded_net_burn, 2),
            blended_cac=round(blended_cac, 2) if blended_cac is not None else None,
            cac_payback_months=round(cac_payback, 2) if cac_payback is not None else None,
            simplified_ltv=round(simplified_ltv, 2) if simplified_ltv is not None else None,
            ltv_to_cac_ratio=round(ltv_to_cac, 2) if ltv_to_cac is not None else None,
            break_even_revenue=round(break_even_rev, 2) if break_even_rev is not None else None,
            is_cash_reserve_breached=rounded_ending_cash < inputs.minimum_cash_reserve,
            is_cash_negative=rounded_ending_cash < 0.0,
        )
        projections.append(proj)

        # Roll over state
        current_customers = closing_cust
        current_cash = rounded_ending_cash

    # Final Summary Statistics
    final_p = projections[-1]
    avg_gm = sum(gm_percentages) / len(gm_percentages) if gm_percentages else 0.0
    avg_cm = sum(cm_percentages) / len(cm_percentages) if cm_percentages else 0.0

    cohort_ltv = calculate_cohort_ltv(
        arpu=inputs.arpu,
        gross_margin_pct=avg_gm,
        monthly_churn_rate=inputs.customer_churn_rate,
        horizon_months=36,
    )

    if first_reserve_breach_month is not None:
        runway_months = first_reserve_breach_month
        runway_status = f"Reserve breached in Month {first_reserve_breach_month}"
    else:
        runway_months = None
        runway_status = f"Healthy (> {inputs.planning_horizon} months)"

    summary = EngineSummary(
        final_month_mrr=final_p.mrr,
        final_month_arr=final_p.arr_run_rate,
        final_month_customers=final_p.closing_customers,
        peak_cash_deficit=round(peak_cash_deficit, 2),
        min_cash_balance=round(min_cash_balance, 2),
        ending_cash=final_p.ending_cash,
        runway_months=runway_months,
        runway_status=runway_status,
        break_even_month=break_even_month,
        average_gross_margin_pct=round(avg_gm, 4),
        average_contribution_margin_pct=round(avg_cm, 4),
        blended_cac_final=final_p.blended_cac,
        simplified_ltv_final=final_p.simplified_ltv,
        ltv_to_cac_ratio_final=final_p.ltv_to_cac_ratio,
        cac_payback_final=final_p.cac_payback_months,
        cohort_ltv_36m=round(cohort_ltv, 2),
    )

    # Rule-Based Warnings Generation
    if first_cash_negative_month is not None:
        warnings.append(
            ModelWarning(
                code="INSOLVENCY_RISK",
                message=f"Cash balance goes negative in Month {first_cash_negative_month}.",
                month=first_cash_negative_month,
                severity=WarningSeverity.CRITICAL,
            )
        )
    elif first_reserve_breach_month is not None:
        warnings.append(
            ModelWarning(
                code="RESERVE_BREACH",
                message=f"Cash falls below the required minimum reserve of {inputs.currency.value} {inputs.minimum_cash_reserve:,.0f} in Month {first_reserve_breach_month}.",
                month=first_reserve_breach_month,
                severity=WarningSeverity.WARNING,
            )
        )

    if avg_cm <= 0.0:
        warnings.append(
            ModelWarning(
                code="NEGATIVE_UNIT_ECONOMICS",
                message="Average contribution margin is non-positive. Direct variable delivery costs exceed revenue per unit.",
                severity=WarningSeverity.CRITICAL,
            )
        )

    if inputs.customer_churn_rate > 0.10:
        warnings.append(
            ModelWarning(
                code="HIGH_CHURN",
                message=f"Monthly churn rate is {inputs.customer_churn_rate * 100:.1f}%, which represents severe customer attrition (> 10%/mo).",
                severity=WarningSeverity.WARNING,
            )
        )

    if final_p.cac_payback_months and final_p.cac_payback_months > inputs.planning_horizon:
        warnings.append(
            ModelWarning(
                code="LONG_PAYBACK",
                message=f"CAC payback period ({final_p.cac_payback_months:.1f} months) exceeds the {inputs.planning_horizon}-month planning horizon.",
                severity=WarningSeverity.INFO,
            )
        )

    return EngineSimulationResult(
        inputs=inputs,
        projections=projections,
        summary=summary,
        warnings=warnings,
    )
