"use client";

import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { Group, CanvasTexture, SRGBColorSpace } from "three";

// ─── 3D Skill Tag Pill ───────────────────────────────────────────────────
function SkillPill({ label: _label, position, color, delay }: {
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
    canvas.width = 2048;
    canvas.height = 2600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Scale context to match doubled resolution for sharper text
    ctx.scale(2, 2);

    // White paper background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    
    // Candidate Name
    ctx.font = "bold 52px Arial, sans-serif";
    ctx.fillText("Jake Ryan", 512, 70);

    // Contact info
    ctx.font = "normal 22px Arial, sans-serif";
    ctx.fillText("123-456-7890 | jake@su.edu | linkedin.com/in/jake | github.com/jake", 512, 105);

    ctx.textAlign = "left";

    const drawSectionHeader = (title: string, y: number) => {
      ctx.font = "bold 24px Arial, sans-serif";
      ctx.fillText(title.toUpperCase(), 60, y);
      ctx.beginPath();
      ctx.moveTo(60, y + 10);
      ctx.lineTo(964, y + 10);
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const drawRow = (leftText: string, rightText: string, y: number, isBoldLeft: boolean) => {
      ctx.font = (isBoldLeft ? "bold " : "normal ") + "22px Arial, sans-serif";
      ctx.fillText(leftText, 60, y);
      ctx.textAlign = "right";
      ctx.font = "bold 22px Arial, sans-serif";
      ctx.fillText(rightText, 964, y);
      ctx.textAlign = "left";
    };
    
    const drawRowLocation = (leftText: string, rightText: string, y: number) => {
      ctx.font = "italic 22px Arial, sans-serif";
      ctx.fillText(leftText, 60, y);
      ctx.textAlign = "right";
      ctx.font = "italic 22px Arial, sans-serif";
      ctx.fillText(rightText, 964, y);
      ctx.textAlign = "left";
    };

    const drawBullet = (text: string, y: number) => {
      ctx.font = "normal 20px Arial, sans-serif";
      ctx.fillText("• " + text, 80, y);
    };

    // EDUCATION
    drawSectionHeader("Education", 160);
    drawRow("Southwestern University", "Georgetown, TX", 200, true);
    drawRowLocation("Bachelor of Arts in Computer Science, Minor in Business", "Aug. 2018 – May 2021", 230);
    drawRow("Blinn College", "Bryan, TX", 265, true);
    drawRowLocation("Associate’s in Liberal Arts", "Aug. 2014 – May 2018", 295);

    // EXPERIENCE
    drawSectionHeader("Experience", 350);
    drawRow("Undergraduate Research Assistant", "June 2020 – Present", 390, true);
    drawRowLocation("Texas A&M University", "College Station, TX", 420);
    drawBullet("Developed a REST API using FastAPI and PostgreSQL to store data from LMS", 450);
    drawBullet("Developed a full-stack web application using Flask, React, PostgreSQL and Docker", 480);
    drawBullet("Explored ways to visualize GitHub collaboration in a classroom setting", 510);

    drawRow("Information Technology Support Specialist", "Sep. 2018 – Present", 550, true);
    drawRowLocation("Southwestern University", "Georgetown, TX", 580);
    drawBullet("Communicate with managers to set up campus computers used on campus", 610);
    drawBullet("Assess and troubleshoot computer problems brought by students, faculty and staff", 640);
    drawBullet("Maintain upkeep of computers, classroom equipment, and 200 printers across campus", 670);

    drawRow("Artificial Intelligence Research Assistant", "May 2019 – July 2019", 710, true);
    drawRowLocation("Southwestern University", "Georgetown, TX", 740);
    drawBullet("Explored methods to generate video game dungeons based off of The Legend of Zelda", 770);
    drawBullet("Developed a game in Java to test the generated dungeons", 800);
    drawBullet("Contributed 50K+ lines of code to an established codebase via Git", 830);
    drawBullet("Conducted a human subject study to determine which technique is enjoyable", 860);

    // PROJECTS
    drawSectionHeader("Projects", 915);
    drawRow("Gitlytics | Python, Flask, React, PostgreSQL, Docker", "June 2020 – Present", 955, true);
    drawBullet("Developed a full-stack web app with Flask serving a REST API and React frontend", 985);
    drawBullet("Implemented GitHub OAuth to get data from user’s repositories", 1015);
    drawBullet("Visualized GitHub data to show collaboration and used Celery for async tasks", 1045);

    drawRow("Simple Paintball | Java, Maven, TravisCI, Git", "May 2018 – May 2020", 1085, true);
    drawBullet("Developed a Minecraft server plugin to entertain kids gaining 2K+ downloads", 1115);
    drawBullet("Implemented continuous delivery using TravisCI to build the plugin upon new release", 1145);

    // TECHNICAL SKILLS
    drawSectionHeader("Technical Skills", 1195);
    
    const drawSkill = (category: string, items: string, y: number) => {
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillText(category + ":", 60, y);
      const metric = ctx.measureText(category + ": ");
      ctx.font = "normal 20px Arial, sans-serif";
      ctx.fillText(items, 60 + metric.width, y);
    };

    drawSkill("Languages", "Java, Python, C/C++, SQL (Postgres), JavaScript, HTML/CSS, R", 1230);
    drawSkill("Frameworks", "React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI", 1255);
    drawSkill("Tools", "Git, Docker, TravisCI, GCP, VS Code, IntelliJ, Eclipse, pandas, NumPy", 1280);

    const tex = new CanvasTexture(canvas);
    tex.anisotropy = 16;
    tex.colorSpace = SRGBColorSpace;
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
          <meshBasicMaterial map={resumeTexture} />
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
