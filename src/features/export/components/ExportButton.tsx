"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ExportButtonProps {
  resumeId: string;
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
}

export function ExportButton({ resumeId, variant = "primary", label = "Export PDF" }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/${resumeId}`);
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Export failed");
        return;
      }

      // Extract filename from Content-Disposition header, or use a default
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1] || `resume_${resumeId}.html`;

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export resume. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant={variant} onClick={handleExport} disabled={loading}>
      {loading ? <Spinner /> : label}
    </Button>
  );
}
