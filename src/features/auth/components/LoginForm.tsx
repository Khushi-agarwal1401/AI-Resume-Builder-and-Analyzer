"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
            placeholder="Enter your password"
            required
            className="w-full h-11 bg-white border border-gray-200 rounded-lg px-4 pr-10 text-[14px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 transition-all"
          />
          <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Remember me & Forgot Password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            className="w-4 h-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 cursor-pointer"
          />
          <span className="text-[13px] text-gray-700">Remember me</span>
        </label>
        <a href="#" className="text-[13px] font-bold text-accent-600 hover:text-accent-700">
          Forgot password?
        </a>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Submit Button */}
      <button 
        type="submit" 
        disabled={loading}
        className="w-full h-12 mt-2 bg-gradient-to-r from-accent-600 to-indigo-500 hover:from-accent-700 hover:to-indigo-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-accent-500/20 disabled:opacity-70"
      >
        {loading ? <Spinner /> : (
          <>
            Sign in <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Footer Text */}
      <p className="text-center text-[12px] text-gray-500 mt-6">
        By signing in, you agree to our <a href="#" className="text-accent-600 hover:underline">Terms of Service</a>
      </p>
    </form>
  );
}
