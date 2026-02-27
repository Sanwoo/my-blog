import Image from "next/image";
import { Calendar, Clock, Eye } from "lucide-react";
import type { PostMeta } from "@/data/placeholderPost";

interface ArticleHeaderProps {
  meta: PostMeta;
}

export function ArticleHeader({ meta }: ArticleHeaderProps) {
  const {
    category,
    categoryLabel,
    title,
    author,
    authorHandle,
    avatar,
    date,
    readTime,
    views,
  } = meta;

  return (
    <header className="max-w-4xl mb-12">
      <div className="flex items-center gap-2 text-sm text-light-accent dark:text-dark-accent font-medium mb-6">
        <span className="uppercase tracking-wider">{category}</span>
        <span className="w-1 h-1 rounded-full bg-light-muted/40" />
        <span>{categoryLabel}</span>
      </div>
      <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-light-text dark:text-dark-text leading-tight mb-8">
        {title.split("\n").map((line, i) => (
          <span key={i}>
            {line}
            {i < title.split("\n").length - 1 && <br />}
          </span>
        ))}
      </h1>
      <div className="flex items-center gap-6 border-b border-light-border dark:border-dark-border pb-8">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-light-bg dark:ring-dark-bg bg-gray-200">
            <Image
              src={avatar}
              alt={author}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div>
            <div className="font-serif font-bold text-light-text dark:text-dark-text">
              {author}
            </div>
            <div className="text-xs text-light-muted dark:text-dark-muted">
              {authorHandle}
            </div>
          </div>
        </div>
        <div className="hidden sm:block w-px h-8 bg-light-border dark:bg-dark-border" />
        <div className="flex flex-wrap gap-4 text-sm text-light-muted dark:text-dark-muted">
          <span className="flex items-center gap-1.5">
            <Calendar width={16} height={16} aria-hidden />
            {date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock width={16} height={16} aria-hidden />
            {readTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye width={16} height={16} aria-hidden />
            {views}
          </span>
        </div>
      </div>
    </header>
  );
}
