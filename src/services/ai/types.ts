import { AiRequest, AiResponse } from "@/types/ai";

interface AiService {
  call(request: AiRequest): Promise<AiResponse>;
}

export type { AiService };
