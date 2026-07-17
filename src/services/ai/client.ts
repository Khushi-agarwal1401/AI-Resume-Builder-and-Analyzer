import { AiRequest, AiResponse } from "@/types/ai";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function callGemini(request: AiRequest): Promise<AiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { success: false, output: "", error: "GEMINI_API_KEY not configured" };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildPrompt(request) }],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, output: "", error: `Gemini API error: ${response.status}` };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return { success: true, output: text };
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function buildPrompt(request: AiRequest): string {
  const { action, input, context } = request;

  const prompts: Record<string, string> = {
    "generate-summary": `Write a professional resume summary (3-4 sentences) based on this information:\n\nContext: ${context}\n\nUser input: ${input}\n\nOnly use facts provided. Do not invent metrics or experience.`,
    "enhance-bullet": `Improve this resume bullet point using strong action verbs. Add metrics only if explicitly provided by the user.\n\nOriginal: ${input}\n\nContext: ${context}\n\nImproved version:`,
    "check-grammar": `Fix grammar and spelling in this text. Do not rewrite content or add information.\n\nText: ${input}\n\nCorrected version:`,
    "suggest-achievements": `Suggest 2-3 quantifiable achievements based on this experience. Only use metrics the user has provided.\n\nExperience: ${input}\n\nContext: ${context}\n\nSuggestions:`,
    "add-keywords": `Identify missing keywords from this job description and suggest which to add to the resume.\n\nResume section: ${input}\n\nJob description: ${context}\n\nMissing keywords:`,
    "rewrite-section": `Rewrite this resume section to be more impactful. Use action verbs. Do not add fabricated metrics.\n\nSection: ${input}\n\nContext: ${context}\n\nRewritten version:`,
  };

  return (
    prompts[action] ||
    `Process this resume content:\n\nInput: ${input}\n\nContext: ${context}`
  );
}
