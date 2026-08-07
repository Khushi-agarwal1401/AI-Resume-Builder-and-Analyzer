export type InputMode = "resume" | "upload" | "paste";

export type ReportTab = "overview" | "keywords" | "bullets" | "formatting" | "improvements";

export interface ResumeOption {
  id: string;
  title: string;
  template: string;
}

export interface AiMeta {
  status: "ai" | "heuristic";
  semanticMatch?: number;
  keywordMatch?: number;
  keywordDensityNote?: string;
}

export interface ApplyMessage {
  ok: boolean;
  text: string;
}

export interface ImproveMessage {
  ok: boolean;
  text: string;
  detail: string[];
}

export type ImproveToggleKey = "keywords" | "bullets" | "grammar";

export interface ImproveToggles {
  keywords: boolean;
  bullets: boolean;
  grammar: boolean;
}
