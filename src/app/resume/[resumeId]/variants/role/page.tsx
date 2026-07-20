"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

const roleTypes = [
  { id: "software-engineer", name: "Software Engineer", desc: "DSA, projects, APIs, system design" },
  { id: "frontend", name: "Frontend Developer", desc: "React, UI/UX, performance" },
  { id: "backend", name: "Backend Developer", desc: "APIs, databases, architecture" },
  { id: "data-analyst", name: "Data Analyst", desc: "SQL, Power BI, Excel" },
  { id: "product-manager", name: "Product Manager", desc: "Roadmaps, metrics, strategy" },
  { id: "marketing", name: "Marketing", desc: "Campaigns, ROI, growth" },
];

export default function RoleVariantPage() {
  const params = useParams();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();
  const [selected, setSelected] = useState("");
  const [variant, setVariant] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  async function handleGenerate() {
    if (!selected) return;
    setLoading(true);
    try {
      const resumeRes = await fetch(`/api/resumes/${params.resumeId}`);
      const resumeJson = await resumeRes.json();

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
  }

  if (authLoading) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner /></div>;

  return (
    <div className="max-w-[720px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black">Role-Based Resume</h1>
          <p className="text-body text-gray-500 mt-1">Tailor your resume for specific roles</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>Back</Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {roleTypes.map((rt) => (
          <button
            key={rt.id}
            onClick={() => setSelected(rt.id)}
            className={`border-2 rounded-sm p-5 text-left transition-all ${
              selected === rt.id ? "border-accent-500 bg-accent-50" : "border-gray-300 bg-white hover:border-gray-500"
            }`}
          >
            <h3 className="text-h3 text-black mb-1">{rt.name}</h3>
            <p className="text-small text-gray-500">{rt.desc}</p>
          </button>
        ))}
      </div>

      <Button onClick={handleGenerate} disabled={loading || !selected}>
        {loading ? "Generating..." : "Generate Variant"}
      </Button>

      {variant && (
        <div className="mt-8 space-y-6">
          <div className="bg-white border border-gray-300 rounded-sm p-6">
            <h3 className="text-h3 text-black mb-3">Generated Variant</h3>
            <div className="text-body text-gray-700 whitespace-pre-wrap leading-relaxed">{variant}</div>
          </div>
          <div className="flex gap-3">
            <Button>Save as New Resume</Button>
            <Button variant="secondary">Replace Current</Button>
            <Button variant="ghost">Discard</Button>
          </div>
        </div>
      )}
    </div>
  );
}
