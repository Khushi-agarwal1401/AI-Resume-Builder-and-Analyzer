"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Project, TargetLevel } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Project[];
  targetLevel?: TargetLevel;
  onChange: (data: Project[]) => void;
}

export function ProjectSection({ data, targetLevel = "fresher", onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), name: "", description: "", technologies: [], liveUrl: "", githubUrl: "", client: "", teamSize: "", impact: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((p) => p.id !== id));
  }

  function update(id: string, field: keyof Project, value: string | string[]) {
    onChange(data.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Projects</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add Project</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Project Name" value={item.name} onChange={(e) => update(item.id, "name", e.target.value)} />
            <Input label="Live URL" value={item.liveUrl} onChange={(e) => update(item.id, "liveUrl", e.target.value)} />
            <Input label="GitHub URL" value={item.githubUrl} onChange={(e) => update(item.id, "githubUrl", e.target.value)} />
            
            {targetLevel === "experienced" && (
              <>
                <Input label="Client" value={item.client || ""} onChange={(e) => update(item.id, "client", e.target.value)} />
                <Input label="Team Size" value={item.teamSize || ""} onChange={(e) => update(item.id, "teamSize", e.target.value)} />
                <Input label="Impact" value={item.impact || ""} onChange={(e) => update(item.id, "impact", e.target.value)} />
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              rows={3}
              value={item.description}
              onChange={(e) => update(item.id, "description", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Technologies (comma separated)</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              value={item.technologies.join(", ")}
              onChange={(e) => update(item.id, "technologies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
