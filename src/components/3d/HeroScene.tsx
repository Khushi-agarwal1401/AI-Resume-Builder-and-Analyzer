"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group, BufferGeometry, Float32BufferAttribute } from "three";

// ─── 3D Resume Document (clean, floating) ────────────────────────────────
function ResumeDocument() {
  const docRef = useRef<Group>(null);
  const { pointer } = useThree();

  useFrame(({ clock }) => {
    if (!docRef.current) return;
    const t = clock.getElapsedTime();

    // Mouse-responsive tilt
    const targetRotX = pointer.y * 0.2 + Math.sin(t * 0.4) * 0.02;
    const targetRotY = pointer.x * 0.3 + Math.cos(t * 0.3) * 0.02;
    docRef.current.rotation.x += (targetRotX - docRef.current.rotation.x) * 0.06;
    docRef.current.rotation.y += (targetRotY - docRef.current.rotation.y) * 0.06;
    docRef.current.position.y = Math.sin(t * 0.5) * 0.05;
  });

  return (
    <group ref={docRef} position={[0, 0, 0]}>
      {/* Back glow */}
      <mesh position={[0, 0, -0.2]}>
        <planeGeometry args={[3.2, 3.8]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.06} />
      </mesh>

      {/* Paper stack shadow layers */}
      <mesh position={[0.03, -0.03, -0.1]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial color="#d1d5db" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0.01, -0.01, -0.05]}>
        <planeGeometry args={[2.2, 2.8]} />
        <meshBasicMaterial color="#e5e7eb" transparent opacity={0.45} />
      </mesh>

      {/* Main page */}
      <RoundedBox args={[2.2, 2.8, 0.05]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial color="#ffffff" roughness={0.2} metalness={0.05} clearcoat={0.2} transparent opacity={0.96} />
      </RoundedBox>

      {/* Content lines */}
      {/* Avatar circle */}
      <mesh position={[-0.75, 0.95, 0.035]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.85} />
      </mesh>
      {/* Name */}
      <mesh position={[0.1, 1.05, 0.035]}>
        <planeGeometry args={[1.2, 0.07]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
      </mesh>
      {/* Title */}
      <mesh position={[0.1, 0.9, 0.035]}>
        <planeGeometry args={[0.9, 0.035]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.6} />
      </mesh>
      {/* Divider */}
      <mesh position={[0, 0.72, 0.035]}>
        <planeGeometry args={[1.85, 0.002]} />
        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.8} />
      </mesh>

      {/* Experience section title */}
      <mesh position={[-0.65, 0.58, 0.035]}>
        <planeGeometry args={[0.4, 0.04]} />
        <meshBasicMaterial color="#2563eb" transparent opacity={0.9} />
      </mesh>
      {/* Bullet lines */}
      <mesh position={[0.05, 0.42, 0.035]}>
        <planeGeometry args={[1.45, 0.028]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.05, 0.32, 0.035]}>
        <planeGeometry args={[1.3, 0.02]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.45} />
      </mesh>
      <mesh position={[0.05, 0.22, 0.035]}>
        <planeGeometry args={[1.4, 0.018]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
      </mesh>
      <mesh position={[0.05, 0.12, 0.035]}>
        <planeGeometry args={[1.1, 0.018]} />
        <meshBasicMaterial color="#94a3b8" transparent opacity={0.4} />
      </mesh>

      {/* Projects section title */}
      <mesh position={[-0.65, -0.06, 0.035]}>
        <planeGeometry args={[0.35, 0.04]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.9} />
      </mesh>
      {/* Project bullets */}
      <mesh position={[0.05, -0.22, 0.035]}>
        <planeGeometry args={[1.4, 0.025]} />
        <meshBasicMaterial color="#1e293b" transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.05, -0.32, 0.035]}>
        <planeGeometry args={[1.2, 0.02]} />
        <meshBasicMaterial color="#64748b" transparent opacity={0.45} />
      </mesh>

      {/* Skills section title */}
      <mesh position={[-0.65, -0.6, 0.035]}>
        <planeGeometry args={[0.3, 0.04]} />
        <meshBasicMaterial color="#059669" transparent opacity={0.9} />
      </mesh>
      {/* Skill tag chips */}
      {["#2563eb", "#059669", "#7c3aed", "#d97706", "#0284c7"].map((c, i) => (
        <mesh key={i} position={[-0.62 + i * 0.33, -0.75, 0.035]}>
          <planeGeometry args={[0.26, 0.045]} />
          <meshBasicMaterial color={c} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Particle system (ambient background) ─────────────────────────────────
function SkillParticles() {
  const count = 40;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [[0.23, 0.51, 0.96], [0.06, 0.72, 0.53], [0.55, 0.36, 0.96], [0.96, 0.62, 0.04]];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, r = 1.4 + Math.random() * 2.8;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
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

  return <points ref={ref} geometry={geo}><pointsMaterial size={0.09} vertexColors transparent opacity={0.5} sizeAttenuation /></points>;
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 6]} intensity={1.2} />
      <directionalLight position={[-3, -2, 4]} intensity={0.4} color="#a855f7" />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#3b82f6" />
      <ResumeDocument />
      <SkillParticles />
    </>
  );
}

export function HeroScene() {
  return (
    <div className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.4], fov: 42 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <Scene />
      </Canvas>
    </div>
  );
}
