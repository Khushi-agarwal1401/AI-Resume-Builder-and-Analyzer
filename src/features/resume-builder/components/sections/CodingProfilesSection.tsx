"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { CodingProfile } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: CodingProfile[];
  onChange: (data: CodingProfile[]) => void;
}

export function CodingProfilesSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), platform: "", url: "", handle: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
  }

  function update(id: string, field: keyof CodingProfile, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <div className="space-y-4" id="CodingProfiles">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Coding Profiles</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Platform" value={item.platform || ""} onChange={(e) => update(item.id, "platform", e.target.value)} />
            <Input label="Url" value={item.url || ""} onChange={(e) => update(item.id, "url", e.target.value)} />
            <Input label="Handle" value={item.handle || ""} onChange={(e) => update(item.id, "handle", e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
