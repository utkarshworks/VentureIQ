import { describe, it, expect, beforeEach } from "vitest";
import {
  getAiRateLimitStatus,
  incrementAiUsage,
  DAILY_LIMIT,
  STORAGE_KEY,
  QUOTA_EXCEEDED_MESSAGE,
} from "../lib/rateLimit";
import { DEFAULT_SAAS_MODEL } from "../lib/defaultModel";
import { solveReversePlanLocally } from "../lib/engine";

describe("AI Client Rate Limiting Engine", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with 5 daily free queries and non-exceeded quota", () => {
    const status = getAiRateLimitStatus();
    expect(status.count).toBe(0);
    expect(status.remaining).toBe(DAILY_LIMIT);
    expect(status.limit).toBe(5);
    expect(status.isQuotaExceeded).toBe(false);
  });

  it("increments usage and decreases remaining queries", () => {
    const s1 = incrementAiUsage();
    expect(s1.count).toBe(1);
    expect(s1.remaining).toBe(4);
    expect(s1.isQuotaExceeded).toBe(false);

    incrementAiUsage();
    incrementAiUsage();
    incrementAiUsage();
    const s5 = incrementAiUsage();
    expect(s5.count).toBe(5);
    expect(s5.remaining).toBe(0);
    expect(s5.isQuotaExceeded).toBe(true);

    // Verify localStorage persistence
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(raw.count).toBe(5);
  });

  it("matches exact required quota exceeded warning string", () => {
    expect(QUOTA_EXCEEDED_MESSAGE).toBe(
      "You've used your 5 daily demo AI questions. Deterministic calculations and PDF generation remain unlimited!"
    );
  });
});

describe("Client-Side Deterministic Reverse Planning Solver", () => {
  it("successfully solves target ARR within operational bounds", () => {
    const planResult = solveReversePlanLocally(DEFAULT_SAAS_MODEL, {
      goal: "target_arr_run_rate",
      target_value: 10000000, // ₹1 Crore ARR
      target_month: 12,
      minimum_cash_reserve: 500000,
      max_allowable_cash_deficit: 3000000,
      adjustable_variables: [
        { name: "arpu", min_value: 2000, max_value: 6000 },
        { name: "customer_churn_rate", min_value: 0.01, max_value: 0.04 },
        { name: "acquisition_budget", min_value: 100000, max_value: 500000 },
      ],
    });

    expect(planResult).toBeDefined();
    expect(planResult.independent_verification_passed).toBe(true);
    expect(planResult.achieved_target_value).toBeGreaterThan(0);
    expect(planResult.solution_assumptions).toHaveProperty("arpu");
    expect(planResult.solution_assumptions.arpu).toBeGreaterThanOrEqual(2000);
    expect(planResult.solution_assumptions.arpu).toBeLessThanOrEqual(6000);
  });
});
