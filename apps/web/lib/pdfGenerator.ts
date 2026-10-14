/**
 * VentureIQ Client-Side Executive PDF Report Generator.
 * Deterministic 2-Page Institutional Financial Brief & Infographic Risk Audit.
 * Runs 100% in the browser or on Vercel without external server dependencies.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { EngineSimulationResult, ModelEngineInputs, ReversePlanResult } from "@/types/model";
import { formatPercent, formatMonths } from "./formatters";
import { computeHealthAudit, SignalItem } from "./healthAudit";
import { StrategicHelpPriority } from "./advisoryEngine";

const priorityLabels: Record<StrategicHelpPriority, { title: string; subtitle: string }> = {
  runway_preservation: {
    title: "Extend Cash Runway & Capital Preservation",
    subtitle: "Focus: Minimizing net operating cash burn and maintaining minimum reserve cushion.",
  },
  unit_economics: {
    title: "Optimize Unit Economics & LTV:CAC",
    subtitle: "Focus: Accelerating CAC payback velocity and widening gross margins above 75%.",
  },
  scale_acquisition: {
    title: "Scale Customer Acquisition & Pipeline Volume",
    subtitle: "Focus: Accelerating organic and paid pipeline while preserving blended CAC discipline.",
  },
  break_even: {
    title: "Accelerate Operating Cash Flow Break-Even",
    subtitle: "Focus: Scaling gross contribution margin to exceed total monthly payroll and fixed overhead.",
  },
  fundraising: {
    title: "Institutional Series & Diligence Readiness",
    subtitle: "Focus: Achieving venture-scale growth, capital efficiency, and 18-month solvency buffer.",
  },
  custom_goal: {
    title: "Custom Strategic Target Milestone",
    subtitle: "Focus: Custom venture targets modeled in financial simulation engine.",
  },
};

/**
 * Sanitizes any Unicode strings into ASCII-safe representations for Helvetica core font.
 * Replaces Rupee (₹) with "Rs. ", comparisons (≥, ≤) with standard ASCII (>=, <=),
 * strips emojis and en-dashes to avoid superscript "¹", '"e', or corrupted glyphs.
 */
export function cleanPdfText(text: string | null | undefined): string {
  if (!text) return "";
  return String(text)
    .replace(/₹/g, "Rs. ")
    .replace(/€/g, "EUR ")
    .replace(/£/g, "GBP ")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[\u2013\u2014]/g, "-") // en-dash, em-dash
    .replace(/[\u2018\u2019]/g, "'") // single quotes
    .replace(/[\u201C\u201D]/g, '"') // double quotes
    .replace(/[\u2022\u00B7]/g, "|") // bullet, middle dot
    .replace(/…/g, "...")
    .replace(/[^\x00-\x7F]/g, " ") // Any other non-ASCII character safely replaced with space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clean currency formatter that outputs safe ASCII symbols.
 * For INR: "Rs. X,XX,XXX"
 * For USD: "$X,XXX"
 * For EUR: "EUR X,XXX"
 * For GBP: "GBP X,XXX"
 */
export function formatPdfCurrency(
  amount: number | null | undefined,
  currency: string = "USD",
  compact: boolean = false
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === "INR" ? "Rs. 0" : "$0";
  }
  const prefix = currency === "INR" ? "Rs. " : currency === "EUR" ? "EUR " : currency === "GBP" ? "GBP " : "$";
  const absVal = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (compact) {
    if (currency === "INR") {
      if (absVal >= 10000000) {
        return `${sign}${prefix}${(absVal / 10000000).toFixed(2)} Cr`;
      }
      if (absVal >= 100000) {
        return `${sign}${prefix}${(absVal / 100000).toFixed(2)} L`;
      }
    } else {
      if (absVal >= 1000000) {
        return `${sign}${prefix}${(absVal / 1000000).toFixed(2)}M`;
      }
      if (absVal >= 1000) {
        return `${sign}${prefix}${(absVal / 1000).toFixed(1)}K`;
      }
    }
  }

  const formattedNum = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(absVal));

  return `${sign}${prefix}${formattedNum}`;
}

