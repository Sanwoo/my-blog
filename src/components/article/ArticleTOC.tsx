"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TOCItem } from "@/data/placeholderPost";

interface ArticleTOCProps {
  items: TOCItem[];
}

export function ArticleTOC({ items }: ArticleTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const headings = items.map((item) => ({
        id: item.id,
        top: document.getElementById(item.id)?.getBoundingClientRect().top ?? 0,
      }));

      const threshold = window.innerHeight * 0.3;
      let current: string | null = null;
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].top <= threshold) {
          current = headings[i].id;
          break;
        }
      }
      if (!current && headings.length > 0) current = headings[0].id;
      setActiveId(current);

      const article = document.querySelector("article[data-reading-progress]");
      if (article) {
        const box = article.getBoundingClientRect();
        const contentHeight = box.height - window.innerHeight;
        if (contentHeight > 0) {
          const scrolled = Math.max(0, -box.top);
          setReadingProgress(Math.min(100, Math.ceil((scrolled / contentHeight) * 100)));
        }
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block w-56 flex-shrink-0">
      <nav className="sticky top-20 space-y-0.5" aria-label="本页目录">
        <div className="space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className={`toc-link block py-1 text-[13px] leading-relaxed transition-all duration-200 ${
                activeId === item.id
                  ? "active"
                  : "text-light-muted dark:text-dark-muted hover:text-light-text-secondary dark:hover:text-dark-text-secondary"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="pt-4 mt-4 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center gap-2 text-xs text-light-muted dark:text-dark-muted">
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx={12} cy={12} r={10} />
              <path d="M12 6v6l4 2" />
            </svg>
            {readingProgress}%
          </div>
        </div>
      </nav>
    </aside>
  );
}
