/**
 * VentureIQ API Client.
 */
import {
  ModelEngineInputs,
  EngineSimulationResult,
  ReversePlanRequest,
  ReversePlanResult,
  ScenarioComparisonResult,
} from "@/types/model";
import { simulateModelLocally, solveReversePlanLocally } from "./engine";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function runSimulation(inputs: ModelEngineInputs): Promise<EngineSimulationResult> {
  try {
    const res = await fetch(`${API_BASE}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Network or server unreachable: fallback to exact local engine
  }
  return simulateModelLocally(inputs);
}

export async function runReversePlan(
  baseInputs: ModelEngineInputs,
  planRequest: ReversePlanRequest
): Promise<ReversePlanResult> {
  try {
    const res = await fetch(`${API_BASE}/reverse-plan/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base_inputs: baseInputs,
        plan_request: planRequest,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Run pure client-side bounded optimizer when backend API is unreachable
  }
  return solveReversePlanLocally(baseInputs, planRequest);
}

export async function runSensitivityOneVar(
  baseInputs: ModelEngineInputs,
  variableName: string
) {
  const res = await fetch(`${API_BASE}/sensitivity/one-var`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_inputs: baseInputs,
      variable_name: variableName,
    }),
  });
  if (!res.ok) {
    throw new Error("Sensitivity analysis failed");
  }
  return await res.json();
}

export async function runSensitivityTwoVar(
  baseInputs: ModelEngineInputs,
  varX: string,
  varY: string,
  metricName: string = "month_12_arr"
) {
  const res = await fetch(`${API_BASE}/sensitivity/two-var`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_inputs: baseInputs,
      var_x: varX,
      var_y: varY,
      metric_name: metricName,
    }),
  });
  if (!res.ok) {
    throw new Error("Two-variable sensitivity failed");
  }
  return await res.json();
}

export async function runTornadoAnalysis(
  baseInputs: ModelEngineInputs,
  outcomeMetric: string = "month_12_arr"
) {
  const res = await fetch(`${API_BASE}/sensitivity/tornado`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_inputs: baseInputs,
      outcome_metric: outcomeMetric,
    }),
  });
  if (!res.ok) {
    throw new Error("Tornado analysis failed");
  }
  return await res.json();
}

export async function requestAIExplanation(
  inputs: ModelEngineInputs,
  query?: string,
  userApiKey?: string
): Promise<{ explanation: string; disclaimer?: string; model?: string }> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      inputs,
      query,
      userApiKey,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI explanation request failed (${res.status})`);
  }
  return await res.json();
}

export async function downloadCsvExport(
  inputs: ModelEngineInputs,
  exportType: "projections" | "assumptions" = "projections"
) {
  const res = await fetch(`${API_BASE}/export/csv?export_type=${exportType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });
  if (!res.ok) throw new Error("CSV Export failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventureiq_${inputs.company_name.toLowerCase().replace(/\s+/g, "_")}_${exportType}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function downloadPdfExport(inputs: ModelEngineInputs) {
  const res = await fetch(`${API_BASE}/export/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inputs),
  });
  if (!res.ok) throw new Error("PDF Export failed");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventureiq_${inputs.company_name.toLowerCase().replace(/\s+/g, "_")}_report.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

