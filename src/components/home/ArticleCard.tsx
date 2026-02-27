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
  const { slug, title, date, href = slug ? `/posts/${slug}` : "#" } = article;

  return (
    <Link
      href={href}
      className="group flex items-baseline gap-3 py-3 transition-colors duration-200"
    >
      <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-light-accent dark:bg-dark-accent flex-shrink-0 group-hover:scale-125 transition-transform duration-200" />
      <span className="flex-1 min-w-0 text-[15px] leading-relaxed text-light-text dark:text-dark-text link-hover group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors duration-200">
        {title}
      </span>
      <span className="text-[13px] text-light-muted dark:text-dark-muted flex-shrink-0 tabular-nums tracking-tight">
        {date}
      </span>
    </Link>
  );
}
