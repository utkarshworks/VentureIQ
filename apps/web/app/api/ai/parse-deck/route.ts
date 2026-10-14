import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ExtractedDeckData {
  company_name?: string;
  profile_type?: "B2B" | "B2C" | "D2C";
  business_type?: "SaaS" | "IT & Tech Services" | "Consumer Product" | "Mobile App" | "E-Commerce / D2C Brand" | "AI & DeepTech" | "Other";
  funding_structure?: "bootstrapped" | "funded";
  funding_stage?: "pre_seed" | "seed" | "series_a" | "series_b" | "angel_grants";
  business_model?: "b2b_saas" | "b2c_subscription" | "subscription_services";
  currency?: "INR" | "USD" | "EUR" | "GBP";
  planning_horizon?: number;
  initial_paying_customers?: number;
  arpu?: number;
  initial_cash_balance?: number;
  minimum_cash_reserve?: number;
  acquisition_mode?: "lead_based" | "budget_based";
  monthly_leads?: number;
  lead_conversion_rate?: number;
  cost_per_lead?: number;
  acquisition_budget?: number;
  target_cac?: number;
  organic_new_customers?: number;
  customer_churn_rate?: number;
  expansion_rate?: number;
  monthly_payroll?: number;
  fixed_opex?: number;
  decision_goal?: string;
}

