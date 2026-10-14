/**
 * VentureIQ Client-Side Executive PDF Report Generator.
 * Runs 100% in the browser or on Vercel without requiring external servers.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EngineSimulationResult, ModelEngineInputs, ReversePlanResult } from "@/types/model";
import { formatCurrency, formatPercent, formatMonths } from "./formatters";

export function generateExecutivePdfReport(
  inputs: ModelEngineInputs,
  result: EngineSimulationResult,
  decisionNotes?: string,
  reversePlanResult?: ReversePlanResult | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const curr = inputs.currency;
  const summary = result.summary;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("VentureIQ", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Financial Decision & Unit Economics Simulation Brief", 14, 18);

  // Metadata block
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8);
  doc.text(
    `Company: ${inputs.company_name} | Model: ${inputs.business_model} | Currency: ${curr} | Horizon: ${inputs.planning_horizon} Months`,
    14,
    30
  );

  let startY = 35;

  // Optional: User Decision Statement
  if (decisionNotes) {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, startY, 182, 16, 2, 2, "F");
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Business Decision Evaluated:", 18, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(decisionNotes, 18, startY + 11);
    startY += 22;
  }

  // 1. Executive Summary Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("1. Executive Financial Position", 14, startY);

  const summaryRows = [
    ["Month 12 ARR Run Rate", formatCurrency(summary.final_month_arr, curr), "Annualized Run Rate"],
    ["Month 12 MRR", formatCurrency(summary.final_month_mrr, curr), "Monthly Recurring Revenue"],
    ["Closing Customers", `${Math.round(summary.final_month_customers)}`, "Active Paying Accounts"],
    ["Ending Cash Balance", formatCurrency(summary.ending_cash, curr), `Reserve Buffer: ${formatCurrency(inputs.minimum_cash_reserve, curr)}`],
    ["Peak Cash Deficit", formatCurrency(summary.peak_cash_deficit, curr), "Maximum Capital Consumed"],
    ["Cash Runway Status", summary.runway_status, "Solvency Assessment"],
    ["Average Gross Margin", formatPercent(summary.average_gross_margin_pct), "After COGS / Delivery"],
    ["Average Contribution Margin", formatPercent(summary.average_contribution_margin_pct), "Unit Absorption"],
    ["Blended CAC", formatCurrency(summary.blended_cac_final, curr), `Payback: ${formatMonths(summary.cac_payback_final)}`],
    ["LTV : CAC Ratio", summary.ltv_to_cac_ratio_final ? `${summary.ltv_to_cac_ratio_final.toFixed(1)}x` : "N/A", "Benchmark: > 3.0x is healthy"],
  ];

  autoTable(doc, {
    startY: startY + 3,
    head: [["Milestone Metric", "Projected Outcome", "Benchmark & Health"]],
    body: summaryRows,
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    styles: { cellPadding: 1.8 },
  });

  startY = (doc as any).lastAutoTable.finalY + 8;

  // 2. Reverse Planning Solution (if available)
  if (reversePlanResult) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("2. Reverse Planning Milestone Feasibility", 14, startY);

    const solRows = [
      ["Target Milestone", formatCurrency(reversePlanResult.target_value, curr), reversePlanResult.feasible ? "FEASIBLE" : "INFEASIBLE"],
      ["Achieved Value", formatCurrency(reversePlanResult.achieved_target_value, curr), reversePlanResult.status],
      ["Min Cash Balance", formatCurrency(reversePlanResult.min_cash_balance, curr), `Reserve: ${formatCurrency(inputs.minimum_cash_reserve, curr)}`],
    ];

    Object.entries(reversePlanResult.solution_assumptions).forEach(([k, v]) => {
      const isRate = k.endsWith("_rate");
      solRows.push([
        `Required ${k.replace(/_/g, " ")}`,
        isRate ? formatPercent(v) : formatCurrency(v, curr),
        "Optimized Assumption",
      ]);
    });

    autoTable(doc, {
      startY: startY + 3,
      head: [["Constraint / Decision Variable", "Optimal Value", "Feasibility Status"]],
      body: solRows,
      theme: "grid",
      headStyles: { fillColor: [5, 150, 105], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      styles: { cellPadding: 1.8 },
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 3. Monthly Financial Projections Table
  if (startY > 220) {
    doc.addPage();
    startY = 20;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("3. Monthly Projections (First 12 Months)", 14, startY);

  const tableRows = result.projections.slice(0, 12).map((p) => [
    p.period,
    `${Math.round(p.closing_customers)}`,
    formatCurrency(p.mrr, curr),
    formatCurrency(p.gross_profit, curr),
    formatCurrency(p.total_opex, curr),
    formatCurrency(p.net_burn, curr),
    formatCurrency(p.ending_cash, curr),
  ]);

  autoTable(doc, {
    startY: startY + 3,
    head: [["Period", "Customers", "MRR", "Gross Profit", "Total OpEx", "Net Burn", "Ending Cash"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], fontSize: 7 },
    bodyStyles: { fontSize: 7, halign: "right" },
    columnStyles: { 0: { halign: "left" } },
    styles: { cellPadding: 1.5 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Disclaimer Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Disclaimer: VentureIQ generates deterministic financial simulations based on user assumptions. Outputs do not constitute guaranteed forecasts or investment advice.",
    14,
    finalY > 280 ? 285 : finalY
  );

  doc.save(`VentureIQ_${inputs.company_name.replace(/\s+/g, "_")}_Brief.pdf`);
}

