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
      <p className="text-micro text-gray-400 text-center py-6">
        Add experience entries with responsibilities first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Experience selector */}
      <div>
        <p className="text-micro font-medium text-gray-600 mb-2">Select Experience</p>
        <div className="flex flex-wrap gap-1.5">
          {experience.map((exp, i) => (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-micro font-medium transition-all",
                selectedExp === i
                  ? "bg-accent-100 text-accent-700 border border-accent-200"
                  : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-gray-300"
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
          <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-micro text-gray-500">
              <span className="font-medium text-gray-700">{currentExp.role}</span>
              {currentExp.company ? (
                <>
                  {" "}at{" "}
                  <span className="font-medium text-gray-700">{currentExp.company}</span>
                </>
              ) : null}
            </p>
          </div>

          {/* Current bullets */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-micro font-medium text-gray-600">
                {currentBullets.length} bullet{currentBullets.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={handleEnhanceAll}
                disabled={loading || !currentBullets.length}
                className="px-2.5 py-1 rounded-lg text-micro font-medium text-accent-600 hover:bg-accent-50 transition-colors disabled:opacity-50"
              >
                {loading ? "Enhancing..." : "Enhance All"}
              </button>
            </div>

            {currentBullets.map((bullet, i) => (
              <div key={i} className="group relative">
                <div
                  className={cn(
                    "p-2.5 rounded-lg border transition-all",
                    enhancedBullets[i]
                      ? "border-accent-200 bg-accent-50/50"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-small text-gray-700 leading-relaxed">
                        {enhancedBullets[i] || bullet}
                      </p>
                      {enhancedBullets[i] && (
                        <p className="text-micro text-gray-400 mt-1 line-through">
                          {bullet.length > 80 ? bullet.slice(0, 80) + "..." : bullet}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!enhancedBullets[i] ? (
                      <button
                        onClick={() => handleEnhanceOne(i)}
                        disabled={loadingIndex === i}
                        className="px-2 py-0.5 rounded-md text-micro font-medium text-accent-600 hover:bg-accent-100 transition-colors"
                      >
                        {loadingIndex === i ? "..." : "Enhance"}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onAccept?.(i, enhancedBullets[i])}
                          className="px-2 py-0.5 rounded-md text-micro font-medium text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleEnhanceOne(i)}
                          disabled={loadingIndex === i}
                          className="px-2 py-0.5 rounded-md text-micro font-medium text-gray-500 hover:bg-gray-100 transition-colors"
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
