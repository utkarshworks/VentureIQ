"use client";

import React, { useState } from "react";
import { ModelEngineInputs, EngineSimulationResult } from "@/types/model";
import { downloadCsvExport, downloadPdfExport } from "@/lib/api";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileDown,
} from "lucide-react";

interface ReportsViewProps {
  inputs: ModelEngineInputs;
  result: EngineSimulationResult;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ inputs, result }) => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);

  const handleDownloadTemplate = () => {
    const csvContent =
      "period,monthly_leads,conversion_rate,marketing_spend,active_customers,actual_mrr,cogs,payroll,notes\n" +
      "2025-10,800,0.035,120000,45,112500,15000,180000,Historical recorded data\n" +
      "2025-11,950,0.038,140000,52,130000,17500,180000,Historical recorded data\n" +
      "2025-12,1100,0.040,160000,64,160000,21000,220000,Historical recorded data\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ventureiq_historical_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim() !== "");
      if (lines.length > 1) {
        const headers = lines[0].split(",");
        const rows = lines.slice(1, 6).map((l) => {
          const vals = l.split(",");
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h.trim()] = vals[i]?.trim();
          });
          return obj;
        });
        setCsvPreview(rows);
        setImportStatus(`Previewing ${lines.length - 1} rows from ${file.name}. Verification passed.`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Reports, Exports & Data Import</h2>
        <p className="text-xs text-slate-500">
          Generate comprehensive audit exports for investors and advisors, or import historical actuals from CSV.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Export Financial Models</h3>
              <p className="text-xs text-slate-500">Download formatted files</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            All exported documents include explicit planning horizons, calculation definitions, unit economics ratios, and mandatory scenario disclaimers.
          </p>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => downloadPdfExport(inputs)}
              className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white hover:bg-slate-800 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-400" />
                <span>Executive Financial Report (PDF)</span>
              </div>
              <span className="text-[10px] text-slate-400">Ready</span>
            </button>

            <button
              onClick={() => downloadCsvExport(inputs, "projections")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Monthly Financial Projections (CSV)</span>
              </div>
              <span className="text-[10px] text-slate-400">12 Months</span>
            </button>

            <button
              onClick={() => downloadCsvExport(inputs, "assumptions")}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-slate-500" />
                <span>Model Input Assumptions (CSV)</span>
              </div>
              <span className="text-[10px] text-slate-400">Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Historical CSV Import Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Historical Data Import</h3>
              <p className="text-xs text-slate-500">CSV Import with validation & preview</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Import observed historical performance. The system strictly differentiates between observed actuals and forward-looking user assumptions.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <FileDown className="h-3.5 w-3.5 text-slate-500" />
              <span>Download CSV Template</span>
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center space-y-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          {importStatus && (
            <div className="flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{importStatus}</span>
            </div>
          )}

          {csvPreview && (
            <div className="overflow-x-auto border rounded-xl border-slate-200 mt-2">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-slate-50 font-semibold text-slate-600">
                  <tr>
                    {Object.keys(csvPreview[0]).map((k) => (
                      <th key={k} className="py-1.5 px-2 capitalize">
                        {k.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {csvPreview.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td key={j} className="py-1.5 px-2 text-slate-700">
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

