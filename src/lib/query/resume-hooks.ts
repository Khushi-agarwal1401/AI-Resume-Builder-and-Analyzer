"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import type { ResumeData } from "@/types/resume";

export interface ResumeListItem {
  id: string;
  title: string;
  template: string;
  ats_score: number | null;
  view_count: number | null;
  download_count: number | null;
  created_at: string;
  updated_at: string;
  is_pinned: boolean | null;
}

async function getResumes(): Promise<ResumeListItem[]> {
  const res = await fetch("/api/resumes");
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to load resumes");
  return json.data;
}

/** Dashboard resume list. Enable once the user is authenticated. */
export function useResumes(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.resumes,
    queryFn: getResumes,
    enabled: options?.enabled,
  });
}

/** Full resume document for a single id (powers dashboard preview cards). */
export function useResume(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.resume(id),
    queryFn: async () => {
      const res = await fetch(`/api/resumes/${id}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to load resume");
      return json.data as ResumeData;
    },
    enabled: options?.enabled !== false,
    staleTime: 30_000,
  });
}

export function useCreateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; targetLevel: string; template: string }) => {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create resume");
      return json.data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}

export function useDeleteResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resumes/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);
      if (!res.ok || (json && !json.success)) {
        throw new Error(json?.error || "Failed to delete resume");
      }
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.resumes });
      const previous = qc.getQueryData<ResumeListItem[]>(queryKeys.resumes);
      qc.setQueryData<ResumeListItem[]>(queryKeys.resumes, (old) => old?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.resumes, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}

export function useDuplicateResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/resumes/${id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to duplicate resume");
      return json.data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}

export function useRenameResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to rename resume");
    },
    onMutate: async ({ id, title }) => {
      await qc.cancelQueries({ queryKey: queryKeys.resumes });
      const previous = qc.getQueryData<ResumeListItem[]>(queryKeys.resumes);
      qc.setQueryData<ResumeListItem[]>(queryKeys.resumes, (old) =>
        old?.map((r) => (r.id === id ? { ...r, title } : r))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.resumes, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}

export function useChangeTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, template }: { id: string; template: string }) => {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to change template");
    },
    onMutate: async ({ id, template }) => {
      await qc.cancelQueries({ queryKey: queryKeys.resumes });
      const previous = qc.getQueryData<ResumeListItem[]>(queryKeys.resumes);
      qc.setQueryData<ResumeListItem[]>(queryKeys.resumes, (old) =>
        old?.map((r) => (r.id === id ? { ...r, template } : r))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.resumes, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}

/**
 * Toggle a resume's pinned (favorite) state — Epic 3, Task 3.1.
 * Optimistically flips `is_pinned`; rolls back on failure.
 */
export function useTogglePinResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: pinned }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || (json && !json.success)) {
        const err = new Error(json?.error || "Failed to update resume");
        (err as { upgradeRequired?: boolean }).upgradeRequired = json?.upgradeRequired;
        throw err;
      }
    },
    onMutate: async ({ id, pinned }) => {
      await qc.cancelQueries({ queryKey: queryKeys.resumes });
      const previous = qc.getQueryData<ResumeListItem[]>(queryKeys.resumes);
      qc.setQueryData<ResumeListItem[]>(queryKeys.resumes, (old) =>
        old?.map((r) => (r.id === id ? { ...r, is_pinned: pinned } : r))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(queryKeys.resumes, ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.resumes }),
  });
}
