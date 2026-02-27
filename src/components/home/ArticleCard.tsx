import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    category,
    date,
    title,
    excerpt,
    readTime,
    href = slug ? `/posts/${slug}` : "#",
  } = article;

  return (
    <article className="group cursor-pointer article-card-hover">
      <Link href={href} className="block">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 text-xs font-medium mb-3">
              <span className="text-light-accent dark:text-dark-accent uppercase tracking-wider">
                {category}
              </span>
              <span className="w-1 h-1 rounded-full bg-light-muted/40" />
              <span className="text-light-muted dark:text-dark-muted">
                {date}
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-serif font-medium mb-3 group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors">
              {title}
            </h3>
            <p className="text-light-muted dark:text-dark-muted leading-relaxed mb-4 line-clamp-3">
              {excerpt}
            </p>
            <div className="flex items-center gap-4 text-sm font-medium text-light-text dark:text-dark-text">
              <span className="flex items-center gap-1.5 hover:underline">
                阅读全文
                <ArrowRight width={16} height={16} aria-hidden />
              </span>
              <span className="text-light-muted dark:text-dark-muted font-normal text-xs">
                {readTime}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
