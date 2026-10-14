"use client";

import React, { useState, useRef, useEffect } from "react";
import { CurrencyCode } from "@/types/model";
import { Download, FileText, Sparkles, TrendingUp, Building2, Menu, X, MoreVertical } from "lucide-react";

interface NavbarProps {
  companyName: string;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onOpenIntake: () => void;
  onOpenAI: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  onToggleMobileNav?: () => void;
  isMobileNavOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  companyName,
  currency,
  onCurrencyChange,
  onOpenIntake,
  onOpenAI,
  onExportCsv,
  onExportPdf,
  onToggleMobileNav,
  isMobileNavOpen,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur shadow-sm">
      {/* Left: Hamburger & Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            title="Toggle Navigation Menu"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        )}

        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm ring-1 ring-slate-800 shrink-0">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">VentureIQ</span>
            <span className="hidden sm:inline rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
              v1.0 Production
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[110px] sm:max-w-xs">
            <span className="hidden xs:inline">Active: </span>
            <span className="font-semibold text-slate-800">{companyName}</span>
          </p>
        </div>
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Desktop Currency Selector */}
        <div className="hidden sm:flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-0.5 text-xs font-medium">
          {(["INR", "USD", "EUR", "GBP"] as CurrencyCode[]).map((curr) => (
            <button
              key={curr}
              onClick={() => onCurrencyChange(curr)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-all ${
                currency === curr
                  ? "bg-white text-slate-900 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : curr === "EUR" ? "€ EUR" : "£ GBP"}
            </button>
          ))}
        </div>

        {/* Mobile Currency Dropdown */}
        <div className="sm:hidden">
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="rounded-lg border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
            aria-label="Select Currency"
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>

        {/* Company Assessment Wizard Button (Desktop) */}
        <button
          onClick={onOpenIntake}
          className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
          title="Retake company assessment or switch data"
        >
          <Building2 className="h-3.5 w-3.5 text-emerald-600" />
          <span>Company Assessment</span>
        </button>

        {/* Strategic Advisory Copilot Spotlight Button */}
        <button
          onClick={onOpenAI}
          className="relative group flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:shadow-lg hover:shadow-emerald-600/35 transition-all hover:scale-[1.02] active:scale-[0.98] ring-1 ring-emerald-400/30 shrink-0"
          title="Open VentureIQ CFO Strategic Memorandum"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
          </span>
          <Sparkles className="h-3.5 w-3.5 text-emerald-300 animate-pulse" />
          <span className="hidden sm:inline">Executive CFO Advisor</span>
          <span className="sm:hidden">Advisor</span>
          <span className="hidden lg:inline text-[9px] bg-white/20 px-1.5 py-0.5 rounded text-emerald-100 font-extrabold uppercase tracking-wider">
            1-Click Brief
          </span>
        </button>

        {/* Desktop Export Buttons */}
        <div className="hidden md:flex items-center gap-1.5">
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            title="Export monthly projection CSV spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
            title="Download executive brief PDF"
          >
            <FileText className="h-3.5 w-3.5 text-emerald-400" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Mobile Actions Dropdown Trigger (visible on < md) */}
        <div className="relative md:hidden" ref={menuRef}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
            title="More Options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {isMobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenIntake();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span>Assessment Wizard</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onExportPdf();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <FileText className="h-4 w-4 text-emerald-600" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onExportCsv();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Download className="h-4 w-4 text-slate-500" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
