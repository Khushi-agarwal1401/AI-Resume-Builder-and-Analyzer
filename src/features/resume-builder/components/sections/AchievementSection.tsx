"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

  function update(id: string, field: keyof Achievement, value: string) {
    onChange(data.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Achievements</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add Achievement</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <Input label="Title" value={item.title} onChange={(e) => update(item.id, "title", e.target.value)} />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              rows={2}
              value={item.description}
              onChange={(e) => update(item.id, "description", e.target.value)}
            />
          </div>
          <Input label="Date" value={item.date} onChange={(e) => update(item.id, "date", e.target.value)} />
        </div>
      ))}
    </div>
  );
}
