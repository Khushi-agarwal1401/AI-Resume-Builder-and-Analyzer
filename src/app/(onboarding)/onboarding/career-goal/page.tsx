"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function CareerGoalPage() {
  const [desiredRole, setDesiredRole] = useState("");
  const [desiredCompany, setDesiredCompany] = useState("");
  const [desiredIndustry, setDesiredIndustry] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [workType, setWorkType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleContinue() {
    if (!desiredRole) {
      setError("Desired role is required");
      return;
    }
    if (salaryMin && salaryMax && Number(salaryMin) > Number(salaryMax)) {
      setError("Minimum salary cannot exceed maximum");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desired_role: desiredRole,
          desired_company: desiredCompany,
          desired_industry: desiredIndustry,
          salary_range: salaryMin && salaryMax ? `${salaryMin}-${salaryMax}` : "",
          work_type: workType.toLowerCase() || null,
        }),
      });
    } catch {
      // ignore
    }

    router.push("/dashboard");
  }

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-1 p-8">
      <div className="flex items-center gap-2 text-micro text-gray-500 uppercase tracking-widest mb-6">
        <span className="text-gray-500 font-semibold">Step 1</span>
        <span className="text-gray-300">/</span>
        <span className="text-accent-500 font-semibold">Step 2</span>
      </div>

      <h1 className="text-h2 text-black mb-2">What are you looking for?</h1>
      <p className="text-body text-gray-500 mb-8">Help us tailor suggestions to your goals</p>

      <div className="space-y-4">
        <Input
          id="desiredRole"
          label="Desired Role *"
          value={desiredRole}
          onChange={(e) => setDesiredRole(e.target.value)}
          placeholder="e.g. Frontend Developer"
        />
        <Input
          id="desiredCompany"
          label="Target Companies"
          value={desiredCompany}
          onChange={(e) => setDesiredCompany(e.target.value)}
          placeholder="e.g. Google, Stripe (optional)"
        />
        <div>
          <label className="block text-body font-medium text-gray-700 mb-1">Desired Industry</label>
          <select
            className="h-10 w-full rounded-sm border border-gray-300 bg-white px-3 text-body outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
            value={desiredIndustry}
            onChange={(e) => setDesiredIndustry(e.target.value)}
          >
            <option value="">Select industry (optional)</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="consulting">Consulting</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="salaryMin"
            label="Min Salary"
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="0"
          />
          <Input
            id="salaryMax"
            label="Max Salary"
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-body font-medium text-gray-700 mb-2">Work Type</label>
          <div className="flex gap-3">
            {["Remote", "Hybrid", "Onsite"].map((type) => (
              <button
                key={type}
                onClick={() => setWorkType(type)}
                className={`flex-1 h-10 rounded-sm border-2 text-body font-medium transition-all duration-200 ${
                  workType === type
                    ? "border-accent-500 bg-accent-50 text-accent-900"
                    : "border-gray-300 text-gray-500 hover:border-gray-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-small text-error mt-4">{error}</p>}

      <div className="flex gap-3 mt-8">
        <Button variant="ghost" onClick={() => router.push("/onboarding/user-type")}>
          Back
        </Button>
        <Button className="flex-1" onClick={handleContinue} disabled={loading}>
          {loading ? "Saving..." : "Continue to Dashboard"}
        </Button>
      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="w-full text-center text-small text-gray-500 hover:text-black mt-4 transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
}
