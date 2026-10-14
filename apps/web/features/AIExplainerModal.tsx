"use client";

import React, { useState } from "react";
import { ModelEngineInputs } from "@/types/model";
import { requestAIExplanation } from "@/lib/api";
import { Sparkles, X, Loader2, AlertCircle, Send } from "lucide-react";

interface AIExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: ModelEngineInputs;
}

export const AIExplainerModal: React.FC<AIExplainerModalProps> = ({
  isOpen,
  onClose,
  inputs,
}) => {
  const [query, setQuery] = useState<string>("");
  const [response, setResponse] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAsk = async (userQuery?: string) => {
    const q = userQuery ?? query;
    setLoading(true);
    try {
      const res = await requestAIExplanation(inputs, q || undefined);
      setResponse(res.explanation);
      setDisclaimer(res.disclaimer);
    } catch {
      setResponse(
        "Could not connect to external AI service. Please ensure the backend is running or check API keys."
      );
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    "Why is my cash runway falling even though revenue is increasing?",
    "What are the biggest financial bottlenecks in my model?",
    "How can I reach break-even 3 months earlier?",
    "Summarize the unit economics and capital efficiency.",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">AI Financial Decision Assistant</h3>
              <p className="text-[11px] text-slate-500">
                Natural-language explanations grounded strictly in deterministic calculations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-medium text-slate-500">Ask a question:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sq);
                  handleAsk(sq);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-800 transition-colors"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="e.g. Can I afford to hire 2 engineers in Month 3?"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition-all shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Analyze</span>
          </button>
        </div>

        {/* Explanation Output Container */}
        {response && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-2 max-h-72 overflow-y-auto">
            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-normal">
              {response}
            </div>
            {disclaimer && (
              <p className="text-[10px] text-purple-700/80 italic pt-2 border-t border-purple-200/50">
                {disclaimer}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            <b>Non-negotiable rule:</b> The AI layer strictly explains computed model results. It never generates artificial forecasts or replaces deterministic mathematical calculations.
          </span>
        </div>
      </div>
    </div>
  );
};

