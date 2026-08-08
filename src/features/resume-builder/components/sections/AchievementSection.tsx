"use client";

import { Trophy } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Achievement } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Achievement[];
  onChange: (data: Achievement[]) => void;
}

export function AchievementSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), title: "", description: "", date: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((a) => a.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((a) => a.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof Achievement, value: string) {
    onChange(data.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  return (
    <SectionCard id="achievements" title="Achievements" icon={Trophy} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Trophy}
          title="No achievements yet"
          description="Add awards, hackathon wins, honors, and scholarships to highlight your accomplishments."
          addLabel="Add Achievement"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.title || "New achievement"}
              subtitle={item.category || "Add achievement details"}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Title" value={item.title} onChange={(e) => update(item.id, "title", e.target.value)} className="rounded-lg" />
                <Input label="Date" value={item.date} onChange={(e) => update(item.id, "date", e.target.value)} className="rounded-lg" />

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Award, Hackathon, Competition (or type your own)"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
                      value={item.category || ""}
                      onChange={(e) => update(item.id, "category", e.target.value)}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {["Award", "Hackathon", "Competition", "Honor", "Scholarship"].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => update(item.id, "category", cat)}
                          className="px-2 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label htmlFor={`achievement-desc-${item.id}`} className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  id={`achievement-desc-${item.id}`}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y"
                  rows={2}
                  value={item.description}
                  onChange={(e) => update(item.id, "description", e.target.value)}
                />
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
