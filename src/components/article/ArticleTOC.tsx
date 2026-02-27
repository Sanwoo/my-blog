"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TOCItem } from "@/data/placeholderPost";

interface ArticleTOCProps {
  items: TOCItem[];
}

export function ArticleTOC({ items }: ArticleTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const headings = items.map((item) => ({
        id: item.id,
        top: document.getElementById(item.id)?.getBoundingClientRect().top ?? 0,
      }));

      const viewportMiddle = window.innerHeight / 2;
      let current: string | null = null;
      for (let i = headings.length - 1; i >= 0; i--) {
        if (headings[i].top <= viewportMiddle + 100) {
          current = headings[i].id;
          break;
        }
      }
      if (!current && headings.length > 0) current = headings[0].id;
      setActiveId(current);

      const currentIdx = current ? items.findIndex((i) => i.id === current) : 0;
      const pct = items.length > 1 ? Math.round((currentIdx / (items.length - 1)) * 100) : 0;
      setProgress(pct);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="lg:col-span-4 hidden lg:block">
      <nav className="sticky top-28 space-y-1" aria-label="本页目录">
        <h4 className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-4">
          本页目录
        </h4>
        <div className="relative pl-4 border-l-2 border-light-border dark:border-dark-border">
          <div
            className="absolute left-[-1px] w-0.5 bg-light-accent dark:bg-dark-accent transition-all duration-300"
            style={{
              top: 0,
              height: `${progress}%`,
            }}
          />
          {items.map((item) => {
            const isH3 = item.label.match(/^\d+\.\d+/) || false;
            return (
              <Link
                key={item.id}
                href={`#${item.id}`}
                className={`toc-link block py-1.5 text-sm transition-all duration-200 ${
                  isH3 ? "pl-3 text-xs" : ""
                } ${
                  activeId === item.id
                    ? "active font-medium translate-x-1"
                    : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
