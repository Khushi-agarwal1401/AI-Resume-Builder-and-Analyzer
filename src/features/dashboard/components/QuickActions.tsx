import React from "react";
import { Plus, Upload, Target, FileSearch } from "lucide-react";

interface QuickActionsProps {
  onCreateResume: () => void;
}

export function QuickActions({ onCreateResume }: QuickActionsProps) {
  const actions = [
    {
      title: "Create New Resume",
      description: "Start from scratch or a template",
      icon: Plus,
      onClick: onCreateResume,
      color: "text-primary-600",
      bgColor: "bg-gradient-to-br from-primary-50 to-primary-100",
      borderColor: "border-primary-200",
    },
    {
      title: "Upload Existing",
      description: "Import PDF or LinkedIn profile",
      icon: Upload,
      onClick: () => alert("Coming soon!"),
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
    },
    {
      title: "Analyze Job Description",
      description: "Tailor your resume for a specific role",
      icon: Target,
      onClick: () => alert("Coming soon!"),
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
    },
    {
      title: "Cover Letter Generator",
      description: "Draft a personalized cover letter",
      icon: FileSearch,
      onClick: () => alert("Coming soon!"),
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      borderColor: "border-emerald-200",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-5">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-3">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            className="flex items-start text-left gap-4 p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
          >
            <div className={`w-11 h-11 rounded-xl ${action.bgColor} ${action.borderColor} border flex items-center justify-center shrink-0 shadow-sm`}>
              <action.icon className={`w-5 h-5 ${action.color}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-sm">
                {action.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
