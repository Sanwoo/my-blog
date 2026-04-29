"use client";

import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

function desktopNavClassName(active: boolean) {
  return cn(
    "inline-flex h-8 items-center justify-center rounded-full border px-3 text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/35",
    active
      ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
      : "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  );
}

export function NavDesktopLinks({
  links,
  pathname,
  isTopMode,
  isWideTopMode,
}: {
  links: ReadonlyArray<{ href: string; label: string }>;
  pathname: string;
  isTopMode: boolean;
  isWideTopMode: boolean;
}) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex">
      <NavigationMenu viewport={false} className="pointer-events-auto">
        <NavigationMenuList
          className={cn(
            "inline-flex items-center gap-1 rounded-full p-1 shadow-xs transition-colors backdrop-blur-xl",
            isWideTopMode
              ? "border border-white/18 bg-white/8 dark:border-white/10 dark:bg-black/10"
              : isTopMode
                ? "border border-white/24 bg-white/12 dark:border-white/10 dark:bg-black/10"
                : "border border-border/70 bg-background/78"
          )}
        >
          {links.map(({ href, label }) => {
            const active = href === pathname;
            return (
              <NavigationMenuItem key={label}>
                <NavigationMenuLink active={active} render={<Link href={href} />} className={desktopNavClassName(active)}>
                  {label}
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
