"use client";

import React, { useState, useEffect } from "react";

interface PercentageInputProps {
  label?: string;
  value: string | number; // Decimal ratio stored in parent state (e.g. 0.035 for 3.5%)
  onChange: (decimalRatio: string) => void;
  placeholder?: string;
  placeholderPercent?: string;
  placeholderDecimal?: string;
  helperText?: string;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
  id?: string;
}

/**
 * Purely Percentage-Driven Input Component.
 * Users enter standard percentage figures (e.g. 3.5 for 3.5%),
 * and it communicates decimal ratios (0.035) to parent states.
 * Free of cramped mode toggles so full labels remain crystal clear.
 */
export const PercentageInput: React.FC<PercentageInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "e.g. 3.5",
  placeholderPercent,
  helperText,
  disabled = false,
  compact = false,
  className = "",
  id,
}) => {
  const [localInput, setLocalInput] = useState<string>("");

  // Sync internal display when external decimal value updates
  useEffect(() => {
    if (value === undefined || value === null || value === "") {
      setLocalInput("");
      return;
    }

    const num = Number(value);
    if (isNaN(num)) {
      setLocalInput(String(value));
      return;
    }

    // Convert decimal to clean percentage string (0.035 -> "3.5")
    const pct = parseFloat((num * 100).toFixed(4));
    setLocalInput(String(pct));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalInput(raw);

    if (!raw.trim()) {
      onChange("");
      return;
    }

    // Clean any pasted % signs
    const cleaned = raw.replace("%", "").trim();
    const num = Number(cleaned);

    if (isNaN(num)) {
      onChange("");
      return;
    }

    // Convert percentage to decimal ratio (3.5% -> 0.035)
    const decimalVal = parseFloat((num / 100).toFixed(6));
    onChange(String(decimalVal));
  };

  const effectivePlaceholder = placeholderPercent || placeholder;
  const paddingClass = compact ? "py-1.5 pl-2.5 pr-6 text-xs" : "h-10 pl-3 pr-8 text-xs";

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-700 block">
          {label}
        </label>
      )}

      <div className="relative rounded-xl shadow-xs">
        <input
          id={id}
          type="number"
          step="any"
          min="0"
          disabled={disabled}
          value={localInput}
          onChange={handleInputChange}
          placeholder={effectivePlaceholder}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all disabled:opacity-50 ${paddingClass}`}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
          <span className="text-xs font-bold text-slate-400">%</span>
        </div>
      </div>

      {helperText && (
        <span className="text-[10px] text-slate-400 block leading-tight">{helperText}</span>
      )}
    </div>
  );
};
