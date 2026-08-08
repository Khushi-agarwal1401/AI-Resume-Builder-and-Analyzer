"use client";

import { Award } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Certification } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Certification[];
  onChange: (data: Certification[]) => void;
}

export function CertificationSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), name: "", issuer: "", date: "", url: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((c) => c.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((c) => c.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof Certification, value: string) {
    onChange(data.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  return (
    <SectionCard id="certifications" title="Certifications" icon={Award} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Award}
          title="No certifications yet"
          description="Add your professional certifications to validate your expertise and stand out to recruiters."
          addLabel="Add Certification"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.name || "New certification"}
              subtitle={item.issuer || "Add certification details"}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Certification Name" value={item.name} onChange={(e) => update(item.id, "name", e.target.value)} className="rounded-lg" />
                <Input label="Issuer" value={item.issuer} onChange={(e) => update(item.id, "issuer", e.target.value)} className="rounded-lg" />
                <Input label="Date" value={item.date} onChange={(e) => update(item.id, "date", e.target.value)} className="rounded-lg" />
                <Input label="URL" value={item.url} onChange={(e) => update(item.id, "url", e.target.value)} className="rounded-lg" />

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="e.g. AWS, Google, Microsoft (or type your own)"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
                      value={item.category || ""}
                      onChange={(e) => update(item.id, "category", e.target.value)}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {["AWS", "Google", "Microsoft", "Cisco", "CompTIA"].map((cat) => (
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
            </ItemCard>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
