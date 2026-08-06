"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApplyMessage, InputMode, ResumeOption } from "./types";

export function ScoreRing({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center">
        <svg width="150" height="150" className="transform -rotate-90">
          <circle cx="75" cy="75" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
          <circle
            cx="75" cy="75" r={radius} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-4xl font-extrabold" style={{ color }}>{value}</div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "green" | "amber" | "red" | "indigo";
}) {
  const tones = {
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-500",
    indigo: "text-indigo-600",
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center">
      <p className={cn("text-2xl font-extrabold", tones[tone])}>{value}</p>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-widest mt-1">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function Chip({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "green" | "red" | "gray" | "indigo" | "amber";
}) {
  const tones = {
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-gray-100 text-gray-600 border-gray-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border", tones[tone])}>
      {children}
    </span>
  );
}

export function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-all",
        active ? "border-accent-500 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
      )}
    >
      {label}
    </button>
  );
}

/** "Apply to" row shared by the keywords, bullets, and improvements tabs. */
export function ApplyTargetRow({
  mode,
  resumes,
  applyTargetId,
  onApplyTargetChange,
  description,
  action,
}: {
  mode: InputMode;
  resumes: ResumeOption[];
  applyTargetId: string;
  onApplyTargetChange: (id: string) => void;
  description: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {mode !== "resume" ? (
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Apply to</label>
          <select
            value={applyTargetId}
            onChange={(e) => onApplyTargetChange(e.target.value)}
            className="h-9 w-full sm:w-64 rounded-lg border border-gray-300 bg-white px-2.5 text-xs text-gray-900 outline-none focus:border-accent-500 focus:ring-[3px] focus:ring-accent-500/15"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-[11px] text-gray-500 flex-1">{description}</p>
      )}
      {action}
    </div>
  );
}

export function RecheckLink({ onRecheck }: { onRecheck: () => void }) {
  return (
    <button
      onClick={onRecheck}
      className="ml-1 font-semibold text-accent-600 hover:text-accent-700 hover:underline"
    >
      Re-check my score →
    </button>
  );
}

/** Success/error message shown after a one-click apply action. */
export function ApplyStatusMessage({ message, onRecheck }: { message: ApplyMessage; onRecheck: () => void }) {
  return (
    <p className={cn("text-[11px] mt-2 flex items-center gap-1", message.ok ? "text-green-600" : "text-red-600")}>
      {message.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
      {message.text}
      {message.ok && <RecheckLink onRecheck={onRecheck} />}
    </p>
  );
}
