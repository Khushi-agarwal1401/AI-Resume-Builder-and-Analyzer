import { describe, expect, it } from "vitest";
import { aiActionEnum } from "@/lib/validation";
import { AI_ACTIONS } from "./actions";
import { DEFAULT_PROMPTS } from "./prompts";

describe("AI action contract", () => {
  it("keeps validation, TypeScript actions, and default prompts in sync", () => {
    const validationActions = new Set(aiActionEnum.options);
    const defaultPromptActions = new Set(Object.keys(DEFAULT_PROMPTS));

    expect(validationActions).toEqual(new Set(AI_ACTIONS));
    expect(defaultPromptActions).toEqual(new Set(AI_ACTIONS));
  });

  it("does not fall back to empty or generic prompts for production actions", () => {
    for (const action of AI_ACTIONS) {
      const prompt = DEFAULT_PROMPTS[action].trim();

      expect(prompt.length).toBeGreaterThan(20);
      expect(prompt).not.toContain("Process this:");
    }
  });
});
