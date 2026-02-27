"use client";

import { useEffect, useState } from "react";

export function GradientBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden" aria-hidden>
      {/* Noise texture overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.04] mix-blend-overlay" aria-hidden>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      {/* Animated floating color blobs */}
      <div
        className={`absolute w-[600px] h-[600px] rounded-full transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{
          background: "radial-gradient(circle, rgba(120,200,220,0.12) 0%, transparent 70%)",
          top: "-10%",
          left: "10%",
          animation: "blob-drift-1 25s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute w-[500px] h-[500px] rounded-full transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{
          background: "radial-gradient(circle, rgba(180,140,220,0.08) 0%, transparent 70%)",
          top: "20%",
          right: "-5%",
          animation: "blob-drift-2 30s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute w-[450px] h-[450px] rounded-full transition-opacity duration-1000 ${mounted ? "opacity-100" : "opacity-0"}`}
        style={{
          background: "radial-gradient(circle, rgba(100,180,160,0.09) 0%, transparent 70%)",
          bottom: "10%",
          left: "30%",
          animation: "blob-drift-3 22s ease-in-out infinite",
        }}
      />

      {/* Dark mode blobs — different palette */}
      <div
        className={`absolute w-[600px] h-[600px] rounded-full transition-opacity duration-1000 hidden dark:block ${mounted ? "dark:opacity-100" : "dark:opacity-0"}`}
        style={{
          background: "radial-gradient(circle, rgba(30,100,120,0.15) 0%, transparent 70%)",
          top: "-10%",
          left: "10%",
          animation: "blob-drift-1 25s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute w-[500px] h-[500px] rounded-full transition-opacity duration-1000 hidden dark:block ${mounted ? "dark:opacity-100" : "dark:opacity-0"}`}
        style={{
          background: "radial-gradient(circle, rgba(80,40,120,0.1) 0%, transparent 70%)",
          top: "20%",
          right: "-5%",
          animation: "blob-drift-2 30s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute w-[450px] h-[450px] rounded-full transition-opacity duration-1000 hidden dark:block ${mounted ? "dark:opacity-100" : "dark:opacity-0"}`}
        style={{
          background: "radial-gradient(circle, rgba(20,80,80,0.12) 0%, transparent 70%)",
          bottom: "10%",
          left: "30%",
          animation: "blob-drift-3 22s ease-in-out infinite",
        }}
      />
    </div>
  );
}
