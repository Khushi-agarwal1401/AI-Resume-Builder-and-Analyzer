"use client";

import { useState, useEffect, useCallback } from "react";
import type { ResumeData } from "@/types/resume";

const EMPTY_RESUME: ResumeData = {
  id: "",
  userId: "",
  title: "Untitled Resume",
  template: "modern",
  personalInfo: { fullName: "", email: "", phone: "", linkedin: "", github: "", portfolio: "", photo: "" },
  summary: "",
  education: [],
  experience: [],
  projects: [],
  skills: { technical: [], soft: [], tools: [], frameworks: [] },
  certifications: [],
  achievements: [],
  languages: [],
  createdAt: "",
  updatedAt: "",
};

export function useResumeForm(resumeId: string) {
  const [data, setData] = useState<ResumeData | null>(resumeId === "new" ? EMPTY_RESUME : null);
  const [loading, setLoading] = useState(resumeId !== "new");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resumeId === "new") return;

    fetch(`/api/resumes/${resumeId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setData(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [resumeId]);

  const updateField = useCallback(
    async (field: string, value: unknown) => {
      setData((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  const saveResume = useCallback(async () => {
    if (!data || resumeId === "new") return;
    setSaving(true);
    try {
      await fetch(`/api/resumes/${resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          template: data.template,
          personalInfo: data.personalInfo,
          summary: data.summary,
        }),
      });
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }, [data, resumeId]);

  // Autosave
  useEffect(() => {
    if (!data || resumeId === "new" || loading) return;
    
    const timer = setTimeout(() => {
      saveResume();
    }, 1000); // 1s debounce
    
    return () => clearTimeout(timer);
  }, [data, resumeId, loading, saveResume]);

  return { data, setData, loading, saving, updateField, saveResume };
}
