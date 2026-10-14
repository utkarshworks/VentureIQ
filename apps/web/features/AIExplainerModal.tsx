"use client";

import React, { useState, useEffect } from "react";
import { ModelEngineInputs } from "@/types/model";
import { requestAIExplanation } from "@/lib/api";
import {
  getAiRateLimitStatus,
  incrementAiUsage,
  RateLimitStatus,
  isLocalhost,
} from "@/lib/rateLimit";
import {
  Target,
  X,
  Loader2,
  AlertCircle,
  Send,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  TrendingUp,
  Coins,
  Calculator,
} from "lucide-react";

import { StrategicHelpPriority, AdvisoryResponse } from "@/lib/advisoryEngine";
import { EditorialAdvisoryReport } from "./EditorialAdvisoryReport";

interface AIExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: ModelEngineInputs;
  helpPriority?: StrategicHelpPriority;
  initialQuery?: string;
}

export const AIExplainerModal: React.FC<AIExplainerModalProps> = ({
  isOpen,
  onClose,
  inputs,
  helpPriority,
  initialQuery,
}) => {
  const [query, setQuery] = useState<string>("");
  const [response, setResponse] = useState<string | null>(null);
  const [advisoryData, setAdvisoryData] = useState<AdvisoryResponse | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const [rateLimit, setRateLimit] = useState<RateLimitStatus>({
    count: 0,
    remaining: 999999,
    limit: 999999,
    isQuotaExceeded: false,
    date: "",
  });

  const isLocal = isLocalhost();

  useEffect(() => {
    if (isOpen) {
      setRateLimit(getAiRateLimitStatus());
      if (initialQuery && initialQuery.trim()) {
        setQuery(initialQuery);
        handleAsk(initialQuery);
      }
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleAsk = async (userQuery?: string) => {
    const q = (userQuery ?? query).trim();
    if (!q) return;

    setLoading(true);
    setResponse(null);
    setAdvisoryData(null);

    try {
      const res = await requestAIExplanation(inputs, q, undefined, helpPriority);
      setResponse(res.explanation);
      setAdvisoryData(res.advisory || null);
      setDisclaimer(res.disclaimer || null);

      if (!isLocal) {
        const updatedStatus = incrementAiUsage();
        setRateLimit(updatedStatus);
      }
    } catch (err: any) {
      setResponse(
        err.message ||
          "Could not query the financial advisory engine. Please verify inputs in the model editor."
      );
      setAdvisoryData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sampleQuestions = [
    { label: "Runway & Burn", query: "How can we extend our cash runway to 18 months without emergency dilution?" },
    { label: "Break-Even", query: "What pricing or customer volume is required to achieve operating break-even?" },
    { label: "Unit Economics", query: "Evaluate our LTV:CAC multiple, gross margin, and CAC payback duration." },
    { label: "Investor Brief", query: "Provide an executive summary of our financial model and capital efficiency for board review." },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-2xl space-y-3.5 sm:space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shadow-sm shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                  Strategic Advisory Copilot
                </h3>
                <span className="rounded-md bg-emerald-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-emerald-700 border border-emerald-200 shrink-0">
                  Private Decision Engine
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                Deterministic strategic analysis grounded strictly in your verified company data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition-colors shrink-0"
            title="Close"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Advisory Privacy & Unlimited Status Banner */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2 sm:p-2.5 text-xs text-slate-700">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-medium text-emerald-950 truncate">
              100% Client-Side Simulation • Private Decision Engine
            </span>
          </div>
          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 uppercase tracking-wider shrink-0 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600">Strategic Decision Scenarios:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                disabled={loading}
                onClick={() => {
                  setQuery(sq.query);
                  handleAsk(sq.query);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-2.5 text-left text-xs hover:bg-emerald-50/60 hover:border-emerald-200 transition-all text-slate-700 disabled:opacity-50"
              >
                <div className="font-semibold text-slate-900 text-[11px]">{sq.label}</div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 mt-0.5">{sq.query}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Ask a strategic financial decision question..."
            disabled={loading}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all disabled:opacity-50 shrink-0 shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> : <Send className="h-4 w-4" />}
            <span className="hidden sm:inline">Ask Advisor</span>
          </button>
        </div>

        {/* Response Box */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-8 space-y-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="text-xs font-medium text-slate-600">
              Auditing cash balances, customer bridge, unit economics &amp; invariant thresholds...
            </span>
          </div>
        )}

        {response && !loading && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-600" />
                VentureIQ Strategic Assessment
              </span>
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Brief"}</span>
              </button>
            </div>

            <div className="pt-1">
              <EditorialAdvisoryReport advisory={advisoryData} rawText={response} />
            </div>

            {disclaimer && (
              <p className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-2 italic">
                {disclaimer}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
