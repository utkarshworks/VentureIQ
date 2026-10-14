import { describe, it, expect } from "vitest";
import { simulateModelLocally } from "@/lib/engine";
import { DEFAULT_SAAS_MODEL } from "@/lib/defaultModel";

describe("Frontend Financial Simulation Engine", () => {
  it("calculates 12-month projections with exact customer bridge reconciliation", () => {
    const result = simulateModelLocally(DEFAULT_SAAS_MODEL);
    expect(result.projections.length).toBe(12);

    for (const p of result.projections) {
      // Closing = Opening - Churned + New
      const expectedClosing = p.opening_customers - p.churned_customers + p.new_customers;
      expect(Math.abs(p.closing_customers - expectedClosing)).toBeLessThan(0.01);

      // ARR = MRR * 12
      expect(Math.abs(p.arr_run_rate - p.mrr * 12)).toBeLessThan(0.1);

      // Gross profit = MRR - COGS
      expect(Math.abs(p.gross_profit - (p.mrr - p.cogs))).toBeLessThan(0.05);

      // Ending cash = Beg cash + Inflows - Outflows
      const expectedEndCash = p.beginning_cash + p.cash_inflows - p.cash_outflows;
      expect(Math.abs(p.ending_cash - expectedEndCash)).toBeLessThan(0.05);
    }
  });

  it("handles zero customers without throwing or NaN", () => {
    const zeroModel = {
      ...DEFAULT_SAAS_MODEL,
      initial_paying_customers: 0,
      monthly_leads: 0,
      organic_new_customers: 0,
    };
    const result = simulateModelLocally(zeroModel);
    expect(result.summary.final_month_mrr).toBe(0);
    expect(result.summary.final_month_customers).toBe(0);
    expect(result.projections[0].blended_cac).toBeNull();
  });
});
