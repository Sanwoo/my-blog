"use client";

import { useOnlinePresence } from "@/lib/use-online-presence";

interface OnlineIndicatorProps {
  pagePath: string;
  postSlug?: string;
  showPageCount?: boolean;
}

export function OnlineIndicator({ pagePath, postSlug, showPageCount = true }: OnlineIndicatorProps) {
  const { siteTotal, pageCount } = useOnlinePresence(pagePath, postSlug);

  return (
    <div className="flex items-center justify-center gap-3 text-[12px] text-light-muted dark:text-dark-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-[5px] w-[5px]">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-[5px] w-[5px] bg-emerald-500" />
        </span>
        Being viewed by {siteTotal} reader{siteTotal !== 1 ? "s" : ""}
      </span>
      {showPageCount && pageCount > 0 && (
        <>
          <span className="text-light-border dark:text-dark-border">·</span>
          <span>{pageCount} on this page</span>
        </>
      )}
    </div>
  );
}
