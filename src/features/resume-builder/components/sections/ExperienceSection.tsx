"use client";

import { Briefcase, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { AiInlineButton } from "./AiInlineButton";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Experience } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const dateRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$|^\d{4}$|^Present$/i;

function getError(field: keyof Experience, value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (field === "startDate" || field === "endDate") {
    return dateRegex.test(value) ? undefined : "e.g. Aug 2021, 2021, or Present";
  }
  return undefined;
}

function dateRange(item: Experience): string {
  const start = item.startDate;
  const end = item.current && !item.endDate ? "Present" : item.endDate;
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" – ");
}

export function ExperienceSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), company: "", role: "", location: "", startDate: "", endDate: "", current: false, responsibilities: [], achievements: [] }]);
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

  function update(id: string, field: keyof Experience, value: string | boolean | string[]) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function addItem(id: string, field: "responsibilities" | "achievements") {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: [...e[field], ""] } : e)));
  }

  function updateItem(id: string, field: "responsibilities" | "achievements", idx: number, value: string) {
    onChange(
      data.map((e) =>
        e.id === id
          ? { ...e, [field]: e[field].map((item, i) => (i === idx ? value : item)) }
          : e
      )
    );
  }

  function removeItem(id: string, field: "responsibilities" | "achievements", idx: number) {
    onChange(
      data.map((e) =>
        e.id === id
          ? { ...e, [field]: e[field].filter((_, i) => i !== idx) }
          : e
      )
    );
  }

  return (
    <SectionCard id="experience" title="Experience" icon={Briefcase} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Briefcase}
          title="No experience yet"
          description="Add your first role — recruiters look for your career story here. Paste a LinkedIn import or type it in."
          addLabel="Add Experience"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => {
            const aiContext = [item.role, item.company].filter(Boolean).join(" at ");
            return (
              <ItemCard
                key={item.id}
                title={item.company || item.role || "New position"}
                subtitle={
                  [item.role, dateRange(item)].filter(Boolean).join(" · ") ||
                  "Add company, role, and dates"
                }
                isFirst={i === 0}
                isLast={i === data.length - 1}
                onMoveUp={() => move(item.id, -1)}
                onMoveDown={() => move(item.id, 1)}
                onDelete={() => remove(item.id)}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Company" value={item.company} onChange={(e) => update(item.id, "company", e.target.value)} className="rounded-lg" />
                  <Input label="Role" value={item.role} onChange={(e) => update(item.id, "role", e.target.value)} className="rounded-lg" />
                  <Input label="Location" value={item.location} onChange={(e) => update(item.id, "location", e.target.value)} className="rounded-lg" />
                  <Input label="Start Date" value={item.startDate} error={getError("startDate", item.startDate)} onChange={(e) => update(item.id, "startDate", e.target.value)} className="rounded-lg" />
                  <Input label="End Date" value={item.endDate} error={getError("endDate", item.endDate)} onChange={(e) => update(item.id, "endDate", e.target.value)} className="rounded-lg" />
                  <label className="flex items-center gap-2 text-sm text-gray-600 mt-auto pb-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.current}
                      onChange={(e) => update(item.id, "current", e.target.checked)}
                      className="w-4 h-4 rounded accent-accent-500"
                    />
                    Currently working here
                  </label>
                </div>

                {/* Responsibilities with inline AI */}
                <BulletList
                  title="Responsibilities"
                  bullets={item.responsibilities}
                  onAdd={() => addItem(item.id, "responsibilities")}
                  onChange={(idx, value) => updateItem(item.id, "responsibilities", idx, value)}
                  onRemove={(idx) => removeItem(item.id, "responsibilities", idx)}
                  aiContext={aiContext}
                />

                {/* Achievements with inline AI */}
                <BulletList
                  title="Achievements"
                  bullets={item.achievements}
                  onAdd={() => addItem(item.id, "achievements")}
                  onChange={(idx, value) => updateItem(item.id, "achievements", idx, value)}
                  onRemove={(idx) => removeItem(item.id, "achievements", idx)}
                  aiContext={aiContext}
                />
              </ItemCard>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

/** One collapsible bullet row with an inline AI rewrite button. */
function BulletRow({
  value,
  index,
  onChange,
  onRemove,
  aiContext,
}: {
  value: string;
  index: number;
  onChange: (idx: number, value: string) => void;
  onRemove: (idx: number) => void;
  aiContext: string;
}) {
  return (
    <div className="flex items-center gap-2 group">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-400 shrink-0" aria-hidden />
      <input
        aria-label={`Bullet point ${index + 1}`}
        placeholder={`Bullet point ${index + 1}`}
        className="flex-1 min-w-0 h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
        value={value}
        onChange={(e) => onChange(index, e.target.value)}
      />
      <AiInlineButton
        action="enhance-bullet"
        input={value}
        context={aiContext}
        iconOnly
        disabled={!value.trim()}
        onResult={(text) => onChange(index, text)}
      />
      <button
        onClick={() => onRemove(index)}
        aria-label={`Remove bullet point ${index + 1}`}
        className="h-8 w-8 shrink-0 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Collapsible list of bullet fields with an AI co-pilot per row. */
function BulletList({
  title,
  bullets,
  onAdd,
  onChange,
  onRemove,
  aiContext,
}: {
  title: string;
  bullets: string[];
  onAdd: () => void;
  onChange: (idx: number, value: string) => void;
  onRemove: (idx: number) => void;
  aiContext: string;
}) {
  return (
    <div className="pt-3">
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-[12px] font-semibold text-gray-700">{title}</label>
        <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1 text-accent-600 hover:text-accent-700 hover:bg-accent-50 -mr-2">
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>
      {bullets.length === 0 ? (
        <p className="text-xs text-gray-400">
          No {title.toLowerCase()} yet — add one, or type a draft and hit the sparkle to let AI polish it.
        </p>
      ) : (
        <div className="space-y-2">
          {bullets.map((b, i) => (
            <BulletRow key={i} value={b} index={i} onChange={onChange} onRemove={onRemove} aiContext={aiContext} />
          ))}
        </div>
      )}
    </div>
  );
}
