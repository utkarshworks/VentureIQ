"""
Unit & Reconciliation Tests for Pure Financial Engine Formulas.
"""
import pytest
from app.engine.models import (
    ModelEngineInputs,
    AcquisitionMode,
    HiringRoleInput,
    FinancingEventInput,
)
from app.engine.simulator import simulate_model
from app.engine.unit_economics import calculate_unit_economics, calculate_cohort_ltv
from app.engine.customer_bridge import calculate_customer_movement
from app.engine.revenue import calculate_monthly_revenue
from app.engine.cogs import calculate_cogs_and_margins
from app.engine.opex import calculate_opex_and_payroll


def test_customer_movement_bridge_reconciliation():
    """Verify closing = opening - churned + new."""
    inputs = ModelEngineInputs(
        initial_paying_customers=100.0,
        customer_churn_rate=0.05,
        acquisition_mode=AcquisitionMode.LEAD_BASED,
        monthly_leads=500.0,
        lead_conversion_rate=0.04,  # 20 new customers
        organic_new_customers=5.0,  # 25 total new
    )
    churned, new_cust, closing, avg_active = calculate_customer_movement(
        opening_customers=100.0,
        inputs=inputs,
        month_index=1,
    )
    assert churned == 5.0  # 100 * 0.05
    assert new_cust == 25.0  # (500 * 0.04) + 5
    assert closing == 100.0 - 5.0 + 25.0  # 120
    assert avg_active == (100.0 + 120.0) / 2.0  # 110


def test_revenue_expansion_contraction():
    """Verify Net MRR and ARR run rate calculations."""
    inputs = ModelEngineInputs(
        arpu=2000.0,
        expansion_rate=0.02,
        contraction_rate=0.005,
    )
    # 100 avg active, 100 opening
    base_mrr, exp_mrr, cont_mrr, mrr, arr = calculate_monthly_revenue(
        opening_customers=100.0,
        avg_active_customers=100.0,
        inputs=inputs,
    )
    assert base_mrr == 200000.0
    assert exp_mrr == 4000.0  # 100 * 2000 * 0.02
    assert cont_mrr == 1000.0  # 100 * 2000 * 0.005
    assert mrr == 203000.0
    assert arr == 203000.0 * 12.0


def test_cogs_gross_profit_and_margins():
    """Verify COGS identities and margins."""
    inputs = ModelEngineInputs(
        payment_processing_rate=0.02,
        hosting_fixed_cost=10000.0,
        hosting_cost_per_customer=10.0,
        servicing_cost_per_customer=40.0,
    )
    mrr = 200000.0
    avg_active = 100.0
    (
        proc_cost,
        host_cost,
        serv_cost,
        cogs,
        gross_profit,
        gm_pct,
        contrib_margin,
        cm_pct,
    ) = calculate_cogs_and_margins(mrr, avg_active, inputs)

    assert proc_cost == 4000.0  # 2% of 200,000
    assert host_cost == 10000.0 + (100.0 * 10.0)  # 11,000
    assert serv_cost == 100.0 * 40.0  # 4,000
    assert cogs == 4000.0 + 11000.0 + 4000.0  # 19,000
    assert gross_profit == 200000.0 - 19000.0  # 181,000
    assert gm_pct == pytest.approx(181000.0 / 200000.0)
    assert contrib_margin == 200000.0 - (4000.0 + 1000.0 + 4000.0)  # 191,000


def test_payroll_with_burden_and_annual_increment():
    """Verify payroll scaling with employer burden and annual appraisal."""
    role = HiringRoleInput(
        role_title="Senior Developer",
        headcount=2,
        monthly_salary=100000.0,
        employer_burden_rate=0.10,  # 10%
        start_month=1,
        annual_increase_rate=0.10,  # 10% after 12 months
    )
    inputs = ModelEngineInputs(
        hiring_roles=[role],
        acquisition_mode=AcquisitionMode.BUDGET_BASED,
        acquisition_budget=50000.0,
        fixed_marketing_ops=10000.0,
        fixed_opex=40000.0,
    )

    # Month 1 (Year 1)
    payroll_m1, acq_spend_m1, fixed_m1, total_m1, _ = calculate_opex_and_payroll(1, 0.0, inputs)
    # 2 * 100000 * 1.10 = 220,000
    assert payroll_m1 == pytest.approx(220000.0)
    assert acq_spend_m1 == pytest.approx(60000.0)
    assert total_m1 == pytest.approx(220000.0 + 60000.0 + 40000.0)  # 320,000

    # Month 13 (Year 2 with 10% appraisal)
    payroll_m13, _, _, total_m13, _ = calculate_opex_and_payroll(13, 0.0, inputs)
    # 2 * (100000 * 1.10) * 1.10 = 242,000
    assert payroll_m13 == pytest.approx(242000.0)


def test_cash_flow_reconciliation_multi_period():
    """Verify balance sheet cash rollover and invariants across all months."""
    financing = FinancingEventInput(month=6, amount=2000000.0, name="Seed Investment")
    inputs = ModelEngineInputs(
        planning_horizon=12,
        initial_cash_balance=1000000.0,
        minimum_cash_reserve=200000.0,
        initial_paying_customers=50.0,
        arpu=3000.0,
        financing_events=[financing],
    )
    result = simulate_model(inputs)

    assert len(result.projections) == 12

    for i, p in enumerate(result.projections):
        # 1. Customer bridge invariant
        expected_closing = p.opening_customers - p.churned_customers + p.new_customers
        assert p.closing_customers == pytest.approx(expected_closing, abs=1e-3)

        # 2. Revenue invariant
        assert p.arr_run_rate == pytest.approx(p.mrr * 12.0, abs=1e-2)

        # 3. Gross profit invariant
        assert p.gross_profit == pytest.approx(p.mrr - p.cogs, abs=1e-2)

        # 4. Cash flow identity: ending = beginning + inflows - outflows
        assert p.ending_cash == pytest.approx(p.beginning_cash + p.net_cash_flow, abs=1e-2)
        assert p.net_cash_flow == pytest.approx(p.cash_inflows - p.cash_outflows, abs=1e-2)

        # 5. Rollover invariant for month t+1
        if i < 11:
            next_p = result.projections[i + 1]
            assert next_p.beginning_cash == pytest.approx(p.ending_cash, abs=1e-2)
            assert next_p.opening_customers == pytest.approx(p.closing_customers, abs=1e-3)

    # Verify financing injection occurred in month 6
    p6 = result.projections[5]
    assert p6.cash_inflows >= 2000000.0
