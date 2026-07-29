"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useBuilder } from "./builder-context";
import { Spinner } from "@/components/ui/Spinner";

export default function BuilderRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const resumeId = params.resumeId as string;
  const { sectionIds } = useBuilder();

  useEffect(() => {
    if (sectionIds.length > 0 && resumeId) {
      router.replace(`/builder/${resumeId}/${sectionIds[0]}`);
    }
  }, [sectionIds, resumeId, router]);

  // Show a minimal loading state while the layout loads data
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Spinner />
        <p className="text-sm text-gray-400">Loading section...</p>
      </div>
    </div>
  );
}
