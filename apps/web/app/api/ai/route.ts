import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ModelEngineInputs, EngineSummary } from "@/types/model";
import { simulateModelLocally } from "@/lib/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const inputs: ModelEngineInputs = body.inputs;
    let summary: EngineSummary = body.summary;
    const query: string = body.query || "Provide an executive assessment of this financial plan and key strategic risks.";
    const userApiKey: string | undefined = body.userApiKey;

    if (!inputs) {
      return NextResponse.json({ error: "Missing model inputs in request body" }, { status: 400 });
    }

    // If summary not provided, compute deterministically
    if (!summary) {
      const sim = simulateModelLocally(inputs);
      summary = sim.summary;
    }

    const apiKey = (userApiKey && userApiKey.trim().length > 0) ? userApiKey.trim() : process.env.GEMINI_API_KEY;

    // Grounding payload constructed purely from deterministic numbers
    const financialContext = `
COMPANY PROFILE:
- Company Name: ${inputs.company_name}
- Business Model: ${inputs.business_model.replace(/_/g, " ").toUpperCase()}
- Currency: ${inputs.currency}
- Planning Horizon: ${inputs.planning_horizon} Months
- Starting Cash: ${inputs.currency} ${inputs.initial_cash_balance.toLocaleString()}
- Minimum Cash Reserve: ${inputs.currency} ${inputs.minimum_cash_reserve.toLocaleString()}
- Starting Customers: ${inputs.initial_paying_customers}
- Monthly ARPU: ${inputs.currency} ${inputs.arpu.toLocaleString()}
- Monthly Churn Rate: ${(inputs.customer_churn_rate * 100).toFixed(1)}%
- Monthly Marketing/Acquisition Spend: ${inputs.currency} ${inputs.acquisition_budget.toLocaleString()}

COMPUTED DETERMINISTIC PROJECTIONS & UNIT ECONOMICS:
- Month 12 ARR Run Rate: ${inputs.currency} ${Math.round(summary.final_month_arr).toLocaleString()}
- Month 12 MRR: ${inputs.currency} ${Math.round(summary.final_month_mrr).toLocaleString()}
- Month 12 Closing Customers: ${Math.round(summary.final_month_customers)}
- Ending Cash Balance: ${inputs.currency} ${Math.round(summary.ending_cash).toLocaleString()}
- Peak Cash Deficit: ${inputs.currency} ${Math.round(summary.peak_cash_deficit).toLocaleString()}
- Runway Status: ${summary.runway_status} (${summary.runway_months !== null ? `${summary.runway_months} months until reserve breached` : `Healthy (> ${inputs.planning_horizon} months)`})
- Average Gross Margin: ${(summary.average_gross_margin_pct * 100).toFixed(1)}%
- Average Contribution Margin: ${(summary.average_contribution_margin_pct * 100).toFixed(1)}%
- Blended CAC: ${summary.blended_cac_final ? `${inputs.currency} ${Math.round(summary.blended_cac_final).toLocaleString()}` : "N/A"}
- Simplified LTV: ${summary.simplified_ltv_final ? `${inputs.currency} ${Math.round(summary.simplified_ltv_final).toLocaleString()}` : "N/A"}
- LTV : CAC Ratio: ${summary.ltv_to_cac_ratio_final ? `${summary.ltv_to_cac_ratio_final.toFixed(1)}x` : "N/A"}
- CAC Payback Period: ${summary.cac_payback_final ? `${summary.cac_payback_final.toFixed(1)} Months` : "N/A"}
- Break-Even Month: ${summary.break_even_month ? `Month ${summary.break_even_month}` : "Not reached within planning horizon"}
`;

    if (!apiKey) {
      // Deterministic fallback response when no Gemini API key is configured
      const isSolvent = summary.ending_cash >= inputs.minimum_cash_reserve;
      const ltvHealthy = summary.ltv_to_cac_ratio_final && summary.ltv_to_cac_ratio_final >= 3.0;
      const paybackHealthy = summary.cac_payback_final && summary.cac_payback_final <= 12.0;

      const fallbackExplanation = `### 📊 Deterministic Financial Assessment (${inputs.company_name})

**1. Solvency & Cash Runway Analysis:**
- Ending Cash: **${inputs.currency} ${Math.round(summary.ending_cash).toLocaleString()}** (Min Reserve: ${inputs.currency} ${inputs.minimum_cash_reserve.toLocaleString()}).
- Capital Health: ${isSolvent ? "✅ **Solvent.** Your current cash trajectory sustains operations through the planning horizon without breaching the minimum reserve." : "⚠️ **Capital Breach Warning.** Projected cash drops below the minimum safety threshold during the horizon. Working capital injection or OpEx reduction required."}

**2. Growth & Revenue Trajectory:**
- Target Month 12 ARR: **${inputs.currency} ${Math.round(summary.final_month_arr).toLocaleString()}** across **${Math.round(summary.final_month_customers)}** paying accounts.
- Churn Exposure: Monthly churn of ${(inputs.customer_churn_rate * 100).toFixed(1)}% compound-dilutes growth. Every 1% churn reduction substantially extends runway.

**3. Unit Economics & Acquisition Efficiency:**
- **LTV:CAC Ratio:** ${summary.ltv_to_cac_ratio_final ? `${summary.ltv_to_cac_ratio_final.toFixed(1)}x` : "N/A"} (${ltvHealthy ? "Healthy (above 3.0x industry benchmark)" : "Sub-optimal (below 3.0x threshold, customer acquisition costs may outpace retained customer value)"}).
- **CAC Payback:** ${summary.cac_payback_final ? `${summary.cac_payback_final.toFixed(1)} months` : "N/A"} (${paybackHealthy ? "Fast capital recycling under 12 months" : "Long payback cycle; elevates working capital drag"}).
- **Gross Margin:** ${(summary.average_gross_margin_pct * 100).toFixed(1)}% after direct hosting and variable COGS.

*(Note: Grounded in VentureMath's deterministic calculation engine. Connect a free Google AI Studio key to unlock dynamic generative dialogues with Gemini 2.5 Flash.)*`;

      return NextResponse.json({
        explanation: fallbackExplanation,
        disclaimer: "Generated via VentureIQ Deterministic Rule-Based Intelligence Engine (No GEMINI_API_KEY detected).",
        model: "deterministic-engine",
      });
    }

    // Call Google Gemini API via official @google/genai SDK
    try {
      const ai = new GoogleGenAI({ apiKey });

      const systemPrompt = `You are VentureIQ's Senior Strategic Financial Planning Engine.
Your mandate is to provide executive, rigorous, CFO-grade insights based STRICTLY on the deterministic model outputs supplied.
CRITICAL RULES:
1. Ground every statement in the provided deterministic figures. Never invent contradictory revenue, cash, or customer figures.
2. Identify concrete trade-offs: pricing leverage, CAC payback duration, churn decay, and runway bottlenecks.
3. Structure your response with clean markdown headings, bold metrics, and actionable recommendations.
4. Keep the tone concise, executive, and analytical.`;

      const userContent = `${systemPrompt}\n\n${financialContext}\n\nUSER DECISION / QUESTION:\n"${query}"\n\nProvide your executive financial evaluation:`;

      // Attempt with gemini-2.5-flash, fallback to gemini-1.5-flash
      let aiResponseText = "";
      let modelUsed = "gemini-2.5-flash";

      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: userContent,
        });
        aiResponseText = response.text || "";
      } catch (geminiError: any) {
        console.warn("gemini-2.5-flash failed, attempting fallback to gemini-1.5-flash:", geminiError?.message);
        modelUsed = "gemini-1.5-flash";
        const fallbackRes = await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: userContent,
        });
        aiResponseText = fallbackRes.text || "";
      }

      if (!aiResponseText) {
        throw new Error("Empty response received from Gemini API");
      }

      return NextResponse.json({
        explanation: aiResponseText,
        disclaimer: `Analysis generated by Google Gemini (${modelUsed}) grounded strictly in VentureMath's deterministic calculations.`,
        model: modelUsed,
      });
    } catch (aiApiError: any) {
      console.error("Gemini API invocation error:", aiApiError);
      return NextResponse.json(
        {
          error: aiApiError?.message || "Failed to query Google Gemini API. Please check your API key.",
          fallback_available: true,
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Server error in /api/ai:", error);
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 });
  }
}

