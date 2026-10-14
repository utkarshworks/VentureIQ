"use client";

import React, { useState, useMemo } from "react";
import { ModelEngineInputs, CurrencyCode } from "@/types/model";
import { DEFAULT_SAAS_MODEL } from "@/lib/defaultModel";
import { simulateModelLocally } from "@/lib/engine";
import { downloadCsvExport } from "@/lib/api";
import { generateExecutivePdfReport } from "@/lib/pdfGenerator";
import { convertModelInputs, fetchLiveExchangeRates } from "@/lib/currencyConverter";

import { Navbar } from "@/components/Navbar";
import { Sidebar, TabId, NAV_ITEMS } from "@/components/Sidebar";
import { WarningsBanner } from "@/components/WarningsBanner";

import { OverviewView } from "@/features/OverviewView";
import { ModelEditorView } from "@/features/ModelEditorView";
import { UnitEconomicsView } from "@/features/UnitEconomicsView";
import { GrowthSimulatorView } from "@/features/GrowthSimulatorView";
import { ScenariosView } from "@/features/ScenariosView";
import { ReversePlannerView } from "@/features/ReversePlannerView";
import { SensitivityView } from "@/features/SensitivityView";
import { CashFlowHiringView } from "@/features/CashFlowHiringView";
import { AIExplainerModal } from "@/features/AIExplainerModal";
import { CompanyAssessmentWizard } from "@/features/CompanyAssessmentWizard";
import { CookiePreferencesModal } from "@/components/CookiePreferencesModal";
import Link from "next/link";
import { Target, FileText, Sparkles, Building2, SlidersHorizontal, X, ChevronRight, Download } from "lucide-react";
import { StrategicHelpPriority } from "@/lib/advisoryEngine";

