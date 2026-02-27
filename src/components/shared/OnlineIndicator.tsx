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
    <div className="flex items-center gap-3 text-xs text-light-muted dark:text-dark-muted">
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
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
