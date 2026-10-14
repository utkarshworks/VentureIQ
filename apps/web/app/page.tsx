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
import { CompanyIntakeModal } from "@/features/CompanyIntakeModal";
import { Target, FileText, Sparkles, Building2 } from "lucide-react";

export default function AppHome() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [inputs, setInputs] = useState<ModelEngineInputs>(DEFAULT_SAAS_MODEL);
  const [decisionGoalText, setDecisionGoalText] = useState<string>(
    "Reach ₹1 Crore ARR run rate within 12 months with ₹25 Lakh budget."
  );
  const [customScenarios, setCustomScenarios] = useState<Record<string, Record<string, any>>>({});
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState<boolean>(false);

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

  const handleCompanyIntakeSubmit = (newInputs: ModelEngineInputs, decisionNotes?: string) => {
    setInputs(newInputs);
    if (decisionNotes) setDecisionGoalText(decisionNotes);
    setActiveTab("overview");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        companyName={inputs.company_name}
        currency={inputs.currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenIntake={() => setIsCompanyModalOpen(true)}
        onOpenAI={() => setIsAIModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Active Company & Strategic Decision Showcase Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800 shrink-0">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">{inputs.company_name}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                    {inputs.business_model.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Decision Focus: <span className="font-medium text-slate-800">&quot;{decisionGoalText}&quot;</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
              >
                <span>Simulate Your Startup</span>
              </button>
              <button
                onClick={handleExportPdf}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-all shadow-sm"
              >
                <FileText className="h-3.5 w-3.5 text-emerald-100" />
                <span>Download Executive PDF</span>
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

      <CompanyIntakeModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        currentInputs={inputs}
        onSubmit={handleCompanyIntakeSubmit}
      />

      <AIExplainerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        inputs={inputs}
      />
    </div>
  );
}
