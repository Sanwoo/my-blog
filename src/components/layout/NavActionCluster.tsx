"use client";

import { useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import { Loader2, LogIn, Menu, X } from "lucide-react";
import { NavMobileAccountDialog } from "@/components/layout/NavMobileAccountDialog";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import type { ViewerSession } from "@/lib/types";
import { NavViewerMenu } from "@/components/layout/NavViewerMenu";

const mobileChromeButtonClassName =
  "relative z-20 size-8 rounded-none border-0 bg-transparent p-0 text-foreground/76 shadow-none transition-colors hover:bg-transparent hover:text-foreground dark:text-foreground/82 dark:hover:bg-transparent";

function restoreFocus(ref: RefObject<HTMLButtonElement | null>) {
  window.requestAnimationFrame(() => {
    ref.current?.focus();
  });
}

export function NavActionCluster({
  desktopCompactMode,
  loading,
  viewer,
  pathname,
  mobileMenuOpen,
  setMobileMenuOpen,
  mobileAccountOpen,
  setMobileAccountOpen,
  mobilePanelId,
  startSignIn,
  signOut,
}: {
  desktopCompactMode: boolean;
  loading: boolean;
  viewer: ViewerSession | null;
  pathname: string;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  mobileAccountOpen: boolean;
  setMobileAccountOpen: Dispatch<SetStateAction<boolean>>;
  mobilePanelId: string;
  startSignIn: (next?: string) => void;
  signOut: () => Promise<void>;
  }) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const handleMobileAccountOpenChange = (open: boolean) => {
    setMobileAccountOpen(open);

    if (!open) {
      restoreFocus(menuButtonRef);
    }
  };

  const handleMenuToggle = () => {
    setMobileMenuOpen((open) => {
      const nextOpen = !open;

      if (!nextOpen && !mobileAccountOpen) {
        restoreFocus(menuButtonRef);
      }

      return nextOpen;
    });
  };

  return (
    <div className="relative z-20 ml-auto flex shrink-0 items-center gap-1.5">
      {!desktopCompactMode ? (
        <>
          {loading ? (
            <Button type="button" variant="outline" size="icon" className="hidden size-9 rounded-full text-muted-foreground lg:inline-flex" aria-live="polite" aria-label="同步中" disabled>
              <Loader2 className="size-4 animate-spin" aria-hidden />
            </Button>
          ) : null}
          {!viewer && !loading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="hidden size-9 rounded-full cursor-pointer md:inline-flex"
              aria-label="登录"
              onClick={() => startSignIn(pathname)}
            >
              <LogIn width={16} height={16} aria-hidden />
            </Button>
          ) : null}
          {viewer ? <div className="hidden md:block"><NavViewerMenu viewer={viewer} signOut={signOut} /></div> : null}
          <div className="hidden md:block">
            <ThemeToggle variant="pill" />
          </div>
        </>
      ) : null}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          ref={menuButtonRef}
          type="button"
          variant="ghost"
          size="icon"
          className={mobileChromeButtonClassName}
          aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
          aria-controls={mobilePanelId}
          aria-expanded={mobileMenuOpen}
          onClick={handleMenuToggle}
        >
          {mobileMenuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
        </Button>
      </div>
      <NavMobileAccountDialog open={mobileAccountOpen} onOpenChange={handleMobileAccountOpenChange} viewer={viewer} signOut={signOut} />
    </div>
  );
}
