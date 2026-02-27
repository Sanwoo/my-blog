"use client";

import { useOnlinePresence } from "@/lib/use-online-presence";
import { Users, Eye } from "lucide-react";

interface OnlineIndicatorProps {
  pagePath: string;
  postSlug?: string;
  showPageCount?: boolean;
}

export function OnlineIndicator({ pagePath, postSlug, showPageCount = true }: OnlineIndicatorProps) {
  const { siteTotal, pageCount } = useOnlinePresence(pagePath, postSlug);

  return (
    <div className="flex items-center gap-4 text-xs text-light-muted dark:text-dark-muted">
      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <Users width={12} height={12} />
        <span>{siteTotal} 人在线</span>
      </span>
      {showPageCount && (
        <span className="flex items-center gap-1.5">
          <Eye width={12} height={12} />
          <span>{pageCount} 人正在看</span>
        </span>
      )}
    </div>
  );
}
