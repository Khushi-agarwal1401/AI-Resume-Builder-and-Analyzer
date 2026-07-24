"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Education, TargetLevel } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: Education[];
  targetLevel?: TargetLevel;
  onChange: (data: Education[]) => void;
}

export function EducationSection({ data, targetLevel = "fresher", onChange }: Props) {
  function add() {
    onChange([...data, { id: generateId(), institution: "", degree: "", field: "", startDate: "", endDate: "", cgpa: "", branch: "", semester: "", classXII: "", classX: "" }]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
  }

  function update(id: string, field: keyof Education, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Education</h3>
        <Button variant="secondary" size="sm" onClick={add}>Add Education</Button>
      </div>
      {data.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-end">
            <button onClick={() => remove(item.id)} className="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Institution" value={item.institution} onChange={(e) => update(item.id, "institution", e.target.value)} />
            <Input label="Degree / Class" value={item.degree} onChange={(e) => update(item.id, "degree", e.target.value)} />
            
            {targetLevel === "fresher" && (
              <Input label="Branch" value={item.branch || ""} onChange={(e) => update(item.id, "branch", e.target.value)} />
            )}
            
            {(targetLevel === "student" || targetLevel === "student_internship") && (
              <>
                <Input label="Semester" value={item.semester || ""} onChange={(e) => update(item.id, "semester", e.target.value)} />
                <Input label="Class XII %" value={item.classXII || ""} onChange={(e) => update(item.id, "classXII", e.target.value)} />
                <Input label="Class X %" value={item.classX || ""} onChange={(e) => update(item.id, "classX", e.target.value)} />
              </>
            )}

            {targetLevel !== "student" && targetLevel !== "student_internship" && (
              <Input label="Field of Study" value={item.field} onChange={(e) => update(item.id, "field", e.target.value)} />
            )}
            
            <Input label="CGPA / Score" value={item.cgpa} onChange={(e) => update(item.id, "cgpa", e.target.value)} />
            <Input label="Start Date" value={item.startDate} onChange={(e) => update(item.id, "startDate", e.target.value)} />
            <Input label="End Date" value={item.endDate} onChange={(e) => update(item.id, "endDate", e.target.value)} />
          </div>
        </div>
      ))}
    </div>
  );
}
