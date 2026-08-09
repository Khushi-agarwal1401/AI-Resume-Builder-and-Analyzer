"use client";

import React, { useEffect, useState } from "react";

const RINGS = [70, 98, 122];
const PER_RING = [5, 6, 5];
const STATUSES = [
  "Initializing AI",
  "Loading ...",
  "Preparing resume tools",
  "Almost ready",
];

export default function Preloader() {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStatusIdx((prev) => (prev + 1) % STATUSES.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        #preloader-container {
          --bg-0: #f8fafc;
          --bg-1: #ffffff;
          --ink-paper: #1e293b;
          --ai-teal: #0d9488;
          --ai-violet: #6366f1;
          --text-primary: #0f172a;
          --text-muted: #64748b;
          --ease-out: cubic-bezier(.16,1,.3,1);
          font-family: -apple-system, "Inter", "Segoe UI", system-ui, sans-serif;
        }

        /* Dark mode: swap the light shell + ink for dark surfaces so the
           full-screen preloader doesn't flash white when .dark is active. */
        .dark #preloader-container {
          --bg-0: #121214;
          --bg-1: #1c1c1f;
          --ink-paper: #e4e4e7;
          --text-primary: #f4f4f5;
          --text-muted: #a1a1aa;
        }
        .dark #preloader-container #preloader {
          background: radial-gradient(120% 90% at 50% 32%, #27272a 0%, var(--bg-1) 45%, var(--bg-0) 100%);
        }
        .dark #preloader-container .guides circle { stroke: #ffffff; opacity: .12; }
        .dark #preloader-container .doc-outline { stroke: #ffffff30; }

        /* ---------- preloader shell ---------- */
        #preloader-container #preloader {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 28px;
          background: radial-gradient(120% 90% at 50% 32%, #e2e8f0 0%, var(--bg-1) 45%, var(--bg-0) 100%);
          transition: opacity .5s var(--ease-out), transform .5s var(--ease-out);
        }
        #preloader-container #preloader::before {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(120% 120% at 50% 50%, transparent 55%, #0000001a 100%);
        }
        #preloader-container #preloader::after {
          content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .035; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
        #preloader-container #preloader.is-exiting { opacity: 0; transform: scale(.97); pointer-events: none; }

        /* ---------- brand lockup ---------- */
        #preloader-container .brand {
          display: flex; align-items: center; gap: 8px;
          opacity: 0; animation: fade-up .5s var(--ease-out) forwards; animation-delay: .05s;
        }
        #preloader-container .brand svg { width: 18px; height: 18px; }
        #preloader-container .brand span { font-size: 13px; font-weight: 600; letter-spacing: .09em; color: var(--text-muted); text-transform: uppercase; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

        /* ---------- hero stage ---------- */
        #preloader-container .stage {
          position: relative;
          width: min(70vw, 260px); height: min(70vw, 260px);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; animation: fade-up .6s var(--ease-out) forwards; animation-delay: .1s;
        }

        #preloader-container .guides { position: absolute; inset: 0; }
        #preloader-container .guides svg { width: 100%; height: 100%; }
        #preloader-container .guides circle { fill: none; stroke: #000000; stroke-width: .6; opacity: .1; }

        #preloader-container .orbits { position: absolute; inset: 0; }
        #preloader-container .orbit { position: absolute; border-radius: 50%; animation: spin linear infinite; }
        #preloader-container .orbit .dot {
          position: absolute; top: 0; left: 50%; width: 4.5px; height: 4.5px; border-radius: 50%;
          transform: translate(-50%, -50%);
          background: var(--ai-teal); box-shadow: 0 0 7px 1px var(--ai-teal); opacity: .8;
        }
        #preloader-container .orbit.violet .dot { background: var(--ai-violet); box-shadow: 0 0 7px 1px var(--ai-violet); }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ---------- vertical composition: logo above, document below ---------- */
        #preloader-container .composition { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; }

        #preloader-container .logo {
          position: relative; width: 52px; height: 52px;
          display: flex; align-items: center; justify-content: center;
          animation: logo-float 3.6s ease-in-out infinite; animation-delay: .3s;
        }
        #preloader-container .logo::after {
          content: ""; position: absolute; inset: -12px; border-radius: 50%;
          background: radial-gradient(circle, var(--ai-violet) 0%, transparent 70%);
          filter: blur(9px); opacity: 0;
          animation: logo-glow 1.6s var(--ease-out) forwards; animation-delay: .3s;
        }
        @keyframes logo-glow { to { opacity: .5; } }
        @keyframes logo-float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-3px) rotate(1.2deg); } }
        #preloader-container .logo svg {
          width: 100%; height: 100%; opacity: 0; transform: scale(.9);
          animation: mark-in .5s var(--ease-out) forwards; animation-delay: .05s;
        }
        @keyframes mark-in { to { opacity: 1; transform: scale(1); } }

        #preloader-container .feed {
          width: 1.4px; height: 26px; position: relative; overflow: hidden; opacity: 0;
          animation: fade-up .4s var(--ease-out) forwards; animation-delay: .5s;
        }
        #preloader-container .feed::before {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(var(--ai-teal), transparent 60%);
          background-size: 100% 200%;
          animation: feed-flow 1.1s linear infinite; animation-delay: .6s;
        }
        @keyframes feed-flow { from { background-position: 0 -100%; } to { background-position: 0 100%; } }

        #preloader-container .doc-wrap { position: relative; width: 84px; height: 106px; }
        #preloader-container .doc-wrap svg {
          width: 100%; height: 100%; overflow: visible;
          filter: drop-shadow(0 6px 16px #00000066);
        }
        #preloader-container .doc-outline {
          fill: var(--bg-1); stroke: #00000030; stroke-width: 1.4;
          stroke-dasharray: 420; stroke-dashoffset: 420; animation: draw-doc 1s var(--ease-out) forwards; animation-delay: .55s;
        }
        @keyframes draw-doc { to { stroke-dashoffset: 0; } }
        #preloader-container .doc-line {
          stroke: var(--ink-paper); stroke-width: 2.1; stroke-linecap: round;
          opacity: 0; transform: scaleX(0); transform-origin: left center; animation: line-in .42s var(--ease-out) forwards;
        }
        #preloader-container .doc-block { fill: var(--ai-teal); opacity: 0; animation: block-in .4s var(--ease-out) forwards; }
        @keyframes line-in { to { opacity: .9; transform: scaleX(1); } }
        @keyframes block-in { to { opacity: .9; } }

        #preloader-container .scan { position: absolute; inset: 0; overflow: hidden; border-radius: 5px; }
        #preloader-container .scan::before {
          content: ""; position: absolute; top: -10%; left: -45%; width: 45%; height: 120%;
          background: linear-gradient(90deg, transparent, #ffffff40 45%, var(--ai-teal) 50%, transparent 100%);
          filter: blur(2px); mix-blend-mode: screen; opacity: 0;
          animation: sweep 2.3s ease-in-out infinite; animation-delay: 1.6s;
        }
        #preloader-container #preloader.is-completing .scan::before { animation: sweep-final .5s ease-out forwards; }
        @keyframes sweep {
          0% { opacity: 0; transform: translateX(0); } 8% { opacity: .9; }
          50% { transform: translateX(300%); opacity: .9; } 58% { opacity: 0; } 100% { opacity: 0; transform: translateX(300%); }
        }
        @keyframes sweep-final { 0% { opacity: .95; transform: translateX(0); } 100% { opacity: 0; transform: translateX(300%); } }

        #preloader-container #preloader.is-completing .logo::after { animation: none; opacity: .85; }
        #preloader-container #preloader.is-completing .logo svg { filter: brightness(1.3); transition: filter .25s ease; }

        /* ---------- loading text ---------- */
        #preloader-container .copy { text-align: center; opacity: 0; animation: fade-up .5s var(--ease-out) forwards; animation-delay: .85s; }
        #preloader-container .copy h2 { margin: 0; font-size: 14px; font-weight: 600; letter-spacing: .02em; color: var(--text-primary); }
        #preloader-container .copy .status { margin-top: 6px; font-size: 12px; color: var(--text-muted); height: 16px; position: relative; }
        #preloader-container .copy .status span {
          position: absolute; left: 50%; transform: translateX(-50%); opacity: 0;
          transition: opacity .45s ease; white-space: nowrap;
        }
        #preloader-container .copy .status span.active { opacity: 1; }

        /* ---------- reduced motion ---------- */
        @media (prefers-reduced-motion: reduce){
          #preloader-container .orbit,
          #preloader-container .logo,
          #preloader-container .scan::before,
          #preloader-container .feed::before { animation: none !important; }
          #preloader-container .logo::after { opacity: .35; animation: none; }
          #preloader-container .doc-outline { stroke-dashoffset: 0; animation: none; }
          #preloader-container .doc-line,
          #preloader-container .doc-block { opacity: .9; transform: none; animation: none; }
          #preloader-container .feed { opacity: .5; }
          #preloader-container .brand,
          #preloader-container .stage,
          #preloader-container .copy { animation: fade-only .4s ease forwards; }
          @keyframes fade-only { from { opacity: 0; } to { opacity: 1; } }
        }
      `}} />
      <div id="preloader-container">
        <div id="preloader">
          <div className="brand">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--ai-teal)" strokeWidth="1.6" />
              <path
                d="M8 12l2.5 2.5L16 9"
                stroke="var(--ai-teal)"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>ResumeAI</span>
          </div>

          <div className="stage">
            <div className="guides">
              <svg viewBox="0 0 260 260">
                <circle cx="130" cy="130" r="70" />
                <circle cx="130" cy="130" r="98" />
                <circle cx="130" cy="130" r="122" />
              </svg>
            </div>

            <div className="orbits" id="orbits">
              {RINGS.map((radius, r) => {
                const count = PER_RING[r];
                  const duration = 10 + r * 5;
                  return Array.from({ length: count }).map((_, p) => {
                    return (
                      <div
                        key={`orbit-${r}-${p}`}
                        className={`orbit ${r % 2 === 1 ? "violet" : ""}`}
                        style={{
                          width: radius * 2 + "px",
                          height: radius * 2 + "px",
                          left: "50%",
                          top: "50%",
                          marginLeft: -radius + "px",
                          marginTop: -radius + "px",
                          animationDuration: duration + "s",
                          animationDirection: r % 2 === 0 ? "normal" : "reverse",
                          animationDelay: -(duration / count) * p + "s",
                        }}
                      >
                        <div className="dot"></div>
                      </div>
                    );
                  });
                })}
            </div>

            <div className="composition">
              <div className="logo">
                <svg viewBox="0 0 52 52" fill="none">
                  <circle
                    cx="26"
                    cy="26"
                    r="19"
                    fill="var(--bg-1)"
                    stroke="var(--ai-violet)"
                    strokeWidth="2.2"
                  />
                  <path
                    d="M18 27l5.5 5.5L35 20"
                    stroke="var(--ai-violet)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="feed"></div>

              <div className="doc-wrap">
                <svg viewBox="0 0 84 106">
                  <rect className="doc-outline" x="2" y="2" width="80" height="102" rx="6" />
                  <circle className="doc-block" cx="15" cy="17" r="6" style={{ animationDelay: "1.05s" }} />
                  <line className="doc-line" x1="28" y1="14" x2="62" y2="14" style={{ animationDelay: "1.1s" }} />
                  <line className="doc-line" x1="28" y1="21" x2="48" y2="21" style={{ animationDelay: "1.18s" }} />
                  <line className="doc-line" x1="9" y1="38" x2="75" y2="38" style={{ animationDelay: "1.28s" }} />
                  <line className="doc-line" x1="9" y1="46" x2="75" y2="46" style={{ animationDelay: "1.36s" }} />
                  <line className="doc-line" x1="9" y1="54" x2="58" y2="54" style={{ animationDelay: "1.44s" }} />
                  <rect className="doc-block" x="9" y="65" width="13" height="4" rx="2" style={{ animationDelay: "1.52s" }} />
                  <line className="doc-line" x1="9" y1="77" x2="75" y2="77" style={{ animationDelay: "1.6s" }} />
                  <line className="doc-line" x1="9" y1="85" x2="63" y2="85" style={{ animationDelay: "1.68s" }} />
                  <line className="doc-line" x1="9" y1="93" x2="69" y2="93" style={{ animationDelay: "1.76s" }} />
                </svg>
                <div className="scan"></div>
              </div>
            </div>
          </div>

          <div className="copy">
            <h2>Loading your page</h2>
            <div className="status" id="status">
              {STATUSES.map((status, i) => (
                <span key={i} className={i === statusIdx ? "active" : ""}>
                  {status}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
