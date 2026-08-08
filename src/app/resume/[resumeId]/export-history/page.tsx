"use client";
import Preloader from "@/components/ui/Preloader";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { Download, FileText, Clock, ExternalLink, Trash2, History } from "lucide-react";


interface ExportRecord {
  id: string;
  format: string;
  template: string;
  file_size: number | null;
  created_at: string;
  url: string | null;
}

export default function ExportHistoryPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const resumeId = params.resumeId as string;
  const [exports, setExports] = useState<ExportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !authenticated) router.push("/login");
  }, [authLoading, authenticated, router]);

  useEffect(() => {
    fetch(`/api/resumes/${resumeId}/exports`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setExports(json.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [resumeId]);

  async function deleteExport(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/exports/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) setExports((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) return <Preloader />;

  return (
    <div className="max-w-[800px] mx-auto px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-h1 text-black flex items-center gap-2">
            <History className="w-5 h-5 text-accent-600" />
            Export History
          </h1>
          <p className="text-body text-gray-500 mt-1">All previous exports for this resume.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push(`/builder/${resumeId}`)}>
          Back to Builder
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Spinner /></div>
      ) : exports.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-sm">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No exports yet</p>
          <p className="text-sm text-gray-400 mt-1">Generate your first export from the builder.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Format</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Template</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exports.map((exp) => (
                  <tr key={exp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-accent-50 text-accent-700 font-medium">{exp.format.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 capitalize">{exp.template}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{exp.file_size ? `${(exp.file_size / 1024).toFixed(1)} KB` : "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      {new Date(exp.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {exp.url && (
                          <Button variant="ghost" size="sm" onClick={() => window.open(exp.url!, "_blank")} className="text-[11px]">
                            <ExternalLink className="w-3 h-3 mr-0.5" /> Open
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => exp.url && window.open(exp.url, "_blank")} className="text-[11px]">
                          <Download className="w-3 h-3 mr-0.5" /> Download
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteExport(exp.id)} disabled={deletingId === exp.id} className="text-red-500 text-[11px]">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}