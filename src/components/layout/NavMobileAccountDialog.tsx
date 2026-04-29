"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ViewerSession } from "@/lib/types";

const AccountCenterContent = dynamic(
  () => import("@/components/account/AccountCenterContent").then((module) => module.AccountCenterContent),
  {
    ssr: false,
  }
);

export function NavMobileAccountDialog({
  open,
  onOpenChange,
  viewer,
  signOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewer: ViewerSession | null;
  signOut: () => Promise<void>;
}) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!viewer) {
    return null;
  }

  const handleSignOut = async () => {
    setIsSigningOut(true);
    onOpenChange(false);

    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-x-0 top-0 flex h-dvh min-w-0 w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-x-clip overflow-y-hidden rounded-none border-x-0 border-b-0 bg-background/96 p-0 shadow-none md:hidden">
        <DialogTitle className="sr-only">账户中心</DialogTitle>
        <DialogDescription className="sr-only">查看资料、通知、登录方式与退出登录。</DialogDescription>
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.9rem)]">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">账户中心</p>
            <p className="truncate text-xs text-muted-foreground">{viewer.displayName}</p>
          </div>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" className="size-9 rounded-full" aria-label="关闭账户面板">
              <X className="size-4" aria-hidden />
            </Button>
          </DialogClose>
        </div>
        <div className="min-h-0 flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4">
          {open ? (
            <AccountCenterContent
              key={`${viewer.id}:${viewer.displayName}:${viewer.handle}:${viewer.avatarUrl ?? ""}:open`}
              viewer={viewer}
              open={open}
              onClose={() => onOpenChange(false)}
              signOut={handleSignOut}
              isSigningOut={isSigningOut}
              className="h-full max-h-none overflow-y-auto pr-0"
            />
          ) : null}
        </div>
        {isSigningOut ? (
          <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top)+0.9rem)] flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              正在退出登录
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
