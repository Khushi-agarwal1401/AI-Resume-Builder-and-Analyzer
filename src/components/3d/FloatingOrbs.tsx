"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group } from "three";

// ─── Floating 3D Card ────────────────────────────────────────────────────
function FloatingCard({ position: initPos, delay, scale: s, color }: {
  position: [number, number, number];
  delay: number;
  scale: number;
  color: string;
}) {
  const ref = useRef<Group>(null);
  const { pointer } = useThree();
  const startY = useRef(initPos[1]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.4 + delay;
    ref.current.position.y = startY.current + Math.sin(t) * 0.6;
    ref.current.position.x = initPos[0] + Math.sin(t * 0.5) * 0.2 + pointer.x * 0.3;
    ref.current.rotation.x = Math.sin(t * 0.4) * 0.1 + pointer.y * 0.2;
    ref.current.rotation.y += 0.003;
    ref.current.rotation.z = Math.sin(t * 0.3 + 1) * 0.08;
  });

  return (
    <group ref={ref} position={initPos} scale={s}>
      <RoundedBox args={[1.5, 2.0, 0.03]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.12}
          clearcoat={0.5}
        />
      </RoundedBox>

      {/* Decorative content lines */}
      <mesh position={[0, 0.5, 0.02]}>
        <planeGeometry args={[1.0, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, 0.32, 0.02]}>
        <planeGeometry args={[0.7, 0.03]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      <mesh position={[0, 0.1, 0.02]}>
        <planeGeometry args={[0.9, 0.025]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, -0.1, 0.02]}>
        <planeGeometry args={[0.7, 0.025]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, -0.3, 0.02]}>
        <planeGeometry args={[0.8, 0.03]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// ─── Scene Assembly ───────────────────────────────────────────────────────
function FloatingDocsScene() {
  const pages = useMemo(() => [
    { position: [-2.4, 1.2, -1.2] as [number, number, number], delay: 0, scale: 0.7, color: "#60a5fa" },
    { position: [2.6, -0.6, -0.8] as [number, number, number], delay: 1.2, scale: 0.85, color: "#c084fc" },
    { position: [0.2, 1.8, -1.8] as [number, number, number], delay: 2.5, scale: 0.6, color: "#818cf8" },
    { position: [-2.0, -1.4, -0.5] as [number, number, number], delay: 0.8, scale: 0.55, color: "#a78bfa" },
    { position: [1.8, 1.4, -1.5] as [number, number, number], delay: 1.8, scale: 0.75, color: "#34d399" },
  ], []);

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 5]} intensity={0.8} />
      {pages.map((page, i) => (
        <FloatingCard key={i} {...page} />
      ))}
    </>
  );
}

export function FloatingOrbs({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className || ""}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <FloatingDocsScene />
      </Canvas>
    </div>
  );
}

