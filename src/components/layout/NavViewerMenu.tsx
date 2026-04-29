"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AccountNotificationBadge,
  useInteractionNotificationSummary,
} from "@/components/account/interaction-notification-summary";
import type { ViewerSession } from "@/lib/types";

const AccountCenterContent = dynamic(
  () => import("@/components/account/AccountCenterContent").then((module) => module.AccountCenterContent),
  {
    ssr: false,
  }
);

export function NavViewerMenu({
  viewer,
  signOut,
}: {
  viewer: ViewerSession;
  signOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { unreadCount } = useInteractionNotificationSummary(true);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setOpen(false);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-10 rounded-full border-border/70 bg-background/82 p-0 shadow-xs backdrop-blur supports-backdrop-filter:bg-background/72"
          aria-label={`${viewer.displayName} 的账户菜单`}
        >
          <ProfileAvatar viewer={viewer} className="size-full border-0 bg-muted/45 shadow-none" />
          <AccountNotificationBadge count={unreadCount} />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={10} className="w-[min(28rem,calc(100vw-1rem))] p-0">
        <PopoverArrow />
        <div className="p-4">
          {open ? (
            <AccountCenterContent
              key={`${viewer.id}:${viewer.displayName}:${viewer.handle}:${viewer.avatarUrl ?? ""}:open`}
              viewer={viewer}
              open={open}
              onClose={() => setOpen(false)}
              signOut={handleSignOut}
              isSigningOut={isSigningOut}
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