function drawPageHeaderFooter(
  doc: jsPDF,
  pageNumber: number,
  totalPages: number,
  companyName: string
) {
  // Top header bar (210mm wide)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 15, "F");

  // Emerald accent strip
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(0, 15, 210, 1.2, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("VentureIQ", 14, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("Institutional Financial Modeling & Strategic Brief", 37, 10);

  // Right header metadata
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.text(`${cleanPdfText(companyName) || "Venture"} | ${dateStr}`, 196, 10, { align: "right" });

  // Bottom footer (page height = 297mm)
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.3);
  doc.line(14, 285, 196, 285);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("VentureIQ Deterministic Advisory Engine | Confidential & Proprietary", 14, 290);
  doc.text(`Page ${pageNumber} of ${totalPages}`, 196, 290, { align: "right" });
}

export function generateExecutivePdfReport(
  inputs: ModelEngineInputs,
  result: EngineSimulationResult,
  decisionNotes?: string,
  helpPriority: StrategicHelpPriority = "runway_preservation",
  _reversePlanResult?: ReversePlanResult | null
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const curr = inputs.currency || "USD";
  const summary = result.summary;
  const projections = result.projections;
  const audit = computeHealthAudit(inputs, result, helpPriority);
  const totalPages = 2; // STRICTLY 2 PAGES
  const companyName = cleanPdfText(inputs.company_name) || "Mamaearth";

  // ========================================================
  // PAGE 1: EXECUTIVE VENTURE SCORECARD & TRAJECTORY BRIDGE
  // ========================================================
  drawPageHeaderFooter(doc, 1, totalPages, companyName);

  let y = 22;

  // Document Title Block
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.text("EXECUTIVE VENTURE HEALTH & FINANCIAL SIMULATION", 14, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(
    "12-Month Operating Projections, Unit Economics Diagnosis & Solvency Overview",
    14,
    y
  );
  y += 5;

  // 1. Venture Profile Ribbon Card (Height: 14mm, Width: 182mm)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, y, 182, 14, 2, 2, "FD");

  const colW = 45.5; // 182 / 4 = 45.5mm
  const metaY1 = y + 4.8;
  const metaY2 = y + 10.2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("VENTURE NAME", 18, metaY1);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName, 18, metaY2);

  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("BUSINESS MODEL", 18 + colW, metaY1);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(cleanPdfText(inputs.business_model.toUpperCase()), 18 + colW, metaY2);

  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("REPORTING CURRENCY", 18 + colW * 2, metaY1);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(curr === "INR" ? "INR (Rs.)" : curr, 18 + colW * 2, metaY2);

  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text("EVALUATION HORIZON", 18 + colW * 3, metaY1);
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${inputs.planning_horizon} Months`, 18 + colW * 3, metaY2);

  y += 17.5;

  // 2. Section 5 Strategic Objective Callout Banner (Height: 18mm)
  const activePriority = priorityLabels[helpPriority] || priorityLabels.runway_preservation;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(187, 247, 208); // emerald-200
  doc.roundedRect(14, y, 182, 18, 2, 2, "FD");

  // Emerald left accent indicator
  doc.setFillColor(5, 150, 105); // emerald-600
  doc.rect(14, y, 3, 18, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text("STRATEGIC ADVISORY OBJECTIVE (SECTION 5)", 20, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // emerald-900
  doc.text(cleanPdfText(activePriority.title), 20, y + 9.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const decisionText = decisionNotes?.trim()
    ? `Target Goal: "${cleanPdfText(decisionNotes)}" | ${cleanPdfText(activePriority.subtitle)}`
    : cleanPdfText(activePriority.subtitle);
  const wrappedGoal = doc.splitTextToSize(decisionText, 170);
  doc.text(wrappedGoal[0] || "", 20, y + 13.8);
  if (wrappedGoal[1]) {
    doc.text(wrappedGoal[1], 20, y + 16.8);
  }

  y += 22;

  // ==========================================
  // 3. 6 KEY INFOGRAPHIC KPI TILES (2 ROWS X 3 COLS)
  // ==========================================
  const isSolvent = summary.runway_months === null && summary.ending_cash >= inputs.minimum_cash_reserve;
  const tileW = 58;
  const tileH = 21;
  const tileGap = 4;

  const kpis = [
    {
      label: "MONTH 12 ARR RUN RATE",
      value: formatPdfCurrency(summary.final_month_arr, curr),
      subtext: "Annualized Forward Revenue",
      accent: [5, 150, 105], // emerald-600
      badge: "Scale Velocity",
    },
    {
      label: "MONTH 12 MRR",
      value: formatPdfCurrency(summary.final_month_mrr, curr),
      subtext: `Accounts: ${Math.round(summary.final_month_customers)} Active`,
      accent: [37, 99, 235], // blue-600
      badge: "Recurring Flow",
    },
    {
      label: "ENDING LIQUID CASH",
      value: formatPdfCurrency(summary.ending_cash, curr),
      subtext: `Safety Floor: ${formatPdfCurrency(inputs.minimum_cash_reserve, curr)}`,
      accent: [79, 70, 229], // indigo-600
      badge: "Treasury Buffer",
    },
    {
      label: "CASH RUNWAY HEALTH",
      value: cleanPdfText(summary.runway_status),
      subtext: isSolvent
        ? "Fully funded 12+ months"
        : `Deficit: ${formatPdfCurrency(summary.peak_cash_deficit, curr)}`,
      accent: isSolvent ? [5, 150, 105] : [225, 29, 72],
      badge: isSolvent ? "Solvent" : "Watchlist",
    },
    {
      label: "AVERAGE GROSS MARGIN",
      value: formatPercent(summary.average_gross_margin_pct),
      subtext: `Contribution: ${formatPercent(summary.average_contribution_margin_pct)}`,
      accent: [13, 148, 136], // teal-600
      badge: "COGS Absorbed",
    },
    {
      label: "LTV : CAC MULTIPLE",
      value: summary.ltv_to_cac_ratio_final ? `${summary.ltv_to_cac_ratio_final.toFixed(1)}x` : "N/A",
      subtext: `Payback: ${formatMonths(summary.cac_payback_final)}`,
      accent: [147, 51, 234], // purple-600
      badge: `CAC: ${formatPdfCurrency(summary.blended_cac_final, curr)}`,
    },
  ];

  kpis.forEach((kpi, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const tx = 14 + col * (tileW + tileGap);
    const ty = y + row * (tileH + 3.5);

    // Card background & border
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(tx, ty, tileW, tileH, 2, 2, "FD");

    // Top accent strip
    doc.setFillColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.rect(tx, ty, tileW, 1.4, "F");

    // Label on left
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, tx + 4, ty + 5.5);

    // Context badge on right
    doc.setFontSize(5.8);
    doc.setTextColor(kpi.accent[0], kpi.accent[1], kpi.accent[2]);
    doc.text(kpi.badge, tx + tileW - 4, ty + 5.5, { align: "right" });

    // Main Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, tx + 4, ty + 12);

    // Subtext
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.subtext, tx + 4, ty + 17.5);
  });

  y += tileH * 2 + 8.5;

  // ==========================================
  // 4. 12-MONTH OPERATING TRAJECTORY BRIDGE TABLE
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("12-Month Operating Trajectory Bridge (Key Milestone Quarters)", 14, y);
  y += 2.5;

  const milestoneIndices = [0, 2, 5, 8, 11];
  const bridgeRows = milestoneIndices
    .map((idx) => projections[idx])
    .filter(Boolean)
    .map((p) => {
      const netProf = p.gross_profit - p.total_opex;
      const isBufferSafe = p.ending_cash >= inputs.minimum_cash_reserve;
      return [
        p.period,
        `${Math.round(p.closing_customers)}`,
        formatPdfCurrency(p.mrr, curr),
        formatPdfCurrency(p.gross_profit, curr),
        formatPdfCurrency(p.total_opex, curr),
        `${netProf >= 0 ? "+" : ""}${formatPdfCurrency(netProf, curr)}`,
        formatPdfCurrency(p.ending_cash, curr),
        isBufferSafe ? "Safe Reserve" : "Buffer Deficit",
      ];
    });

  const fullYearMrr = projections[projections.length - 1]?.mrr || 0;
  const fullYearGrossProfit = projections.reduce((acc, p) => acc + (p.gross_profit || 0), 0);
  const fullYearTotalOpex = projections.reduce((acc, p) => acc + (p.total_opex || 0), 0);
  const fullYearNet = fullYearGrossProfit - fullYearTotalOpex;
  const fullYearClosingCash = projections[projections.length - 1]?.ending_cash || 0;

  bridgeRows.push([
    "FY Total / M12",
    `${Math.round(summary.final_month_customers)}`,
    formatPdfCurrency(fullYearMrr, curr),
    formatPdfCurrency(fullYearGrossProfit, curr),
    formatPdfCurrency(fullYearTotalOpex, curr),
    `${fullYearNet >= 0 ? "+" : ""}${formatPdfCurrency(fullYearNet, curr)}`,
    formatPdfCurrency(fullYearClosingCash, curr),
    isSolvent ? "Solvent" : "Watchlist",
  ]);

  autoTable(doc, {
    startY: y + 1,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [["Period", "Customers", "MRR", "Gross Profit", "Total OpEx", "Net Cash Flow", "Ending Cash", "Buffer Status"]],
    body: bridgeRows,
    theme: "striped",
    headStyles: { fillColor: [15, 23, 42], fontSize: 6.8, fontStyle: "bold", halign: "right" },
    bodyStyles: { fontSize: 6.5, halign: "right" },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", cellWidth: 22 },
      1: { halign: "right", cellWidth: 18 },
      2: { halign: "right", cellWidth: 25 },
      3: { halign: "right", cellWidth: 25 },
      4: { halign: "right", cellWidth: 24 },
      5: { halign: "right", fontStyle: "bold", cellWidth: 24 },
      6: { halign: "right", fontStyle: "bold", cellWidth: 25 },
      7: { halign: "center", cellWidth: 19 },
    },
    styles: { cellPadding: 1.4 },
  });

  y = (doc as any).lastAutoTable.finalY + 5.5;

  // ==========================================
  // 5. EXECUTIVE SOLVENCY & CAPITAL VELOCITY BOX
  // ==========================================
  const narrativeH = 26;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, 182, narrativeH, 2, 2, "FD");

  // Left indicator strip
  doc.setFillColor(isSolvent ? 5 : 225, isSolvent ? 150 : 29, isSolvent ? 105 : 72);
  doc.rect(14, y, 3, narrativeH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Executive Solvency, Runway & Capital Velocity Assessment", 20, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);

  const narrative = isSolvent
    ? `The venture maintains balance sheet stability across the 12-month horizon. With initial liquid capital of ${formatPdfCurrency(
        inputs.initial_cash_balance,
        curr
      )}, projected month 12 closing cash of ${formatPdfCurrency(
        summary.ending_cash,
        curr
      )} remains comfortably above the mandatory safety floor of ${formatPdfCurrency(
        inputs.minimum_cash_reserve,
        curr
      )}. Gross margins of ${formatPercent(
        summary.average_gross_margin_pct
      )} absorb operational overhead, sustaining positive operational runway without emergency bridge capital.`
    : `The venture faces balance sheet liquidity pressure within the operating horizon. Projected cash falls below the mandatory safety reserve of ${formatPdfCurrency(
        inputs.minimum_cash_reserve,
        curr
      )} ${summary.runway_months ? `in Month ${summary.runway_months}` : "under current burn velocity"}. Peak capital consumed reaches ${formatPdfCurrency(
        summary.peak_cash_deficit,
        curr
      )}. Immediate capital preservation measures are required: trim discretionary customer acquisition or secure bridge financing.`;

  const wrappedNarrative = doc.splitTextToSize(narrative, 172);
  doc.text(wrappedNarrative, 20, y + 10);

  y += narrativeH + 6;

  // ==========================================
  // 6. UNIT ECONOMICS & PAYBACK SCHEDULE CARDS
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Unit Economics & Customer Cash Payback Dynamics", 14, y);
  y += 3.5;

  // Fill mathematically down to Y = 277mm so Page 1 is balanced with zero bottom gap
  const cardW = 89;
  const cardH = 277 - y;
  const cardHeaderH = 6.5;

  // Left Card: Unit Economics Snapshot
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, cardW, cardH, 2, 2, "FD");

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, y, cardW, cardHeaderH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  doc.text("UNIT ECONOMICS BREAKDOWN", 18, y + 4.5);

  const churnPct = inputs.customer_churn_rate > 1 ? inputs.customer_churn_rate / 100 : inputs.customer_churn_rate;

  const uEconItems = [
    ["Average Revenue Per User (ARPU)", formatPdfCurrency(inputs.arpu, curr)],
    ["Average Gross Margin %", formatPercent(summary.average_gross_margin_pct)],
    ["Blended Acquisition CAC", formatPdfCurrency(summary.blended_cac_final, curr)],
    ["CAC Payback Velocity", formatMonths(summary.cac_payback_final)],
    ["Monthly Customer Churn Rate", formatPercent(churnPct)],
    ["Customer Lifetime Value (LTV)", formatPdfCurrency(summary.simplified_ltv_final, curr)],
    ["LTV : CAC Multiple", summary.ltv_to_cac_ratio_final ? `${summary.ltv_to_cac_ratio_final.toFixed(1)}x` : "N/A"],
  ];

  const usableCardH = cardH - cardHeaderH - 4;
  const rowStep = usableCardH / 7;

  uEconItems.forEach(([lbl, val], idx) => {
    const itemY = y + cardHeaderH + 5.5 + idx * rowStep;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, 18, itemY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(val, 14 + cardW - 5, itemY, { align: "right" });

    // Subtle divider line
    if (idx < uEconItems.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(18, itemY + 2.5, 14 + cardW - 5, itemY + 2.5);
    }
  });

  // Right Card: Cohort Cumulative Net Cash Flow Schedule
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(107, y, cardW, cardH, 2, 2, "FD");

  doc.setFillColor(5, 150, 105); // emerald-600
  doc.roundedRect(107, y, cardW, cardHeaderH, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(255, 255, 255);
  doc.text("COHORT NET CASH ACCUMULATION", 111, y + 4.5);

  const cacVal = summary.blended_cac_final || 0;
  const monthlyGmPerAccount = inputs.arpu * (summary.average_gross_margin_pct || 0.75);
  const m0Cash = -cacVal;
  const m3Cash = Math.round(m0Cash + monthlyGmPerAccount * 3);
  const m6Cash = Math.round(m0Cash + monthlyGmPerAccount * 6);
  const m12Cash = Math.round(m0Cash + monthlyGmPerAccount * 12);
  const m24Cash = Math.round(m0Cash + monthlyGmPerAccount * 24);

  const cohortItems = [
    ["Month 0 Outlay (-CAC)", formatPdfCurrency(m0Cash, curr)],
    ["Month 3 Accumulation", formatPdfCurrency(m3Cash, curr)],
    ["Month 6 Accumulation", formatPdfCurrency(m6Cash, curr)],
    ["Month 12 (Year 1) Net", formatPdfCurrency(m12Cash, curr)],
    ["Month 24 (Year 2) Net", formatPdfCurrency(m24Cash, curr)],
    ["Payback Break-Even Horizon", formatMonths(summary.cac_payback_final)],
    ["Capital Reinvestment", summary.cac_payback_final && summary.cac_payback_final < 12 ? "Fast Recycling" : "Capital Intensive"],
  ];

  cohortItems.forEach(([lbl, val], idx) => {
    const itemY = y + cardHeaderH + 5.5 + idx * rowStep;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(lbl, 111, itemY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(val, 107 + cardW - 5, itemY, { align: "right" });

    // Subtle divider line
    if (idx < cohortItems.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(111, itemY + 2.5, 107 + cardW - 5, itemY + 2.5);
    }
  });

  // ========================================================
  // PAGE 2: STRATEGIC HEALTH RADAR AUDIT & ACTION ROADMAP
  // ========================================================
  doc.addPage();
  drawPageHeaderFooter(doc, 2, totalPages, companyName);

  y = 22;

  // Title Block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13.5);
  doc.setTextColor(15, 23, 42);
  doc.text("STRATEGIC HEALTH RADAR AUDIT & ACTION ROADMAP", 14, y);
  y += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Multi-Dimensional Risk Matrix, Early Warning Indicators & Recommended Execution Plan",
    14,
    y
  );
  y += 5.5;

  // ==========================================
  // AUDIT DIAGNOSIS & HEALTH SCORECARD BANNER
  // ==========================================
  const redCount = audit.badSignals.length;
  const orangeCount = audit.warningSignals.length;
  const greenCount = audit.goodSignals.length;

  if (redCount > 0) {
    doc.setFillColor(255, 241, 242); // rose-50
    doc.setDrawColor(254, 205, 211); // rose-200
  } else if (orangeCount > 0) {
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(253, 230, 138); // amber-200
  } else {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(187, 247, 208); // emerald-200
  }
  doc.roundedRect(14, y, 182, 14, 2, 2, "FD");

  // Left Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(
    redCount > 0 ? 190 : orangeCount > 0 ? 180 : 5,
    redCount > 0 ? 18 : orangeCount > 0 ? 83 : 150,
    redCount > 0 ? 60 : orangeCount > 0 ? 9 : 105
  );
  doc.text(`AUDIT DIAGNOSIS: ${cleanPdfText(audit.overallGrade.label)}`, 18, y + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(cleanPdfText(audit.overallGrade.sub), 18, y + 10);

  // Right Side: 3 Badge Pills with precision alignment (flush to X = 193)
  // Red pill
  doc.setFillColor(255, 228, 230); // rose-100
  doc.roundedRect(114, y + 3.5, 24, 7, 1.5, 1.5, "F");
  doc.setFillColor(225, 29, 72);
  doc.circle(118, y + 7, 1.3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(190, 18, 60);
  doc.text(`${redCount} Red`, 121, y + 7.8);

  // Orange pill
  doc.setFillColor(254, 243, 199); // amber-100
  doc.roundedRect(141.5, y + 3.5, 25.5, 7, 1.5, 1.5, "F");
  doc.setFillColor(217, 119, 6);
  doc.circle(145.5, y + 7, 1.3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(180, 83, 9);
  doc.text(`${orangeCount} Orange`, 148.5, y + 7.8);

  // Green pill
  doc.setFillColor(209, 250, 229); // emerald-100
  doc.roundedRect(170.5, y + 3.5, 22.5, 7, 1.5, 1.5, "F");
  doc.setFillColor(5, 150, 105);
  doc.circle(174.5, y + 7, 1.3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(6, 95, 70);
  doc.text(`${greenCount} Green`, 177.5, y + 7.8);

  y += 17.5;

  // ==========================================
  // INFOGRAPHIC RISK & OPPORTUNITY CARDS
  // ==========================================

  // Dynamic Card Drawer with auto-sized badge & consistent category spacing
  const drawSignalCard = (
    signal: SignalItem,
    type: "red" | "orange" | "green",
    cardY: number
  ): number => {
    const cardH = 17.5;

    let fill = [255, 241, 242];
    let stroke = [254, 205, 211];
    let barColor = [225, 29, 72];
    let catColor = [190, 18, 60];
    let badgeFill = [255, 228, 230];
    let prefix = "CFO Mandate: ";

    if (type === "orange") {
      fill = [254, 243, 199];
      stroke = [253, 230, 138];
      barColor = [217, 119, 6];
      catColor = [180, 83, 9];
      badgeFill = [254, 235, 179];
      prefix = "Watchlist Advisory: ";
    } else if (type === "green") {
      fill = [240, 253, 244];
      stroke = [187, 247, 208];
      barColor = [5, 150, 105];
      catColor = [6, 95, 70];
      badgeFill = [209, 250, 229];
      prefix = "Competitive Edge: ";
    }

    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.roundedRect(14, cardY, 182, cardH, 1.5, 1.5, "FD");

    // Left accent bar
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.rect(14, cardY, 3, cardH, "F");

    // Indicator dot
    doc.circle(20, cardY + 5.2, 1.4, "F");

    // Dynamic Category Tag
    const catText = `[${cleanPdfText(signal.category).toUpperCase()}]`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(catColor[0], catColor[1], catColor[2]);
    doc.text(catText, 24, cardY + 5.8);
    const catW = doc.getTextWidth(catText);

    // Title placed right after category with consistent 3mm gap
    const titleX = 24 + catW + 3;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(cleanPdfText(signal.title), titleX, cardY + 5.8);

    // Dynamic Metric Value Badge on right (expands cleanly to fit text)
    const metricText = cleanPdfText(signal.metricValue);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    const metricW = doc.getTextWidth(metricText);
    const badgeW = Math.max(24, metricW + 8);
    const badgeX = 196 - badgeW - 3;
    const badgeY = cardY + 2.8;

    doc.setFillColor(badgeFill[0], badgeFill[1], badgeFill[2]);
    doc.roundedRect(badgeX, badgeY, badgeW, 5.2, 1, 1, "F");
    doc.setTextColor(catColor[0], catColor[1], catColor[2]);
    doc.text(metricText, badgeX + badgeW / 2, badgeY + 3.8, { align: "center" });

    // Recommendation / Mandate
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    const mandateText = `${prefix}${cleanPdfText(type === "green" ? signal.summary || signal.recommendation : signal.recommendation)}`;
    const wrappedMandate = doc.splitTextToSize(mandateText, 172);
    doc.text(wrappedMandate[0] || "", 20, cardY + 11.2);
    if (wrappedMandate[1]) {
      doc.text(wrappedMandate[1], 20, cardY + 14.8);
    }

    return cardH;
  };

  // 1. 🔴 RED FLAGS (CRITICAL RISKS)
  if (audit.badSignals.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`CRITICAL RISKS (RED FLAGS) - ${audit.badSignals.length} DETECTED`, 14, y);
    y += 3.2;

    audit.badSignals.slice(0, 3).forEach((signal) => {
      const h = drawSignalCard(signal, "red", y);
      y += h + 2.5;
    });
  }

  // 2. 🟠 ORANGE FLAGS (WATCHLIST AREAS)
  if (audit.warningSignals.length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`WATCHLIST AREAS (ORANGE FLAGS) - ${audit.warningSignals.length} MONITORED`, 14, y);
    y += 3.2;

    audit.warningSignals.slice(0, 2).forEach((signal) => {
      const h = drawSignalCard(signal, "orange", y);
      y += h + 2.5;
    });
  } else {
    // Sleek single-line status if zero orange flags
    const bannerH = 9;
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(14, y, 182, bannerH, 1.5, 1.5, "FD");
    doc.setFillColor(217, 119, 6);
    doc.rect(14, y, 3, bannerH, "F");
    doc.circle(20, y + 4.5, 1.3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(180, 83, 9);
    doc.text("WATCHLIST (ORANGE FLAGS): No critical operational yellow flags detected. Secondary metrics tracking within viable limits.", 24, y + 5.5);
    y += bannerH + 3.5;
  }

  // 3. 🟢 GREEN FLAGS (VENTURE STRENGTHS)
  // Determine available height so Signal Cards seamlessly hand off to Section B (around Y = 186mm)
  const remainingForGreen = 186 - y;
  // Calculate how many green cards fit comfortably (each taking ~20mm)
  const numGreenToDisplay = Math.max(2, Math.min(audit.goodSignals.length, Math.round((remainingForGreen - 4) / 20)));

  if (audit.goodSignals.length > 0 && numGreenToDisplay > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`VENTURE STRENGTHS (GREEN FLAGS) - ${audit.goodSignals.length} CONFIRMED`, 14, y);
    y += 3.2;

    audit.goodSignals.slice(0, numGreenToDisplay).forEach((signal) => {
      const h = drawSignalCard(signal, "green", y);
      y += h + 2.5;
    });
  }

  // ==========================================
  // NEXT STRATEGIC RECOMMENDATIONS & CFO ROADMAP
  // ==========================================
  // Smooth natural transition with standard section margin (no artificial jump)
  y = Math.max(y + 4.5, 188);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text("NEXT STRATEGIC RECOMMENDATIONS & CFO ACTION ROADMAP", 14, y);
  y += 3.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Prioritized 4-Phase Execution Blueprint for Management & Board Governance", 14, y);
  y += 4.5;

  const phases = [
    {
      pill: "PHASE 1 (DAYS 1-30)",
      title: "Cash & Solvency Floor Protection",
      directive: `Audit all non-essential SaaS & variable vendor outlays. Lock minimum liquidity reserve floor at ${formatPdfCurrency(
        inputs.minimum_cash_reserve,
        curr
      )}. Ensure net monthly burn does not breach runway parameters.`,
    },
    {
      pill: "PHASE 2 (DAYS 30-60)",
      title: "Unit Economics & Payback Acceleration",
      directive: `Compress CAC payback below 12 months. Introduce annual upfront discounted plans (15% discount) to collect working capital upfront and eliminate collection risk.`,
    },
    {
      pill: "PHASE 3 (DAYS 60-90)",
      title: "Pipeline & Conversion Scalability",
      directive: `Optimize conversion funnel. Allocate customer acquisition budget exclusively into channels delivering verified LTV:CAC multiples above 3.0x.`,
    },
    {
      pill: "PHASE 4 (DAYS 90-120)",
      title: "Milestone Governance & Capital Planning",
      directive: `Review dynamic operating actuals against 12-month model baseline in VentureIQ. Recalibrate hiring timeline and runway before making irrevocable commitments.`,
    },
  ];

  // Distribute 4 phase cards evenly down to Y = 275 mm
  const totalPhaseSpace = 275 - y;
  const phaseCardH = Math.min(18.5, (totalPhaseSpace - 3 * 2.5) / 4);
  const phaseGap = 2.5;

  phases.forEach((phase) => {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, y, 182, phaseCardH, 1.5, 1.5, "FD");

    // Phase Pill
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(18, y + 2.8, 38, 5.2, 1, 1, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    doc.setTextColor(255, 255, 255);
    doc.text(phase.pill, 37, y + 6.4, { align: "center" });

    // Phase Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(phase.title, 60, y + 6.4);

    // Phase Directive
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const wrappedDirective = doc.splitTextToSize(phase.directive, 172);
    doc.text(wrappedDirective[0] || "", 18, y + 11.2);
    if (wrappedDirective[1]) {
      doc.text(wrappedDirective[1], 18, y + 14.8);
    }

    y += phaseCardH + phaseGap;
  });

  // Subtle Certification Notice
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.2);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    "Institutional Venture Audit | Certified by VentureIQ Deterministic Engine | Strictly Confidential",
    105,
    280,
    { align: "center" }
  );

  // Save the PDF
  const safeName = companyName.replace(/[^a-zA-Z0-9]/g, "_");
  doc.save(`VentureIQ_Executive_Report_${safeName}.pdf`);
  return doc;
}
