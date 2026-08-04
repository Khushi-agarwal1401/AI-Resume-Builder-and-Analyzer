"use client";

import { useState, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponsiveWidgetProps {
  /** Icon rendered in the mobile-only collapsible header bar. */
  icon: React.ReactNode;
  /** Title rendered in the mobile-only collapsible header bar. */
  title: string;
  /** Optional subtitle rendered under the title in the mobile header bar. */
  subtitle?: string;
  /** Extra classes for the wrapper (e.g. grid column spans). */
  className?: string;
  /** Whether the content is expanded by default on mobile. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a dashboard widget so that below `lg` it renders as a collapsible
 * card with a compact header bar (tap to expand/collapse), while on `lg+`
 * the header bar is hidden and the content is always visible.
 *
 * The collapsed state only hides the content below `lg`, so resizing to a
 * larger screen always reveals the widget regardless of state.
 */
export function ResponsiveWidget({
  icon,
  title,
  subtitle,
  className,
  defaultOpen = true,
  children,
}: ResponsiveWidgetProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className={cn("flex flex-col min-w-0", className)}>
      {/* Mobile/tablet-only collapsible header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="lg:hidden flex items-center justify-between gap-3 w-full bg-white border border-gray-200 rounded-2xl px-4 py-3.5 shadow-sm hover:border-gray-300 hover:shadow-md active:scale-[0.99] transition-all duration-200 text-left"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {icon}
          <span className="min-w-0">
            <span className="block text-sm font-bold text-gray-900 leading-tight truncate">
              {title}
            </span>
            {subtitle && (
              <span className="block text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                {subtitle}
              </span>
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Content — hidden below lg when collapsed, always visible on lg+ */}
      <div id={contentId} className={cn("flex flex-col flex-1 min-w-0 max-lg:mt-3", !open && "max-lg:hidden")}>
        {children}
      </div>
    </div>
  );
}
