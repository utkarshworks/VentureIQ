"use client";

import React from "react";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  statusBadge?: string;
  statusType?: "good" | "neutral" | "warning" | "danger";
  hint?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  statusBadge,
  statusType = "neutral",
  hint,
}) => {
  const badgeClasses = {
    good: "bg-emerald-50 text-emerald-700 border-emerald-200",
    neutral: "bg-slate-100 text-slate-600 border-slate-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  }[statusType];

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-slate-300 hover:shadow-md transition-all min-w-0 overflow-hidden flex flex-col justify-between gap-2.5">
      {/* Card Header */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span
          className="text-xs font-semibold text-slate-500 truncate flex-1 min-w-0 group-hover:text-slate-800 transition-colors"
          title={title}
        >
          {title}
        </span>
        {statusBadge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shrink-0 whitespace-nowrap ${badgeClasses}`}
          >
            {statusBadge}
          </span>
        )}
      </div>

      {/* Numerical Metric Display */}
      <div className="min-w-0 py-0.5">
        <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 break-words leading-none">
          {value}
        </div>
      </div>

      {/* Subtitle & Hint Footer */}
      {(subtitle || hint) && (
        <div className="min-w-0 space-y-0.5 pt-0.5 border-t border-slate-100/80">
          {subtitle && (
            <p className="text-[11px] font-medium text-slate-500 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
          {hint && (
            <p className="text-[10px] text-slate-400 truncate" title={hint}>
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
