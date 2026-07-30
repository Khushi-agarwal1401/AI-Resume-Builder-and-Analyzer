"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group, CanvasTexture, Mesh } from "three";

// ─── 3D Skill Tag Pill ───────────────────────────────────────────────────
function SkillPill({ label, position, color, delay }: {
  label: string;
  position: [number, number, number];
  color: string;
  delay: number;
}) {
  const ref = useRef<Group>(null);
  const startPos = useRef(position);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.8 + delay;
    ref.current.position.y = startPos.current[1] + Math.sin(t) * 0.12;
    ref.current.position.x = startPos.current[0] + Math.cos(t * 0.7) * 0.08;
    ref.current.rotation.z = Math.sin(t * 0.5) * 0.05;
  });

  return (
    <group ref={ref} position={position}>
      <RoundedBox args={[0.95, 0.3, 0.06]} radius={0.14} smoothness={4}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.92}
        />
      </RoundedBox>
    </group>
  );
}

// ─── 3D ATS Scanner Laser Beam ──────────────────────────────────────────
function ScannerLaser() {
  const laserRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!laserRef.current) return;
    const t = clock.getElapsedTime();
    // Move up and down across the document height (-1.2 to 1.2)
    laserRef.current.position.y = Math.sin(t * 0.9) * 1.15;
  });

  return (
    <group ref={laserRef} position={[0, 0, 0.045]}>
      {/* Main glowing laser line */}
      <mesh>
        <planeGeometry args={[2.25, 0.035]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.9} />
      </mesh>
      {/* Laser glow bar */}
      <mesh position={[0, -0.08, 0]}>
        <planeGeometry args={[2.25, 0.16]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ─── High-Res Synchronous Canvas Texture Generator ────────────────────────
function useResumeTexture() {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1300;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // White paper background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top Accent Bar
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(0, 0, canvas.width, 24);

    // Candidate Name
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 56px system-ui, -apple-system, sans-serif";
    ctx.fillText("Radheshyam Bhati", 60, 115);

    // Subtitle Role
    ctx.fillStyle = "#2563eb";
    ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
    ctx.fillText("Senior Software Engineer", 60, 168);

    // Contact info
    ctx.fillStyle = "#64748b";
    ctx.font = "500 23px system-ui, -apple-system, sans-serif";
    ctx.fillText("radheshyam@email.com  •  +91 98765 43210  •  San Francisco, CA", 60, 215);

    // Divider line
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 245);
    ctx.lineTo(964, 245);
    ctx.stroke();

    // Section 1: SUMMARY
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("PROFESSIONAL SUMMARY", 60, 300);

    ctx.fillStyle = "#334155";
    ctx.font = "normal 23px system-ui, -apple-system, sans-serif";
    ctx.fillText("Results-driven Engineer with 5+ years building scalable microservices,", 60, 342);
    ctx.fillText("AI applications, and high-performance React web platforms handling 100K+ DAU.", 60, 378);

    // Section 2: WORK EXPERIENCE
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("WORK EXPERIENCE", 60, 455);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.fillText("TechNova Solutions — Senior Engineer", 60, 500);
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
    ctx.fillText("2023 – Present", 790, 500);

    ctx.fillStyle = "#334155";
    ctx.font = "normal 22px system-ui, -apple-system, sans-serif";
    ctx.fillText("• Architected React & Node.js microservices handling 100K+ daily active users.", 80, 542);
    ctx.fillText("• Optimized PostgreSQL & Redis queries, improving throughput by 42%.", 80, 578);
    ctx.fillText("• Led cross-functional team of 6 engineers delivering 3 major AI releases.", 80, 614);

    // Section 3: TECHNICAL SKILLS
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
    ctx.fillText("TECHNICAL SKILLS", 60, 690);

    const skills = [
      { name: "✓ React", bg: "#3b82f6" },
      { name: "✓ TypeScript", bg: "#10b981" },
      { name: "✓ Node.js", bg: "#8b5cf6" },
      { name: "✓ Python", bg: "#f59e0b" },
      { name: "✓ AWS", bg: "#0284c7" },
      { name: "✓ Docker", bg: "#ec4899" }
    ];

    skills.forEach((s, idx) => {
      const x = 60 + (idx % 3) * 295;
      const y = 730 + Math.floor(idx / 3) * 75;

      // Pill Background
      ctx.fillStyle = s.bg;
      ctx.beginPath();
      ctx.roundRect(x, y, 265, 52, 14);
      ctx.fill();

      // Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 23px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(s.name, x + 30, y + 34);
    });

    // Stamp Seal
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.arc(880, 1140, 95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("98% ATS", 880, 1135);
    ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    ctx.fillText("VERIFIED", 880, 1168);

    const tex = new CanvasTexture(canvas);
    tex.needsUpdate = true;
    setTexture(tex);
  }, []);

  return texture;
}

// ─── Real 3D Resume Document Mesh ─────────────────────────────────────────
function RealResumeDocument() {
  const docRef = useRef<Group>(null);
  const { pointer } = useThree();
  const resumeTexture = useResumeTexture();

  useFrame(({ clock }) => {
    if (!docRef.current) return;
    const t = clock.getElapsedTime();

    // Mouse tilt response
    const targetRotX = pointer.y * 0.22 + Math.sin(t * 0.4) * 0.03;
    const targetRotY = pointer.x * 0.28 + Math.cos(t * 0.3) * 0.03;

    docRef.current.rotation.x += (targetRotX - docRef.current.rotation.x) * 0.08;
    docRef.current.rotation.y += (targetRotY - docRef.current.rotation.y) * 0.08;
    docRef.current.position.y = Math.sin(t * 0.5) * 0.06;
  });

  return (
    <group ref={docRef} position={[0, 0, 0]}>
      {/* Backdrop Ambient Glow */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[3.2, 3.8]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.08} />
      </mesh>

      {/* Paper Stack Shadow Layers */}
      <mesh position={[0.04, -0.04, -0.1]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial color="#d1d5db" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0.02, -0.02, -0.05]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial color="#e5e7eb" transparent opacity={0.5} />
      </mesh>

      {/* Main Paper Box */}
      <RoundedBox args={[2.2, 2.8, 0.05]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.2}
          metalness={0.02}
          clearcoat={0.3}
        />
      </RoundedBox>

      {/* Real Formatted Texture Front Page */}
      {resumeTexture && (
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[2.16, 2.76]} />
          <meshBasicMaterial map={resumeTexture} transparent opacity={0.99} />
        </mesh>
      )}

      {/* Animated AI Laser Scanner Sweep */}
      <ScannerLaser />
    </group>
  );
}

// ─── Main Scene Assembly ──────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight position={[4, 5, 6]} intensity={1.3} />
      <directionalLight position={[-3, -2, 4]} intensity={0.4} color="#a855f7" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#3b82f6" />

      {/* Real Formatted 3D Resume Sheet */}
      <RealResumeDocument />

      {/* Orbiting Skill Badges */}
      <SkillPill label="React" position={[-1.65, 1.2, 0.4]} color="#3b82f6" delay={0} />
      <SkillPill label="Python" position={[1.65, 1.1, 0.3]} color="#10b981" delay={1.2} />
      <SkillPill label="AI Engine" position={[-1.6, -1.0, 0.5]} color="#8b5cf6" delay={2.4} />
      <SkillPill label="ATS 98%" position={[1.6, -0.9, 0.4]} color="#f59e0b" delay={1.8} />
    </>
  );
}

export function HeroScene() {
  return (
    <div className="w-full h-full min-h-[480px] pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.3], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
