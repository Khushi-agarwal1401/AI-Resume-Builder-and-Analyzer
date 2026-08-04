"use client";

import { Input } from "@/components/ui/Input";
import type { PersonalInfo } from "@/types/resume";

interface Props {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[\d\s-]{10,}$/;
const linkedinRegex = /^linkedin\.com\/in\/.*/i;
const githubRegex = /^github\.com\/.*/i;
const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/i;

function getError(field: keyof PersonalInfo, value: string): string | undefined {
  if (!value) return undefined;
  switch (field) {
    case "email": return emailRegex.test(value) ? undefined : "Invalid email format";
    case "phone": return phoneRegex.test(value) ? undefined : "Invalid phone format";
    case "linkedin": return linkedinRegex.test(value) ? undefined : "Must be linkedin.com/in/...";
    case "github": return githubRegex.test(value) ? undefined : "Must be github.com/...";
    case "portfolio": return urlRegex.test(value) ? undefined : "Invalid URL format";
    default: return undefined;
  }
}

export function PersonalInfoSection({ data, onChange }: Props) {
  function update(field: keyof PersonalInfo, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Personal Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Full Name" value={data.fullName} onChange={(e) => update("fullName", e.target.value)} />
        <Input label="Email" type="email" value={data.email} error={getError("email", data.email)} onChange={(e) => update("email", e.target.value)} />
        <Input label="Phone" value={data.phone} error={getError("phone", data.phone)} onChange={(e) => update("phone", e.target.value)} />
        <Input label="LinkedIn URL" value={data.linkedin} error={getError("linkedin", data.linkedin)} onChange={(e) => update("linkedin", e.target.value)} />
        <Input label="GitHub URL" value={data.github} error={getError("github", data.github)} onChange={(e) => update("github", e.target.value)} />
        <Input label="Portfolio URL" value={data.portfolio} error={getError("portfolio", data.portfolio)} onChange={(e) => update("portfolio", e.target.value)} />
      </div>
    </div>
  );
}
