"use client";

import { Globe } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
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

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((l) => l.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof Language, value: string) {
    onChange(data.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  return (
    <SectionCard id="languages" title="Languages" icon={Globe} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Globe}
          title="No languages yet"
          description="Add languages you speak to showcase your communication skills and cultural adaptability."
          addLabel="Add Language"
          onAdd={add}
        />
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-3">
            {["English", "Hindi", "Spanish", "French", "German"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onChange([...data, { id: generateId(), name: lang, proficiency: "intermediate" }])}
                className="px-2 py-1 text-xs rounded-md bg-accent-50 text-accent-700 hover:bg-accent-100 transition-colors border border-accent-200"
              >
                + {lang}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {data.map((item, i) => (
              <ItemCard
                key={item.id}
                title={item.name || "New language"}
                subtitle={item.proficiency || "Add language details"}
                isFirst={i === 0}
                isLast={i === data.length - 1}
                onMoveUp={() => move(item.id, -1)}
                onMoveDown={() => move(item.id, 1)}
                onDelete={() => remove(item.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor={`lang-name-${item.id}`} className="block text-sm font-medium mb-1">Language</label>
                    <input
                      id={`lang-name-${item.id}`}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
                      value={item.name}
                      onChange={(e) => update(item.id, "name", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor={`lang-proficiency-${item.id}`} className="block text-sm font-medium mb-1">Proficiency</label>
                    <select
                      id={`lang-proficiency-${item.id}`}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
                      value={item.proficiency}
                      onChange={(e) => update(item.id, "proficiency", e.target.value)}
                    >
                      {proficiencies.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </ItemCard>
            ))}
          </div>
        </>
      )}
    </SectionCard>
  );
}
