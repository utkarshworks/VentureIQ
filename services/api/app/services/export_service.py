"""
VentureIQ Export Service
Generates streaming CSV and structured PDF reports.
"""
import io
import csv
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.engine.models import EngineSimulationResult, ModelEngineInputs


def generate_projections_csv(sim_result: EngineSimulationResult) -> str:
    """Generates standard CSV content for monthly projections."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Headers
    writer.writerow([
        "Month Index",
        "Period",
        "Opening Customers",
        "Churned Customers",
        "New Customers",
        "Closing Customers",
        "MRR",
        "ARR Run Rate",
        "COGS",
        "Gross Profit",
        "Gross Margin %",
        "Contribution Margin",
        "Contribution Margin %",
        "Payroll",
        "Acquisition Spend",
        "Fixed OpEx",
        "Total OpEx",
        "Operating Profit",
        "Beginning Cash",
        "Cash Inflows",
        "Cash Outflows",
        "Net Cash Flow",
        "Ending Cash",
        "Net Burn",
        "Blended CAC",
        "CAC Payback (Mo)",
        "Simplified LTV",
        "LTV:CAC",
    ])

    for p in sim_result.projections:
        writer.writerow([
            p.month_index,
            p.period,
            p.opening_customers,
            p.churned_customers,
            p.new_customers,
            p.closing_customers,
            p.mrr,
            p.arr_run_rate,
            p.cogs,
            p.gross_profit,
            f"{p.gross_margin_pct * 100:.2f}%",
            p.contribution_margin,
            f"{p.contribution_margin_pct * 100:.2f}%",
            p.payroll_cost,
            p.acquisition_spend,
            p.fixed_opex,
            p.total_opex,
            p.operating_profit,
            p.beginning_cash,
            p.cash_inflows,
            p.cash_outflows,
            p.net_cash_flow,
            p.ending_cash,
            p.net_burn,
            p.blended_cac if p.blended_cac is not None else "N/A",
            p.cac_payback_months if p.cac_payback_months is not None else "N/A",
            p.simplified_ltv if p.simplified_ltv is not None else "N/A",
            p.ltv_to_cac_ratio if p.ltv_to_cac_ratio is not None else "N/A",
        ])

    return output.getvalue()


def generate_assumptions_csv(inputs: ModelEngineInputs) -> str:
    """Exports key model assumptions to CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Assumption Key", "Value", "Unit / Notes"])
    
    data = [
        ("Company Name", inputs.company_name, "Metadata"),
        ("Business Model", inputs.business_model.value, "Model Type"),
        ("Currency", inputs.currency.value, "Currency Code"),
        ("Planning Horizon", inputs.planning_horizon, "Months"),
        ("Initial Paying Customers", inputs.initial_paying_customers, "Count"),
        ("Initial Cash Balance", inputs.initial_cash_balance, inputs.currency.value),
        ("Minimum Cash Reserve", inputs.minimum_cash_reserve, inputs.currency.value),
        ("ARPU (Price)", inputs.arpu, f"{inputs.currency.value}/customer/mo"),
        ("Monthly Churn Rate", f"{inputs.customer_churn_rate * 100:.2f}%", "% of opening base"),
        ("Acquisition Mode", inputs.acquisition_mode.value, "Acquisition Logic"),
        ("Monthly Leads", inputs.monthly_leads, "Leads/mo"),
        ("Lead Conversion Rate", f"{inputs.lead_conversion_rate * 100:.2f}%", "% to customer"),
        ("Cost per Lead", inputs.cost_per_lead, inputs.currency.value),
        ("Acquisition Budget", inputs.acquisition_budget, inputs.currency.value),
        ("Payment Processing Fee Rate", f"{inputs.payment_processing_rate * 100:.2f}%", "% of MRR"),
        ("Hosting Fixed Cost", inputs.hosting_fixed_cost, inputs.currency.value),
        ("Servicing Cost per Customer", inputs.servicing_cost_per_customer, inputs.currency.value),
        ("Fixed OpEx Overhead", inputs.fixed_opex, f"{inputs.currency.value}/mo"),
    ]
    for row in data:
        writer.writerow(row)

    return output.getvalue()


