"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, PenLine, Wand2, Layout, FileDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface TourStep {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accent: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "build",
    icon: PenLine,
    title: "Build section by section",
    description:
      "Fill guided sections — personal info, education, experience, skills and more. Your resume renders live as you type, with a progress meter tracking your way to 100%.",
    accent: "from-accent-500 to-accent-700",
  },
  {
    id: "ai",
    icon: Wand2,
    title: "Polish with the AI assistant",
    description:
      "Improve summaries, sharpen bullet points with action verbs, add measurable metrics, and fix grammar — all powered by AI from the builder's assistant panel.",
    accent: "from-blue-500 to-indigo-600",
  },
  {
    id: "templates",
    icon: Layout,
    title: "Switch templates anytime",
    description:
      "Your content lives independently of the design. Preview and swap between 8 professional templates whenever you like — nothing is ever lost.",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "export",
    icon: FileDown,
    title: "Export & check your ATS score",
    description:
      "Download a polished PDF, run a free ATS analysis to see how recruiters read your resume, and get tailored suggestions to improve it.",
    accent: "from-pink-500 to-rose-600",
  },
];

interface ProductTourModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProductTourModal({ open, onClose }: ProductTourModalProps) {
  const [step, setStep] = useState(0);
  const current = TOUR_STEPS[step];
  const Icon = current.icon;

  // Reset to the first step whenever the modal opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const goNext = () => setStep((s) => Math.min(s + 1, TOUR_STEPS.length - 1));
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top accent bar */}
        <div className={cn("h-1.5 w-full bg-gradient-to-r transition-all duration-500", current.accent)} />

        <div className="p-7">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
              Step {step + 1} of {TOUR_STEPS.length}
            </span>
            <button
              onClick={onClose}
              aria-label="Close tour"
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mb-7">
            <div
              className={cn(
                "w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                current.accent
              )}
            >
              <Icon className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
            <p className="text-sm text-gray-500 leading-relaxed">{current.description}</p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {TOUR_STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === step ? "w-6 bg-gray-900" : i < step ? "w-1.5 bg-accent-400" : "w-1.5 bg-gray-200 hover:bg-gray-300"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={goPrev} disabled={step === 0} className="gap-1">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            {step < TOUR_STEPS.length - 1 ? (
              <Button onClick={goNext} className="gap-1.5">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={onClose} className="gap-1.5 bg-black text-white hover:bg-gray-800">
                <Check className="w-4 h-4" />
                Get Started
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
