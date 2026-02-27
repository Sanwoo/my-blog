"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TOCItem } from "@/data/placeholderPost";

interface ArticleTOCProps {
  items: TOCItem[];
}

export function ArticleTOC({ items }: ArticleTOCProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

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
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [items]);

  return (
    <aside className="lg:col-span-4">
      <nav
        className="sticky top-28 space-y-2"
        aria-label="本页目录"
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-6">
          本页目录
        </h4>
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`#${item.id}`}
              className={`toc-link block py-2 text-sm transition-colors text-light-text dark:text-dark-text hover:text-light-accent dark:hover:text-dark-accent ${
                activeId === item.id ? "active" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
