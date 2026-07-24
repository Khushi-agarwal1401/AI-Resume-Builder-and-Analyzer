"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

  function update(id: string, field: keyof Activity, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <div className="space-y-4" id="Activities">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Extra Curricular Activities</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Title" value={item.title || ""} onChange={(e) => update(item.id, "title", e.target.value)} />
            <Input label="Description" value={item.description || ""} onChange={(e) => update(item.id, "description", e.target.value)} />
            <Input label="Date" value={item.date || ""} onChange={(e) => update(item.id, "date", e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
