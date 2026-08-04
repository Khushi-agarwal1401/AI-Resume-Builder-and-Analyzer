"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Gauge, LayoutList, Lock, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UpgradeDialogProps {
  /** Name of the premium template the user was trying to use. */
  templateName?: string;
  onClose: () => void;
}

/** Task 6.2 — the benefits shown instead of a bare "Premium" label. */
const BENEFITS = [
  {
    icon: Gauge,
    title: "ATS improvement",
    description: "Premium templates are engineered to score higher with applicant tracking systems.",
  },
  {
    icon: LayoutList,
    title: "Extra sections",
    description: "Showcase certifications, leadership, publications, and more with expanded layouts.",
  },
  {
    icon: Palette,
    title: "Unlimited customization",
    description: "Full control over fonts, colors, and spacing — make every template your own.",
  },
];

/** Explains why Premium is worth it and points the user to the plans. */
export function UpgradeDialog({ templateName, onClose }: UpgradeDialogProps) {
  // Close on Escape and lock background scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to Premium"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog panel */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-gray-900/40 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-900 to-indigo-700 px-6 pt-6 pb-5 text-white">
          <button
            autoFocus
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-h2 text-white">Unlock Premium</h2>
          <p className="text-small text-white/80 mt-1.5 leading-relaxed">
            {templateName
              ? `${templateName} is a premium template — preview it freely, upgrade to use it in the builder.`
              : "Premium templates need a Pro subscription. Upgrade to use them in the builder."}
          </p>
        </div>

        {/* Benefits (Task 6.2) */}
        <div className="px-6 py-5 space-y-4">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-small font-semibold text-black">{title}</p>
                <p className="text-small text-gray-500 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-2">
          <Link href="/pricing" className="block">
            <Button variant="accent" className="w-full">
              View Plans
            </Button>
          </Link>
          <Link href="/settings/subscription" className="block">
            <Button variant="secondary" className="w-full">
              Compare Plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
