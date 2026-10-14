"use client";

import React, { useState, useMemo } from "react";
import { ModelEngineInputs, CurrencyCode } from "@/types/model";
import { DEFAULT_SAAS_MODEL } from "@/lib/defaultModel";
import { simulateModelLocally } from "@/lib/engine";
import { downloadCsvExport } from "@/lib/api";
import { generateExecutivePdfReport } from "@/lib/pdfGenerator";

import { Navbar } from "@/components/Navbar";
import { Sidebar, TabId } from "@/components/Sidebar";
import { WarningsBanner } from "@/components/WarningsBanner";

import { OverviewView } from "@/features/OverviewView";
import { ModelEditorView } from "@/features/ModelEditorView";
import { UnitEconomicsView } from "@/features/UnitEconomicsView";
import { GrowthSimulatorView } from "@/features/GrowthSimulatorView";
import { ScenariosView } from "@/features/ScenariosView";
import { ReversePlannerView } from "@/features/ReversePlannerView";
import { SensitivityView } from "@/features/SensitivityView";
import { CashFlowHiringView } from "@/features/CashFlowHiringView";
import { ReportsView } from "@/features/ReportsView";
import { AIExplainerModal } from "@/features/AIExplainerModal";
import { CompanyAssessmentWizard } from "@/features/CompanyAssessmentWizard";
import { Target, FileText, Sparkles, Building2, SlidersHorizontal } from "lucide-react";

export default function AppHome() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [inputs, setInputs] = useState<ModelEngineInputs>(DEFAULT_SAAS_MODEL);
  const [decisionGoalText, setDecisionGoalText] = useState<string>(
    "Reach ₹1 Crore ARR run rate within 12 months with ₹25 Lakh budget."
  );
  const [customScenarios, setCustomScenarios] = useState<Record<string, Record<string, any>>>({});
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  
  // First-time visitor default: Always display the intake assessment questions first
  const [viewMode, setViewMode] = useState<"assessment" | "dashboard">("assessment");

  // Compute deterministic simulation result for current model inputs
  const simulationResult = useMemo(() => {
    return simulateModelLocally(inputs);
  }, [inputs]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setInputs((prev) => ({ ...prev, currency: newCurrency }));
  };

  const handleUpdateInputs = (newInputs: ModelEngineInputs) => {
    setInputs(newInputs);
  };

  const handleApplyPartialAssumptions = (partial: Partial<ModelEngineInputs>) => {
    setInputs((prev) => ({ ...prev, ...partial }));
    setActiveTab("overview");
  };

  const handleSaveAsScenario = (name: string, overrides: Record<string, number>) => {
    setCustomScenarios((prev) => ({
      ...prev,
      [name]: overrides,
    }));
  };

  const handleExportCsv = () => {
    downloadCsvExport(inputs, "projections");
  };

  // Client-side PDF generation for 100% Vercel compatibility
  const handleExportPdf = () => {
    generateExecutivePdfReport(inputs, simulationResult, decisionGoalText);
  };

  // Called when user finishes the 5-step intake questionnaire
  const handleAssessmentComplete = (completedInputs: ModelEngineInputs, decisionGoal: string) => {
    setInputs(completedInputs);
    setDecisionGoalText(decisionGoal);
    setViewMode("dashboard");
    setActiveTab("overview");
  };

  // Screen 1: Mandatory Multi-Step Intake Assessment Screen
  if (viewMode === "assessment") {
    return (
      <CompanyAssessmentWizard
        initialInputs={inputs}
        initialDecisionGoal={decisionGoalText}
        onComplete={handleAssessmentComplete}
      />
    );
  }

  // Screen 2: Real-Time Dynamic Financial Dashboard
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        companyName={inputs.company_name}
        currency={inputs.currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenIntake={() => setViewMode("assessment")}
        onOpenAI={() => setIsAIModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Active Company & Strategic Decision Subheader */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm shrink-0">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 tracking-tight">{inputs.company_name}</h1>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200">
                    {inputs.business_model.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    {inputs.planning_horizon}M Horizon
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Target className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-xl font-medium text-slate-700">
                    &quot;{decisionGoalText}&quot;
                  </span>
                  <button
                    onClick={() => setViewMode("assessment")}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline shrink-0"
                    title="Edit strategic decision or company inputs"
                  >
                    Edit Decision
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode("assessment")}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                title="Retake multi-step company assessment"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span>Retake Assessment</span>
              </button>
              <button
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-100" />
                <span>Executive PDF</span>
              </button>
            </div>
          </div>

          {/* Explicit Rule-based Warnings Banner */}
          <WarningsBanner warnings={simulationResult.warnings} />

          {/* Active View Switcher */}
          {activeTab === "overview" && (
            <OverviewView result={simulationResult} inputs={inputs} />
          )}

          {activeTab === "model_editor" && (
            <ModelEditorView inputs={inputs} onUpdateInputs={handleUpdateInputs} />
          )}

          {activeTab === "unit_economics" && (
            <UnitEconomicsView result={simulationResult} inputs={inputs} />
          )}

          {activeTab === "growth_simulator" && (
            <GrowthSimulatorView
              baseInputs={inputs}
              onApplySimulatedToModel={handleUpdateInputs}
            />
          )}

          {activeTab === "scenarios" && (
            <ScenariosView baseInputs={inputs} customScenarios={customScenarios} />
          )}

          {activeTab === "reverse_planner" && (
            <ReversePlannerView
              baseInputs={inputs}
              onApplyAssumptions={handleApplyPartialAssumptions}
              onSaveAsScenario={handleSaveAsScenario}
            />
          )}

          {activeTab === "sensitivity" && (
            <SensitivityView baseInputs={inputs} />
          )}

          {activeTab === "cash_flow_hiring" && (
            <CashFlowHiringView
              inputs={inputs}
              result={simulationResult}
              onUpdateInputs={handleUpdateInputs}
            />
          )}

          {activeTab === "reports" && (
            <ReportsView inputs={inputs} result={simulationResult} />
          )}
        </main>
      </div>

      <AIExplainerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        inputs={inputs}
      />
    </div>
  );
}
