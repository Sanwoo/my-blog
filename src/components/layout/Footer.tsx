"use client";

import Link from "next/link";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";

export function Footer() {
  return (
    <footer className="border-t border-light-border dark:border-dark-border mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="font-serif text-lg italic text-light-text dark:text-dark-text">Echoes.</span>
              <p className="text-xs text-light-muted dark:text-dark-muted">
                探索设计、技术与生活的交汇点
              </p>
            </div>
            <div className="flex gap-6 text-sm text-light-muted dark:text-dark-muted">
              <Link href="#" className="hover:text-light-text dark:hover:text-dark-text transition-colors">
                Privacy
              </Link>
              <Link href="#" className="hover:text-light-text dark:hover:text-dark-text transition-colors">
                Terms
              </Link>
              <Link href="#" className="hover:text-light-text dark:hover:text-dark-text transition-colors">
                RSS
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-light-border/50 dark:border-dark-border/50">
            <p className="text-xs text-light-muted dark:text-dark-muted">
              © {new Date().getFullYear()} Echoes Blog. All rights reserved.
            </p>
            <OnlineIndicator pagePath="/" showPageCount={false} />
          </div>
        </div>
      </div>
    </footer>
  );
}
