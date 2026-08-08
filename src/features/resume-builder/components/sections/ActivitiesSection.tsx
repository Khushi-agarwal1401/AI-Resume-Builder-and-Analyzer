"use client";

import { Dumbbell } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Activity } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Activity[];
  onChange: (data: Activity[]) => void;
}

export function ActivitiesSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), title: "", description: "", date: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((e) => e.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof Activity, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <SectionCard id="activities" title="Extra Curricular Activities" icon={Dumbbell} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Dumbbell}
          title="No activities yet"
          description="Add extracurricular activities to showcase your well-rounded personality and interests."
          addLabel="Add Activity"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.title || "New activity"}
              subtitle={item.date || "Add activity details"}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Title" value={item.title || ""} onChange={(e) => update(item.id, "title", e.target.value)} className="rounded-lg" />
                <Input label="Date" value={item.date || ""} onChange={(e) => update(item.id, "date", e.target.value)} className="rounded-lg" />
                <div className="col-span-2">
                  <label htmlFor={`activity-desc-${item.id}`} className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    id={`activity-desc-${item.id}`}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y"
                    rows={2}
                    value={item.description || ""}
                    onChange={(e) => update(item.id, "description", e.target.value)}
                  />
                </div>
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
