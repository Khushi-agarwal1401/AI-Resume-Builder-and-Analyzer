"use client";

import { useState } from "react";
import { ArrowRight, FilePlus, Upload } from "lucide-react";
import { CreateResumeModal } from "@/features/dashboard/components/CreateResumeModal";
import { useCreateResume } from "@/lib/query/resume-hooks";
import { useRouter } from "next/navigation";

export default function StartPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialStep, setInitialStep] = useState<"create" | "upload">("create");
  const createResume = useCreateResume();
  const router = useRouter();

  const handleCreate = (targetLevel: string, title: string, template?: string) => {
    createResume
      .mutateAsync({ title, targetLevel, template: template || "modern" })
      .then((data) => router.push(`/builder/${data.id}`))
      .catch((err) => console.error(err));
  };

  const openBuildFromScratch = () => {
    router.push("/templates");
  };

  const openUploadResume = () => {
    setInitialStep("upload");
    setModalOpen(true);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8f9fc] flex flex-col items-center py-16 px-4 sm:px-6">
      <div className="text-center mb-12">
        <h3 className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-3">How do you want to start?</h3>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Pick the fastest path to your <br className="hidden sm:block" /> resume.
        </h1>
        <p className="text-slate-500 text-lg">
          Choose how you'd like to begin — both take just a few minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
        {/* Build from scratch card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center transition-all hover:shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white mb-6 shadow-sm">
            <FilePlus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Build from scratch</h2>
          <p className="text-slate-500 mb-8 flex-1 max-w-xs">
            Start with a blank page and let AI write every section with you.
          </p>
          <button 
            onClick={openBuildFromScratch}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 px-8 rounded-full transition-colors w-max"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Upload resume card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col items-center text-center transition-all hover:shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white mb-6 shadow-sm">
            <Upload className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Upload resume</h2>
          <p className="text-slate-500 mb-8 flex-1 max-w-xs">
            Drop in your existing resume and we'll tailor it to a matching job right away.
          </p>
          <button 
            onClick={openUploadResume}
            className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-8 rounded-full transition-colors w-max"
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <CreateResumeModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreate={handleCreate}
        initialStep={initialStep}
      />
    </div>
  );
}
