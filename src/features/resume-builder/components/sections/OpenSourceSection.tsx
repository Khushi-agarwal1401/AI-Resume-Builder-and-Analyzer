"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { OpenSource } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: OpenSource[];
  onChange: (data: OpenSource[]) => void;
}

export function OpenSourceSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), projectName: "", role: "", url: "", description: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
  }

  function update(id: string, field: keyof OpenSource, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <div className="space-y-4" id="OpenSource">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Open Source</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Project Name" value={item.projectName || ""} onChange={(e) => update(item.id, "projectName", e.target.value)} />
            <Input label="Role" value={item.role || ""} onChange={(e) => update(item.id, "role", e.target.value)} />
            <Input label="Url" value={item.url || ""} onChange={(e) => update(item.id, "url", e.target.value)} />
            <Input label="Description" value={item.description || ""} onChange={(e) => update(item.id, "description", e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
