import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReactionCount({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[color:var(--reaction-count-foreground)]",
        className
      )}
    >
      <Heart
        width={12}
        height={12}
        aria-hidden
        className="fill-[color:var(--reaction-heart-soft)] text-[color:var(--reaction-heart)]"
      />
      <span>{count} 次欣赏</span>
    </span>
  );
}
