"use client";

import { ArticleCard } from "./ArticleCard";
import type { ArticleCardData } from "./ArticleCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface ArticleListProps {
  articles: ArticleCardData[];
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <section>
      <h2 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
        最新文章
      </h2>
      <div className="stagger-children">
        {articles.map((article, i) => (
          <ArticleCard key={article.slug ?? i} article={article} />
        ))}
      </div>
      {articles.length > 0 && (
        <div className="mt-4 pt-2">
          <Link
            href="#"
            className="inline-flex items-center gap-1.5 text-sm text-light-accent dark:text-dark-accent hover:underline underline-offset-4"
          >
            更多文章
            <ArrowRight width={14} height={14} />
          </Link>
        </div>
      )}
    </section>
  );
}
