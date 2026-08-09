"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, ArrowLeft, Sparkles, CheckCircle2, TriangleAlert } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

type Stage = "checking" | "ready" | "success" | "invalid";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [stage, setStage] = useState<Stage>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // On mount, confirm the reset token is valid before showing the form.
  useEffect(() => {
    let cancelled = false;
    async function checkToken() {
      try {
        if (!token) {
          if (!cancelled) setStage("invalid");
          return;
        }
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (!cancelled) setStage(json.valid ? "ready" : "invalid");
      } catch {
        if (!cancelled) setStage("invalid");
      }
    }
    checkToken();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Unable to reset your password. Please try again.");
        return;
      }
      setStage("success");
      // Give the success state a moment before heading back to login.
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[#f8f9fc]">
      {/* LEFT COLUMN - Marketing (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60 pointer-events-none" />
        <div className="absolute top-10 right-10 w-64 h-64 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center relative overflow-hidden shrink-0 shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
            <div className="w-3.5 h-3.5 bg-white rounded-sm rotate-45" />
          </div>
          <span className="text-[18px] font-bold text-gray-900 tracking-tight">AI Resume Builder & Analyzer</span>
        </div>

        <div className="relative z-10 max-w-[500px] my-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-accent-600 text-[10px] font-bold tracking-widest uppercase mb-8">
            <Sparkles className="w-3 h-3" />
            Account Recovery
          </div>
          <h1 className="text-[52px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Almost there.<br />
            <span className="text-accent-600">Pick a new password.</span>
          </h1>
          <p className="text-[18px] text-gray-600 leading-relaxed max-w-[420px]">
            Choose something strong you haven&apos;t used before — then sign in and get back to your resumes.
          </p>
        </div>

        <p className="relative z-10 text-[12px] text-gray-500 font-medium">
          Trusted by 50,000+ job seekers worldwide
        </p>
      </div>

      {/* RIGHT COLUMN - Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative p-6">
        <div className="absolute top-8 right-8 z-10">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-[14px] text-accent-600 font-medium hover:text-accent-700 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </div>

        <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 sm:p-10 z-10">
          {stage === "checking" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner />
              <p className="text-sm text-gray-500 mt-4">Verifying your link…</p>
            </div>
          )}

          {stage === "invalid" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <TriangleAlert className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">Invalid or expired link</h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                This password reset link is invalid or has expired. Request a new one and try again.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center gap-2 w-full h-12 bg-gradient-to-r from-accent-600 to-indigo-500 hover:from-accent-700 hover:to-indigo-600 text-white font-bold rounded-lg transition-all shadow-md shadow-accent-500/20"
              >
                Request a new link <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {stage === "success" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">Password updated</h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                Your password has been changed. Taking you back to sign in…
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-12 bg-gradient-to-r from-accent-600 to-indigo-500 hover:from-accent-700 hover:to-indigo-600 text-white font-bold rounded-lg transition-all shadow-md shadow-accent-500/20"
              >
                Sign in now <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {stage === "ready" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-[28px] font-bold text-gray-900 mb-2 tracking-tight">Set a new password</h2>
                <p className="text-[14px] text-gray-500">
                  Use at least 8 characters with a mix of letters and numbers.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="password" className="block text-[13px] font-bold text-gray-900">
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a new password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      className="w-full h-11 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirm" className="block text-[13px] font-bold text-gray-900">
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm"
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                      autoComplete="new-password"
                      className="w-full h-11 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                    />
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 bg-gradient-to-r from-accent-600 to-indigo-500 hover:from-accent-700 hover:to-indigo-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-accent-500/20 disabled:opacity-70"
                >
                  {loading ? <Spinner /> : (
                    <>
                      Update password <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-[#f8f9fc]"><Spinner /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
