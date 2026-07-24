import React from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingStepLayoutProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  children: React.ReactNode;
}

export function OnboardingStepLayout({
  title,
  description,
  currentStep,
  totalSteps,
  onBack,
  children,
}: OnboardingStepLayoutProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3 text-sm font-semibold text-gray-600">
          <span>Step {currentStep} of {totalSteps}</span>
          <span className="text-primary-600">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Header section with optional back button */}
      <div className="relative text-center mb-12">
        {onBack && (
          <button
            onClick={onBack}
            type="button"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2.5 text-gray-400 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">{title}</h1>
        <p className="text-gray-500 text-lg">{description}</p>
      </div>

      {/* Main Content */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}
