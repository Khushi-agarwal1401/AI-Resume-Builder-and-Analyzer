import type { AiAction, AiResponse } from "@/types/ai";

export async function callAi(action: AiAction, input: string, context = ""): Promise<AiResponse> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, input, context }),
  });

  return response.json();
}
