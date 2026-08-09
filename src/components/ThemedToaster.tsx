"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/features/theme/ThemeProvider";

/** Toaster that follows the active light/dark theme (Sonner has its own
 * light/dark styling and defaults to light otherwise). */
export function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="top-right" richColors theme={theme} />;
}
