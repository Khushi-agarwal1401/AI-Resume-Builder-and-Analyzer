"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { Group, BufferGeometry, Float32BufferAttribute } from "three";

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
          opacity={0.9}
        />
      </RoundedBox>
      <Text
        position={[0, 0, 0.04]}
        fontSize={0.095}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {label}
      </Text>
    </group>
  );
}

// ─── 3D ATS Scanner Laser Beam ──────────────────────────────────────────
function ScannerLaser() {
  const laserRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!laserRef.current) return;
    const t = clock.getElapsedTime();
    // Move up and down across the document height (-1.15 to 1.15)
    laserRef.current.position.y = Math.sin(t * 0.9) * 1.15;
  });

  return (
    <group ref={laserRef} position={[0, 0, 0.04]}>
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

// ─── Real Formatted 3D Resume Sheet ──────────────────────────────────────
function RealResumeDocument() {
  const docRef = useRef<Group>(null);
  const { pointer } = useThree();

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

      {/* Main White Paper Page */}
      <RoundedBox args={[2.2, 2.8, 0.05]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.18}
          metalness={0.02}
          clearcoat={0.3}
          transparent
          opacity={0.98}
        />
      </RoundedBox>

      {/* Animated AI Laser Scanner Sweep */}
      <ScannerLaser />

      {/* ── REAL WRITTEN RESUME TEXT CONTENT ON 3D PAPER ── */}

      {/* Candidate Name */}
      <Text position={[-0.85, 1.15, 0.035]} fontSize={0.12} color="#0f172a" anchorX="left" fontWeight="bold">
        Radheshyam Bhati
      </Text>

      {/* Candidate Title */}
      <Text position={[-0.85, 1.0, 0.035]} fontSize={0.075} color="#2563eb" anchorX="left" fontWeight="bold">
        Senior Software Engineer
      </Text>

      {/* Contact Info */}
      <Text position={[-0.85, 0.88, 0.035]} fontSize={0.048} color="#64748b" anchorX="left">
        radheshyam@email.com • +91 98765 43210 • github.com/radheshyam
      </Text>

      {/* Divider */}
      <mesh position={[0, 0.8, 0.035]}>
        <planeGeometry args={[1.8, 0.003]} />
        <meshBasicMaterial color="#cbd5e1" />
      </mesh>

      {/* Section 1: SUMMARY */}
      <Text position={[-0.85, 0.68, 0.035]} fontSize={0.065} color="#1e293b" anchorX="left" fontWeight="bold">
        PROFESSIONAL SUMMARY
      </Text>
      <Text position={[-0.85, 0.55, 0.035]} fontSize={0.048} color="#475569" anchorX="left" maxWidth={1.7} lineHeight={1.3}>
        Results-driven Engineer with 5+ years building scalable microservices, AI solutions, and high-performance React web applications handling 100K+ DAU.
      </Text>

      {/* Section 2: EXPERIENCE */}
      <Text position={[-0.85, 0.32, 0.035]} fontSize={0.065} color="#1e293b" anchorX="left" fontWeight="bold">
        WORK EXPERIENCE
      </Text>
      <Text position={[-0.85, 0.21, 0.035]} fontSize={0.055} color="#0f172a" anchorX="left" fontWeight="bold">
        TechNova Solutions — Senior Engineer
      </Text>
      <Text position={[0.9, 0.21, 0.035]} fontSize={0.045} color="#64748b" anchorX="right">
        2023 – Present
      </Text>

      {/* Bullets */}
      <Text position={[-0.82, 0.08, 0.035]} fontSize={0.046} color="#334155" anchorX="left" maxWidth={1.65} lineHeight={1.3}>
        • Architected React & Node.js microservices handling 100K+ daily users.
      </Text>
      <Text position={[-0.82, -0.05, 0.035]} fontSize={0.046} color="#334155" anchorX="left" maxWidth={1.65} lineHeight={1.3}>
        • Improved PostgreSQL & Redis query throughput by 42%.
      </Text>
      <Text position={[-0.82, -0.18, 0.035]} fontSize={0.046} color="#334155" anchorX="left" maxWidth={1.65} lineHeight={1.3}>
        • Led team of 6 engineers delivering 3 major AI feature releases.
      </Text>

      {/* Section 3: TECHNICAL SKILLS */}
      <Text position={[-0.85, -0.38, 0.035]} fontSize={0.065} color="#1e293b" anchorX="left" fontWeight="bold">
        TECHNICAL SKILLS
      </Text>

      {/* Skill Tags mockup on paper */}
      {["React", "TypeScript", "Node.js", "Python", "AWS", "Docker"].map((skill, i) => (
        <group key={skill} position={[-0.72 + (i % 3) * 0.58, -0.52 - Math.floor(i / 3) * 0.15, 0.035]}>
          <RoundedBox args={[0.52, 0.1, 0.01]} radius={0.03}>
            <meshBasicMaterial color={i % 2 === 0 ? "#10b981" : "#3b82f6"} transparent opacity={0.85} />
          </RoundedBox>
          <Text position={[0, 0, 0.01]} fontSize={0.045} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
            ✓ {skill}
          </Text>
        </group>
      ))}

      {/* ATS Verified Badge Stamp */}
      <group position={[0.65, -1.05, 0.04]}>
        <mesh>
          <circleGeometry args={[0.22, 32]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.92} />
        </mesh>
        <Text position={[0, 0, 0.01]} fontSize={0.085} color="#ffffff" anchorX="center" anchorY="middle" fontWeight="bold">
          98% ATS
        </Text>
      </group>
    </group>
  );
}

// ─── Particle System ─────────────────────────────────────────────────────
function SkillParticles() {
  const count = 45;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      [0.23, 0.51, 0.96],
      [0.06, 0.72, 0.53],
      [0.55, 0.36, 0.96],
      [0.96, 0.62, 0.04],
    ];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = 1.3 + Math.random() * 2.5;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.5 - 0.5;
      const p = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = p[0]; col[i * 3 + 1] = p[1]; col[i * 3 + 2] = p[2];
    }
    return [pos, col];
  }, []);

  const ref = useRef<any>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(clock.getElapsedTime() * 0.3 + i * 0.5) * 0.0015;
      pos[i * 3] += Math.cos(clock.getElapsedTime() * 0.2 + i * 0.3) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  const geo = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

// ─── Main Scene Assembly ──────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 6]} intensity={1.3} />
      <directionalLight position={[-3, -2, 4]} intensity={0.4} color="#a855f7" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#3b82f6" />

      {/* Real Written 3D Resume Sheet */}
      <RealResumeDocument />

      {/* Floating 3D Badges */}
      <SkillPill label="React" position={[-1.7, 1.25, 0.4]} color="#3b82f6" delay={0} />
      <SkillPill label="Python" position={[1.65, 1.15, 0.3]} color="#10b981" delay={1.2} />
      <SkillPill label="AI Prompt" position={[-1.65, -1.05, 0.5]} color="#8b5cf6" delay={2.4} />
      <SkillPill label="ATS 98%" position={[1.6, -0.95, 0.4]} color="#f59e0b" delay={1.8} />

      {/* Particles */}
      <SkillParticles />
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
