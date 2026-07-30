"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Float, Icosahedron } from "@react-three/drei";
import { Group, Points as ThreePoints, BufferGeometry, Float32BufferAttribute } from "three";

// ─── 3D Flowing Particle Stream along Bezier Paths ─────────────────────────
function ParticleStream({ isSyncing }: { isSyncing: boolean }) {
  const pointsRef = useRef<ThreePoints>(null);
  const count = 180;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Start near left nodes (-1.8 to 0)
      pos[i * 3] = -2.0 + Math.random() * 4.0;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      spd[i] = 0.015 + Math.random() * 0.025;
    }
    return [pos, spd];
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geo = pointsRef.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;

    const mult = isSyncing ? 3.5 : 1.0;

    for (let i = 0; i < count; i++) {
      // Move left to right
      pos[i * 3] += speeds[i] * mult;

      // Vertical curve towards center (0,0) then to right
      const x = pos[i * 3];
      pos[i * 3 + 1] = Math.sin(x * 1.5) * 0.4;

      // Reset when particle goes past right boundary (+2.0)
      if (pos[i * 3] > 2.0) {
        pos[i * 3] = -2.0;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
      }
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={isSyncing ? 0.07 : 0.045}
        color={isSyncing ? "#38bdf8" : "#818cf8"}
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
}

// ─── 3D Central AI Crystal Core ───────────────────────────────────────────
function AICrystalCore({ isSyncing }: { isSyncing: boolean }) {
  const meshRef = useRef<Group>(null);
  const wireRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.6;
      meshRef.current.rotation.y = t * 0.8;
    }
    if (wireRef.current) {
      wireRef.current.rotation.x = -t * 0.4;
      wireRef.current.rotation.y = -t * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Inner Glowing Crystal */}
      <group ref={meshRef}>
        <Icosahedron args={[0.5, 0]}>
          <meshPhysicalMaterial
            color={isSyncing ? "#ec4899" : "#3b82f6"}
            emissive={isSyncing ? "#db2777" : "#1d4ed8"}
            emissiveIntensity={isSyncing ? 0.8 : 0.4}
            roughness={0.1}
            metalness={0.8}
            clearcoat={1}
            transparent
            opacity={0.9}
          />
        </Icosahedron>
      </group>

      {/* Outer Wireframe Energy Sphere */}
      <group ref={wireRef}>
        <Icosahedron args={[0.75, 1]}>
          <meshBasicMaterial
            color={isSyncing ? "#f43f5e" : "#60a5fa"}
            wireframe
            transparent
            opacity={0.35}
          />
        </Icosahedron>
      </group>

      {/* Point Light inside crystal */}
      <pointLight intensity={isSyncing ? 3.0 : 1.5} color={isSyncing ? "#f43f5e" : "#3b82f6"} distance={4} />
    </group>
  );
}

// ─── 3D LinkedIn & GitHub Node Boxes ──────────────────────────────────────
function NodeBox({ position, color }: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4} position={position}>
      <group>
        <RoundedBox args={[0.8, 0.5, 0.15]} radius={0.08} smoothness={4}>
          <meshPhysicalMaterial
            color={color}
            roughness={0.2}
            metalness={0.3}
            transparent
            opacity={0.9}
          />
        </RoundedBox>
      </group>
    </Float>
  );
}

// ─── 3D Target Resume Output Sheet ────────────────────────────────────────
function ResumeSheet({ isSyncing }: { isSyncing: boolean }) {
  return (
    <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3} position={[1.8, 0, 0]}>
      <group>
        <RoundedBox args={[0.9, 1.2, 0.04]} radius={0.05} smoothness={4}>
          <meshPhysicalMaterial
            color={isSyncing ? "#ecfdf5" : "#ffffff"}
            roughness={0.2}
            metalness={0.05}
            clearcoat={0.5}
          />
        </RoundedBox>

        {/* Emerald Checkmark Aura Ring */}
        {isSyncing && (
          <mesh position={[0, 0, -0.05]}>
            <planeGeometry args={[1.2, 1.5]} />
            <meshBasicMaterial color="#10b981" transparent opacity={0.25} />
          </mesh>
        )}
      </group>
    </Float>
  );
}

// ─── Scene Container with Parallax Controls ────────────────────────────────
function Scene({ isSyncing }: { isSyncing: boolean }) {
  const groupRef = useRef<Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += (pointer.x * 0.35 - groupRef.current.rotation.y) * 0.08;
    groupRef.current.rotation.x += (-pointer.y * 0.25 - groupRef.current.rotation.x) * 0.08;
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-4, -3, 2]} intensity={0.5} color="#a855f7" />

      {/* Left Data Nodes */}
      <NodeBox position={[-1.8, 0.45, 0]} color="#2563eb" />
      <NodeBox position={[-1.8, -0.45, 0]} color="#1e293b" />

      {/* Center 3D AI Crystal */}
      <AICrystalCore isSyncing={isSyncing} />

      {/* Right Target Resume */}
      <ResumeSheet isSyncing={isSyncing} />

      {/* Dynamic 3D Particle Streams */}
      <ParticleStream isSyncing={isSyncing} />
    </group>
  );
}

export function Sync3DScene({ isSyncing }: { isSyncing: boolean }) {
  return (
    <div className="w-full h-[320px] relative rounded-2xl overflow-hidden bg-slate-950/90 border border-slate-800 shadow-inner">
      <Canvas
        camera={{ position: [0, 0, 3.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene isSyncing={isSyncing} />
      </Canvas>
    </div>
  );
}
