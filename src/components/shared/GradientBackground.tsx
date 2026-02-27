"use client";

import { useEffect, useState } from "react";

export function GradientBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      {/* Noise texture overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] dark:opacity-[0.035]" aria-hidden>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>

      {/* Light mode blobs */}
      <div className="dark:hidden">
        <div
          className={`absolute rounded-full blur-[120px] transition-opacity duration-[2s] ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "50vw",
            height: "50vw",
            maxWidth: "700px",
            maxHeight: "700px",
            background: "rgba(120,210,230,0.15)",
            top: "-15%",
            left: "-5%",
            animation: "blob-drift-1 25s ease-in-out infinite",
          }}
        />
        <div
          className={`absolute rounded-full blur-[120px] transition-opacity duration-[2s] ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "40vw",
            height: "40vw",
            maxWidth: "550px",
            maxHeight: "550px",
            background: "rgba(200,160,240,0.1)",
            top: "15%",
            right: "-10%",
            animation: "blob-drift-2 30s ease-in-out infinite",
          }}
        />
        <div
          className={`absolute rounded-full blur-[100px] transition-opacity duration-[2s] ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "45vw",
            height: "45vw",
            maxWidth: "600px",
            maxHeight: "600px",
            background: "rgba(140,220,180,0.1)",
            bottom: "0%",
            left: "25%",
            animation: "blob-drift-3 22s ease-in-out infinite",
          }}
        />
      </div>

      {/* Dark mode blobs — more vivid for dark background */}
      <div className="hidden dark:block">
        <div
          className={`absolute rounded-full blur-[120px] transition-opacity duration-[2s] ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "50vw",
            height: "50vw",
            maxWidth: "700px",
            maxHeight: "700px",
            background: "rgba(20,120,150,0.2)",
            top: "-15%",
            left: "-5%",
            animation: "blob-drift-1 25s ease-in-out infinite",
          }}
        />
        <div
          className={`absolute rounded-full blur-[120px] transition-opacity duration-[2s] ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "40vw",
            height: "40vw",
            maxWidth: "550px",
            maxHeight: "550px",
            background: "rgba(100,50,150,0.12)",
            top: "15%",
            right: "-10%",
            animation: "blob-drift-2 30s ease-in-out infinite",
          }}
        />
        <div
          className={`absolute rounded-full blur-[100px] transition-opacity duration-[2s] ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{
            width: "45vw",
            height: "45vw",
            maxWidth: "600px",
            maxHeight: "600px",
            background: "rgba(20,100,90,0.15)",
            bottom: "0%",
            left: "25%",
            animation: "blob-drift-3 22s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}
