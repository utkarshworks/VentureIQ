"use client";

import React from "react";
import { ModelWarning } from "@/types/model";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface WarningsBannerProps {
  warnings: ModelWarning[];
}

export const WarningsBanner: React.FC<WarningsBannerProps> = ({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {warnings.map((w, idx) => {
        const isCritical = w.severity === "critical";
        const isWarning = w.severity === "warning";

        const bgClass = isCritical
          ? "bg-rose-50 border-rose-200 text-rose-900"
          : isWarning
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-blue-50 border-blue-200 text-blue-900";

        const Icon = isCritical ? AlertCircle : isWarning ? AlertTriangle : Info;
        const iconColor = isCritical
          ? "text-rose-600"
          : isWarning
          ? "text-amber-600"
          : "text-blue-600";

        return (
          <div
            key={idx}
            className={`flex items-start gap-3 rounded-xl border p-3 text-xs ${bgClass}`}
          >
            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
            <div className="flex-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] mr-2">
                [{w.code}]
              </span>
              <span>{w.message}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

