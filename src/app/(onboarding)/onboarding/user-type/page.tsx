"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type UserType = "student" | "experienced" | null;

export default function UserTypePage() {
  const [selected, setSelected] = useState<UserType>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleContinue() {
    if (!selected) return;
    setLoading(true);
    try {
      await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userType: selected }),
      });
    } catch {
      // ignore
    }
    router.push("/onboarding/career-goal");
  }

  return (
    <div className="bg-white rounded-md border border-gray-300 shadow-1 p-8">
      <div className="flex items-center gap-2 text-micro text-gray-500 uppercase tracking-widest mb-6">
        <span className="text-accent-500 font-semibold">Step 1</span>
        <span className="text-gray-300">/</span>
        <span>Step 2</span>
      </div>
      <h1 className="text-h2 text-black mb-2">Tell us about yourself</h1>
      <p className="text-body text-gray-500 mb-8">Choose the path that fits you best</p>

      <div className="space-y-4">
        <button
          onClick={() => setSelected("student")}
          className={cn(
            "w-full text-left p-6 rounded-sm border-2 transition-all duration-200",
            selected === "student"
              ? "border-accent-500 bg-accent-50"
              : "border-gray-300 hover:border-gray-500 bg-white"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-gray-100 flex items-center justify-center text-xl">
              🎓
            </div>
            <div>
              <h3 className="text-h3 text-black">Student</h3>
              <p className="text-body text-gray-500 mt-1">
                Currently enrolled in college or university
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelected("experienced")}
          className={cn(
            "w-full text-left p-6 rounded-sm border-2 transition-all duration-200",
            selected === "experienced"
              ? "border-accent-500 bg-accent-50"
              : "border-gray-300 hover:border-gray-500 bg-white"
          )}
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-sm bg-gray-100 flex items-center justify-center text-xl">
              💼
            </div>
            <div>
              <h3 className="text-h3 text-black">Experienced Professional</h3>
              <p className="text-body text-gray-500 mt-1">
                0+ years, including internships and first jobs
              </p>
            </div>
          </div>
        </button>
      </div>

      <Button
        className="w-full mt-8"
        disabled={!selected || loading}
        onClick={handleContinue}
      >
        {loading ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
