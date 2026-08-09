"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import type { ResumeData } from "@/types/resume";
import { templateAtsScore } from "@/features/resume-builder/config/template-registry";
import { Modern } from "@/features/resume-builder/templates/Modern";
import { AtsProfessional } from "@/features/resume-builder/templates/AtsProfessional";
import { Creative } from "@/features/resume-builder/templates/Creative";
import { Executive } from "@/features/resume-builder/templates/Executive";
import { ExecutiveSidebar } from "@/features/resume-builder/templates/ExecutiveSidebar";
import { ModernCard } from "@/features/resume-builder/templates/ModernCard";
import { Student } from "@/features/resume-builder/templates/Student";
import { Minimal } from "@/features/resume-builder/templates/Minimal";

interface ShowcaseDesign {
  id: string;
  name: string;
  component: (props: { resume: ResumeData }) => React.ReactNode;
}

/**
 * The morph reel: ONE resume flowing through every design. The front card
 * crossfades between these every 3.4s while the back card peeks the next one.
 */
const SHOWCASE: ShowcaseDesign[] = [
  { id: "modern", name: "Modern", component: Modern },
  { id: "ats-professional", name: "ATS Pro", component: AtsProfessional },
  { id: "creative", name: "Creative", component: Creative },
  { id: "executive", name: "Executive", component: Executive },
  { id: "executive-sidebar", name: "Exec Sidebar", component: ExecutiveSidebar },
  { id: "modern-card", name: "Card Modern", component: ModernCard },
  { id: "student", name: "Student", component: Student },
  { id: "minimal", name: "Minimal", component: Minimal },
];

// A4 page at 96dpi: 210mm ≈ 794px, 297mm ≈ 1123px. The card renders the real
// template inside a zoomed A4 frame — the same technique the gallery uses.
const A4_W_PX = 794;
const FRONT_W = 340;
const BACK_W = 300;
const a4Height = (width: number) => Math.round((width * 297) / 210);

function ResumePaper({ design, resume, width }: { design: ShowcaseDesign; resume: ResumeData; width: number }) {
  const C = design.component;
  return (
    <div className="bg-white" style={{ width, height: a4Height(width) }}>
      <div
        className="box-border p-8"
        style={{ width: "210mm", height: "297mm", zoom: width / A4_W_PX }}
      >
        <C resume={resume} />
      </div>
    </div>
  );
}

/**
 * CVAurum-style cinematic hero animation:
 * a 3D fan of live resume cards that re-skin themselves every 3.4s.
 */
export function ResumeCardFan({ resume }: { resume: ResumeData }) {
  const reduce = useReducedMotion();
  const [ti, setTi] = useState(0);

  // Crossfade through every design every 3.4s
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTi((i) => (i + 1) % SHOWCASE.length), 3400);
    return () => clearInterval(t);
  }, [reduce]);

  // Mouse-parallax 3D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 110, damping: 16 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 110, damping: 16 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const front = SHOWCASE[ti];
  const next = SHOWCASE[(ti + 1) % SHOWCASE.length];

  return (
    <div
      className="relative flex h-full w-full items-center justify-center"
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
      aria-hidden="true"
    >
      {/* Aurora glows behind the fan */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-10 -left-8 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side,#3b82f655,transparent)" }}
        animate={reduce ? undefined : { x: [0, 40, -20, 0], y: [0, 24, 10, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -right-6 h-80 w-80 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side,#8b5cf655,transparent)" }}
        animate={reduce ? undefined : { x: [0, -40, 15, 0], y: [0, -24, 12, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-1/4 top-1/3 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side,#06b6d444,transparent)" }}
        animate={reduce ? undefined : { x: [0, 30, -25, 0], y: [0, -30, 16, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Fine dot grid for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(100,116,139,.45) 1px, transparent 1.4px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* 3D card fan — scaled down on lg so it always fits its column */}
      <div style={{ perspective: 1400 }} className="relative lg:scale-[0.82] xl:scale-100">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
          style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
          className="relative h-[520px] w-[430px]"
        >
          {/* depth: the NEXT design waits behind */}
          <div
            className="absolute left-20 top-8 overflow-hidden rounded-xl border border-gray-200/50 bg-white opacity-40 shadow-2xl"
            style={{ width: BACK_W, height: a4Height(BACK_W), transform: "translateZ(-70px) rotate(5deg)" }}
          >
            <ResumePaper design={next} resume={resume} width={BACK_W} />
          </div>

          {/* front card — crossfades between templates */}
          <div
            className="absolute left-0 top-0 overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-[0_30px_80px_-24px_rgba(59,130,246,0.5)]"
            style={{ width: FRONT_W, height: a4Height(FRONT_W), transform: "translateZ(50px) rotate(-2deg)" }}
          >
            <div className="relative h-full w-full">
              <AnimatePresence initial={false}>
                <motion.div
                  key={front.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                >
                  <ResumePaper design={front} resume={resume} width={FRONT_W} />
                </motion.div>
              </AnimatePresence>

              {/* subtle sheen sweep */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.35) 45%, transparent 60%)",
                }}
              />
            </div>

            {/* live template name — proof it's the same content, restyled */}
            <div className="pointer-events-none absolute bottom-3 right-3">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={front.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-gray-200/80 bg-white/90 px-3 py-1 text-[11px] font-bold text-gray-800 shadow-lg backdrop-blur"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  {front.name} — same content, one click
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* floating proof chips — honest, live: the current template's real score */}
          <motion.div
            className="absolute -top-6 left-0 rounded-xl border border-gray-200/70 bg-white/90 px-3.5 py-2.5 text-xs text-gray-800 shadow-xl backdrop-blur-md"
            style={{ zIndex: 20 }}
            animate={reduce ? undefined : { y: [0, -7, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="font-bold text-emerald-600">{templateAtsScore(front.id)}% ATS Score</div>
            <div className="mt-0.5 text-gray-500">estimated for {front.name} layout</div>
          </motion.div>

          <motion.div
            className="absolute -right-8 top-44 rounded-xl border border-gray-200/70 bg-white/90 px-3.5 py-2.5 text-xs text-gray-800 shadow-xl backdrop-blur-md"
            style={{ zIndex: 20 }}
            animate={reduce ? undefined : { y: [0, -9, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
          >
            <div className="font-bold text-blue-600">11 templates, one resume</div>
            <div className="mt-0.5 text-gray-500">restyle section by section</div>
          </motion.div>

          <motion.div
            className="absolute -bottom-10 left-2 rounded-xl border border-gray-200/70 bg-white/90 px-3.5 py-2.5 text-xs text-gray-800 shadow-xl backdrop-blur-md"
            style={{ zIndex: 20 }}
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            <div className="font-bold text-sky-600">See what the ATS sees</div>
            <div className="mt-0.5 text-gray-500">parser&apos;s-eye view, built in</div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
