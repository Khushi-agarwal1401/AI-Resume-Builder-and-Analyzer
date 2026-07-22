"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { GraduationCap, Briefcase, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

const studentSchema = z.object({
  user_type: z.literal("student"),
  college_name: z.string().min(1, "College name is required"),
  degree: z.string().min(1, "Degree is required"),
  graduation_year: z.string().min(4, "Valid year required").max(4),
  skills: z.array(z.string()).min(1, "Add at least one skill"),
});

const experiencedSchema = z.object({
  user_type: z.literal("experienced"),
  current_role: z.string().min(1, "Current role is required"),
  experience_years: z.number().min(0),
  industry: z.string().min(1, "Industry is required"),
  current_company: z.string().optional(),
});

type UserType = "student" | "experienced" | null;

export default function UserTypePage() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Student State
  const [collegeName, setCollegeName] = useState("");
  const [degree, setDegree] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Experienced State
  const [currentRole, setCurrentRole] = useState("");
  const [experienceYears, setExperienceYears] = useState("0");
  const [industry, setIndustry] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType) return;
    setError("");

    try {
      let payload;
      if (userType === "student") {
        payload = studentSchema.parse({
          user_type: "student",
          college_name: collegeName,
          degree,
          graduation_year: graduationYear,
          skills,
        });
      } else {
        payload = experiencedSchema.parse({
          user_type: "experienced",
          current_role: currentRole,
          experience_years: parseInt(experienceYears, 10),
          industry,
          current_company: currentCompany || undefined,
        });
      }

      setLoading(true);
      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      router.push("/onboarding/career-goal");
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError((err as any).errors[0].message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
        <p className="text-gray-500">We'll tailor your resume-building experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button
          onClick={() => { setUserType("student"); setError(""); }}
          className={cn(
            "p-6 rounded-xl border-2 text-left transition-all",
            userType === "student"
              ? "border-accent-600 bg-accent-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 mb-4">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Student</h3>
          <p className="text-sm text-gray-500">Currently studying or recently graduated</p>
        </button>

        <button
          onClick={() => { setUserType("experienced"); setError(""); }}
          className={cn(
            "p-6 rounded-xl border-2 text-left transition-all",
            userType === "experienced"
              ? "border-accent-600 bg-accent-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 mb-4">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1">Experienced Professional</h3>
          <p className="text-sm text-gray-500">0+ years, including internships and first jobs</p>
        </button>
      </div>

      {userType && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          {userType === "student" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="College Name" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} required />
                <Input label="Degree (e.g., B.S. Computer Science)" value={degree} onChange={(e) => setDegree(e.target.value)} required />
              </div>
              <Input label="Graduation Year" placeholder="2024" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} required />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Skills</label>
                <div className="flex gap-2">
                  <Input 
                    value={skillInput} 
                    onChange={(e) => setSkillInput(e.target.value)} 
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                    placeholder="e.g., React, Python, UI Design" 
                  />
                  <Button type="button" onClick={handleAddSkill} variant="secondary" className="px-3 shrink-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill) => (
                    <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                      {skill}
                      <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {userType === "experienced" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Current Role" placeholder="e.g., Software Engineer" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} required />
                <Input label="Current Company (Optional)" placeholder="e.g., Google" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <select 
                    value={experienceYears} 
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full h-10 rounded-sm border border-gray-300 bg-white px-3 outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
                  >
                    <option value="0">Less than 1 year</option>
                    <option value="1">1 year</option>
                    <option value="2">2 years</option>
                    <option value="3">3 years</option>
                    <option value="4">4 years</option>
                    <option value="5">5+ years</option>
                    <option value="10">10+ years</option>
                  </select>
                </div>
                <Input label="Industry" placeholder="e.g., Technology" value={industry} onChange={(e) => setIndustry(e.target.value)} required />
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Spinner /> : "Continue"}
          </Button>
        </form>
      )}
    </div>
  );
}
