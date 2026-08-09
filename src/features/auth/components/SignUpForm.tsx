"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { User, Mail, Lock, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    // 1. Server-side signup: zod validation + rate limiting + DB user create.
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName: name }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data?.error || "Sign up failed. Please try again.");
      return;
    }

    // 2. Email confirmation required → guide the user, no session yet.
    if (data?.data?.requiresEmailConfirmation) {
      setLoading(false);
      setInfo(
        "Account created. Check your email to confirm your address, then sign in."
      );
      return;
    }

    // 3. Establish the same next-auth JWT session used by login.
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created, but sign in failed. Please log in.");
      return;
    }

    router.push("/onboarding/user-type");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Input */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="block text-[13px] font-bold text-gray-900">
          Full Name
        </label>
        <div className="relative">
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            required
            className="w-full h-11 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
          <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Email Input */}
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

      {/* Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-[13px] font-bold text-gray-900">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
            minLength={8}
            className="w-full h-11 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
          <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {info && <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2">{info}</p>}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full h-12 mt-4 bg-gradient-to-r from-accent-600 to-indigo-500 hover:from-accent-700 hover:to-indigo-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-accent-500/20 disabled:opacity-70"
      >
        {loading ? <Spinner /> : (
          <>
            Create Account <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Footer Text */}
      <p className="text-center text-[12px] text-gray-500 mt-6">
        By signing up, you agree to our <a href="#" className="text-accent-600 hover:underline">Terms of Service</a>
      </p>
    </form>
  );
}
