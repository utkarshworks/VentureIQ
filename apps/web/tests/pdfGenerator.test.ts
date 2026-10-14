import { describe, it, expect, vi } from "vitest";
import { cleanPdfText, formatPdfCurrency, generateExecutivePdfReport } from "@/lib/pdfGenerator";
import { simulateModelLocally } from "@/lib/engine";
import { ModelEngineInputs } from "@/types/model";

describe("Executive PDF Report Generator (2-Page Infographic)", () => {
  it("sanitizes Unicode characters to avoid jsPDF Helvetica font mangling", () => {
    // Rupee symbol
    expect(cleanPdfText("Cash balance: ₹50,000")).toBe("Cash balance: Rs. 50,000");
    // Comparison operators
    expect(cleanPdfText("Target: ≥ 75% margin and ≤ 12M payback")).toBe("Target: >= 75% margin and <= 12M payback");
    // En-dashes and quotes
    expect(cleanPdfText("Phase 1 (Days 1–30): “Action”")).toBe('Phase 1 (Days 1-30): "Action"');
    // Bullet points and emojis
    expect(cleanPdfText("🔴 Critical • Alert")).toBe("Critical | Alert");
  });

  it("formats currencies cleanly in ASCII without Rupee symbol corruptions", () => {
    expect(formatPdfCurrency(948338188, "INR", false)).toBe("Rs. 94,83,38,188");
    expect(formatPdfCurrency(948338188, "INR", true)).toBe("Rs. 94.83 Cr");
    expect(formatPdfCurrency(1500000, "USD", true)).toBe("$1.50M");
    expect(formatPdfCurrency(-81, "INR", false)).toBe("-Rs. 81");
    expect(formatPdfCurrency(0, "INR", false)).toBe("Rs. 0");
    expect(formatPdfCurrency(null, "INR", false)).toBe("Rs. 0");
  });

  it("generates an executive PDF report with strictly two (2) pages", () => {
    const sampleInputs: ModelEngineInputs = {
      company_name: "Mamaearth",
      business_model: "b2c_subscription",
      currency: "INR",
      start_date: "2026-01-01",
      planning_horizon: 12,
      initial_paying_customers: 200000,
      monthly_leads: 50000,
      lead_to_customer_conversion_rate: 0.05,
      arpu: 799,
      cogs_per_unit: 380,
      customer_churn_rate: 0.333,
      expansion_rate: 0.05,
      organic_customers_monthly: 200,
      acquisition_budget: 2000000,
      target_cac: 181,
      initial_cash_balance: 500000000,
      minimum_cash_reserve: 200000000,
      fixed_opex: 500000,
      fixed_marketing_ops: 500000,
      hosting_fixed_cost: 1000000,
      hosting_variable_per_user: 5,
      payment_fee_pct: 0.02,
      hiring_roles: [],
    };

    const simResult = simulateModelLocally(sampleInputs);

    const doc = generateExecutivePdfReport(
      sampleInputs,
      simResult,
      "Extend liquid operating runway beyond 18 months and preserve safety reserve floor.",
      "unit_economics"
    );

    expect(doc).toBeDefined();
    // Verify that the PDF is strictly 2 pages
    expect(doc.getNumberOfPages()).toBe(2);
  });
});

