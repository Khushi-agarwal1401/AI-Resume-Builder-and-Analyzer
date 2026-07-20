"use client";

import { Button } from "@/components/ui/Button";
import type { Language } from "@/types/resume";
import { generateId } from "@/lib/utils";

const proficiencies = ["native", "fluent", "advanced", "intermediate", "basic"] as const;

interface Props {
  data: Language[];
  onChange: (data: Language[]) => void;
}

export function LanguageSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), name: "", proficiency: "intermediate" }]);
  }

  function remove(id: string) {
    onChange(data.filter((l) => l.id !== id));
  }

  function update(id: string, field: keyof Language, value: string) {
    onChange(data.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Languages</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add Language</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Language</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={item.name}
              onChange={(e) => update(item.id, "name", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Proficiency</label>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={item.proficiency}
              onChange={(e) => update(item.id, "proficiency", e.target.value)}
            >
              {proficiencies.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button onClick={() => remove(item.id)} className="text-red-500 text-sm pb-2">Remove</button>
        </div>
      ))}
    </div>
  );
}
