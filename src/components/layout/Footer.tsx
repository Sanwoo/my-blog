"use client";

import Link from "next/link";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";

const footerLinks = [
  { label: "关于", href: "#" },
  { label: "文章", href: "#" },
  { label: "笔记", href: "#" },
  { label: "时间线", href: "#" },
];

const footerSecondary = [
  { label: "RSS", href: "#" },
  { label: "Sitemap", href: "#" },
  { label: "GitHub", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-light-border dark:border-dark-border mt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-light-muted dark:text-dark-muted mb-6">
          {footerLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              {label}
            </Link>
          ))}
          <span className="text-light-border dark:text-dark-border">·</span>
          {footerSecondary.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Meta */}
        <div className="flex flex-col items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
          <p>© 2020-{new Date().getFullYear()} Echoes · Stay hungry, Stay foolish.</p>
          <OnlineIndicator pagePath="/" showPageCount={false} />
        </div>
      </div>
    </footer>
  );
}
