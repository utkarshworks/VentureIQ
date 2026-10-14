"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, X, Check, Trash2, Cookie, Sliders, Info } from "lucide-react";

export interface CookiePreferences {
  essential: boolean; // Always true
  functional: boolean;
  advisoryMemory: boolean;
}

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePreferences?: (prefs: CookiePreferences) => void;
}

export const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  onSavePreferences,
}) => {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    advisoryMemory: true,
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [clearConfirm, setClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("ventureiq_cookie_preferences");
      if (stored) {
        setPreferences({ ...JSON.parse(stored), essential: true });
      }
    } catch {}
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    try {
      localStorage.setItem("ventureiq_cookie_preferences", JSON.stringify(preferences));
      localStorage.setItem("ventureiq_cookie_consent", "configured");
    } catch {}
    onSavePreferences?.(preferences);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearAllStorage = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-3 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shadow-sm shrink-0">
              <Cookie className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Cookie &amp; Local Storage Preferences</h3>
              <p className="text-[11px] text-slate-500">
                Control client-side data persistence and browser storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Privacy Invariant Banner */}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 text-xs text-slate-700 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 text-xs">100% Client-Side Privacy Architecture</span>
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              VentureIQ does not sell data, track browsing across external sites, or utilize invasive advertising cookies. Browser storage is used strictly to retain your model simulations, session settings, and live foreign exchange rates.
            </p>
          </div>
        </div>

        {/* Preference Categories */}
        <div className="space-y-2">
          {/* Category 1: Strictly Necessary */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">1. Strictly Necessary Storage</span>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-700 uppercase tracking-wider">
                  Always Active
                </span>
              </div>
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="h-4 w-4 accent-emerald-600 cursor-not-allowed opacity-80"
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Required to persist your financial inputs (ARPU, burn, cash reserves, hiring plans) across browser refreshes. Without this storage, your assessment data cannot be rendered into dynamic simulation charts.
            </p>
            <span className="text-[9.5px] text-slate-400 font-mono block">
              Storage Keys: ventureiq_user_inputs, ventureiq_decision_goal, ventureiq_assessment_completed
            </span>
          </div>

          {/* Category 2: Functional & Currency */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">2. Currency &amp; Live Rates Cache</span>
                <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Functional
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={(e) => setPreferences((p) => ({ ...p, functional: e.target.checked }))}
                className="h-4 w-4 accent-emerald-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Caches real-time foreign exchange market rates (USD/INR/EUR/GBP) locally to prevent redundant external API network calls and speed up instant currency conversion on your dashboard.
            </p>
            <span className="text-[9.5px] text-slate-400 font-mono block">
              Storage Keys: ventureiq_rates
            </span>
          </div>

          {/* Category 3: Advisory Session Memory */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">3. Advisory Copilot Query Quota</span>
                <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Performance
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences.advisoryMemory}
                onChange={(e) => setPreferences((p) => ({ ...p, advisoryMemory: e.target.checked }))}
                className="h-4 w-4 accent-emerald-600 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Maintains your private strategic query status and local daily rate-limiting counter on device to prevent accidental infinite query looping.
            </p>
            <span className="text-[9.5px] text-slate-400 font-mono block">
              Storage Keys: ventureiq_ai_usage
            </span>
          </div>
        </div>

        {/* Clear All Stored Data Option */}
        <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 text-xs font-bold">
              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
              <span>Reset &amp; Purge Stored Browser Data</span>
            </div>
            {!clearConfirm ? (
              <button
                type="button"
                onClick={() => setClearConfirm(true)}
                className="rounded-lg border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
              >
                Clear Data
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleClearAllStorage}
                  className="rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-rose-700 transition-colors"
                >
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => setClearConfirm(false)}
                  className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <p className="text-[10px] text-rose-800/80 leading-relaxed">
            Deletes all saved financial model inputs, goals, and exchange cache from this device.
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            {savedSuccess ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Sliders className="h-3.5 w-3.5" />}
            <span>{savedSuccess ? "Preferences Saved!" : "Save Preferences"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
