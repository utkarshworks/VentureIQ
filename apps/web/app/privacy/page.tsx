"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Cookie,
  Database,
  ArrowLeft,
  Sliders,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Server,
  FileText,
} from "lucide-react";
import { CookiePreferencesModal } from "@/components/CookiePreferencesModal";

export default function PrivacyPolicyPage() {
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  const handleClearData = () => {
    try {
      localStorage.clear();
      setClearedSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 1200);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">VentureIQ</span>
              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                Privacy &amp; Cookie Architecture
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreferencesOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Sliders className="h-3.5 w-3.5 text-emerald-600" />
            <span>Manage Preferences</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-slate-300" />
            <span>Return to App</span>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto p-6 sm:p-10 space-y-8">
        {/* Page Title & Hero */}
        <div className="space-y-2 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider">
              Transparency &amp; Governance
            </span>
            <span className="text-xs text-slate-400">Last Updated: October 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Privacy Policy &amp; Client-Side Cookie Disclosure
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            VentureIQ is built on a <strong>100% Client-Side Privacy Architecture</strong>. Your financial plans, cash balances, and revenue assumptions remain securely stored inside your local browser.
          </p>
        </div>

        {/* Quick Management Action Card */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Full User Data Sovereignty</span>
            </h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              You maintain total control over your data. Adjust functional storage permissions or purge all local browser data with one click.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPreferencesOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Configure Cookies</span>
            </button>
            {!clearConfirm ? (
              <button
                onClick={() => setClearConfirm(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge Data</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClearData}
                  className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 transition-all"
                >
                  {clearedSuccess ? "Purged!" : "Confirm Purge"}
                </button>
                <button
                  onClick={() => setClearConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Core Privacy Principles */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-600" />
            <span>1. Core Privacy Invariants</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-bold text-slate-900">Zero Cloud Database Storage</span>
              <p className="text-slate-600 leading-relaxed">
                Your financial numbers (salaries, ARR, customer counts) are never stored in a centralized cloud database. Projections run locally via deterministic client-side mathematical algorithms.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-bold text-slate-900">No Third-Party Advertising Profiling</span>
              <p className="text-slate-600 leading-relaxed">
                VentureIQ contains zero third-party advertising tracking scripts, retargeting pixels, or data brokers. We do not sell or monetize personal information.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5 shadow-sm">
              <span className="font-bold text-slate-900">Private Strategic Advisory</span>
              <p className="text-slate-600 leading-relaxed">
                The Strategic Advisory Copilot formulates executive insights and ratio audits directly within our private mathematical decision engine. Financial data is never used to train public machine learning models.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Detailed Cookie & Storage Table */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cookie className="h-4 w-4 text-emerald-600" />
            <span>2. Local Storage &amp; Cookie Inventory</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The table below outlines all local storage keys and browser cookies utilized by VentureIQ, their classification, purpose, and expiration period:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Storage Key</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Purpose</th>
                  <th className="py-2.5 px-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">ventureiq_user_inputs</td>
                  <td className="py-2 px-3">localStorage</td>
                  <td className="py-2 px-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                      Essential
                    </span>
                  </td>
                  <td className="py-2 px-3">Stores active financial model inputs (revenue, headcount, burn rate).</td>
                  <td className="py-2 px-3">Persistent (Until cleared)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">ventureiq_assessment_completed</td>
                  <td className="py-2 px-3">localStorage</td>
                  <td className="py-2 px-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                      Essential
                    </span>
                  </td>
                  <td className="py-2 px-3">Remembers whether founder completed initial 5-step intake.</td>
                  <td className="py-2 px-3">Persistent</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">ventureiq_rates</td>
                  <td className="py-2 px-3">localStorage</td>
                  <td className="py-2 px-3">
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      Functional
                    </span>
                  </td>
                  <td className="py-2 px-3">Caches real-time foreign exchange rates (USD/INR/EUR/GBP) for 1 hour.</td>
                  <td className="py-2 px-3">1 Hour Refresh</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">ventureiq_cookie_preferences</td>
                  <td className="py-2 px-3">localStorage</td>
                  <td className="py-2 px-3">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                      Essential
                    </span>
                  </td>
                  <td className="py-2 px-3">Saves your chosen privacy preferences and storage toggles.</td>
                  <td className="py-2 px-3">Persistent</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-mono font-medium text-slate-900">ventureiq_ai_usage</td>
                  <td className="py-2 px-3">localStorage</td>
                  <td className="py-2 px-3">
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                      Performance
                    </span>
                  </td>
                  <td className="py-2 px-3">Enforces local daily advisory rate limits to prevent loop exhaustion.</td>
                  <td className="py-2 px-3">Daily (24h)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Regulatory Compliance (GDPR, CCPA, DPDPA) */}
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-600" />
            <span>3. Regulatory Compliance &amp; Rights</span>
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3 text-xs text-slate-600 leading-relaxed">
            <p>
              In compliance with global data protection frameworks including the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and India&apos;s Digital Personal Data Protection Act (DPDPA):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li><strong>Right to Rectification:</strong> Edit financial variables anytime via the Model Editor or Assessment Wizard.</li>
              <li><strong>Right to Erasure:</strong> Purge all stored records instantly using the &ldquo;Purge Data&rdquo; button above.</li>
              <li><strong>Right to Restrict Processing:</strong> Disable non-essential functional and cache storage via the Cookie Preferences panel.</li>
              <li><strong>Data Portability:</strong> Export your complete financial statements as standardized CSV spreadsheets or executive PDF memoranda at any time.</li>
            </ul>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          Deterministic Financial Invariant Engine • 100% Client-Side Simulation • VentureIQ Production v1.0
        </footer>
      </main>

      <CookiePreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        onSavePreferences={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
}