def generate_pdf_report(
    company_name: str,
    sim_result: EngineSimulationResult,
) -> bytes:
    """Generates an executive financial report PDF."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )
    styles = getSampleStyleSheet()

    elements = []

    # Title & Subtitle
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Title"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0f172a"),
        alignment=0,
    )
    elements.append(Paragraph(f"VentureIQ Financial Plan: {company_name}", title_style))
    elements.append(Spacer(1, 4))
    
    meta_style = ParagraphStyle(
        "ReportMeta",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
    )
    elements.append(
        Paragraph(
            f"Generated on {sim_result.projections[0].period} | Planning Horizon: {sim_result.inputs.planning_horizon} Months | Currency: {sim_result.inputs.currency.value}",
            meta_style,
        )
    )
    elements.append(Spacer(1, 14))

    # Executive Summary Box
    summary = sim_result.summary
    curr = sim_result.inputs.currency.value
    summary_data = [
        ["Key Milestone", "Projected Outcome", "Health / Threshold"],
        ["Final Month ARR Run Rate", f"{curr} {summary.final_month_arr:,.0f}", "Annualized Run Rate"],
        ["Final Month MRR", f"{curr} {summary.final_month_mrr:,.0f}", "Monthly Recurring Revenue"],
        ["Ending Cash Balance", f"{curr} {summary.ending_cash:,.0f}", f"Reserve: {curr} {sim_result.inputs.minimum_cash_reserve:,.0f}"],
        ["Peak Cash Deficit", f"{curr} {summary.peak_cash_deficit:,.0f}", "Max Capital Consumed"],
        ["Runway Status", summary.runway_status, "Cash Breaches / Safety"],
        ["Break-Even Month", f"Month {summary.break_even_month}" if summary.break_even_month else "Beyond Horizon", "Operating Profitability"],
        ["Average Gross Margin", f"{summary.average_gross_margin_pct * 100:.1f}%", "Revenue Retained"],
        ["Average Contribution Margin", f"{summary.average_contribution_margin_pct * 100:.1f}%", "Unit Contribution"],
        ["LTV : CAC Ratio", f"{summary.ltv_to_cac_ratio_final:.1f}x" if summary.ltv_to_cac_ratio_final else "N/A", "Unit Efficiency (> 3x ideal)"],
    ]

    summary_table = Table(summary_data, colWidths=[200, 170, 170])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f8fafc"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 16))

    # Monthly Trajectory Table (First 12 months)
    elements.append(Paragraph("Monthly Financial Trajectory", styles["Heading2"]))
    elements.append(Spacer(1, 6))

    proj_headers = ["Month", "Active Cust", "MRR", "Gross Profit", "Total OpEx", "Net Burn", "Ending Cash"]
    proj_rows = [proj_headers]
    for p in sim_result.projections[:12]:
        proj_rows.append([
            p.period,
            f"{int(round(p.closing_customers))}",
            f"{curr} {p.mrr:,.0f}",
            f"{curr} {p.gross_profit:,.0f}",
            f"{curr} {p.total_opex:,.0f}",
            f"{curr} {p.net_burn:,.0f}",
            f"{curr} {p.ending_cash:,.0f}",
        ])

    traj_table = Table(proj_rows, colWidths=[70, 70, 80, 80, 80, 80, 80])
    traj_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#f1f5f9"), colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
    ]))
    elements.append(traj_table)
    elements.append(Spacer(1, 16))

    # Disclaimer Footer
    disclaimer_text = (
        "<b>Important Disclaimer:</b> The projections contained in this report are scenario-based mathematical calculations "
        "derived deterministically from user-supplied assumptions. They do not constitute guaranteed forecasts or investment advice."
    )
    elements.append(Paragraph(disclaimer_text, meta_style))

    doc.build(elements)
    return buffer.getvalue()
