"use client";

import { Heart } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Volunteer } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Volunteer[];
  onChange: (data: Volunteer[]) => void;
}

export function VolunteerSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), organization: "", role: "", startDate: "", endDate: "", description: "" }]);
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

  function update(id: string, field: keyof Volunteer, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <SectionCard id="volunteer" title="Volunteer Experience" icon={Heart} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Heart}
          title="No volunteer experience yet"
          description="Add volunteer work to showcase your community involvement and social impact."
          addLabel="Add Volunteer"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.organization || "New volunteer role"}
              subtitle={item.role || "Add volunteer details"}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Organization" value={item.organization || ""} onChange={(e) => update(item.id, "organization", e.target.value)} className="rounded-lg" />
                <Input label="Role" value={item.role || ""} onChange={(e) => update(item.id, "role", e.target.value)} className="rounded-lg" />
                <Input label="Start Date" value={item.startDate || ""} onChange={(e) => update(item.id, "startDate", e.target.value)} className="rounded-lg" />
                <Input label="End Date" value={item.endDate || ""} onChange={(e) => update(item.id, "endDate", e.target.value)} className="rounded-lg" />
                <div className="col-span-2">
                  <label htmlFor={`volunteer-desc-${item.id}`} className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    id={`volunteer-desc-${item.id}`}
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
