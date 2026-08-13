"use client";

import { useState, useEffect } from "react";
import { Wrench, X } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { AiInlineButton } from "./AiInlineButton";
import type { Skills } from "@/types/resume";

interface Props {
  data: Skills;
  onChange: (data: Skills) => void;
}

const categories: (keyof Skills)[] = ["technical", "soft", "tools", "frameworks"];

const PLACEHOLDERS: Record<keyof Skills, string> = {
  technical: "e.g. JavaScript, Python, SQL",
  soft: "e.g. Communication, Leadership, Problem Solving",
  tools: "e.g. Git, Docker, Figma",
  frameworks: "e.g. React, Node.js, Django",
};

function parseList(text: string): string[] {
  return text.split(",").map((s) => s.trim()).filter(Boolean);
}

export function SkillsSection({ data, onChange }: Props) {
  function update(category: keyof Skills, value: string) {
    onChange({ ...data, [category]: parseList(value) });
  }

  function updateList(category: keyof Skills, items: string[]) {
    onChange({ ...data, [category]: items.slice(0, 24) });
  }

  return (
    <SectionCard id="skills" title="Skills" icon={Wrench}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat) => (
          <SkillCategoryEditor
            key={cat}
            category={cat}
            values={data[cat]}
            placeholder={PLACEHOLDERS[cat]}
            onCommit={(text) => update(cat, text)}
            onApply={(items) => updateList(cat, items)}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-4">
        Type skills separated by commas — or hit ✨ Suggest and AI will propose more for each category.
      </p>
    </SectionCard>
  );
}

/** One skill category: comma input + live chips + AI suggestion. */
function SkillCategoryEditor({
  category,
  values,
  placeholder,
  onCommit,
  onApply,
}: {
  category: keyof Skills;
  values: string[];
  placeholder: string;
  onCommit: (text: string) => void;
  onApply: (items: string[]) => void;
}) {
  const [text, setText] = useState(() => values.join(", "));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    // Only sync from parent if we are NOT focused.
    // This prevents stale prop echos from wiping out spaces/commas while typing.
    if (!isFocused) {
      setText(values.join(", "));
    }
  }, [values, isFocused]);

  function handleAiResult(output: string) {
    // The model may return a bulleted/numbered list — split on any separator.
    const items = output
      .split(/[\n,;•\-–]+/)
      .map((s) => s.trim().replace(/^\d+[.)]\s*/, "").replace(/^["']|["']$/g, ""))
      .filter(Boolean);
    if (items.length > 0) onApply([...new Set(items)]);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-gray-300 focus-within:border-accent-300 focus-within:shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-500" aria-hidden />
          <label className="text-sm font-semibold text-gray-900 capitalize">{category}</label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 tabular-nums">{values.length}</span>
          <AiInlineButton
            action="add-keywords"
            input={values.join(", ")}
            context={`Target category: ${category}. Suggest additional relevant ${category} skills for a resume, as a simple list.`}
            label="Suggest"
            onResult={handleAiResult}
          />
        </div>
      </div>

      <input
        aria-label={`${category} skills`}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50/60 px-3 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 focus:bg-white hover:border-gray-300"
        value={text}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          setText(e.target.value);
          onCommit(e.target.value);
        }}
      />

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {values.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-50 border border-accent-100 text-[11px] font-semibold text-accent-700 transition-all hover:border-accent-200"
            >
              {skill}
              <button
                onClick={() => onApply(values.filter((s) => s !== skill))}
                aria-label={`Remove ${skill}`}
                className="text-accent-400 hover:text-accent-800 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
