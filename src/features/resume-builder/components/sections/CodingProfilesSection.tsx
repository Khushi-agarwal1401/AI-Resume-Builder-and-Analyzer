"use client";

import { Code2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
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

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((e) => e.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof CodingProfile, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <SectionCard id="codingProfiles" title="Coding Profiles" icon={Code2} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Code2}
          title="No coding profiles yet"
          description="Add your coding platform profiles (LeetCode, Codeforces, etc.) to showcase your problem-solving skills."
          addLabel="Add Profile"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.platform || "New profile"}
              subtitle={item.handle || "Add profile details"}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Platform" value={item.platform || ""} onChange={(e) => update(item.id, "platform", e.target.value)} className="rounded-lg" />
                <Input label="Url" value={item.url || ""} onChange={(e) => update(item.id, "url", e.target.value)} className="rounded-lg" />
                <Input label="Handle" value={item.handle || ""} onChange={(e) => update(item.id, "handle", e.target.value)} className="rounded-lg" />
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
