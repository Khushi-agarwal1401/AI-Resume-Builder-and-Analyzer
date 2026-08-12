"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowRight, ArrowLeft, Sparkles, MailCheck } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json?.error || "Something went wrong. Please try again.");
        return;
      }

      // The route intentionally returns success for unknown emails too —
      // show the same "check your inbox" state either way.
      setSent(true);
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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 to-transparent opacity-60 pointer-events-none dark:from-blue-500/20" />
        <div className="absolute top-10 right-10 w-64 h-64 opacity-10" style={{ backgroundImage: 'radial-gradient(#4f46e5 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-md shadow-blue-500/20">
            <Image src="/images/logo.png" alt="ResumeCareer logo" fill sizes="36px" className="object-contain" />
          </div>
          <span className="text-[18px] font-bold text-gray-900 tracking-tight">Resume<span className="text-blue-600">Career</span></span>
        </div>

        <div className="relative z-10 max-w-[500px] my-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-accent-600 text-[10px] font-bold tracking-widest uppercase mb-8">
            <Sparkles className="w-3 h-3" />
            Account Recovery
          </div>
          <h1 className="text-[52px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Lost access?<br />
            <span className="text-accent-600">Let&apos;s get you back in.</span>
          </h1>
          <p className="text-[18px] text-gray-600 leading-relaxed max-w-[420px]">
            Enter your email and we&apos;ll send you a secure link to reset your password.
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <MailCheck className="w-7 h-7 text-emerald-500" />
              </div>
              <h2 className="text-[24px] font-bold text-gray-900 mb-2 tracking-tight">Check your inbox</h2>
              <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                If an account exists for <strong className="text-gray-700">{email}</strong>, we&apos;ve
                sent a password reset link. It expires in a few hours — check your spam folder too.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full h-12 bg-gradient-to-r from-accent-600 to-indigo-500 hover:from-accent-700 hover:to-indigo-600 text-white font-bold rounded-lg transition-all shadow-md shadow-accent-500/20"
              >
                Back to sign in <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-[28px] font-bold text-gray-900 mb-2 tracking-tight">Reset your password</h2>
                <p className="text-[14px] text-gray-500">
                  We&apos;ll email you a secure link to create a new one.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="block text-[13px] font-bold text-gray-900">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full h-11 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
                    />
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
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
                      Send reset link <ArrowRight className="w-4 h-4" />
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
