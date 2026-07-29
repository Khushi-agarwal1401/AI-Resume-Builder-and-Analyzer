"use client";

import { signIn } from "next-auth/react";
import { Linkedin, Github } from "lucide-react";

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors"
      >
        {/* using Github icon as a placeholder for Google since Lucide doesn't have Google */}
        <Github size={20} className="text-gray-900" />
        <span className="font-semibold text-[14px]">Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors"
      >
        <Github size={20} className="text-gray-900" />
        <span className="font-semibold text-[14px]">Continue with GitHub</span>
      </button>

      <button
        type="button"
        onClick={() => signIn("linkedin", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors"
      >
        <Linkedin size={20} className="text-[#0A66C2]" />
        <span className="font-semibold text-[14px]">Continue with LinkedIn</span>
      </button>
    </div>
  );
}
