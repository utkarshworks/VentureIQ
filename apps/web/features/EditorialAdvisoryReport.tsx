"use client";

import React from "react";
import {
  Target,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Activity,
} from "lucide-react";
import { AdvisoryResponse } from "@/lib/advisoryEngine";

interface EditorialAdvisoryReportProps {
  advisory?: AdvisoryResponse | null;
  rawText?: string | null;
}

/**
 * Editorial Advisory Report Viewer.
 * Presents executive CFO-grade findings with clean editorial hierarchy,
 * structured audit cards, diagnostic trade-offs, and an actionable roadmap,
 * free of raw markdown hashes (###) or unstyled text blocks.
 */
export const EditorialAdvisoryReport: React.FC<EditorialAdvisoryReportProps> = ({
  advisory,
  rawText,
}) => {
  // 1. Structured Rendering when advisory object is present
  if (advisory) {
    return (
      <div className="space-y-5 text-slate-800 font-sans">
        {/* Editorial Memo Masthead */}
        <div className="border-b border-slate-200 pb-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Strategic Advisory Memorandum
            </span>
            <span>Confidential • Board &amp; CFO Brief</span>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {advisory.title}
          </h2>

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-xs font-semibold text-slate-500">Focus Area:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200/80">
              <Target className="h-3 w-3 text-emerald-600" />
              {advisory.focusArea}
            </span>
          </div>
        </div>

        {/* Direct Executive Answer & Extracted Inquiry Verdict */}
        {advisory.directAnswer && (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-5 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">
                  Direct Inquiry Answer
                </span>
              </div>
              {advisory.directAnswer.verdictType && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${
                    advisory.directAnswer.verdictType === "optimal"
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                      : advisory.directAnswer.verdictType === "warning"
                      ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                      : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                  }`}
                >
                  {advisory.directAnswer.verdictType === "optimal"
                    ? "Verified Viable"
                    : advisory.directAnswer.verdictType === "warning"
                    ? "Caution / Guardrails Needed"
                    : "High Risk / Deficit Breach"}
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {advisory.directAnswer.headline}
            </h3>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
              {advisory.directAnswer.details}
            </p>

            {advisory.directAnswer.extractedParameters &&
              advisory.directAnswer.extractedParameters.length > 0 && (
                <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Extracted Inquiry Metrics:
                  </span>
                  {advisory.directAnswer.extractedParameters.map((param, i) => (
                    <div
                      key={i}
                      className="rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] flex items-center gap-1.5"
                    >
                      <span className="text-slate-400">{param.label}:</span>
                      <span className="font-bold text-white">{param.value}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Executive Summary Lead Callout */}
        <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-r-xl space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-emerald-600" />
            Executive Summary
          </span>
          <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
            {advisory.executiveSummary}
          </p>
        </div>

        {/* Section 1: Key Invariant & Ratio Audits */}
        {advisory.keyMetricsAudited && advisory.keyMetricsAudited.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                1. Key Invariant &amp; Ratio Audits
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {advisory.keyMetricsAudited.map((metric, idx) => {
                const statusStyles = {
                  good: "border-emerald-200 bg-emerald-50/30 text-emerald-900",
                  warning: "border-amber-200 bg-amber-50/30 text-amber-900",
                  danger: "border-rose-200 bg-rose-50/30 text-rose-900",
                  neutral: "border-slate-200 bg-slate-50 text-slate-900",
                }[metric.status || "neutral"];

                const badgeStyles = {
                  good: "bg-emerald-100 text-emerald-800 border-emerald-200",
                  warning: "bg-amber-100 text-amber-800 border-amber-200",
                  danger: "bg-rose-100 text-rose-800 border-rose-200",
                  neutral: "bg-slate-100 text-slate-700 border-slate-200",
                }[metric.status || "neutral"];

                const badgeLabel = {
                  good: "Optimal",
                  warning: "Watchlist",
                  danger: "Review Urgently",
                  neutral: "Baseline",
                }[metric.status || "neutral"];

                return (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3 flex flex-col justify-between space-y-1.5 transition-all shadow-2xs ${statusStyles}`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-600 line-clamp-1">
                        {metric.label}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${badgeStyles}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>

                    <div className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-mono">
                      {metric.value}
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      Target: {metric.benchmark}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Strategic Diagnosis & Invariant Trade-Offs */}
        {advisory.strategicDiagnosis && advisory.strategicDiagnosis.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                2. Strategic Diagnosis &amp; Invariant Trade-Offs
              </h3>
            </div>

            <div className="space-y-2">
              {advisory.strategicDiagnosis.map((item, idx) => {
                // Split premise from diagnosis if colon exists
                const parts = item.split(":");
                const title = parts.length > 1 ? parts[0] : null;
                const body = parts.length > 1 ? parts.slice(1).join(":") : item;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-white p-3.5 flex items-start gap-3 shadow-2xs"
                  >
                    <div className="flex h-5 w-5 rounded-full bg-slate-900 text-emerald-400 items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-black">{idx + 1}</span>
                    </div>
                    <div className="text-xs text-slate-700 leading-relaxed">
                      {title && <span className="font-bold text-slate-900">{title}: </span>}
                      <span>{body.trim()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Recommended CFO Action Plan */}
        {advisory.recommendedActions && advisory.recommendedActions.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                3. Actionable CFO Implementation Roadmap
              </h3>
            </div>

            <div className="space-y-2.5">
              {advisory.recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        Step {action.step || idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{action.action}</h4>
                    </div>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {action.timeline}
                    </span>
                  </div>

                  <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-700 flex items-start gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-800">Expected Impact: </span>
                      <span>{action.impact}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Clean Editorial Fallback Parser when raw text is provided
  if (!rawText) return null;

  // Split lines and parse into styled editorial blocks, stripping all markdown hashes
  const lines = rawText.split("\n");
  const parsedElements: React.ReactNode[] = [];

  let currentSectionTitle: string | null = null;
  let currentParagraphs: string[] = [];

  const flushParagraphs = (keyPrefix: string) => {
    if (currentParagraphs.length > 0) {
      const text = currentParagraphs.join("\n").trim();
      if (text) {
        parsedElements.push(
          <p key={`${keyPrefix}-${parsedElements.length}`} className="text-xs text-slate-700 leading-relaxed font-sans">
            {text}
          </p>
        );
      }
      currentParagraphs = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushParagraphs(`hr-${idx}`);
      parsedElements.push(<div key={`div-${idx}`} className="my-3 border-t border-slate-200/80" />);
      return;
    }

    // Level 3 Heading: ### Title
    if (trimmed.startsWith("### ")) {
      flushParagraphs(`h3-${idx}`);
      const cleanTitle = trimmed.replace(/^###\s+/, "").replace(/^[📊🔍🧠🎯💡⚡]\s*/, "");
      parsedElements.push(
        <div key={`h3-${idx}`} className="pt-2 pb-1 border-b border-slate-100">
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-600" />
            <span>{cleanTitle}</span>
          </h2>
        </div>
      );
      return;
    }

    // Level 4 Heading: #### Title
    if (trimmed.startsWith("#### ")) {
      flushParagraphs(`h4-${idx}`);
      const cleanSub = trimmed.replace(/^####\s+/, "").replace(/^[📊🔍🧠🎯💡⚡]\s*/, "");
      parsedElements.push(
        <div key={`h4-${idx}`} className="pt-2 pb-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-slate-600" />
            <span>{cleanSub}</span>
          </h3>
        </div>
      );
      return;
    }

    // Bullet / List items
    if (trimmed.startsWith("- ") || trimmed.startsWith("• ") || trimmed.startsWith("* ")) {
      flushParagraphs(`bullet-${idx}`);
      const itemText = trimmed.replace(/^[-•*]\s+/, "");
      parsedElements.push(
        <div key={`li-${idx}`} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed pl-1 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
          <span>{itemText}</span>
        </div>
      );
      return;
    }

    // Standard text line
    if (trimmed) {
      currentParagraphs.push(trimmed);
    } else {
      flushParagraphs(`blank-${idx}`);
    }
  });

  flushParagraphs("final");

  return (
    <div className="space-y-3 font-sans">
      {parsedElements}
    </div>
  );
};

