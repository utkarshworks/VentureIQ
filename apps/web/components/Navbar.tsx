"use client";

import React from "react";
import { CurrencyCode } from "@/types/model";
import { Download, FileText, Sparkles, TrendingUp } from "lucide-react";

interface NavbarProps {
  companyName: string;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onOpenIntake: () => void;
  onOpenAI: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyName,
  currency,
  onCurrencyChange,
  onOpenIntake,
  onOpenAI,
  onExportCsv,
  onExportPdf,
}) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <TrendingUp className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">VentureIQ</span>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              v1.0 Production
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Model: <span className="font-medium text-slate-700">{companyName}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Currency Selector */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-medium">
          {(["INR", "USD", "EUR", "GBP"] as CurrencyCode[]).map((curr) => (
            <button
              key={curr}
              onClick={() => onCurrencyChange(curr)}
              className={`rounded-md px-2.5 py-1 transition-all ${
                currency === curr
                  ? "bg-white text-slate-900 shadow-sm font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : "£ GBP"}
            </button>
          ))}
        </div>

        {/* Analyze Startup / Intake Button */}
        <button
          onClick={onOpenIntake}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all shadow-sm"
        >
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          <span>Analyze Your Startup</span>
        </button>

        {/* AI Explainer Button */}
        <button
          onClick={onOpenAI}
          className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-all shadow-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span>AI Insights</span>
        </button>

        {/* Export Dropdown / Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            title="Export monthly projection spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
            title="Download executive brief PDF"
          >
            <FileText className="h-3.5 w-3.5 text-slate-300" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};

