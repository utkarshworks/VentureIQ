"use client";

import React, { useState, useEffect } from "react";

interface PercentageInputProps {
  label: string;
  value: string; // The decimal value stored in parent state (e.g. "0.035" for 3.5%)
  onChange: (decimalRatio: string) => void;
  placeholderPercent?: string;
  placeholderDecimal?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const PercentageInput: React.FC<PercentageInputProps> = ({
  label,
  value,
  onChange,
  placeholderPercent = "e.g. 3.5",
  placeholderDecimal = "e.g. 0.035",
  helperText,
  disabled = false,
  className = "",
  id,
}) => {
  // Mode toggle: 'percent' (e.g. 3.5%) vs 'decimal' (e.g. 0.035)
  const [mode, setMode] = useState<"percent" | "decimal">("percent");
  const [localInput, setLocalInput] = useState<string>("");

  // Keep local input in sync when external decimal value changes
  useEffect(() => {
    if (!value || value === "") {
      setLocalInput("");
      return;
    }

    const num = Number(value);
    if (isNaN(num)) {
      setLocalInput(value);
      return;
    }

    if (mode === "percent") {
      // e.g. 0.035 -> 3.5
      // Clean up floating point precision issues like 0.035 * 100 = 3.5000000000000004
      const pct = parseFloat((num * 100).toFixed(4));
      setLocalInput(String(pct));
    } else {
      setLocalInput(String(num));
    }
  }, [value, mode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalInput(raw);

    if (!raw.trim()) {
      onChange("");
      return;
    }

    // Check if user accidentally pasted '%' sign
    const cleaned = raw.replace("%", "").trim();
    const num = Number(cleaned);

    if (isNaN(num)) {
      onChange("");
      return;
    }

    if (mode === "percent") {
      // 3.5% -> 0.035
      const decimalVal = parseFloat((num / 100).toFixed(6));
      onChange(String(decimalVal));
    } else {
      onChange(String(num));
    }
  };

  const handleModeSwitch = (newMode: "percent" | "decimal") => {
    if (newMode === mode) return;
    setMode(newMode);
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 truncate">
          {label}
        </label>
        
        {/* % vs Decimal Toggle Pills */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[10px] shrink-0 font-bold">
          <button
            type="button"
            onClick={() => handleModeSwitch("percent")}
            className={`rounded px-1.5 py-0.5 transition-all ${
              mode === "percent"
                ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Enter as Percentage (e.g. 3.5%)"
          >
            % Percent
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch("decimal")}
            className={`rounded px-1.5 py-0.5 transition-all ${
              mode === "decimal"
                ? "bg-white text-emerald-800 shadow-sm border border-slate-200/60"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Enter as Decimal Ratio (e.g. 0.035)"
          >
            0.xx Decimal
          </button>
        </div>
      </div>

      <div className="relative flex items-center">
        <input
          id={id}
          type="number"
          step={mode === "percent" ? "0.1" : "0.005"}
          min="0"
          value={localInput}
          onChange={handleInputChange}
          placeholder={mode === "percent" ? placeholderPercent : placeholderDecimal}
          disabled={disabled}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-3 pr-10 text-xs font-semibold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
        />
        <span className="absolute right-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
          {mode === "percent" ? "%" : "dec"}
        </span>
      </div>

      {helperText && <span className="text-[10px] text-slate-400 block">{helperText}</span>}
    </div>
  );
};

