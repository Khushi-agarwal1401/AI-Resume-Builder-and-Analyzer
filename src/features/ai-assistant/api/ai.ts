import type { AiAction, AiResponse } from "@/types/ai";
import { toast } from "sonner";

export async function callAi(action: AiAction, input: string, context = ""): Promise<AiResponse> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, input, context }),
  });

  const result: AiResponse = await response.json();

  // A-04: surface anti-fabrication warnings attached by the API guard
  if (result.success && Array.isArray(result.warnings) && result.warnings.length > 0) {
    result.warnings.forEach((warning) => toast.warning(warning, { duration: 8000 }));
  }

  return result;
}
