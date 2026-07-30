"use client";

import { useState, useCallback } from "react";
import { callAi } from "@/features/ai-assistant/api/ai";
import type { ResumeData } from "@/types/resume";
import { cn } from "@/lib/utils";

interface BulletImproverProps {
  experience?: ResumeData["experience"];
  onAccept?: (index: number, enhanced: string) => void;
}

export function BulletImprover({ experience, onAccept }: BulletImproverProps) {
  const [selectedExp, setSelectedExp] = useState(0);
  const [enhancedBullets, setEnhancedBullets] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const currentExp = experience?.[selectedExp];
  const currentBullets = currentExp?.responsibilities || [];

  const handleSelect = useCallback(
    (idx: number) => {
      setSelectedExp(idx);
      setEnhancedBullets([]);
    },
    []
  );

  const handleEnhanceAll = useCallback(async () => {
    if (!currentBullets.length) return;
    setLoading(true);
    setEnhancedBullets([]);
    const results: string[] = [];
    for (let i = 0; i < currentBullets.length; i++) {
      try {
        const res = await callAi(
          "enhance-bullet",
          currentBullets[i],
          `Role: ${currentExp?.role} at ${currentExp?.company}`
        );
        results.push(res.success ? res.output : currentBullets[i]);
      } catch {
        results.push(currentBullets[i]);
      }
    }
    setEnhancedBullets(results);
    setLoading(false);
  }, [currentBullets, currentExp]);

  const handleEnhanceOne = useCallback(
    async (idx: number) => {
      setLoadingIndex(idx);
      try {
        const res = await callAi(
          "enhance-bullet",
          currentBullets[idx],
          `Role: ${currentExp?.role} at ${currentExp?.company}`
        );
        if (res.success) {
          const newEnhanced = [...enhancedBullets];
          newEnhanced[idx] = res.output;
          setEnhancedBullets(newEnhanced);
        }
      } catch {
        // ignore
      } finally {
        setLoadingIndex(null);
      }
    },
    [currentBullets, currentExp, enhancedBullets]
  );

  if (!experience?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <p className="text-[13px] font-medium text-gray-600">No experience entries</p>
        <p className="text-[11px] text-gray-400 mt-1">Add experience entries with responsibilities first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Experience selector */}
      <div>
        <p className="text-[12px] font-medium text-gray-600 mb-2">Select Experience</p>
        <div className="flex flex-wrap gap-1.5">
          {experience.map((exp, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                selectedExp === i
                  ? "bg-accent-100 text-accent-700 border-accent-200 shadow-sm"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100/50"
              )}
            >
              {exp.role || `Entry ${i + 1}`}
            </button>
          ))}
        </div>
      </div>

      {currentExp && (
        <>
          {/* Context */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent-100 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-600">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">{currentExp.role}</p>
                {currentExp.company && (
                  <p className="text-[11px] text-gray-500">{currentExp.company}</p>
                )}
              </div>
            </div>
          </div>

          {/* Current bullets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-medium text-gray-600 flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                {currentBullets.length} bullet{currentBullets.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={handleEnhanceAll}
                disabled={loading || !currentBullets.length}
                className={cn(
                  "px-3 py-1 rounded-lg text-[11px] font-medium transition-all",
                  "text-accent-600 hover:bg-accent-50 border border-transparent hover:border-accent-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-accent-300 border-t-accent-600 rounded-full animate-spin" />
                    Enhancing...
                  </span>
                ) : (
                  "Enhance All"
                )}
              </button>
            </div>

            {currentBullets.map((bullet, i) => (
              <div key={i} className="group">
                <div
                  className={cn(
                    "p-3 rounded-xl border transition-all duration-200",
                    enhancedBullets[i]
                      ? "border-accent-200 bg-accent-50/50 shadow-sm"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      enhancedBullets[i] ? "bg-accent-200" : "bg-gray-100"
                    )}>
                      <span className={cn("text-[9px] font-bold", enhancedBullets[i] ? "text-accent-700" : "text-gray-500")}>{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 leading-relaxed">
                        {enhancedBullets[i] || bullet}
                      </p>
                      {enhancedBullets[i] && bullet !== enhancedBullets[i] && (
                        <p className="text-[11px] text-gray-400 mt-1.5 line-through decoration-gray-300">
                          {bullet.length > 80 ? bullet.slice(0, 80) + "..." : bullet}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!enhancedBullets[i] ? (
                      <button
                        onClick={() => handleEnhanceOne(i)}
                        disabled={loadingIndex === i}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium text-accent-600 hover:bg-accent-100 transition-colors border border-transparent hover:border-accent-200"
                      >
                        {loadingIndex === i ? (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 border-2 border-accent-300 border-t-accent-600 rounded-full animate-spin" />
                            ...
                          </span>
                        ) : "Enhance"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onAccept?.(i, enhancedBullets[i])}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium text-green-600 hover:bg-green-50 transition-colors border border-transparent hover:border-green-200"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleEnhanceOne(i)}
                          disabled={loadingIndex === i}
                          className="px-2.5 py-1 rounded-md text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
