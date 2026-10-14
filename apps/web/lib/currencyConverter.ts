import { CurrencyCode, ModelEngineInputs } from "@/types/model";

// Default base exchange rates against 1 USD
export const BASE_FALLBACK_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  INR: 86.8, // 1 USD = 86.8 INR
  EUR: 0.92, // 1 USD = 0.92 EUR
  GBP: 0.77, // 1 USD = 0.77 GBP
};

let cachedRates: Record<CurrencyCode, number> = { ...BASE_FALLBACK_RATES };
let lastFetchTime = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live exchange rates from open exchange API.
 * Uses cached rates or fallback if offline or request fails.
 */
export async function fetchLiveExchangeRates(): Promise<Record<CurrencyCode, number>> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_DURATION_MS && cachedRates.USD === 1.0) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      cache: "force-cache",
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        cachedRates = {
          USD: 1.0,
          INR: typeof data.rates.INR === "number" ? data.rates.INR : BASE_FALLBACK_RATES.INR,
          EUR: typeof data.rates.EUR === "number" ? data.rates.EUR : BASE_FALLBACK_RATES.EUR,
          GBP: typeof data.rates.GBP === "number" ? data.rates.GBP : BASE_FALLBACK_RATES.GBP,
        };
        lastFetchTime = now;
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("ventureiq_rates", JSON.stringify(cachedRates));
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn("Could not fetch live exchange rates, falling back to cached/pegged rates:", err);
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("ventureiq_rates");
        if (stored) {
          cachedRates = { ...BASE_FALLBACK_RATES, ...JSON.parse(stored) };
        }
      }
    } catch {}
  }
  return cachedRates;
}

/**
 * Get multiplier to convert an amount from `fromCurr` to `toCurr`.
 */
export function getExchangeRate(fromCurr: CurrencyCode, toCurr: CurrencyCode): number {
  if (fromCurr === toCurr) return 1.0;
  const rates = cachedRates;
  const fromRateToUsd = rates[fromCurr] || BASE_FALLBACK_RATES[fromCurr] || 1;
  const toRateToUsd = rates[toCurr] || BASE_FALLBACK_RATES[toCurr] || 1;
  return toRateToUsd / fromRateToUsd;
}

/**
 * Converts a specific monetary amount from one currency to another with smart rounding.
 */
export function convertAmount(
  amount: number,
  fromCurr: CurrencyCode,
  toCurr: CurrencyCode,
  precision: "auto" | "round" | "cents" = "auto"
): number {
  if (fromCurr === toCurr || !amount || isNaN(amount)) return amount;
  const rate = getExchangeRate(fromCurr, toCurr);
  const converted = amount * rate;

  if (precision === "cents") {
    return Math.round(converted * 100) / 100;
  }
  if (precision === "round") {
    return Math.round(converted);
  }
  // Auto precision: if converted number < 10, keep 2 decimals, else round to integer
  if (Math.abs(converted) < 10) {
    return Math.round(converted * 100) / 100;
  }
  return Math.round(converted);
}

/**
 * Converts all monetary properties of a ModelEngineInputs structure.
 * Non-monetary parameters (customer counts, lead counts, churn %, conversion %, months) are left strictly untouched.
 */
export function convertModelInputs(
  inputs: ModelEngineInputs,
  fromCurr: CurrencyCode,
  toCurr: CurrencyCode
): ModelEngineInputs {
  if (fromCurr === toCurr) return inputs;

  const scale = (val: number, precision: "auto" | "round" | "cents" = "auto") => {
    if (val === undefined || val === null || isNaN(val) || val === 0) return val;
    return convertAmount(val, fromCurr, toCurr, precision);
  };

  return {
    ...inputs,
    currency: toCurr,
    arpu: scale(inputs.arpu, "auto"),
    initial_cash_balance: scale(inputs.initial_cash_balance, "round"),
    minimum_cash_reserve: scale(inputs.minimum_cash_reserve, "round"),
    cost_per_lead: scale(inputs.cost_per_lead, "auto"),
    acquisition_budget: scale(inputs.acquisition_budget, "round"),
    target_cac: scale(inputs.target_cac, "auto"),
    fixed_marketing_ops: scale(inputs.fixed_marketing_ops, "round"),
    hosting_fixed_cost: scale(inputs.hosting_fixed_cost, "round"),
    hosting_cost_per_customer: scale(inputs.hosting_cost_per_customer, "auto"),
    servicing_cost_per_customer: scale(inputs.servicing_cost_per_customer, "auto"),
    fixed_opex: scale(inputs.fixed_opex, "round"),
    hiring_roles: (inputs.hiring_roles || []).map((role) => ({
      ...role,
      monthly_salary: scale(role.monthly_salary, "round"),
    })),
    financing_events: (inputs.financing_events || []).map((event) => ({
      ...event,
      amount: scale(event.amount, "round"),
    })),
  };
}

