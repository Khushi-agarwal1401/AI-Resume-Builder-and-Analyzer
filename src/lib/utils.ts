import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "h1", "h2", "h3", "body-lg", "body", "small", "micro"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/** Compact relative time, e.g. "just now", "5m ago", "3h ago", "2d ago". */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function generateId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
}

/**
 * Detect an Enter keydown that is confirming an IME composition (Japanese,
 * Chinese, Korean, ...). Acting on it would submit a half-typed query.
 *
 * `isComposing` is the standard signal, but some WebKit versions fire
 * `compositionend` before the confirming keydown, leaving `isComposing`
 * false; the legacy `keyCode === 229` catches those. Call with
 * `event.nativeEvent` from a React handler, or with the event itself for a
 * native listener.
 */
export function isImeConfirming(
  event: Pick<KeyboardEvent, "isComposing" | "keyCode">
): boolean {
  return event.isComposing || event.keyCode === 229;
}
