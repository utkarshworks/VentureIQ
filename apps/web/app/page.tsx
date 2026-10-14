"use client";

import React, { useState, useMemo } from "react";
import { ModelEngineInputs, CurrencyCode } from "@/types/model";
import { DEFAULT_SAAS_MODEL } from "@/lib/defaultModel";
import { simulateModelLocally } from "@/lib/engine";
import { downloadCsvExport, downloadPdfExport } from "@/lib/api";

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

export default function AppHome() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [inputs, setInputs] = useState<ModelEngineInputs>(DEFAULT_SAAS_MODEL);
  const [customScenarios, setCustomScenarios] = useState<Record<string, Record<string, any>>>({});
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);

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

  const handleExportPdf = () => {
    downloadPdfExport(inputs);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        companyName={inputs.company_name}
        currency={inputs.currency}
        onCurrencyChange={handleCurrencyChange}
        onOpenAI={() => setIsAIModalOpen(true)}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
      />

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
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
