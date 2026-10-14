/**
 * VentureIQ - Client-Side AI Rate Limiting Utility.
 * Enforces a daily limit of 5 AI queries per browser via localStorage.
 * Resets daily at midnight local time.
 */

export const DAILY_LIMIT = 5;
export const STORAGE_KEY = "ventureiq_ai_daily_usage";
export const QUOTA_EXCEEDED_MESSAGE =
  "You've used your 5 daily demo AI questions. Deterministic calculations and PDF generation remain unlimited!";

export interface RateLimitStatus {
  count: number;
  remaining: number;
  limit: number;
  isQuotaExceeded: boolean;
  date: string;
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getAiRateLimitStatus(): RateLimitStatus {
  if (typeof window === "undefined") {
    return {
      count: 0,
      remaining: DAILY_LIMIT,
      limit: DAILY_LIMIT,
      isQuotaExceeded: false,
      date: getTodayKey(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const today = getTodayKey();
    if (!raw) {
      return {
        count: 0,
        remaining: DAILY_LIMIT,
        limit: DAILY_LIMIT,
        isQuotaExceeded: false,
        date: today,
      };
    }
    const parsed = JSON.parse(raw);
    if (parsed.date !== today) {
      // New day: reset usage
      const fresh = { date: today, count: 0 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return {
        count: 0,
        remaining: DAILY_LIMIT,
        limit: DAILY_LIMIT,
        isQuotaExceeded: false,
        date: today,
      };
    }
    const count = Number(parsed.count) || 0;
    const remaining = Math.max(0, DAILY_LIMIT - count);
    return {
      count,
      remaining,
      limit: DAILY_LIMIT,
      isQuotaExceeded: count >= DAILY_LIMIT,
      date: today,
    };
  } catch {
    return {
      count: 0,
      remaining: DAILY_LIMIT,
      limit: DAILY_LIMIT,
      isQuotaExceeded: false,
      date: getTodayKey(),
    };
  }
}

export function incrementAiUsage(): RateLimitStatus {
  if (typeof window === "undefined") {
    return {
      count: 1,
      remaining: DAILY_LIMIT - 1,
      limit: DAILY_LIMIT,
      isQuotaExceeded: false,
      date: getTodayKey(),
    };
  }
  try {
    const status = getAiRateLimitStatus();
    const newCount = status.count + 1;
    const updated = { date: status.date, count: newCount };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return {
      count: newCount,
      remaining: Math.max(0, DAILY_LIMIT - newCount),
      limit: DAILY_LIMIT,
      isQuotaExceeded: newCount >= DAILY_LIMIT,
      date: status.date,
    };
  } catch {
    return {
      count: 1,
      remaining: DAILY_LIMIT - 1,
      limit: DAILY_LIMIT,
      isQuotaExceeded: false,
      date: getTodayKey(),
    };
  }
}

