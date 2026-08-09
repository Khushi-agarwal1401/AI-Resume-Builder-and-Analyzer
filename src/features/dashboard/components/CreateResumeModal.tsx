"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  FileUp,
  GraduationCap,
  Loader2,
  PenLine,
  Sparkles,
  TrendingUp,
  UploadCloud,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

type Step = "method" | "create" | "upload";

interface CreateResumeModalProps {
  open: boolean;
  onClose: () => void;
  initialStep?: Step;
}

const ACCEPTED_EXTENSIONS = ["pdf", "docx", "txt"];

/** Human-friendly file size formatting. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * "New Resume" wizard — three ways to start a resume:
 *  1. Create Resume   → pick a level (student / internship / fresher / experienced)
 *  2. Fetch from LinkedIn + GitHub → jump to the existing integration pages
 *  3. Upload Resume   → parse an existing PDF/DOCX/TXT and rebuild it in the builder
 */
export function CreateResumeModal({ open, onClose, initialStep = "method" }: CreateResumeModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset to the initial step whenever the modal (re)opens
  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setFile(null);
      setUploadError("");
      setUploading(false);
      setDragging(false);
    }
  }, [open]);

  // Close on Escape + lock background scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const stepTitle: Record<Step, { title: string; subtitle: string }> = {
    method: { title: "How do you want to start?", subtitle: "Pick a starting point — you can always switch later." },
    create: { title: "Choose your level", subtitle: "We'll tailor the template and suggestions to your experience." },
    upload: { title: "Upload your resume", subtitle: "We'll extract the content and rebuild it in the builder — AI-polished." },
  };

  /** Selects a file for review — the actual upload happens on explicit confirm. */
  const handleFileSelected = useCallback((selected: File | null) => {
    if (!selected) return;
    const ext = selected.name.split(".").pop()?.toLowerCase() || "";
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setUploadError("Unsupported file type. Please upload a PDF, DOCX, or TXT resume.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setUploadError("File is too large. Please upload a resume under 5 MB.");
      return;
    }

    setFile(selected);
    setUploadError("");
  }, []);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFileSelected(e.dataTransfer.files?.[0] ?? null);
  }

  /** Uploads the selected file: parse → AI structure → create resume → open builder. */
  const handleUpload = useCallback(async () => {
    if (!file || uploading) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resumes/import", { method: "POST", body: formData });
      const json = await res.json();
      if (json.success && json.data?.id) {
        toast.success("Resume imported! Opening builder…");
        router.push(`/builder/${json.data.id}`);
      } else {
        setUploadError(json.error || "Could not import your resume. Please try again.");
      }
    } catch {
      setUploadError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [file, uploading, router]);

  const back = () => setStep((s) => (s === "create" || s === "upload" ? "method" : s));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={stepTitle[step].title}
        className="relative w-full max-w-3xl max-h-[90dvh] overflow-y-auto bg-white rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3 min-w-0">
            {step !== "method" && (
              <button
                onClick={back}
                aria-label="Back"
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{stepTitle[step].title}</h2>
              <p className="text-sm text-gray-500 mt-0.5 truncate">{stepTitle[step].subtitle}</p>
            </div>
          </div>
          <button
            id="close-create-modal"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* ── STEP 1: method picker ── */}
          {step === "method" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Create Resume */}
              <button
                id="tour-step-2"
                onClick={() => setStep("create")}
                className="group flex flex-col items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md hover:bg-purple-50/30 text-left transition-all active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <PenLine className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    Create Resume
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Start from scratch with a guided builder. Pick your level and we&apos;ll scaffold it.
                  </p>
                </div>
              </button>

              {/* Upload Resume */}
              <button
                id="tour-step-4"
                onClick={() => setStep("upload")}
                className="group flex flex-col items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md hover:bg-emerald-50/30 text-left transition-all active:scale-[0.99]"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <FileUp className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    Upload Resume
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Upload an existing PDF, DOCX, or TXT resume and we&apos;ll rebuild it for you.
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* ── STEP 2a: level picker (create from scratch) ── */}
          {step === "create" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { onClose(); router.push("/templates?level=student"); }}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-green-500 hover:shadow-md hover:bg-green-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Student</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Showcase your academic achievements, projects, and extracurriculars.</p>
                </div>
              </button>

              <button
                onClick={() => { onClose(); router.push("/templates?level=student_internship"); }}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md hover:bg-blue-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Internship</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Highlight your foundational skills and previous internship experiences.</p>
                </div>
              </button>

              <button
                onClick={() => { onClose(); router.push("/templates?level=fresher"); }}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-purple-500 hover:shadow-md hover:bg-purple-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Fresher</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Stand out for entry-level roles with a focus on potential and core skills.</p>
                </div>
              </button>

              <button
                onClick={() => { onClose(); router.push("/templates?level=experienced"); }}
                className="flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-red-500 hover:shadow-md hover:bg-red-50/30 text-left transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Experienced</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Present your career progression, leadership, and measurable impact.</p>
                </div>
              </button>
            </div>
          )}

          {/* ── STEP 2b: upload resume ── */}
          {step === "upload" && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files?.[0] ?? null)}
              />

              {uploading ? (
                <div className="flex flex-col items-center justify-center py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/60">
                  <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                  <p className="text-sm font-semibold text-gray-700">Extracting your resume…</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs text-center">
                    We&apos;re reading <span className="font-medium text-gray-600">{file?.name}</span> and structuring your
                    experience, education, skills &amp; more.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "w-full flex flex-col items-center justify-center py-14 px-6 border-2 border-dashed rounded-xl transition-all",
                    dragging
                      ? "border-emerald-500 bg-emerald-50/60 scale-[1.01]"
                      : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all",
                    dragging ? "bg-emerald-500 text-white scale-110" : "bg-emerald-100 text-emerald-600"
                  )}>
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800">
                    {dragging ? "Drop it here!" : "Drag & drop your resume here"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">
                    or <span className="text-emerald-600 font-semibold underline underline-offset-2">browse files</span>
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <FileText className="w-3.5 h-3.5" />
                    PDF · DOCX · TXT — up to 5 MB
                  </div>
                </button>
              )}

              {file && !uploading && (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatBytes(file.size)}</p>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                    className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{uploadError}</p>
                </div>
              )}

              {file && !uploading && (
                <Button
                  variant="accent"
                  className="w-full"
                  onClick={handleUpload}
                >
                  Extract &amp; Create Resume
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          {/* Footer with step indicator */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5" aria-label="Step 1 of 2">
              <span className={cn("h-1.5 rounded-full transition-all duration-300", step === "method" ? "w-6 bg-gray-900" : "w-1.5 bg-gray-200 dark:bg-gray-700")} />
              <span className={cn("h-1.5 rounded-full transition-all duration-300", step !== "method" ? "w-6 bg-accent-500" : "w-1.5 bg-gray-200 dark:bg-gray-700")} />
            </div>
            <span className="text-xs text-gray-400">
              {step === "method" ? "Step 1 of 2 — choose a method" : `Step 2 of 2 — ${stepTitle[step].title.toLowerCase()}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
