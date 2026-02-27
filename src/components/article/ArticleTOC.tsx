"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TOCItem } from "@/data/placeholderPost";

interface ArticleTOCProps {
  items: TOCItem[];
}

export function ArticleTOC({ items }: ArticleTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [readPct, setReadPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const headings = items.map((item) => ({
        id: item.id,
        top: document.getElementById(item.id)?.getBoundingClientRect().top ?? 0,
      }));

      let current: string | null = null;
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].top <= window.innerHeight * 0.3) {
          current = headings[i].id;
          break;
        }
      }
      if (!current && headings.length > 0) current = headings[0].id;
      setActiveId(current);

      const article = document.querySelector("article[data-reading-progress]");
      if (article) {
        const box = article.getBoundingClientRect();
        const h = box.height - window.innerHeight;
        if (h > 0) setReadPct(Math.min(100, Math.ceil((Math.max(0, -box.top) / h) * 100)));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden xl:block w-52 flex-shrink-0">
      <nav className="sticky top-24" aria-label="目录">
        <div className="space-y-[2px]">
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
        <div className="mt-6 pt-4 border-t border-light-border/40 dark:border-dark-border/40 flex items-center gap-1.5 text-[12px] text-light-muted dark:text-dark-muted tabular-nums">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
            <path d="M22 12A10 10 0 0 0 12 2v10z" />
          </svg>
          {readPct}%
        </div>
      </nav>
    </aside>
  );
}
