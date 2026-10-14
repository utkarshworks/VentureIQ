/**
 * VentureIQ Currency and Number Formatters.
 * Supports Indian Numbering System (Lakhs, Crores) and International formatting.
 */

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "INR",
  compact: boolean = false
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A";
  }

  const symbolMap: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const sym = symbolMap[currency] || `${currency} `;

  if (compact) {
    if (currency === "INR") {
      const absVal = Math.abs(amount);
      const sign = amount < 0 ? "-" : "";
      if (absVal >= 10000000) {
        return `${sign}${sym}${(absVal / 10000000).toFixed(2)} Cr`;
      }
      if (absVal >= 100000) {
        return `${sign}${sym}${(absVal / 100000).toFixed(2)} L`;
      }
      if (absVal >= 1000) {
        return `${sign}${sym}${(absVal / 1000).toFixed(1)}k`;
      }
      return `${sign}${sym}${absVal.toFixed(0)}`;
    } else {
      const absVal = Math.abs(amount);
      const sign = amount < 0 ? "-" : "";
      if (absVal >= 1000000) {
        return `${sign}${sym}${(absVal / 1000000).toFixed(2)}M`;
      }
      if (absVal >= 1000) {
        return `${sign}${sym}${(absVal / 1000).toFixed(1)}k`;
      }
      return `${sign}${sym}${absVal.toFixed(0)}`;
    }
  }

  // Full formatted representation
  if (currency === "INR") {
    // Indian locale grouping (e.g. 1,00,000)
    return `${sym}${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    })}`;
  }

  return `${sym}${amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })}`;
}

export function formatPercent(
  ratio: number | null | undefined,
  decimals: number = 1
): string {
  if (ratio === null || ratio === undefined || isNaN(ratio)) {
    return "N/A";
  }
  return `${(ratio * 100).toFixed(decimals)}%`;
}

export function formatNumber(
  val: number | null | undefined,
  decimals: number = 0
): string {
  if (val === null || val === undefined || isNaN(val)) {
    return "N/A";
  }
  return val.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

export function formatMonths(
  months: number | null | undefined,
  fallback: string = "Extends horizon"
): string {
  if (months === null || months === undefined || isNaN(months)) {
    return fallback;
  }
  return `${months.toFixed(1)} mos`;
}

