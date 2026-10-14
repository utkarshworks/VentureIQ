"use client";

import React, { useState, useEffect } from "react";
import { Cookie, ShieldCheck, Sliders, X } from "lucide-react";
import Link from "next/link";
import { CookiePreferencesModal, CookiePreferences } from "./CookiePreferencesModal";

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("ventureiq_cookie_consent");
      if (!consent) {
        // Small delay to prevent layout pop on immediate load
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem("ventureiq_cookie_consent", "all");
      localStorage.setItem(
        "ventureiq_cookie_preferences",
        JSON.stringify({ essential: true, functional: true, advisoryMemory: true })
      );
    } catch {}
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    try {
      localStorage.setItem("ventureiq_cookie_consent", "essential");
      localStorage.setItem(
        "ventureiq_cookie_preferences",
        JSON.stringify({ essential: true, functional: false, advisoryMemory: false })
      );
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible && !isPreferencesOpen) return null;

  return (
    <>
      {isVisible && (
        <aside
          aria-label="Privacy & Cookie Consent"
          className="fixed bottom-3 inset-x-3 sm:bottom-4 sm:left-6 sm:right-auto sm:max-w-lg z-40 rounded-2xl border border-slate-200 bg-white/98 p-3.5 sm:p-5 shadow-2xl backdrop-blur-md space-y-2.5 sm:space-y-3 animate-in slide-in-from-bottom-5 duration-200 ring-1 ring-slate-900/5"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shrink-0 shadow-sm">
                <Cookie className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Privacy &amp; Storage Notice</span>
                  <span className="rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.2 text-[9px] font-bold border border-emerald-200">
                    100% Client-Side
                  </span>
                </h4>
                <p className="text-[10px] text-slate-500">Zero third-party tracking or ad profiling</p>
              </div>
            </div>
            <button
              onClick={handleEssentialOnly}
              className="text-slate-400 hover:text-slate-600 p-1.5 -mr-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Dismiss Notice"
              aria-label="Dismiss Notice"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
            VentureIQ stores your financial model inputs, currency conversion cache, and assessment responses locally on your browser. No financial data is ever shared with external third parties.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[11px]">
              <Link
                href="/privacy"
                className="text-slate-500 hover:text-slate-900 font-medium underline underline-offset-2 transition-colors"
              >
                Cookie &amp; Privacy Policy
              </Link>
              <span className="text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setIsPreferencesOpen(true)}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
              >
                <Sliders className="h-3 w-3" />
                <span>Manage</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleEssentialOnly}
                className="flex-1 sm:flex-initial rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm text-center"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="flex-1 sm:flex-initial rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm text-center"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Modal */}
      <CookiePreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        onSavePreferences={() => {
          setIsVisible(false);
          setIsPreferencesOpen(false);
        }}
      />
    </>
  );
};

