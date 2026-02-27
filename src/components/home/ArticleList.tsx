"use client";

import { ArticleCard } from "./ArticleCard";
import type { ArticleCardData } from "./ArticleCard";
import Link from "next/link";

interface ArticleListProps {
  articles: ArticleCardData[];
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <section>
      <h2 className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
        Recent Posts
      </h2>
      <div className="stagger">
        {articles.map((article, i) => (
          <ArticleCard key={article.slug ?? i} article={article} />
        ))}
      </div>
      {articles.length > 0 && (
        <div className="mt-3">
          <Link href="#" className="inline-flex items-center gap-1 text-[13px] text-light-accent dark:text-dark-accent link-hover">
            ⊕ More
          </Link>
        </div>
      )}
    </section>
  );
}