function parseTextWithHeuristics(text: string): { data: ExtractedDeckData; count: number } {
  const raw = text.toLowerCase();
  const data: ExtractedDeckData = {};
  let count = 0;

  // Currency
  if (raw.includes("dollar") || raw.includes("$") || raw.includes("usd")) {
    data.currency = "USD";
    count++;
  } else if (raw.includes("€") || raw.includes("eur") || raw.includes("euro")) {
    data.currency = "EUR";
    count++;
  } else if (raw.includes("£") || raw.includes("gbp") || raw.includes("pound")) {
    data.currency = "GBP";
    count++;
  } else if (raw.includes("₹") || raw.includes("inr") || raw.includes("rupee") || raw.includes("lakh") || raw.includes("crore")) {
    data.currency = "INR";
    count++;
  }

  // Profile Type
  if (raw.includes("d2c") || raw.includes("direct to consumer") || raw.includes("direct-to-consumer")) {
    data.profile_type = "D2C";
    count++;
  } else if (raw.includes("b2c") || raw.includes("business to consumer") || raw.includes("consumer app")) {
    data.profile_type = "B2C";
    count++;
  } else if (raw.includes("b2b") || raw.includes("enterprise") || raw.includes("saas") || raw.includes("business to business")) {
    data.profile_type = "B2B";
    count++;
  }

  // Business Type
  if (raw.includes("deeptech") || raw.includes("deep tech") || raw.includes("artificial intelligence") || raw.includes("ai platform")) {
    data.business_type = "AI & DeepTech";
    count++;
  } else if (raw.includes("saas") || raw.includes("software as a service")) {
    data.business_type = "SaaS";
    count++;
  } else if (raw.includes("mobile app") || raw.includes("ios app") || raw.includes("android app")) {
    data.business_type = "Mobile App";
    count++;
  } else if (raw.includes("consumer product") || raw.includes("hardware") || raw.includes("physical product")) {
    data.business_type = "Consumer Product";
    count++;
  } else if (raw.includes("e-commerce") || raw.includes("ecommerce") || raw.includes("store")) {
    data.business_type = "E-Commerce / D2C Brand";
    count++;
  } else if (raw.includes("it services") || raw.includes("agency") || raw.includes("consulting") || raw.includes("tech services")) {
    data.business_type = "IT & Tech Services";
    count++;
  }

  // Funding Structure & Stage
  if (raw.includes("series a")) {
    data.funding_structure = "funded";
    data.funding_stage = "series_a";
    count += 2;
  } else if (raw.includes("series b")) {
    data.funding_structure = "funded";
    data.funding_stage = "series_b";
    count += 2;
  } else if (raw.includes("seed round") || raw.includes("seed stage") || raw.includes("seed fund")) {
    data.funding_structure = "funded";
    data.funding_stage = "seed";
    count += 2;
  } else if (raw.includes("pre-seed") || raw.includes("pre seed")) {
    data.funding_structure = "funded";
    data.funding_stage = "pre_seed";
    count += 2;
  } else if (raw.includes("angel") || raw.includes("grant")) {
    data.funding_structure = "funded";
    data.funding_stage = "angel_grants";
    count += 2;
  } else if (raw.includes("bootstrapped") || raw.includes("self-funded") || raw.includes("profitable")) {
    data.funding_structure = "bootstrapped";
    count++;
  }

  // Company Name
  const nameMatch = text.match(/(?:company|startup|product|venture|project|brand|deck for)[:\s]+([A-Za-z0-9\s&]{3,30})/i) ||
                    text.match(/^[#\s]*([A-Za-z0-9]{3,20}(?:IQ|Math|Tech|Flow|SaaS|AI|Cloud|Hub|Scale|Pay|Labs|Analytics)?)/m);
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    if (!candidate.toLowerCase().includes("project handover") && !candidate.toLowerCase().includes("confidential")) {
      data.company_name = candidate;
      count++;
    }
  }

  // Paying Customers
  const custMatch = raw.match(/(\d+[\d,]*)\s*(?:paying\s*)?(?:customers|clients|subscribers|accounts|users|merchants)/);
  if (custMatch) {
    const val = parseInt(custMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(val) && val > 0 && val < 5000000) {
      data.initial_paying_customers = val;
      count++;
    }
  }

  // ARPU / Price
  const arpuMatch = raw.match(/(?:₹|\$|€|£|rs\.?|inr)?\s*(\d+[\d,]*)\s*(?:\/|per|\s)*(?:month|mo|cust|user|arpu|seat|account)/);
  if (arpuMatch) {
    const val = parseInt(arpuMatch[1].replace(/,/g, ""), 10);
    if (!isNaN(val) && val > 0 && val < 1000000) {
      data.arpu = val;
      count++;
    }
  }

  // Cash Balance & Min Reserve
  const cashLakhMatch = raw.match(/(?:cash|bank|balance|reserve|treasury)[\s\w:]*(\d+(?:\.\d+)?)\s*(?:lakh|l\b)/);
  if (cashLakhMatch) {
    const lakhs = parseFloat(cashLakhMatch[1]);
    data.initial_cash_balance = Math.round(lakhs * 100000);
    data.minimum_cash_reserve = Math.round(lakhs * 20000);
    count += 2;
  } else {
    const cashCroreMatch = raw.match(/(?:cash|bank|balance|reserve|treasury)[\s\w:]*(\d+(?:\.\d+)?)\s*(?:crore|cr\b)/);
    if (cashCroreMatch) {
      const cr = parseFloat(cashCroreMatch[1]);
      data.initial_cash_balance = Math.round(cr * 10000000);
      data.minimum_cash_reserve = Math.round(cr * 2000000);
      count += 2;
    } else {
      const cashMatch = raw.match(/(?:cash|bank|balance|reserve|treasury)[\s\w:]*(?:₹|\$|€|£)?\s*(\d+[\d,]{4,11})/);
      if (cashMatch) {
        const val = parseInt(cashMatch[1].replace(/,/g, ""), 10);
        if (!isNaN(val) && val > 0) {
          data.initial_cash_balance = val;
          data.minimum_cash_reserve = Math.round(val * 0.2);
          count += 2;
        }
      }
    }
  }

  // Churn Rate
  const churnMatch = raw.match(/(\d+(?:\.\d+)?)\s*%\s*(?:monthly\s*)?(?:churn|attrition|decay)/);
  if (churnMatch) {
    const val = parseFloat(churnMatch[1]);
    if (!isNaN(val) && val >= 0 && val <= 100) {
      data.customer_churn_rate = val > 1 ? val / 100 : val;
      count++;
    }
  }

  // Monthly Payroll / Team
  const payrollLakhMatch = raw.match(/(?:payroll|salary|salaries|team cost)[\s\w:]*(\d+(?:\.\d+)?)\s*(?:lakh|l\b)/);
  if (payrollLakhMatch) {
    data.monthly_payroll = Math.round(parseFloat(payrollLakhMatch[1]) * 100000);
    count++;
  } else {
    const payrollMatch = raw.match(/(?:payroll|salary|salaries|team cost)[\s\w:]*(?:₹|\$|€|£)?\s*(\d+[\d,]{3,9})/);
    if (payrollMatch) {
      const val = parseInt(payrollMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(val) && val > 0) {
        data.monthly_payroll = val;
        count++;
      }
    }
  }

  // Marketing Budget / Spend
  const mktLakhMatch = raw.match(/(?:marketing|cac|acquisition|ads)[\s\w:]*(\d+(?:\.\d+)?)\s*(?:lakh|l\b)/);
  if (mktLakhMatch) {
    data.acquisition_budget = Math.round(parseFloat(mktLakhMatch[1]) * 100000);
    count++;
  } else {
    const mktMatch = raw.match(/(?:marketing|acquisition budget|ads spend)[\s\w:]*(?:₹|\$|€|£)?\s*(\d+[\d,]{3,9})/);
    if (mktMatch) {
      const val = parseInt(mktMatch[1].replace(/,/g, ""), 10);
      if (!isNaN(val) && val > 0) {
        data.acquisition_budget = val;
        count++;
      }
    }
  }

  // Decision Goal / Target Milestone
  const decisionMatch = text.match(/(?:goal|target|decision|milestone|objective|reverse[\s-]plan)[:\s]+([^\n.]{15,150})/i);
  if (decisionMatch && decisionMatch[1]) {
    data.decision_goal = decisionMatch[1].trim();
    count++;
  }

  return { data, count };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileBase64, fileName, mimeType, pastedText, userApiKey } = body;

    let cleanText = "";
    let isPdf = false;

    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");
      const name = (fileName || "").toLowerCase();
      const mime = (mimeType || "").toLowerCase();

      if (mime.includes("pdf") || name.endsWith(".pdf")) {
        isPdf = true;
        try {
          const pdfModule = await import("pdf-parse");
          const PDFClass = pdfModule.PDFParse || (pdfModule as any).default?.PDFParse;
          if (PDFClass) {
            const parser = new PDFClass({ data: buffer });
            const pdfRes = await parser.getText();
            if (pdfRes && pdfRes.pages) {
              cleanText = pdfRes.pages.map((p: any) => p.text).join("\n");
            }
            await parser.destroy();
          }
        } catch (pdfErr: any) {
          console.warn("pdf-parse extraction notice:", pdfErr?.message);
        }
      } else {
        // Plain text, Markdown, CSV
        cleanText = buffer.toString("utf-8");
      }
    } else if (pastedText) {
      cleanText = String(pastedText);
    }

    if (!cleanText && !fileBase64) {
      return NextResponse.json({ error: "No document content or pasted text received" }, { status: 400 });
    }

    // Attempt intelligent extraction via Gemini 2.5 Flash if API Key is available
    const apiKey = (userApiKey && userApiKey.trim().length > 0) ? userApiKey.trim() : process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const systemPrompt = `You are VentureIQ's expert venture capital and startup CFO financial analyst.
Analyze the provided pitch deck, financial summary, or startup notes.
Extract all numerical and operational parameters to configure a deterministic financial model.
Return ONLY a valid JSON object with the following keys. Do NOT include markdown code fences or other text.
JSON Structure:
{
  "company_name": string or null,
  "profile_type": "B2B" | "B2C" | "D2C" | null,
  "business_type": "SaaS" | "IT & Tech Services" | "Consumer Product" | "Mobile App" | "E-Commerce / D2C Brand" | "AI & DeepTech" | "Other" | null,
  "funding_structure": "bootstrapped" | "funded" | null,
  "funding_stage": "pre_seed" | "seed" | "series_a" | "series_b" | "angel_grants" | null,
  "business_model": "b2b_saas" | "b2c_subscription" | "subscription_services" | null,
  "currency": "INR" | "USD" | "EUR" | "GBP",
  "planning_horizon": 12 | 18 | 24 | 36,
  "initial_paying_customers": number or null,
  "arpu": number or null,
  "initial_cash_balance": number or null,
  "minimum_cash_reserve": number or null,
  "acquisition_mode": "lead_based" | "budget_based",
  "monthly_leads": number or null,
  "lead_conversion_rate": number or null,
  "cost_per_lead": number or null,
  "acquisition_budget": number or null,
  "target_cac": number or null,
  "organic_new_customers": number or null,
  "customer_churn_rate": number or null,
  "expansion_rate": number or null,
  "monthly_payroll": number or null,
  "fixed_opex": number or null,
  "decision_goal": string or null
}
CRITICAL RULES:
1. Ensure all rates are decimal fractions (e.g. 3.5% churn is 0.035, 4% conversion is 0.04).
2. For currency numbers, convert words (e.g. "₹35 Lakhs" -> 3500000, "₹1.5 Crores" -> 15000000, "$450K" -> 450000).
3. If decision_goal is not explicit, formulate an executive milestone question based on their target metrics.`;

        let contents: any[] = [];
        if (isPdf && fileBase64) {
          contents = [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: fileBase64,
              },
            },
            {
              text: systemPrompt,
            },
          ];
        } else {
          contents = [
            {
              text: `${systemPrompt}\n\nDOCUMENT / NOTES CONTENT:\n${cleanText.substring(0, 30000)}`,
            },
          ];
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            responseMimeType: "application/json",
          },
        });

        const rawJson = response.text || "{}";
        const parsedData: ExtractedDeckData = JSON.parse(rawJson);

        // Count non-null extracted fields
        const fieldsCount = Object.values(parsedData).filter((v) => v !== null && v !== undefined && v !== "").length;

        return NextResponse.json({
          success: true,
          method: "gemini-2.5-flash",
          extractedData: parsedData,
          fieldsCount,
          sourceLabel: fileName || "Pasted Pitch Notes",
        });
      } catch (geminiErr: any) {
        console.warn("Gemini deck parsing failed, falling back to deterministic parser:", geminiErr?.message);
      }
    }

    // High-Precision Deterministic Fallback Parser
    const { data, count } = parseTextWithHeuristics(cleanText);

    return NextResponse.json({
      success: true,
      method: "pdf-text-engine",
      extractedData: data,
      fieldsCount: count,
      sourceLabel: fileName || "Pasted Pitch Notes",
    });
  } catch (err: any) {
    console.error("Error in /api/ai/parse-deck:", err);
    return NextResponse.json({ error: err?.message || "Failed to parse pitch deck" }, { status: 500 });
  }
}

