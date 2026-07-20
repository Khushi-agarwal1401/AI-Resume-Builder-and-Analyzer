"use client";

import { Input } from "@/components/ui/Input";
import type { PersonalInfo } from "@/types/resume";

interface Props {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
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
        <Input label="Email" type="email" value={data.email} onChange={(e) => update("email", e.target.value)} />
        <Input label="Phone" value={data.phone} onChange={(e) => update("phone", e.target.value)} />
        <Input label="LinkedIn URL" value={data.linkedin} onChange={(e) => update("linkedin", e.target.value)} />
        <Input label="GitHub URL" value={data.github} onChange={(e) => update("github", e.target.value)} />
        <Input label="Portfolio URL" value={data.portfolio} onChange={(e) => update("portfolio", e.target.value)} />
      </div>
    </div>
  );
}
