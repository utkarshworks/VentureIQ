import { describe, it, expect } from "vitest";
import { formatCurrency, formatPercent, formatNumber, formatMonths } from "@/lib/formatters";

describe("Currency and Number Formatters", () => {
  it("formats Indian Rupee (INR) numbers into Lakhs and Crores when compact", () => {
    // 1 Crore = 10,000,000
    expect(formatCurrency(10000000, "INR", true)).toBe("₹1.00 Cr");
    // 2.5 Crores
    expect(formatCurrency(25000000, "INR", true)).toBe("₹2.50 Cr");
    // 50 Lakhs = 5,000,000
    expect(formatCurrency(5000000, "INR", true)).toBe("₹50.00 L");
    // 1.5 Lakhs = 150,000
    expect(formatCurrency(150000, "INR", true)).toBe("₹1.50 L");
    // 25 Thousands
    expect(formatCurrency(25000, "INR", true)).toBe("₹25.0k");
  });

  it("formats Indian Rupee (INR) full numbers with Indian commas", () => {
    const formatted = formatCurrency(10000000, "INR", false);
    // Should be ₹1,00,00,000
    expect(formatted).toBe("₹1,00,00,000");
  });

  it("formats International currencies (USD, EUR, GBP)", () => {
    expect(formatCurrency(1500000, "USD", true)).toBe("$1.50M");
    expect(formatCurrency(20000, "EUR", true)).toBe("€20.0k");
    expect(formatCurrency(5000, "GBP", true)).toBe("£5.0k");
  });

  it("handles null, undefined, and NaN gracefully without crashing", () => {
    expect(formatCurrency(null, "INR")).toBe("N/A");
    expect(formatCurrency(undefined, "USD")).toBe("N/A");
    expect(formatPercent(null)).toBe("N/A");
    expect(formatNumber(undefined)).toBe("N/A");
    expect(formatMonths(null)).toBe("Extends horizon");
  });

  it("formats percentages accurately", () => {
    expect(formatPercent(0.035, 1)).toBe("3.5%");
    expect(formatPercent(0.852, 1)).toBe("85.2%");
  });
});

