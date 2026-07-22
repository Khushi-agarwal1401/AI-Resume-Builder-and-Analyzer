"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  className?: string;
  children: React.ReactNode;
}

export function BentoCard({ className, children }: BentoCardProps) {
  const boundingRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springX = useSpring(mouseX, { stiffness: 500, damping: 50 });
  const springY = useSpring(mouseY, { stiffness: 500, damping: 50 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!boundingRef.current) return;
    const rect = boundingRef.current.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  const background = useMotionTemplate`radial-gradient(400px circle at ${springX}px ${springY}px, rgba(99,102,241,0.15), transparent 40%)`;
  const borderBackground = useMotionTemplate`radial-gradient(400px circle at ${springX}px ${springY}px, rgba(255,255,255,0.2), transparent 40%)`;

  return (
    <div
      ref={boundingRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border bg-white group",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ background }}
        />
        <motion.div
          className="absolute inset-0 z-0"
          style={{ background: borderBackground }}
        />
      </div>
      <div className="relative z-10 p-8 h-full">
        {children}
      </div>
    </div>
  );
}
