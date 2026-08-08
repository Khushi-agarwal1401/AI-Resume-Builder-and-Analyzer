"use client";

import { FolderKanban } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Project, TargetLevel } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Project[];
  targetLevel?: TargetLevel;
  onChange: (data: Project[]) => void;
}

const githubRegex = /^github\.com\/.*/i;
const urlRegex = /^(https?:\/\/)?([\w\d-]+\.)+\w{2,}(\/.*)?$/i;

function getError(field: keyof Project, value: string | undefined): string | undefined {
  if (!value) return undefined;
  switch (field) {
    case "liveUrl": return urlRegex.test(value) ? undefined : "Invalid URL format";
    case "githubUrl": return githubRegex.test(value) ? undefined : "Must be github.com/...";
    default: return undefined;
  }
}

export function ProjectSection({ data, targetLevel = "fresher", onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), name: "", description: "", technologies: [], liveUrl: "", githubUrl: "", client: "", teamSize: "", impact: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((p) => p.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((p) => p.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof Project, value: string | string[]) {
    onChange(data.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  return (
    <SectionCard id="projects" title="Projects" icon={FolderKanban} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Add your personal, open-source, or company projects to showcase your skills and impact."
          addLabel="Add Project"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.name || "New project"}
              subtitle={item.technologies.length > 0 ? item.technologies.slice(0, 3).join(", ") : "Add project details"}
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Project Name" value={item.name} onChange={(e) => update(item.id, "name", e.target.value)} className="rounded-lg" />
                <div>
                  <label htmlFor={`project-type-${item.id}`} className="block text-sm font-medium mb-1">Project Type</label>
                  <select
                    id={`project-type-${item.id}`}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
                    value={item.type || ""}
                    onChange={(e) => update(item.id, "type", e.target.value)}
                  >
                    <option value="">None</option>
                    <option value="personal">Personal</option>
                    <option value="github">GitHub</option>
                    <option value="company">Company</option>
                  </select>
                </div>
                <Input label="Live URL" value={item.liveUrl} error={getError("liveUrl", item.liveUrl)} onChange={(e) => update(item.id, "liveUrl", e.target.value)} className="rounded-lg" />
                <Input label="GitHub URL" value={item.githubUrl} error={getError("githubUrl", item.githubUrl)} onChange={(e) => update(item.id, "githubUrl", e.target.value)} className="rounded-lg" />

                {targetLevel === "experienced" && (
                  <>
                    <Input label="Client" value={item.client || ""} onChange={(e) => update(item.id, "client", e.target.value)} className="rounded-lg" />
                    <Input label="Team Size" value={item.teamSize || ""} onChange={(e) => update(item.id, "teamSize", e.target.value)} className="rounded-lg" />
                    <Input label="Impact" value={item.impact || ""} onChange={(e) => update(item.id, "impact", e.target.value)} className="rounded-lg" />
                  </>
                )}
              </div>
              <div>
                <label htmlFor={`project-desc-${item.id}`} className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  id={`project-desc-${item.id}`}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300 resize-y"
                  rows={3}
                  value={item.description}
                  onChange={(e) => update(item.id, "description", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`project-tech-${item.id}`} className="block text-sm font-medium mb-1">Technologies (comma separated)</label>
                <input
                  id={`project-tech-${item.id}`}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-accent-400 focus:ring-[3px] focus:ring-accent-500/15 hover:border-gray-300"
                  value={item.technologies.join(", ")}
                  onChange={(e) => update(item.id, "technologies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                />
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
