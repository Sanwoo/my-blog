import { Calendar, Clock, Eye, Hash } from "lucide-react";
import type { PostMeta } from "@/data/placeholderPost";

interface ArticleHeaderProps {
  meta: PostMeta;
}

export function ArticleHeader({ meta }: ArticleHeaderProps) {
  const { category, title, date, readTime, views } = meta;

  return (
    <header className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
      <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-light-text dark:text-dark-text leading-tight mb-6 tracking-tight">
        {title.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < title.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-light-muted dark:text-dark-muted">
        <span className="flex items-center gap-1">
          <Calendar width={14} height={14} />
          {date}
        </span>
        <span className="w-px h-3 bg-light-border dark:bg-dark-border" />
        <span className="flex items-center gap-1">
          <Hash width={14} height={14} />
          {category}
        </span>
        <span className="w-px h-3 bg-light-border dark:bg-dark-border" />
        <span className="flex items-center gap-1">
          <Eye width={14} height={14} />
          {views}
        </span>
        <span className="w-px h-3 bg-light-border dark:bg-dark-border" />
        <span className="flex items-center gap-1">
          <Clock width={14} height={14} />
          {readTime}
        </span>
      </div>
    </header>
  );
}
