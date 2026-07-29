"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Rocket,
  Building2,
  Zap,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Download,
  Trash2,
  Sparkles,
} from "lucide-react";

const companyTypes = [
  {
    id: "startup",
    name: "Startup",
    desc: "Multi-tasking, ownership, fast growth",
    icon: Rocket,
    gradient: "from-violet-500 to-purple-600",
    lightBg: "bg-violet-50",
    accent: "text-violet-600",
  },
  {
    id: "mnc",
    name: "MNC",
    desc: "Teamwork, process, communication",
    icon: Building2,
    gradient: "from-blue-500 to-indigo-600",
    lightBg: "bg-blue-50",
    accent: "text-blue-600",
  },
  {
    id: "faang",
    name: "FAANG / Product",
    desc: "Impact metrics, scalability, leadership",
    icon: Zap,
    gradient: "from-amber-500 to-orange-600",
    lightBg: "bg-amber-50",
    accent: "text-amber-600",
  },
];

export default function CompanyVariantPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState("");
  const [variant, setVariant] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  const handleGenerate = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    setVariant("");
    setSaved(false);
    try {
      const resumeRes = await fetch(`/api/resumes/${params.resumeId}`);
      const resumeJson = await resumeRes.json();
      if (!resumeJson.success) return;

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "company-variant",
          input: selected,
          context: JSON.stringify(resumeJson.data),
        }),
      });
      const json = await res.json();
      if (json.success) setVariant(json.output);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selected, params.resumeId]);

  const handleCopy = useCallback(() => {
    if (!variant) return;
    navigator.clipboard.writeText(variant);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [variant]);

  const selectedType = companyTypes.find((ct) => ct.id === selected);

  const handleSave = useCallback(async () => {
    if (!variant) return;
    try {
      // Fetch original resume to preserve full structure
      const resumeRes = await fetch(`/api/resumes/${params.resumeId}`);
      const resumeJson = await resumeRes.json();
      const originalData = resumeJson?.data || {};

      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Resume (${selectedType?.name || selected} Variant)`,
          data: {
            ...originalData,
            summary: variant,
          },
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      // ignore
    }
  }, [variant, selected, selectedType, params.resumeId]);


  if (authLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[800px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-small text-gray-500 hover:text-gray-800 transition-colors mb-3"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <h1 className="text-h1 text-gray-900">Company-Specific Resume</h1>
            <p className="text-body text-gray-500 mt-1">
              Tailor your resume to match different company cultures and expectations
            </p>
          </div>
        </div>

        {/* Company Type Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {companyTypes.map((ct) => {
            const Icon = ct.icon;
            const isSelected = selected === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => setSelected(ct.id)}
                className={cn(
                  "relative group rounded-2xl border-2 p-6 text-left transition-all duration-300 overflow-hidden",
                  isSelected
                    ? "border-transparent shadow-lg shadow-gray-200/50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                )}
              >
                {/* Gradient background when selected */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-5",
                      ct.gradient
                    )}
                  />
                )}
                {/* Selected ring */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-br p-[2px]",
                      ct.gradient
                    )}
                  >
                    <div className="absolute inset-[2px] rounded-[14px] bg-white" />
                  </div>
                )}
                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110",
                      isSelected ? cn("bg-gradient-to-br text-white", ct.gradient) : ct.lightBg
                    )}
                  >
                    <Icon
                      size={22}
                      className={isSelected ? "text-white" : ct.accent}
                    />
                  </div>
                  <h3
                    className={cn(
                      "text-h3 font-bold mb-1",
                      isSelected ? "text-gray-900" : "text-gray-800"
                    )}
                  >
                    {ct.name}
                  </h3>
                  <p className="text-small text-gray-500">{ct.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            onClick={handleGenerate}
            disabled={loading || !selected}
            className="rounded-xl font-bold shadow-md hover:shadow-lg transition-all duration-300 px-6"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                Generate {selectedType ? selectedType.name : "Variant"}
              </span>
            )}
          </Button>
          {selected && !variant && !loading && (
            <p className="text-micro text-gray-400">
              Select a company type above, then click generate
            </p>
          )}
        </div>

        {/* Result */}
        {variant && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Result header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  {selectedType && (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        selectedType.gradient
                      )}
                    >
                      {(() => {
                        const Icon = selectedType.icon;
                        return <Icon size={16} className="text-white" />;
                      })()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-small font-semibold text-gray-900">
                      {selectedType?.name || "Company"} Variant
                    </h3>
                    <p className="text-micro text-gray-400">Generated resume tailored for {selected}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-micro font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={14} className="text-green-500" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="text-body text-gray-700 whitespace-pre-wrap leading-relaxed font-mono text-small bg-gray-50 rounded-xl p-4 border border-gray-100">
                  {variant}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-small font-semibold text-accent-600 hover:bg-accent-100 transition-colors"
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-500" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Save as New Resume
                      </>
                    )}
                  </button>
                  <Button variant="secondary" className="rounded-xl text-small">
                    Replace Current
                  </Button>
                </div>
                <button
                  onClick={() => setVariant("")}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-small text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Discard
                </button>
              </div>
            </div>

            {/* Regenerate */}
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-small font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all"
            >
              {loading ? "Generating..." : "↻ Regenerate"}
            </button>
          </div>
        )}

        {/* Empty state */}
        {!variant && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-100 to-accent-50 flex items-center justify-center mx-auto mb-5">
              <Building2 size={28} className="text-accent-600" />
            </div>
            <h3 className="text-h3 text-gray-900 mb-1">No variant generated yet</h3>
            <p className="text-body text-gray-500 max-w-sm mx-auto">
              Select a company type above and click generate to create a tailored resume variant.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
