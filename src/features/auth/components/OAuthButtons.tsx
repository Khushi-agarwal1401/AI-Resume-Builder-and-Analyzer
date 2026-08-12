"use client";

import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/post-login" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors gap-2"
      >
        <FaGoogle size={20} className="text-gray-900" />
        <span className="font-semibold text-[14px]">Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: "/post-login" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors gap-2"
      >
        <FaGithub size={20} className="text-gray-900" />
        <span className="font-semibold text-[14px]">Continue with GitHub</span>
      </button>
    </div>
  );
}
