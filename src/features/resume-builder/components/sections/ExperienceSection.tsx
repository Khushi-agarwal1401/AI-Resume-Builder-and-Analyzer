"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Experience } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

export function ExperienceSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), company: "", role: "", location: "", startDate: "", endDate: "", current: false, responsibilities: [], achievements: [] }]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Experience</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add Experience</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Company" value={item.company} onChange={(e) => update(item.id, "company", e.target.value)} />
            <Input label="Role" value={item.role} onChange={(e) => update(item.id, "role", e.target.value)} />
            <Input label="Location" value={item.location} onChange={(e) => update(item.id, "location", e.target.value)} />
            <Input label="Start Date" value={item.startDate} onChange={(e) => update(item.id, "startDate", e.target.value)} />
            <Input label="End Date" value={item.endDate} onChange={(e) => update(item.id, "endDate", e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.current} onChange={(e) => update(item.id, "current", e.target.checked)} />
              Currently working here
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Responsibilities</label>
              <Button variant="secondary" size="sm" onClick={() => addItem(item.id, "responsibilities")}>Add</Button>
            </div>
            {item.responsibilities.map((r, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                  value={r}
                  onChange={(e) => updateItem(item.id, "responsibilities", i, e.target.value)}
                />
                <button onClick={() => removeItem(item.id, "responsibilities", i)} className="text-red-500 text-sm">x</button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Achievements</label>
              <Button variant="secondary" size="sm" onClick={() => addItem(item.id, "achievements")}>Add</Button>
            </div>
            {item.achievements.map((a, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <input
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                  value={a}
                  onChange={(e) => updateItem(item.id, "achievements", i, e.target.value)}
                />
                <button onClick={() => removeItem(item.id, "achievements", i)} className="text-red-500 text-sm">x</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
