"use client";

import { useState, useEffect } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector("article[data-reading-progress]");
      if (!article) return;
      const box = article.getBoundingClientRect();
      const contentHeight = box.height - window.innerHeight;
      if (contentHeight <= 0) return;
      const scrolled = Math.max(0, -box.top);
      const value = Math.min(100, Math.ceil((scrolled / contentHeight) * 100));
      setProgress(value);
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  return (
    <div
      className="fixed top-14 left-0 right-0 z-40 h-[2px]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="阅读进度"
    >
      <div
        className="h-full bg-light-accent dark:bg-dark-accent transition-[width] duration-150 opacity-80"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
