"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface QuickCreateButtonProps {
  className?: string;
}

/** Persistent "+ New Resume" button that creates a resume and opens the builder. */
export function QuickCreateButton({ className }: QuickCreateButtonProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Resume",
          targetLevel: "fresher",
          template: "modern",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Resume created");
        router.push(`/builder/${json.data.id}`);
      } else {
        toast.error(json.error || "Could not create resume.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={creating}
      variant="primary"
      className={cn("text-white", className)}
      size="sm"
    >
      {creating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      New Resume
    </Button>
  );
}
