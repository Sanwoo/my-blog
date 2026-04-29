"use client";

import { useArticleReading } from "@/components/article/ArticleReadingProvider";

export function ReadingProgress() {
  const { progress } = useArticleReading();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-border/40"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="阅读进度"
    >
      <div
        className="h-full bg-foreground transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
