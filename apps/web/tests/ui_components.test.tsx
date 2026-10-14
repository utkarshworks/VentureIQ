import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "@/components/MetricCard";
import { WarningsBanner } from "@/components/WarningsBanner";
import { ModelWarning } from "@/types/model";

describe("UI Components", () => {
  it("renders MetricCard with title, value, subtitle and badge", () => {
    render(
      <MetricCard
        title="ARR Run Rate"
        value="₹1.20 Cr"
        subtitle="Annualized run rate"
        statusBadge="Healthy"
        statusType="good"
      />
    );

    expect(screen.getByText("ARR Run Rate")).toBeDefined();
    expect(screen.getByText("₹1.20 Cr")).toBeDefined();
    expect(screen.getByText("Annualized run rate")).toBeDefined();
    expect(screen.getByText("Healthy")).toBeDefined();
  });

  it("renders WarningsBanner with rule-based warnings", () => {
    const warnings: ModelWarning[] = [
      {
        code: "RESERVE_BREACH",
        message: "Cash falls below minimum reserve in Month 7",
        severity: "warning",
      },
      {
        code: "NEGATIVE_UNIT_ECONOMICS",
        message: "Variable costs exceed unit revenue",
        severity: "critical",
      },
    ];

    render(<WarningsBanner warnings={warnings} />);

    expect(screen.getByText("SAFETY RESERVE BREACH")).toBeDefined();
    expect(screen.getByText("Cash falls below minimum reserve in Month 7")).toBeDefined();
    expect(screen.getByText("MARGIN LEAKAGE")).toBeDefined();
    expect(screen.getAllByText(/CFO Action Plan:/i).length).toBeGreaterThan(0);
  });

  it("returns null when warnings array is empty", () => {
    const { container } = render(<WarningsBanner warnings={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders CompanyAssessmentWizard with questions and step 1 headers", async () => {
    const { CompanyAssessmentWizard } = await import("@/features/CompanyAssessmentWizard");
    const { DEFAULT_SAAS_MODEL } = await import("@/lib/defaultModel");

    render(
      <CompanyAssessmentWizard
        initialInputs={DEFAULT_SAAS_MODEL}
        initialDecisionGoal="Reach ₹1 Crore ARR run rate within 12 months"
        onComplete={() => {}}
      />
    );

    expect(screen.getByText("Step 1: Company Identity, Type of Business & Funding Stage")).toBeDefined();
    expect(screen.getByText("Company / Startup Name")).toBeDefined();
    expect(screen.getByText("Type of Business / Industry")).toBeDefined();
    expect(screen.getByText("Funding Structure")).toBeDefined();
    expect(screen.getByText("Operating Currency")).toBeDefined();
    // Simulation Horizon was removed as requested
    expect(screen.queryByText("Simulation Horizon")).toBeNull();
    // Business Types in requested order: SaaS, IT & Tech Services, Mobile App, Consumer Product, D2C, Other
    expect(screen.getByText("SaaS")).toBeDefined();
    expect(screen.getByText("IT & Tech Services")).toBeDefined();
    expect(screen.getByText("Mobile App")).toBeDefined();
    expect(screen.getByText("Consumer Product")).toBeDefined();
    expect(screen.getAllByText("D2C").length).toBe(2);
    expect(screen.getByText("Other")).toBeDefined();
    // AI & DeepTech removed
    expect(screen.queryByText("AI & DeepTech")).toBeNull();
    expect(screen.getByText("Continue to Step 02")).toBeDefined();
  });

  it("navigates through the 5-step wizard, verifies CAC in Step 3, Decision Focus in Step 5, and completes", async () => {
    const { CompanyAssessmentWizard } = await import("@/features/CompanyAssessmentWizard");
    const { DEFAULT_SAAS_MODEL } = await import("@/lib/defaultModel");
    const { fireEvent } = await import("@testing-library/react");

    let completed = false;
    let submittedInputs: any = null;
    let submittedPriority: any = null;

    render(
      <CompanyAssessmentWizard
        initialInputs={DEFAULT_SAAS_MODEL}
        initialDecisionGoal="Reach ₹1 Crore ARR run rate"
        onComplete={(inputs, goal, priority) => {
          completed = true;
          submittedInputs = inputs;
          submittedPriority = priority;
        }}
      />
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText("Continue to Step 02"));
    expect(screen.getByText("Step 2: Baseline Revenue, Customers & Cash Position")).toBeDefined();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText("Continue to Step 03"));
    expect(screen.getByText("Step 3: Growth Engine, CAC & Churn Dynamics")).toBeDefined();
    // Verify Current Blended CAC, Target CAC, and 4-field retention grid in Step 3
    expect(screen.getByText("Current Blended CAC (INR)")).toBeDefined();
    expect(screen.getByText("Target CAC (INR)")).toBeDefined();
    expect(screen.getByText("Monthly Customer Churn Rate")).toBeDefined();
    expect(screen.getByText("Avg Customer Lifetime (Months)")).toBeDefined();
    expect(screen.getByText("Organic Customers / Mo")).toBeDefined();
    expect(screen.getByText("Monthly Expansion Rate")).toBeDefined();
    // Switched tabs removed as instructed
    expect(screen.queryByText("Monthly Churn %")).toBeNull();
    expect(screen.queryByText("Annual Churn %")).toBeNull();

    // Step 3 -> Step 4
    fireEvent.click(screen.getByText("Continue to Step 04"));
    expect(screen.getByText("Step 4: Cost of Goods Sold (COGS) & Operating Expenses")).toBeDefined();

    // Step 4 -> Step 5
    fireEvent.click(screen.getByText("Continue to Step 05"));
    expect(screen.getByText("What strategic problem do you need help solving?")).toBeDefined();
    expect(screen.getByText("Extend Cash Runway & Capital Preservation")).toBeDefined();
    expect(screen.getByText("Optimize Unit Economics & LTV:CAC")).toBeDefined();
    expect(screen.getByText("Scale Acquisition & Top-Line ARR Growth")).toBeDefined();
    expect(screen.getByText("Achieve Operating Cash Break-Even")).toBeDefined();

    // Choose Unit Economics
    fireEvent.click(screen.getByText("Optimize Unit Economics & LTV:CAC"));

    // Verify Step 5 has the final submit button
    const submitBtn = screen.getByText("Build Financial Engine & Open Dashboard");
    expect(submitBtn).toBeDefined();

    // Click submit -> should submit cleanly with zeroed/configured inputs and selected priority
    fireEvent.click(submitBtn);
    expect(completed).toBe(true);
    expect(submittedInputs).toBeDefined();
    expect(submittedPriority).toBe("unit_economics");
  });

  it("renders SituationAnalysisRadar and flags good, bad, and warning signals with filter pills", async () => {
    const { SituationAnalysisRadar } = await import("@/features/SituationAnalysisRadar");
    const { simulateModelLocally } = await import("@/lib/engine");
    const { DEFAULT_SAAS_MODEL } = await import("@/lib/defaultModel");
    const { fireEvent } = await import("@testing-library/react");

    const result = simulateModelLocally(DEFAULT_SAAS_MODEL);
    render(
      <SituationAnalysisRadar
        result={result}
        inputs={DEFAULT_SAAS_MODEL}
        helpPriority="unit_economics"
        decisionGoal="Optimize LTV:CAC past 3x"
      />
    );

    expect(screen.getByText("Current Situation Analysis & Health Radar")).toBeDefined();
    expect(screen.getByText("Active Advisory Objective (Section 5)")).toBeDefined();
    expect(screen.getByText(/All Findings/)).toBeDefined();
    expect(screen.getByText(/🟢 Good/)).toBeDefined();
    expect(screen.getByText(/🟡 Watchlist/)).toBeDefined();

    // Filter to Good signals
    fireEvent.click(screen.getByText(/🟢 Good/));
    expect(screen.getByText("Fully Funded & Solvent Operating Runway")).toBeDefined();
  });

  it("renders empty model on dashboard with N/A values, zero warnings, and no good/bad triggers", async () => {
    const { isModelEmpty, simulateModelLocally } = await import("@/lib/engine");
    const { OverviewView } = await import("@/features/OverviewView");
    const { SituationAnalysisRadar } = await import("@/features/SituationAnalysisRadar");

    const emptyInputs: any = {
      company_name: "Blank Startup",
      business_model: "b2b_saas",
      currency: "INR",
      start_date: "2026-01",
      planning_horizon: 12,
      initial_paying_customers: 0,
      initial_cash_balance: 0,
      minimum_cash_reserve: 0,
      arpu: 0,
      expansion_rate: 0,
      contraction_rate: 0,
      customer_churn_rate: 0,
      acquisition_mode: "lead_based",
      monthly_leads: 0,
      lead_conversion_rate: 0,
      cost_per_lead: 0,
      acquisition_budget: 0,
      target_cac: 0,
      organic_new_customers: 0,
      fixed_marketing_ops: 0,
      payment_processing_rate: 0,
      hosting_fixed_cost: 0,
      hosting_cost_per_customer: 0,
      servicing_cost_per_customer: 0,
      fixed_opex: 0,
      hiring_roles: [],
      financing_events: [],
      cash_collection_rate: 1.0,
    };

    expect(isModelEmpty(emptyInputs)).toBe(true);

    const result = simulateModelLocally(emptyInputs);
    expect(result.warnings.length).toBe(0);

    // Test SituationAnalysisRadar empty state
    const { unmount: unmountRadar } = render(<SituationAnalysisRadar result={result} inputs={emptyInputs} />);
    expect(screen.getByText("Current Situation Analysis: Awaiting Financial Data")).toBeDefined();
    expect(screen.getByText("Status: All metrics N/A • Zero triggers active")).toBeDefined();
    expect(screen.queryByText(/🟢 Good/)).toBeNull();
    expect(screen.queryByText(/🔴 High Risk/)).toBeNull();
    unmountRadar();

    // Test OverviewView empty state
    render(<OverviewView result={result} inputs={emptyInputs} />);
    // Verify "No Data" badges
    const noDataBadges = screen.getAllByText("No Data");
    expect(noDataBadges.length).toBeGreaterThanOrEqual(8);
    // Verify placeholders
    expect(screen.getByText("Trajectory Visualizations Awaiting Baseline")).toBeDefined();
    expect(screen.getByText("No financial projections to display. Complete the assessment or input your company figures to generate audited monthly balance sheet and P&L schedules.")).toBeDefined();
  });

  it("converts model inputs dynamically across currencies while preserving customer counts and percentages", async () => {
    const { convertModelInputs, getExchangeRate } = await import("@/lib/currencyConverter");
    const { DEFAULT_SAAS_MODEL } = await import("@/lib/defaultModel");

    const inrModel = {
      ...DEFAULT_SAAS_MODEL,
      currency: "INR" as const,
      arpu: 500, // ₹500
      initial_cash_balance: 868000,
      initial_paying_customers: 250,
      customer_churn_rate: 0.025,
      lead_conversion_rate: 0.035,
    };

    const usdModel = convertModelInputs(inrModel, "INR", "USD");

    expect(usdModel.currency).toBe("USD");
    // Customers and percentages remain untouched
    expect(usdModel.initial_paying_customers).toBe(250);
    expect(usdModel.customer_churn_rate).toBe(0.025);
    expect(usdModel.lead_conversion_rate).toBe(0.035);

    // Monetary values converted according to exchange rate
    // ₹500 at ~86.8 INR/USD is ~$5.76
    expect(usdModel.arpu).toBeGreaterThan(5.0);
    expect(usdModel.arpu).toBeLessThan(7.0);
    expect(usdModel.initial_cash_balance).toBe(10000); // 868,000 / 86.8 = 10,000
  });
});

