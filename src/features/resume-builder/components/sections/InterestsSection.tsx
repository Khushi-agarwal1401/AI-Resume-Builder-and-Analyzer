"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props {
  data: string[];
  onChange: (data: string[]) => void;
}

export function InterestsSection({ data, onChange }: Props) {
  function add() {
    onChange([...data, ""]);
  }

  function remove(index: number) {
    onChange(data.filter((_, i) => i !== index));
  }

  function update(index: number, value: string) {
    onChange(data.map((item, i) => (i === index ? value : item)));
  }

  return (
    <div className="space-y-4" id="Interests">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Interests</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add</Button>
      </div>
      {data.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input value={item} onChange={(e) => update(index, e.target.value)} placeholder="e.g. Data Structures" />
          <Button variant="ghost" onClick={() => remove(index)} className="text-red-500">X</Button>
        </div>
      ))}
    </div>
  );
}
