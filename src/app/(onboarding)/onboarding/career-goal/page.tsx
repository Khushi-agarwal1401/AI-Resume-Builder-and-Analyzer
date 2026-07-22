"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { z } from "zod";

export default function CareerGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [desiredRole, setDesiredRole] = useState("");
  const [desiredCompany, setDesiredCompany] = useState("");
  const [desiredIndustry, setDesiredIndustry] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [workType, setWorkType] = useState<"remote" | "hybrid" | "onsite" | "">("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!desiredRole || !desiredIndustry || !workType) {
      setError("Please fill in the required fields");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desired_role: desiredRole,
          desired_company: desiredCompany || null,
          desired_industry: desiredIndustry,
          salary_range: salaryRange || null,
          work_type: workType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save goals");

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What's your career goal?</h1>
        <p className="text-gray-500">This helps our AI tailor your resume and suggest improvements.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Desired Role *" 
            placeholder="e.g., Senior Product Manager" 
            value={desiredRole} 
            onChange={(e) => setDesiredRole(e.target.value)} 
          />
          <Input 
            label="Target Industry *" 
            placeholder="e.g., FinTech" 
            value={desiredIndustry} 
            onChange={(e) => setDesiredIndustry(e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Dream Company (Optional)" 
            placeholder="e.g., Stripe" 
            value={desiredCompany} 
            onChange={(e) => setDesiredCompany(e.target.value)} 
          />
          <Input 
            label="Expected Salary Range (Optional)" 
            placeholder="e.g., $120k - $150k" 
            value={salaryRange} 
            onChange={(e) => setSalaryRange(e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Preferred Work Type *</label>
          <div className="grid grid-cols-3 gap-4">
            {(["remote", "hybrid", "onsite"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setWorkType(type)}
                className={cn(
                  "p-3 rounded-lg border text-sm font-medium capitalize transition-all",
                  workType === type 
                    ? "border-accent-600 bg-accent-50 text-accent-700" 
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                )}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <Button type="button" variant="secondary" onClick={handleSkip} className="w-full sm:w-auto" disabled={loading}>
            Skip for now
          </Button>
          <Button type="submit" className="w-full sm:flex-1" disabled={loading}>
            {loading ? <Spinner /> : "Continue to Dashboard"}
          </Button>
        </div>
      </form>
    </div>
  );
}
