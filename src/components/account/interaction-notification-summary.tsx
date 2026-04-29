"use client";

import useSWR from "swr";
import { fetchJson } from "@/lib/client/http";
import { INTERACTION_NOTIFICATION_SUMMARY_KEY } from "@/lib/account-client";
import { interactionNotificationsResponseSchema } from "@/lib/schemas/account";
import { cn } from "@/lib/utils";
import type { z } from "zod";

export type InteractionNotificationsResponse = z.infer<typeof interactionNotificationsResponseSchema>;

export const EMPTY_INTERACTION_UNREAD = {
  total: 0,
  likes: 0,
  replies: 0,
};

const SAME_ORIGIN_NO_STORE_INIT = {
  cache: "no-store",
  credentials: "same-origin",
} satisfies RequestInit;

export async function fetchInteractionNotificationSummary(url: string) {
  return fetchJson(url, SAME_ORIGIN_NO_STORE_INIT, "REQUEST_FAILED", interactionNotificationsResponseSchema);
}

export function useInteractionNotificationSummary(enabled: boolean) {
  const query = useSWR<InteractionNotificationsResponse>(
    enabled ? INTERACTION_NOTIFICATION_SUMMARY_KEY : null,
    fetchInteractionNotificationSummary
  );

  return {
    ...query,
    unread: query.data?.unread ?? EMPTY_INTERACTION_UNREAD,
    unreadCount: query.data?.unread.total ?? 0,
  };
}

export function AccountNotificationBadge({
  count,
  variant = "floating",
}: {
  count: number;
  variant?: "floating" | "inline";
}) {
  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white",
        variant === "floating"
          ? "absolute -right-1 -top-1 border-2 border-background shadow-sm"
          : "static shrink-0 border border-red-500/80 shadow-none",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
