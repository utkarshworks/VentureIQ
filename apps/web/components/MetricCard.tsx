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
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
  }[statusType];

  return (
    <div className="group rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-2">
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-xs font-semibold text-slate-500 truncate group-hover:text-slate-700 transition-colors" title={title}>
          {title}
        </span>
        {statusBadge && (
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide shrink-0 ${badgeClasses}`}
          >
            {statusBadge}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</span>
      </div>

      {subtitle && <p className="text-[11px] font-medium text-slate-400 truncate">{subtitle}</p>}
      {hint && <p className="text-[10px] text-slate-400 italic line-clamp-1">{hint}</p>}
    </div>
  );
};
