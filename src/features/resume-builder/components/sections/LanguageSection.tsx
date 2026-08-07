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
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Languages</h3>
          <Button variant="secondary" size="sm" onClick={add}>Add Language</Button>
        </div>
        <div className="flex gap-2 flex-wrap mb-2">
          {["English", "Hindi", "Spanish", "French", "German"].map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onChange([...data, { id: generateId(), name: lang, proficiency: "intermediate" }])}
              className="px-2 py-1 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
            >
              + {lang}
            </button>
          ))}
        </div>
      </div>
      {data.map((item) => (
        <div key={item.id} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor={`lang-name-${item.id}`} className="block text-sm font-medium mb-1">Language</label>
            <input
              id={`lang-name-${item.id}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={item.name}
              onChange={(e) => update(item.id, "name", e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor={`lang-proficiency-${item.id}`} className="block text-sm font-medium mb-1">Proficiency</label>
            <select
              id={`lang-proficiency-${item.id}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={item.proficiency}
              onChange={(e) => update(item.id, "proficiency", e.target.value)}
            >
              {proficiencies.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button onClick={() => remove(item.id)} aria-label={`Remove ${item.name || "language"}`} className="text-red-500 text-sm pb-2">Remove</button>
        </div>
      ))}
    </div>
  );
}
