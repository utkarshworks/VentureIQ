"use client";

import React, { useState, useEffect } from "react";
import { ModelEngineInputs } from "@/types/model";
import { requestAIExplanation } from "@/lib/api";
import {
  getAiRateLimitStatus,
  incrementAiUsage,
  RateLimitStatus,
  QUOTA_EXCEEDED_MESSAGE,
  DAILY_LIMIT,
} from "@/lib/rateLimit";
import {
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  Send,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

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
  const [modelTag, setModelTag] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Rate Limiting & BYOK State
  const [rateLimit, setRateLimit] = useState<RateLimitStatus>({
    count: 0,
    remaining: DAILY_LIMIT,
    limit: DAILY_LIMIT,
    isQuotaExceeded: false,
    date: "",
  });
  const [userApiKey, setUserApiKey] = useState<string>("");
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRateLimit(getAiRateLimitStatus());
      const savedKey = localStorage.getItem("ventureiq_custom_gemini_key");
      if (savedKey) {
        setUserApiKey(savedKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveApiKey = (key: string) => {
    setUserApiKey(key);
    if (key.trim()) {
      localStorage.setItem("ventureiq_custom_gemini_key", key.trim());
    } else {
      localStorage.removeItem("ventureiq_custom_gemini_key");
    }
  };

  const handleAsk = async (userQuery?: string) => {
    const q = (userQuery ?? query).trim();
    if (!q) return;

    // Check rate limit if no custom API key provided
    const hasCustomKey = Boolean(userApiKey && userApiKey.trim().length > 10);
    const currentStatus = getAiRateLimitStatus();

    if (!hasCustomKey && currentStatus.isQuotaExceeded) {
      setResponse(QUOTA_EXCEEDED_MESSAGE);
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await requestAIExplanation(inputs, q, hasCustomKey ? userApiKey.trim() : undefined);
      setResponse(res.explanation);
      setDisclaimer(res.disclaimer || null);
      setModelTag(res.model || null);

      if (!hasCustomKey) {
        const updatedStatus = incrementAiUsage();
        setRateLimit(updatedStatus);
      }
    } catch (err: any) {
      setResponse(
        err.message ||
          "Could not query Gemini service. Please verify network connectivity or check your Google AI Studio API key."
      );
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
    "Why is cash runway falling even though ARR is increasing?",
    "What pricing or CAC changes are needed to reach break-even?",
    "Can we afford to hire 2 engineers in Month 3?",
    "Provide an executive summary of unit economics for investors.",
  ];

  const hasCustomKey = Boolean(userApiKey && userApiKey.trim().length > 10);
  const isBlockedByQuota = !hasCustomKey && rateLimit.isQuotaExceeded;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">AI Strategic Decision Explainer</h3>
                <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700 border border-purple-200">
                  Google Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Strategic financial interpretations grounded strictly in deterministic model math
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

        {/* Rate Limiting & Quota Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-purple-100 bg-purple-50/50 p-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-600 shrink-0" />
            {hasCustomKey ? (
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Unlimited BYOK Access Active
              </span>
            ) : (
              <span className="text-slate-700">
                Demo Daily Quota:{" "}
                <b className={rateLimit.remaining === 0 ? "text-rose-600" : "text-purple-700"}>
                  {rateLimit.remaining} of {DAILY_LIMIT} free questions remaining today
                </b>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="flex items-center gap-1 text-[11px] font-semibold text-purple-700 hover:text-purple-900 underline"
          >
            <Key className="h-3 w-3" />
            <span>{showKeyInput ? "Hide API Key Settings" : "Use Your Own Gemini Key"}</span>
          </button>
        </div>

        {/* Quota Exceeded Alert Notice */}
        {isBlockedByQuota && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-900 space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Daily Demo Quota Reached</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed font-medium">
              &quot;You&apos;ve used your 5 daily demo AI questions. Deterministic calculations and PDF generation remain unlimited!&quot;
            </p>
            <p className="text-[11px] text-rose-600 pt-1">
              Want unlimited AI queries? Add your own free Gemini API key below (takes 30 seconds at Google AI Studio).
            </p>
          </div>
        )}

        {/* Optional BYOK (Bring Your Own Key) Panel */}
        {showKeyInput && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-purple-600" />
                Google Gemini API Key (Optional)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] text-purple-700 hover:underline"
              >
                <span>Get Free Key at Google AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-500">
              Your key stays safely stored in your browser&apos;s localStorage and is sent directly to Gemini without being logged.
            </p>
            <input
              type="password"
              value={userApiKey}
              onChange={(e) => handleSaveApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        )}

        {/* Suggestion Chips */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-slate-600">Sample Decision Prompts:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleQuestions.map((sq, i) => (
              <button
                key={i}
                type="button"
                disabled={isBlockedByQuota || loading}
                onClick={() => {
                  setQuery(sq);
                  handleAsk(sq);
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-700 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-800 transition-colors disabled:opacity-50 text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input Form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            disabled={isBlockedByQuota || loading}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isBlockedByQuota && !loading && handleAsk()}
            placeholder={
              isBlockedByQuota
                ? "Daily demo limit reached. Enter your Gemini key above to continue."
                : "e.g. Can we afford to hire 2 engineers in Month 3?"
            }
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-400"
          />
          <button
            type="button"
            onClick={() => handleAsk()}
            disabled={isBlockedByQuota || loading || !query.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-purple-700 transition-all shadow-sm disabled:opacity-50 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Analyze</span>
          </button>
        </div>

        {/* Response Container */}
        {response && (
          <div className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 space-y-3 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-900">
                  Strategic Evaluation
                </span>
                {modelTag && (
                  <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-800">
                    {modelTag}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyResponse}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

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

        {/* Deterministic Rule Guarantee */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100">
          <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
          <span>
            <b>Mathematical Grounding:</b> The AI layer strictly interprets computed balance sheet metrics. It never invents fictional numbers or overrides deterministic financial logic.
          </span>
        </div>
      </div>
    </div>
  );
};
