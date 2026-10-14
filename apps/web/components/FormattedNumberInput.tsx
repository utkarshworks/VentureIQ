"use client";

import React from "react";
import { formatWithCommas, parseCommaSeparated, formatCurrency } from "@/lib/formatters";

interface FormattedNumberInputProps {
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  currency?: string;
  isCurrency?: boolean;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({
  value,
  onChange,
  placeholder = "Enter value",
  currency = "INR",
  isCurrency = false,
  disabled = false,
  className = "",
  id,
}) => {
  const displayValue = formatWithCommas(value, currency);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseCommaSeparated(e.target.value);
    onChange(raw);
  };

  const numVal = Number(value);
  const showCompactHint = isCurrency && !isNaN(numVal) && numVal >= 10000;

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        {isCurrency && (
          <span className="absolute left-3 text-xs font-bold text-slate-400 select-none pointer-events-none">
            {currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : "£"}
          </span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-semibold text-slate-900 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 ${
            isCurrency ? "pl-7 pr-3" : "px-3"
          } ${className}`}
        />
        {showCompactHint && (
          <span className="absolute right-3 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 pointer-events-none select-none">
            {formatCurrency(numVal, currency, true)}
          </span>
        )}
      </div>
    </div>
  );
};

