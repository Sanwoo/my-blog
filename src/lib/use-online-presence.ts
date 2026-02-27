"use client";

import { useEffect, useState, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

function generateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("echoes-session-id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("echoes-session-id", id);
  }
  return id;
}

interface OnlineCount {
  siteTotal: number;
  pageCount: number;
}

export function useOnlinePresence(pagePath: string, postSlug?: string): OnlineCount {
  const [counts, setCounts] = useState<OnlineCount>({ siteTotal: 0, pageCount: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    const sessionId = generateSessionId();
    if (!sessionId) return;

    const upsertPresence = async () => {
      await supabase
        .from("online_presence")
        .upsert(
          {
            session_id: sessionId,
            page_path: pagePath,
            post_slug: postSlug ?? null,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: "session_id" }
        );
    };

    const fetchCounts = async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const [siteResult, pageResult] = await Promise.all([
        supabase
          .from("online_presence")
          .select("id", { count: "exact", head: true })
          .gte("last_seen_at", fiveMinutesAgo),
        postSlug
          ? supabase
              .from("online_presence")
              .select("id", { count: "exact", head: true })
              .eq("post_slug", postSlug)
              .gte("last_seen_at", fiveMinutesAgo)
          : supabase
              .from("online_presence")
              .select("id", { count: "exact", head: true })
              .eq("page_path", pagePath)
              .gte("last_seen_at", fiveMinutesAgo),
      ]);

      setCounts({
        siteTotal: siteResult.count ?? 0,
        pageCount: pageResult.count ?? 0,
      });
    };

    upsertPresence().then(fetchCounts);

    intervalRef.current = setInterval(() => {
      upsertPresence().then(fetchCounts);
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      supabase
        .from("online_presence")
        .delete()
        .eq("session_id", sessionId)
        .then(() => {});
    };
  }, [pagePath, postSlug]);

  return counts;
}
