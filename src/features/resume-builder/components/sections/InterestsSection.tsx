"use client";

import { Heart } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { SectionEmptyState } from "./SectionEmptyState";

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
    <SectionCard id="interests" title="Interests" icon={Heart} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={Heart}
          title="No interests yet"
          description="Add your hobbies and interests to showcase your personality and well-roundedness."
          addLabel="Add Interest"
          onAdd={add}
        />
      ) : (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => update(index, e.target.value)}
                placeholder="e.g. Photography, Hiking"
                aria-label={`Interest ${index + 1}`}
                className="rounded-lg"
              />
              <button
                onClick={() => remove(index)}
                aria-label={`Remove interest ${index + 1}`}
                className="text-red-500 text-sm px-2 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
