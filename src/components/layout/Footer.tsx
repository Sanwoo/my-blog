"use client";

import Link from "next/link";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";

export function Footer() {
  return (
    <footer className="border-t border-light-border/40 dark:border-dark-border/40 mt-16">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12 text-center space-y-5">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[13px] text-light-muted dark:text-dark-muted">
          {["关于", "文章", "笔记", "时间线"].map(l => (
            <Link key={l} href="#" className="hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors duration-200">{l}</Link>
          ))}
          <span className="text-light-border dark:text-dark-border">·</span>
          {["RSS", "Sitemap", "GitHub"].map(l => (
            <Link key={l} href="#" className="hover:text-light-text-secondary dark:hover:text-dark-text-secondary transition-colors duration-200">{l}</Link>
          ))}
        </div>
        <p className="text-[12px] text-light-muted dark:text-dark-muted">
          © 2020–{new Date().getFullYear()} Echoes · Stay hungry, Stay foolish.
        </p>
        <OnlineIndicator pagePath="/" showPageCount={false} />
      </div>
    </footer>
  );
}
