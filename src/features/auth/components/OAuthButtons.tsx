"use client";

import { signIn } from "next-auth/react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export function OAuthButtons() {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors"
      >
        <FcGoogle className="h-5 w-5 absolute left-4" />
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors"
      >
        <FaGithub className="h-5 w-5 absolute left-4 text-gray-900" />
        Continue with GitHub
      </button>

      <button
        type="button"
        onClick={() => signIn("linkedin", { callbackUrl: "/dashboard" })}
        className="w-full flex items-center justify-center relative py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[14px] font-medium rounded-lg transition-colors"
      >
        <FaLinkedin className="h-5 w-5 absolute left-4 text-[#0077b5]" />
        Continue with LinkedIn
      </button>
    </div>
  );
}
