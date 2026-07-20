"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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

  function update(id: string, field: keyof Certification, value: string) {
    onChange(data.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Certifications</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add Certification</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Certification Name" value={item.name} onChange={(e) => update(item.id, "name", e.target.value)} />
            <Input label="Issuer" value={item.issuer} onChange={(e) => update(item.id, "issuer", e.target.value)} />
            <Input label="Date" value={item.date} onChange={(e) => update(item.id, "date", e.target.value)} />
            <Input label="URL" value={item.url} onChange={(e) => update(item.id, "url", e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
