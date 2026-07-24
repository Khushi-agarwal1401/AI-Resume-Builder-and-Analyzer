import { cn } from "@/lib/utils";

export function TemplateMiniPreview({ templateId, className }: { templateId: string; className?: string }) {
  return (
    <div className={cn("w-full h-full rounded-sm overflow-hidden bg-white flex flex-col", className)}>
      {/* Mini template preview */}
      {templateId === "modern" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-10 h-1.5 bg-black rounded mx-auto mb-0.5" /></div>
          <div className="w-6 h-0.5 bg-gray-300 rounded mx-auto" />
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="w-7 h-0.5 bg-gray-200 rounded mb-0.5" />
            <div className="w-5 h-0.5 bg-gray-200 rounded mb-0.5" />
            <div className="w-full h-0.5 bg-gray-100 rounded" />
          </div>
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="flex gap-1">
              <div className="flex-1 h-0.5 bg-gray-100 rounded" />
              <div className="flex-1 h-0.5 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      )}
      {templateId === "ats-professional" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-12 h-1 bg-gray-800 rounded mx-auto mb-0.5" /></div>
          <div className="w-7 h-0.5 bg-gray-300 rounded mx-auto" />
          <div className="mt-1">
            <div className="w-full h-1 bg-gray-200 rounded mb-1" />
            <div className="w-6 h-0.5 bg-gray-100 rounded mb-0.5" />
            <div className="w-8 h-0.5 bg-gray-100 rounded mb-0.5" />
          </div>
          <div className="mt-1">
            <div className="w-full h-1 bg-gray-200 rounded mb-1" />
            <div className="w-5 h-0.5 bg-gray-100 rounded" />
          </div>
        </div>
      )}
      {templateId === "student" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-10 h-1 bg-emerald-600 rounded mx-auto mb-0.5" /></div>
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="flex gap-1">
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-100 rounded mb-0.5" /><div className="w-3/4 h-0.5 bg-gray-100 rounded" /></div>
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-100 rounded mb-0.5" /><div className="w-3/4 h-0.5 bg-gray-100 rounded" /></div>
            </div>
          </div>
          <div className="mt-1">
            <div className="w-full h-0.5 bg-black rounded mb-0.5" />
            <div className="w-5 h-0.5 bg-gray-100 rounded" />
          </div>
        </div>
      )}
      {templateId === "minimal" && (
        <div className="p-3 flex flex-col gap-2 text-[6px]">
          <div className="w-10 h-1 bg-gray-400 rounded" />
          <div className="w-full h-0.5 bg-gray-100 rounded" />
          <div className="w-full h-0.5 bg-gray-100 rounded" />
          <div className="w-8 h-0.5 bg-gray-100 rounded" />
        </div>
      )}
      {templateId === "executive" && (
        <div className="p-3 flex flex-col gap-1.5 text-[6px]">
          <div className="text-center"><div className="w-10 h-1.5 bg-indigo-900 rounded mx-auto mb-0.5" /></div>
          <div className="w-6 h-0.5 bg-gray-500 rounded mx-auto" />
          <div className="mt-1 border-t border-indigo-200 pt-1">
            <div className="w-full h-0.5 bg-indigo-100 rounded mb-1" />
            <div className="flex gap-2">
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-200 rounded mb-0.5" /><div className="w-4 h-0.5 bg-gray-100 rounded" /></div>
              <div className="flex-1"><div className="w-full h-0.5 bg-gray-200 rounded mb-0.5" /><div className="w-4 h-0.5 bg-gray-100 rounded" /></div>
            </div>
          </div>
        </div>
      )}
      {templateId === "creative" && (
        <div className="flex h-full">
          <div className="w-1/3 bg-pink-100 p-1.5 flex flex-col gap-1">
            <div className="w-full h-1 bg-pink-400 rounded" />
            <div className="w-full h-0.5 bg-pink-300 rounded" />
            <div className="w-full h-0.5 bg-pink-300 rounded" />
          </div>
          <div className="w-2/3 p-1.5 flex flex-col gap-1">
            <div className="w-full h-0.5 bg-black rounded" />
            <div className="w-5 h-0.5 bg-gray-100 rounded" />
            <div className="w-full h-0.5 bg-gray-100 rounded" />
            <div className="w-4 h-0.5 bg-gray-100 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
