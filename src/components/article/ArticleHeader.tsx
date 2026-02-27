import { Calendar, Clock, Eye, Hash, Sparkles } from "lucide-react";
import type { PostMeta } from "@/data/placeholderPost";

interface ArticleHeaderProps {
  meta: PostMeta;
}

export function ArticleHeader({ meta }: ArticleHeaderProps) {
  const { category, title, date, readTime, views } = meta;

  return (
    <header className="text-center max-w-3xl mx-auto mb-10 animate-fade-up">
      <h1 className="text-[2rem] md:text-[2.5rem] font-bold text-light-text dark:text-dark-text leading-[1.25] tracking-tight mb-8">
        {title.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < title.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-light-muted dark:text-dark-muted">
        <span className="inline-flex items-center gap-1">
          <Calendar width={13} height={13} />
          {date}
        </span>
        <span className="text-light-border dark:text-dark-border">·</span>
        <span className="inline-flex items-center gap-1">
          <Hash width={13} height={13} />
          {category}
        </span>
        <span className="text-light-border dark:text-dark-border">·</span>
        <span className="inline-flex items-center gap-1">
          <Eye width={13} height={13} />
          {views}
        </span>
        <span className="text-light-border dark:text-dark-border">·</span>
        <span className="inline-flex items-center gap-1">
          <Clock width={13} height={13} />
          {readTime}
        </span>
        <span className="text-light-border dark:text-dark-border">·</span>
        <span className="inline-flex items-center gap-1">
          <Sparkles width={13} height={13} />
          Handmade
        </span>
      </div>
    </header>
  );
}
