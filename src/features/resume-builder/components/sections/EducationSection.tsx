"use client";

import { GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { SectionCard } from "@/components/ui/SectionCard";
import { ItemCard } from "@/components/ui/ItemCard";
import { SectionEmptyState } from "./SectionEmptyState";
import type { Education, TargetLevel } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Education[];
  targetLevel?: TargetLevel;
  onChange: (data: Education[]) => void;
}

const cgpaRegex = /^(\d+(\.\d+)?%?|\d+\/\d+)$/;
const percentageRegex = /^(100(\.0{1,2})?%?|\d{1,2}(\.\d{1,2})?%?)$/;
const dateRegex = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s\d{4}$|^\d{4}$|^Present$/i;

function getError(field: keyof Education, value: string | undefined): string | undefined {
  if (!value) return undefined;
  switch (field) {
    case "cgpa": return cgpaRegex.test(value) ? undefined : "e.g. 9.5, 95%, 3.8/4";
    case "classXII":
    case "classX": return percentageRegex.test(value) ? undefined : "e.g. 95 or 95%";
    case "startDate":
    case "endDate": return dateRegex.test(value) ? undefined : "e.g. Aug 2021, 2021, or Present";
    default: return undefined;
  }
}

export function EducationSection({ data, targetLevel = "fresher", onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), institution: "", degree: "", field: "", startDate: "", endDate: "", cgpa: "", branch: "", semester: "", classXII: "", classX: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = data.findIndex((e) => e.id === id);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= data.length) return;
    const next = [...data];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  function update(id: string, field: keyof Education, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  const showSchooling = targetLevel === "student" || targetLevel === "student_internship";

  return (
    <SectionCard id="education" title="Education" icon={GraduationCap} onAdd={add}>
      {data.length === 0 ? (
        <SectionEmptyState
          icon={GraduationCap}
          title="No education yet"
          description="Add your school, degree, and scores — education leads the hierarchy for students and recent graduates."
          addLabel="Add Education"
          onAdd={add}
        />
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => (
            <ItemCard
              key={item.id}
              title={item.institution || item.degree || "New education"}
              subtitle={
                [item.degree, item.field, item.startDate && item.endDate ? `${item.startDate} – ${item.endDate}` : ""]
                  .filter(Boolean)
                  .join(" · ") || "Add institution and degree"
              }
              isFirst={i === 0}
              isLast={i === data.length - 1}
              onMoveUp={() => move(item.id, -1)}
              onMoveDown={() => move(item.id, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Institution" value={item.institution} onChange={(e) => update(item.id, "institution", e.target.value)} className="rounded-lg" />
                <Input label="Degree / Class" value={item.degree} onChange={(e) => update(item.id, "degree", e.target.value)} className="rounded-lg" />

                {targetLevel === "fresher" && (
                  <Input label="Branch" value={item.branch || ""} onChange={(e) => update(item.id, "branch", e.target.value)} className="rounded-lg" />
                )}

                {showSchooling && (
                  <>
                    <Input label="Semester" value={item.semester || ""} onChange={(e) => update(item.id, "semester", e.target.value)} className="rounded-lg" />
                    <Input label="Class XII %" value={item.classXII || ""} error={getError("classXII", item.classXII)} onChange={(e) => update(item.id, "classXII", e.target.value)} className="rounded-lg" />
                    <Input label="Class X %" value={item.classX || ""} error={getError("classX", item.classX)} onChange={(e) => update(item.id, "classX", e.target.value)} className="rounded-lg" />
                  </>
                )}

                {!showSchooling && (
                  <Input label="Field of Study" value={item.field} onChange={(e) => update(item.id, "field", e.target.value)} className="rounded-lg" />
                )}

                <Input label="CGPA / Score" value={item.cgpa} error={getError("cgpa", item.cgpa)} onChange={(e) => update(item.id, "cgpa", e.target.value)} className="rounded-lg" />
                <Input label="Start Date" value={item.startDate} error={getError("startDate", item.startDate)} onChange={(e) => update(item.id, "startDate", e.target.value)} className="rounded-lg" />
                <Input label="End Date" value={item.endDate} error={getError("endDate", item.endDate)} onChange={(e) => update(item.id, "endDate", e.target.value)} className="rounded-lg" />
              </div>
            </ItemCard>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
