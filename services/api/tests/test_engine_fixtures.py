"""
Deterministic Fixture Regression Test with Hand-Calculated Expected Numbers.
"""
import pytest
from app.engine.models import (
    ModelEngineInputs,
    AcquisitionMode,
    HiringRoleInput,
)
from app.engine.simulator import simulate_model


def test_hand_calculated_model_fixture():
    """
    Manually verified 3-month model scenario:
    - Initial customers: 100
    - ARPU: ₹2,000 / month
    - Monthly churn: 5%
    - Leads: 1,000/mo, Conversion: 3% (30 new customers/mo)
    - Organic: 0
    - Total new customers: 30
    - Payment processing: 2% of MRR
    - Hosting: fixed ₹10,000 + ₹10/customer
    - Servicing: ₹20/customer
    - Fixed OpEx: ₹50,000
    - Hiring: 1 engineer @ ₹80,000/mo + 15% burden = ₹92,000/mo, starts Month 2
    - Marketing: 1,000 leads * ₹100/lead = ₹100,000/mo + ₹20,000 ops = ₹120,000/mo
    - Initial cash: ₹1,000,000
    """
    role = HiringRoleInput(
        role_title="Founding Engineer",
        headcount=1,
        monthly_salary=80000.0,
        employer_burden_rate=0.15,
        start_month=2,
    )
    inputs = ModelEngineInputs(
        planning_horizon=3,
        initial_paying_customers=100.0,
        initial_cash_balance=1000000.0,
        minimum_cash_reserve=200000.0,
        arpu=2000.0,
        customer_churn_rate=0.05,
        acquisition_mode=AcquisitionMode.LEAD_BASED,
        monthly_leads=1000.0,
        lead_conversion_rate=0.03,
        cost_per_lead=100.0,
        organic_new_customers=0.0,
        fixed_marketing_ops=20000.0,
        payment_processing_rate=0.02,
        hosting_fixed_cost=10000.0,
        hosting_cost_per_customer=10.0,
        servicing_cost_per_customer=20.0,
        fixed_opex=50000.0,
        hiring_roles=[role],
    )

    result = simulate_model(inputs)
    assert len(result.projections) == 3

    # Month 1 Hand Checks:
    # Opening: 100
    # Churned: 100 * 0.05 = 5
    # New: 30
    # Closing: 100 - 5 + 30 = 125
    # Avg active: (100 + 125)/2 = 112.5
    # Base MRR: 112.5 * 2000 = 225,000
    # ARR Run Rate: 225,000 * 12 = 2,700,000
    p1 = result.projections[0]
    assert p1.opening_customers == 100.0
    assert p1.churned_customers == 5.0
    assert p1.new_customers == 30.0
    assert p1.closing_customers == 125.0
    assert p1.avg_active_customers == 112.5
    assert p1.mrr == 225000.0
    assert p1.arr_run_rate == 2700000.0

    # Direct Costs Month 1:
    # Payment proc: 2% of 225,000 = 4,500
    # Hosting: 10,000 + 112.5 * 10 = 11,125
    # Servicing: 112.5 * 20 = 2,250
    # COGS = 4,500 + 11,125 + 2,250 = 17,875
    # Gross Profit = 225,000 - 17,875 = 207,125
    assert p1.cogs == 17875.0
    assert p1.gross_profit == 207125.0

    # OpEx Month 1:
    # Payroll: 0 (engineer starts month 2)
    # Acq spend: 1000 * 100 + 20,000 = 120,000
    # Fixed OpEx: 50,000
    # Total OpEx = 170,000
    # Operating Profit = 207,125 - 170,000 = 37,125
    assert p1.payroll_cost == 0.0
    assert p1.acquisition_spend == 120000.0
    assert p1.total_opex == 170000.0
    assert p1.operating_profit == 37125.0

    # Cash Flow Month 1:
    # Beg cash: 1,000,000
    # Inflows: 225,000
    # Outflows: 17,875 + 170,000 = 187,875
    # Net cash flow: 225,000 - 187,875 = +37,125
    # Ending cash: 1,037,125
    assert p1.beginning_cash == 1000000.0
    assert p1.cash_inflows == 225000.0
    assert p1.cash_outflows == 187875.0
    assert p1.ending_cash == 1037125.0

    # Unit Economics Month 1:
    # CAC: 120,000 / 30 = 4,000
    assert p1.blended_cac == 4000.0

    # Month 2 Hand Checks:
    # Opening: 125
    # Churned: 125 * 0.05 = 6.25
    # New: 30
    # Closing: 125 - 6.25 + 30 = 148.75
    # Avg active: (125 + 148.75) / 2 = 136.875
    # Base MRR: 136.875 * 2000 = 273,750
    p2 = result.projections[1]
    assert p2.opening_customers == 125.0
    assert p2.churned_customers == 6.25
    assert p2.closing_customers == 148.75
    assert p2.mrr == 273750.0

    # Payroll starts in Month 2: ₹92,000
    assert p2.payroll_cost == 92000.0
    assert p2.beginning_cash == 1037125.0

