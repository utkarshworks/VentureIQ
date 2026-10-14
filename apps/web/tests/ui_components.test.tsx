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
});

