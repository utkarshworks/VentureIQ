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

    expect(screen.getByText("[RESERVE_BREACH]")).toBeDefined();
    expect(screen.getByText("Cash falls below minimum reserve in Month 7")).toBeDefined();
    expect(screen.getByText("[NEGATIVE_UNIT_ECONOMICS]")).toBeDefined();
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
    expect(screen.getByText("Simulation Horizon")).toBeDefined();
    expect(screen.getByText("Continue to Step 02")).toBeDefined();
  });

  it("navigates through the 4-step wizard, verifies Current Blended CAC in Step 3, and completes at Step 4", async () => {
    const { CompanyAssessmentWizard } = await import("@/features/CompanyAssessmentWizard");
    const { DEFAULT_SAAS_MODEL } = await import("@/lib/defaultModel");
    const { fireEvent } = await import("@testing-library/react");

    let completed = false;
    let submittedInputs: any = null;

    render(
      <CompanyAssessmentWizard
        initialInputs={DEFAULT_SAAS_MODEL}
        initialDecisionGoal="Reach ₹1 Crore ARR run rate"
        onComplete={(inputs) => {
          completed = true;
          submittedInputs = inputs;
        }}
      />
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText("Continue to Step 02"));
    expect(screen.getByText("Step 2: Baseline Revenue, Customers & Cash Position")).toBeDefined();

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText("Continue to Step 03"));
    expect(screen.getByText("Step 3: Growth Engine, CAC & Churn Dynamics")).toBeDefined();
    // Verify Current Blended CAC field is rendered in Step 3
    expect(screen.getByText("Current Blended CAC (INR)")).toBeDefined();

    // Step 3 -> Step 4
    fireEvent.click(screen.getByText("Continue to Step 04"));
    expect(screen.getByText("Step 4: Operating Expenses & Team Payroll")).toBeDefined();

    // Verify Step 4 has the final submit button instead of Step 5
    const submitBtn = screen.getByText("Build Financial Engine & Open Dashboard");
    expect(submitBtn).toBeDefined();

    // Click submit
    fireEvent.click(submitBtn);
    expect(completed).toBe(true);
    expect(submittedInputs).toBeDefined();
  });

  it("renders SituationAnalysisRadar and flags good, bad, and warning signals with filter pills", async () => {
    const { SituationAnalysisRadar } = await import("@/features/SituationAnalysisRadar");
    const { simulateModelLocally } = await import("@/lib/engine");
    const { DEFAULT_SAAS_MODEL } = await import("@/lib/defaultModel");
    const { fireEvent } = await import("@testing-library/react");

    const result = simulateModelLocally(DEFAULT_SAAS_MODEL);
    render(<SituationAnalysisRadar result={result} inputs={DEFAULT_SAAS_MODEL} />);

    expect(screen.getByText("Current Situation Analysis & Health Radar")).toBeDefined();
    expect(screen.getByText(/All Findings/)).toBeDefined();
    expect(screen.getByText(/🟢 Good/)).toBeDefined();
    expect(screen.getByText(/🟡 Watchlist/)).toBeDefined();

    // Filter to Good signals
    fireEvent.click(screen.getByText(/🟢 Good/));
    expect(screen.getByText("Fully Funded & Solvent Operating Runway")).toBeDefined();
  });
});

