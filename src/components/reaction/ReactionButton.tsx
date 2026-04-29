"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReactionButtonTone = "article" | "comment";
type ReactionButtonSize = "default" | "sm";

const likeAnimationDurationMs = 520;

export function ReactionButton({
  active,
  pending,
  count,
  label,
  tone,
  size,
  onToggle,
}: {
  active: boolean;
  pending?: boolean;
  count: number;
  label?: string;
  tone: ReactionButtonTone;
  size: ReactionButtonSize;
  onToggle: () => void;
}) {
  const animationTimeoutRef = useRef<number | null>(null);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, []);

  const isArticleTone = tone === "article";
  const handleToggle = () => {
    const shouldAnimate = !active && !pending;

    if (shouldAnimate) {
      setIsLikeAnimating(true);

      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = window.setTimeout(() => {
        setIsLikeAnimating(false);
        animationTimeoutRef.current = null;
      }, likeAnimationDurationMs);
    }

    onToggle();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn(
        "group/reaction relative overflow-hidden rounded-full border border-border/70 bg-background/76 transition-[transform,background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_0.75rem_1.8rem_-1.1rem_color-mix(in_oklab,var(--foreground)_16%,transparent)] focus-visible:ring-3 focus-visible:ring-[color:var(--reaction-ring)] motion-reduce:transform-none motion-reduce:transition-none",
        isArticleTone ? "h-10 px-4 py-2 text-sm" : "h-8 px-3 text-[13px]",
        active
          ? "border-[color:var(--reaction-border)] bg-[color:var(--reaction-surface)] text-[color:var(--reaction-foreground)] shadow-[0_0.9rem_2rem_-1.3rem_var(--reaction-shadow)] hover:bg-[color:var(--reaction-surface-strong)]"
          : "text-muted-foreground hover:border-[color:var(--reaction-border-muted)] hover:bg-[color:var(--reaction-surface-muted)] hover:text-foreground",
        pending && "cursor-progress"
      )}
      onClick={handleToggle}
      disabled={pending}
      aria-pressed={active}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:hidden",
          active && "opacity-100"
        )}
        style={{
          background:
            "radial-gradient(circle at 24% 28%, color-mix(in oklab, var(--reaction-heart) 18%, transparent), transparent 52%), radial-gradient(circle at 78% 72%, color-mix(in oklab, var(--reaction-heart) 12%, transparent), transparent 48%)",
        }}
      />
      <span className="relative inline-flex items-center gap-2">
        <span className="relative inline-flex items-center justify-center">
          <Heart
            width={isArticleTone ? 16 : 14}
            height={isArticleTone ? 16 : 14}
            aria-hidden
            className={cn(
              "transition-[transform,color,fill,stroke] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              active
                ? "fill-[color:var(--reaction-heart)] text-[color:var(--reaction-heart)]"
                : "fill-transparent text-current",
              isLikeAnimating &&
                (isArticleTone
                  ? "motion-safe:animate-[reaction-heart-pop_520ms_cubic-bezier(0.22,1,0.36,1)]"
                  : "motion-safe:animate-[reaction-heart-pop-sm_420ms_cubic-bezier(0.22,1,0.36,1)]")
            )}
          />
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full opacity-0 motion-reduce:hidden",
              isLikeAnimating &&
                (isArticleTone
                  ? "motion-safe:animate-[reaction-heart-halo_520ms_cubic-bezier(0.22,1,0.36,1)]"
                  : "motion-safe:animate-[reaction-heart-halo-sm_420ms_cubic-bezier(0.22,1,0.36,1)]")
            )}
            style={{
              boxShadow: "0 0 0 0 color-mix(in oklab, var(--reaction-heart) 28%, transparent)",
            }}
          />
        </span>
        {label ? <span>{label}</span> : null}
        <span
          className={cn(
            "text-[11px] font-medium text-current transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          )}
        >
          {count}
        </span>
      </span>
    </Button>
  );
}
