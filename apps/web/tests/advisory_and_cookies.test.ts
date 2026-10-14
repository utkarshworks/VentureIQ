import { describe, it, expect } from "vitest";
import { generateAdvisoryAnalysis } from "../lib/advisoryEngine";
import { DEFAULT_SAAS_MODEL } from "../lib/defaultModel";
import { simulateModelLocally } from "../lib/engine";

describe("Strategic Advisory Engine - Deep Query Extraction & Exact Answering", () => {
  it("accurately extracts target ARR in Crores and calculates exact customer requirements", () => {
    const inputs = { ...DEFAULT_SAAS_MODEL, arpu: 5000 };
    const simulation = simulateModelLocally(inputs);

    // Query asking for ₹1 Crore ARR
    const query = "What customer count do we need to reach ₹1 Crore ARR?";
    const advisory = generateAdvisoryAnalysis(inputs, simulation.summary, query, "custom_goal");

    expect(advisory.directAnswer).toBeDefined();
    expect(advisory.directAnswer?.headline).toContain("Achieving ₹1.00 Cr ARR Run Rate");
    
    // Find the parameters
    const targetArrParam = advisory.directAnswer?.extractedParameters?.find(p => p.label === "Target ARR");
    expect(targetArrParam?.value).toBe("₹1.00 Cr");
    
    // Annual revenue per customer = arpu (5000) * 12 = 60,000
    // Target MRR = 10,000,000 / 12 = 833,333.33
    // Required accounts = ceil(833,333.33 / 5000) = 167 accounts
    const reqAccountsParam = advisory.directAnswer?.extractedParameters?.find(p => p.label === "Required Paying Accounts");
    expect(reqAccountsParam?.value).toBe("167 accounts");
    expect(advisory.directAnswer?.headline).toContain("Target Milestone Plan");
    expect(advisory.directAnswer?.details).toContain("To hit ₹1.00 Cr ARR");
  });

  it("accurately extracts hiring headcount and monthly salary, and calculates burdened payroll impact", () => {
    const inputs = { ...DEFAULT_SAAS_MODEL, starting_cash: 5000000 };
    const simulation = simulateModelLocally(inputs);

    const query = "Can we afford to hire 2 engineers at 2.5 Lakhs per month?";
    const advisory = generateAdvisoryAnalysis(inputs, simulation.summary, query, "runway_preservation");

    expect(advisory.directAnswer).toBeDefined();
    const headcountParam = advisory.directAnswer?.extractedParameters?.find(p => p.label === "Headcount Expansion");
    expect(headcountParam?.value).toContain("2 new hire(s)");

    const payrollParam = advisory.directAnswer?.extractedParameters?.find(p => p.label === "Fully-Burdened Monthly Payroll");
    // 2 * 250,000 * 1.15 = 575,000 = ₹5,75,000
    expect(payrollParam?.value).toContain("5,75,000");
  });

  it("accurately computes operating break-even MRR and active accounts needed", () => {
    const inputs = { ...DEFAULT_SAAS_MODEL };
    const simulation = simulateModelLocally(inputs);

    const query = "When do we hit operating break-even and what MRR is needed?";
    const advisory = generateAdvisoryAnalysis(inputs, simulation.summary, query, "break_even");

    expect(advisory.directAnswer).toBeDefined();
    expect(advisory.directAnswer?.headline).toContain("Operating Break-Even");
    const breakEvenParam = advisory.directAnswer?.extractedParameters?.find(p => p.label === "Break-Even MRR");
    expect(breakEvenParam).toBeDefined();
  });

  it("verifies dynamic model reflection: when inputs change, advisory calculations change accordingly", () => {
    const inputsA = { ...DEFAULT_SAAS_MODEL, arpu: 10000 };
    const simulationA = simulateModelLocally(inputsA);

    const inputsB = { ...DEFAULT_SAAS_MODEL, arpu: 20000 };
    const simulationB = simulateModelLocally(inputsB);

    const query = "What do we need to reach ₹50 Lakh ARR?";
    const advisoryA = generateAdvisoryAnalysis(inputsA, simulationA.summary, query, "scale_acquisition");
    const advisoryB = generateAdvisoryAnalysis(inputsB, simulationB.summary, query, "scale_acquisition");

    // Target MRR = 5,000,000 / 12 = 416,666.67
    // At ARPU ₹10,000: ceil(416,666.67 / 10,000) = 42 accounts
    // At ARPU ₹20,000: ceil(416,666.67 / 20,000) = 21 accounts
    const reqA = advisoryA.directAnswer?.extractedParameters?.find(p => p.label === "Required Paying Accounts")?.value;
    const reqB = advisoryB.directAnswer?.extractedParameters?.find(p => p.label === "Required Paying Accounts")?.value;

    expect(reqA).toBe("42 accounts");
    expect(reqB).toBe("21 accounts");
    expect(reqA).not.toEqual(reqB);
  });
});
