import { NextRequest, NextResponse } from "next/server";
import { ModelEngineInputs, EngineSummary } from "@/types/model";
import { simulateModelLocally } from "@/lib/engine";
import { generateAdvisoryAnalysis, StrategicHelpPriority } from "@/lib/advisoryEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputs: ModelEngineInputs = body.inputs;
    let summary: EngineSummary = body.summary;
    const query: string = body.query || "Provide an executive assessment of this financial plan and key strategic risks.";
    const helpPriority: StrategicHelpPriority = body.helpPriority || "runway_preservation";

    if (!inputs) {
      return NextResponse.json({ error: "Missing model inputs in request body" }, { status: 400 });
    }

    // Compute deterministic summary if not provided
    if (!summary) {
      const sim = simulateModelLocally(inputs);
      summary = sim.summary;
    }

    // Private rule-based advisory analysis without sending data to third parties
    const advisory = generateAdvisoryAnalysis(inputs, summary, query, helpPriority);

    const formattedResponse = `### 📊 ${advisory.title}
**Strategic Focus:** ${advisory.focusArea}

${advisory.executiveSummary}

---

#### 🔍 Key Invariant Audits
${advisory.keyMetricsAudited
  .map(
    (m) =>
      `- **${m.label}:** \`${m.value}\` *(Target: ${m.benchmark})* — ${
        m.status === "good" ? "✅ Optimal" : m.status === "warning" ? "🟡 Watchlist" : "🔴 Review Urgently"
      }`
  )
  .join("\n")}

---

#### 🧠 Strategic Diagnosis & Trade-Offs
${advisory.strategicDiagnosis.map((d) => `• ${d}`).join("\n\n")}

---

#### 🎯 Recommended Action Plan
${advisory.recommendedActions
  .map((a) => `**Step ${a.step}: ${a.action}**\n- *Expected Impact:* ${a.impact}\n- *Execution Horizon:* ${a.timeline}`)
  .join("\n\n")}`;

    return NextResponse.json({
      explanation: formattedResponse,
      advisory,
      disclaimer: advisory.disclaimer,
      model: "ventureiq-advisory-engine",
    });
  } catch (error: any) {
    console.error("Server error in /api/ai:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate financial advisory report." },
      { status: 500 }
    );
  }
}