export default function AppHome() {
  const [inputs, setInputs] = useState<ModelEngineInputs>(DEFAULT_SAAS_MODEL);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [decisionGoalText, setDecisionGoalText] = useState<string>("");
  const [helpPriority, setHelpPriority] = useState<StrategicHelpPriority>("runway_preservation");
  const [customScenarios, setCustomScenarios] = useState<Record<string, Record<string, any>>>({});
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [isCookieModalOpen, setIsCookieModalOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string>("");
  
  // First-time visitor default: Always display the intake assessment questions first
  const [viewMode, setViewMode] = useState<"assessment" | "dashboard">("assessment");

  const handleOpenAdvisor = (query?: string) => {
    setAiInitialQuery(query || "");
    setIsAIModalOpen(true);
  };

  // Restore persisted assessment data if user previously completed or worked on it
  React.useEffect(() => {
    fetchLiveExchangeRates().catch(() => {});
    try {
      const savedInputsRaw = localStorage.getItem("ventureiq_user_inputs");
      const savedGoal = localStorage.getItem("ventureiq_decision_goal");
      const savedHelp = localStorage.getItem("ventureiq_help_priority");
      const savedCompleted = localStorage.getItem("ventureiq_assessment_completed");
      if (savedInputsRaw) {
        setInputs(JSON.parse(savedInputsRaw));
      }
      if (savedGoal) {
        setDecisionGoalText(savedGoal);
      }
      if (savedHelp) {
        setHelpPriority(savedHelp as StrategicHelpPriority);
      }
      if (savedCompleted === "true" || (savedInputsRaw && savedGoal)) {
        setViewMode("dashboard");
      }
    } catch (e) {
      console.warn("Could not load stored session data:", e);
    }
  }, []);

  // Compute deterministic simulation result for current model inputs
  const simulationResult = useMemo(() => {
    return simulateModelLocally(inputs);
  }, [inputs]);

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    if (newCurrency === inputs.currency) return;
    setInputs((prev) => {
      const updated = convertModelInputs(prev, prev.currency, newCurrency);
      try {
        localStorage.setItem("ventureiq_user_inputs", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateInputs = (newInputs: ModelEngineInputs) => {
    setInputs(newInputs);
    try {
      localStorage.setItem("ventureiq_user_inputs", JSON.stringify(newInputs));
    } catch {}
  };

  const handleApplyPartialAssumptions = (partial: Partial<ModelEngineInputs>) => {
    setInputs((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem("ventureiq_user_inputs", JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
    generateExecutivePdfReport(inputs, simulationResult, decisionGoalText, helpPriority);
  };

  // Called when user finishes the 5-step intake questionnaire
  const handleAssessmentComplete = (
    completedInputs: ModelEngineInputs,
    decisionGoal: string,
    priority: StrategicHelpPriority
  ) => {
    setInputs(completedInputs);
    setDecisionGoalText(decisionGoal);
    setHelpPriority(priority);
    setViewMode("dashboard");
    setActiveTab("overview");
  };

  // Screen 1: Mandatory Multi-Step Intake Assessment Screen
  if (viewMode === "assessment") {
    return (
      <CompanyAssessmentWizard
        initialInputs={inputs}
        initialDecisionGoal={decisionGoalText}
        initialHelpPriority={helpPriority}
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
        onOpenAI={() => handleOpenAdvisor()}
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
        isMobileNavOpen={isMobileNavOpen}
      />

      {/* MOBILE NAVIGATION DRAWER & BACKDROP */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileNavOpen(false)}
          />
          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl p-4 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <div className="space-y-4">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{inputs.company_name}</h3>
                    <p className="text-[10px] text-slate-500">Navigation &amp; Decision Hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  aria-label="Close menu"
                  title="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Decision Modules */}
              <div className="space-y-1">
                <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Decision Modules
                </p>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as TabId);
                        setIsMobileNavOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? item.highlight
                            ? "bg-emerald-600 text-white shadow-sm font-bold"
                            : "bg-slate-900 text-white shadow-sm font-bold"
                          : item.highlight
                          ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 ${
                            isActive
                              ? "text-white"
                              : item.highlight
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold ${
                            isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Fast Mobile Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setIsMobileNavOpen(false);
                    setViewMode("assessment");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
                  <span>Retake Assessment</span>
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      handleExportPdf();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm"
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-400" />
                    <span>PDF Brief</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      handleExportCsv();
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5 text-slate-500" />
                    <span>CSV Data</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="border-t border-slate-100 pt-3 text-[11px] text-slate-400 space-y-1">
              <p>100% Client-Side Engine</p>
              <Link
                href="/privacy"
                onClick={() => setIsMobileNavOpen(false)}
                className="text-emerald-700 underline font-medium block"
              >
                Cookie &amp; Privacy Policy
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* MOBILE HORIZONTAL DECISION MODULE TABS STRIP (Sticky under navbar on mobile) */}
      <nav
        aria-label="Mobile Module Navigation"
        className="lg:hidden sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-2.5 py-2 overflow-x-auto flex items-center gap-1.5 shadow-xs scrollbar-none"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as TabId)}
              className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                isActive
                  ? item.highlight
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-900 text-white shadow-sm"
                  : item.highlight
                  ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                  : "text-slate-600 bg-slate-100 hover:bg-slate-200/70"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  isActive ? "text-white" : item.highlight ? "text-emerald-600" : "text-slate-500"
                }`}
              />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="flex-1 min-w-0 p-3.5 sm:p-6 max-w-7xl mx-auto w-full space-y-5 sm:space-y-6">
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
                <p className="text-xs text-slate-500 font-medium">
                  Financial Projections, Solvency &amp; Strategic Risk Radar
                </p>
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
            <OverviewView
              result={simulationResult}
              inputs={inputs}
              helpPriority={helpPriority}
              decisionGoal={decisionGoalText}
              onOpenAI={handleOpenAdvisor}
            />
          )}

          {activeTab === "model_editor" && (
            <ModelEditorView
              inputs={inputs}
              onUpdateInputs={handleUpdateInputs}
              result={simulationResult}
              onOpenAI={handleOpenAdvisor}
            />
          )}

          {activeTab === "unit_economics" && (
            <UnitEconomicsView
              result={simulationResult}
              inputs={inputs}
              onOpenAI={handleOpenAdvisor}
            />
          )}

          {activeTab === "growth_simulator" && (
            <GrowthSimulatorView
              baseInputs={inputs}
              onApplySimulatedToModel={handleUpdateInputs}
              onOpenAI={handleOpenAdvisor}
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
              onOpenAI={handleOpenAdvisor}
            />
          )}

          {/* DASHBOARD PRIVACY & DATA GOVERNANCE FOOTER */}
          <footer className="mt-16 border-t border-slate-200 pt-6 pb-12 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>100% Client-Side Private Engine • Zero Financial Data Transmitted to Remote Servers</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-slate-900 underline transition-colors">
                Cookie & Privacy Policy
              </Link>
              <button
                type="button"
                onClick={() => setIsCookieModalOpen(true)}
                className="hover:text-slate-900 underline transition-colors"
              >
                Manage Cookie Preferences
              </button>
            </div>
          </footer>
        </main>
      </div>

      {/* GLOBAL FLOATING AMBIENT STRATEGIC ADVISOR ACTION WIDGET */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenAdvisor()}
          className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-3 pr-4 text-white shadow-2xl shadow-emerald-950/60 border border-emerald-500/50 hover:border-emerald-400 hover:scale-[1.03] active:scale-[0.98] transition-all ring-1 ring-emerald-500/20"
          title="Open Executive CFO Strategic Copilot"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 shadow-md">
            <Sparkles className="h-4 w-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-tight">Executive CFO Copilot</span>
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-extrabold text-emerald-300 uppercase tracking-wider">
                Ready
              </span>
            </div>
            <p className="text-[10px] text-slate-300 group-hover:text-emerald-200 transition-colors">
              1-Click Strategic Diagnostic
            </p>
          </div>
        </button>
      </div>

      <AIExplainerModal
        isOpen={isAIModalOpen}
        onClose={() => {
          setIsAIModalOpen(false);
          setAiInitialQuery("");
        }}
        inputs={inputs}
        helpPriority={helpPriority}
        initialQuery={aiInitialQuery}
      />

      <CookiePreferencesModal
        isOpen={isCookieModalOpen}
        onClose={() => setIsCookieModalOpen(false)}
      />
    </div>
  );
}
