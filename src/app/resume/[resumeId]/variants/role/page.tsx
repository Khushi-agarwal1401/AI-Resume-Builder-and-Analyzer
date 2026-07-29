"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import {
  Code2,
  Monitor,
  Server,
  BarChart3,
  Target,
  Megaphone,
  ArrowLeft,
  Copy,
  CheckCircle2,
  Download,
  Trash2,
  Sparkles,
} from "lucide-react";

const roleTypes = [
  {
    id: "software-engineer",
    name: "Software Engineer",
    desc: "DSA, projects, APIs, system design",
    icon: Code2,
    gradient: "from-emerald-500 to-teal-600",
    lightBg: "bg-emerald-50",
    accent: "text-emerald-600",
  },
  {
    id: "frontend",
    name: "Frontend Developer",
    desc: "React, UI/UX, performance",
    icon: Monitor,
    gradient: "from-sky-500 to-cyan-600",
    lightBg: "bg-sky-50",
    accent: "text-sky-600",
  },
  {
    id: "backend",
    name: "Backend Developer",
    desc: "APIs, databases, architecture",
    icon: Server,
    gradient: "from-indigo-500 to-violet-600",
    lightBg: "bg-indigo-50",
    accent: "text-indigo-600",
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    desc: "SQL, Power BI, Excel",
    icon: BarChart3,
    gradient: "from-amber-500 to-yellow-600",
    lightBg: "bg-amber-50",
    accent: "text-amber-600",
  },
  {
    id: "product-manager",
    name: "Product Manager",
    desc: "Roadmaps, metrics, strategy",
    icon: Target,
    gradient: "from-rose-500 to-pink-600",
    lightBg: "bg-rose-50",
    accent: "text-rose-600",
  },
  {
    id: "marketing",
    name: "Marketing",
    desc: "Campaigns, ROI, growth",
    icon: Megaphone,
    gradient: "from-orange-500 to-red-600",
    lightBg: "bg-orange-50",
    accent: "text-orange-600",
  },
];

export default function RoleVariantPage() {
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
          action: "role-variant",
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

  const handleSave = useCallback(async () => {
    if (!variant) return;
    setSaved(true);
    try {
      await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Resume (${selectedRole?.name || selected} Variant)`,
          data: { summary: variant },
        }),
      });
    } catch {
      // ignore
    }
    setTimeout(() => setSaved(false), 2000);
  }, [variant, selected, selectedRole]);

  const selectedRole = roleTypes.find((rt) => rt.id === selected);

  if (authLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-[900px] mx-auto px-6 py-10">
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
            <h1 className="text-h1 text-gray-900">Role-Based Resume</h1>
            <p className="text-body text-gray-500 mt-1">
              Tailor your resume to highlight skills relevant to specific roles
            </p>
          </div>
        </div>

        {/* Role Type Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {roleTypes.map((rt) => {
            const Icon = rt.icon;
            const isSelected = selected === rt.id;
            return (
              <button
                key={rt.id}
                onClick={() => setSelected(rt.id)}
                className={cn(
                  "relative group rounded-2xl border-2 p-5 text-left transition-all duration-300 overflow-hidden",
                  isSelected
                    ? "border-transparent shadow-lg shadow-gray-200/50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                )}
              >
                {isSelected && (
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-5",
                      rt.gradient
                    )}
                  />
                )}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl bg-gradient-to-br p-[2px]",
                      rt.gradient
                    )}
                  >
                    <div className="absolute inset-[2px] rounded-[14px] bg-white" />
                  </div>
                )}
                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110",
                      isSelected
                        ? cn("bg-gradient-to-br text-white", rt.gradient)
                        : rt.lightBg
                    )}
                  >
                    <Icon
                      size={20}
                      className={isSelected ? "text-white" : rt.accent}
                    />
                  </div>
                  <h3
                    className={cn(
                      "text-body font-bold mb-1",
                      isSelected ? "text-gray-900" : "text-gray-800"
                    )}
                  >
                    {rt.name}
                  </h3>
                  <p className="text-micro text-gray-500">{rt.desc}</p>
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
                Generate {selectedRole ? selectedRole.name : "Variant"}
              </span>
            )}
          </Button>
          {selected && !variant && !loading && (
            <p className="text-micro text-gray-400">
              Select a role type above, then click generate
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
                  {selectedRole && (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center",
                        selectedRole.gradient
                      )}
                    >
                      {(() => {
                        const Icon = selectedRole.icon;
                        return <Icon size={16} className="text-white" />;
                      })()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-small font-semibold text-gray-900">
                      {selectedRole?.name || "Role"} Variant
                    </h3>
                    <p className="text-micro text-gray-400">
                      Generated resume tailored for {selectedRole?.name || selected}
                    </p>
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
              <Code2 size={28} className="text-accent-600" />
            </div>
            <h3 className="text-h3 text-gray-900 mb-1">No variant generated yet</h3>
            <p className="text-body text-gray-500 max-w-sm mx-auto">
              Select a role type above and click generate to create a tailored resume variant.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
