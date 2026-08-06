"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { callAi } from "@/features/ai-assistant/api/ai";
import type { AiAction } from "@/types/ai";
import { cn } from "@/lib/utils";

interface AiInlineButtonProps {
  /** /api/ai action used to rewrite the field. */
  action: AiAction;
  /** Current field text — passed to the model as the thing to improve. */
  input: string;
  /** Optional role/company/project context that steers the rewrite. */
  context?: string;
  /** Button label (ignored in icon-only mode). */
  label?: string;
  /** Compact icon-only sparkle button for per-field rows. */
  iconOnly?: boolean;
  /** Fired with the rewritten text once the API returns. */
  onResult: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Inline "✨ AI" action button that rewrites a field in place via /api/ai —
 * the Kickresume/Enhancv-style co-pilot pattern. Shows a spinner while the
 * model runs, then hands the improved text to the parent so the field updates
 * instantly.
 */
export function AiInlineButton({
  action,
  input,
  context = "",
  label = "AI",
  iconOnly = false,
  onResult,
  disabled,
  className,
}: AiInlineButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!input.trim()) {
      toast.info("Add some text first, then let AI improve it.");
      return;
    }
    setLoading(true);
    try {
      const res = await callAi(action, input, context);
      if (res.success && res.output?.trim()) {
        // Normalize: strip list prefixes / surrounding quotes the model may add.
        const text = res.output
          .trim()
          .replace(/^[-•*]\s+/, "")
          .replace(/^["']|["']$/g, "")
          .trim();
        if (text) {
          onResult(text);
          toast.success("✨ Improved with AI");
        } else {
          toast.error("AI returned an empty result. Please try again.");
        }
      } else {
        toast.error(res.error || "AI couldn't improve this. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      title={loading ? "Improving…" : `Improve with AI`}
      aria-label={loading ? "Improving with AI" : "Improve with AI"}
      className={cn(
        "inline-flex items-center justify-center gap-1 rounded-lg border border-accent-200 bg-gradient-to-b from-accent-50 to-accent-100/70 text-accent-700 font-semibold",
        "transition-all duration-200 hover:border-accent-300 hover:shadow-sm hover:from-accent-100 hover:to-accent-100 active:scale-95",
        "disabled:opacity-50 disabled:pointer-events-none",
        iconOnly ? "h-8 w-8 shrink-0" : "h-8 px-2.5 text-[11px] shrink-0",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      {!iconOnly && <span>{loading ? "Improving…" : label}</span>}
    </button>
  );
}
