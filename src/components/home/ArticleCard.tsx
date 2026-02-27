import Link from "next/link";

export interface ArticleCardData {
  slug?: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  readTime: string;
  href?: string;
}

interface ArticleCardProps {
  article: ArticleCardData;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const {
    slug,
    title,
    date,
    readTime,
    href = slug ? `/posts/${slug}` : "#",
  } = article;

  return (
    <Link href={href} className="group flex items-start gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-light-bg-soft dark:hover:bg-dark-bg-secondary transition-colors">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-light-accent dark:bg-dark-accent flex-shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="text-[15px] text-light-text dark:text-dark-text group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors line-clamp-2">
          {title}
        </span>
      </span>
      <span className="text-xs text-light-muted dark:text-dark-muted flex-shrink-0 mt-0.5 tabular-nums">
        {date || readTime}
      </span>
    </Link>
  );
}
