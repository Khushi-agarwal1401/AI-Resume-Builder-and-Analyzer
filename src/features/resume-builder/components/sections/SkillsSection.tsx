"use client";

import type { Skills } from "@/types/resume";

interface Props {
  data: Skills;
  onChange: (data: Skills) => void;
}

const categories: (keyof Skills)[] = ["technical", "soft", "tools", "frameworks"];

export function SkillsSection({ data, onChange }: Props) {
  function update(category: keyof Skills, value: string) {
    onChange({ ...data, [category]: value.split(",").map((s) => s.trim()).filter(Boolean) });
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Skills</h3>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat}>
            <label className="block text-sm font-medium mb-1 capitalize">{cat}</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={data[cat].join(", ")}
              onChange={(e) => update(cat, e.target.value)}
              placeholder={`e.g. ${cat === "technical" ? "JavaScript, Python" : cat === "soft" ? "Communication, Leadership" : cat === "tools" ? "Git, Docker" : "React, Node.js"}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
