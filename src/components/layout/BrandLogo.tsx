"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  showTagline?: boolean;
  className?: string;
}

export function BrandLogo({ href = "/", showTagline = true, className }: BrandLogoProps) {
  const content = (
    <>
      <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
        <Image
          src="/images/logo.png"
          alt="ResumeCareer logo"
          fill
          sizes="36px"
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-xl font-extrabold text-gray-900 leading-none tracking-tight dark:text-white">
          Resume<span className="text-blue-600">Career</span>
        </span>
        {showTagline && (
          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase dark:text-gray-500">
            Build · Analyze · Get Hired
          </span>
        )}
      </div>
    </>
  );

  return (
    <Link href={href} className={cn("flex items-center gap-3 group shrink-0", className)}>
      {content}
    </Link>
  );
}
