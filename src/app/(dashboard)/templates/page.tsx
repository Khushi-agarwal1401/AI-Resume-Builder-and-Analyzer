"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Category = "All" | "Professional" | "Creative" | "Minimal";

const TEMPLATES = [
  { id: "modern", name: "Modern", category: "Professional", color: "bg-blue-500", desc: "Clean and standard layout." },
  { id: "ats-professional", name: "ATS Professional", category: "Professional", color: "bg-slate-700", desc: "Optimized for ATS scanners." },
  { id: "student", name: "Student", category: "Minimal", color: "bg-green-500", desc: "Focuses on education and projects." },
  { id: "minimal", name: "Minimal", category: "Minimal", color: "bg-gray-400", desc: "Simple, elegant, and space-efficient." },
  { id: "executive", name: "Executive", category: "Professional", color: "bg-indigo-700", desc: "For senior leadership roles." },
  { id: "creative", name: "Creative", category: "Creative", color: "bg-pink-500", desc: "Stand out with a unique design." },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Category>("All");

  const filtered = activeTab === "All" ? TEMPLATES : TEMPLATES.filter(t => t.category === activeTab);

  async function handleUseTemplate(templateId: string) {
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Resume", template: templateId }),
    });
    const json = await res.json();
    if (json.success) router.push(`/builder/${json.data.id}`);
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Resume Templates</h1>
          <p className="text-gray-500 mt-1">Choose a professionally designed template to get started.</p>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {(["All", "Professional", "Creative", "Minimal"] as Category[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab ? "border-accent-600 text-accent-700" : "border-transparent text-gray-500 hover:text-gray-900"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((t) => (
            <div key={t.id} className="group border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all">
              <div className={cn("h-48 flex items-center justify-center p-6 relative", t.color)}>
                <div className="w-[120px] h-[160px] bg-white shadow-lg rounded-sm opacity-90 group-hover:opacity-100 transition-opacity">
                  {/* Generic mock lines for visual effect */}
                  <div className="p-2 space-y-2">
                    <div className="h-2 w-3/4 bg-gray-300 rounded" />
                    <div className="h-1.5 w-1/2 bg-gray-200 rounded" />
                    <div className="mt-4 space-y-1.5">
                      <div className="h-1 w-full bg-gray-200 rounded" />
                      <div className="h-1 w-5/6 bg-gray-200 rounded" />
                      <div className="h-1 w-4/5 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{t.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{t.desc}</p>
                <Button onClick={() => handleUseTemplate(t.id)} className="w-full">
                  Use this template
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
