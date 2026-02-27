"use client";

import { useState } from "react";
import { List, LayoutGrid } from "lucide-react";
import { ArticleCard } from "./ArticleCard";
import type { ArticleCardData } from "./ArticleCard";

type ViewMode = "list" | "grid";

interface ArticleListProps {
  articles: ArticleCardData[];
}

export function ArticleList({ articles }: ArticleListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted">
          最新文章
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "list"
                ? "bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg"
                : "hover:bg-light-border dark:hover:bg-dark-border"
            }`}
            aria-label="列表视图"
            aria-pressed={viewMode === "list"}
          >
            <List width={16} height={16} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded transition-colors ${
              viewMode === "grid"
                ? "bg-light-text dark:bg-dark-text text-light-bg dark:text-dark-bg"
                : "hover:bg-light-border dark:hover:bg-dark-border"
            }`}
            aria-label="网格视图"
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid width={16} height={16} aria-hidden />
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 gap-8"
            : "space-y-12"
        }
      >
        {articles.map((article, i) => (
          <ArticleCard key={article.slug ?? i} article={article} />
        ))}
      </div>

      <div className="pt-8 flex justify-center">
        <button
          type="button"
          className="px-8 py-3 border border-light-border dark:border-dark-border rounded-full text-sm font-medium hover:bg-light-text hover:text-white dark:hover:bg-dark-text dark:hover:text-black transition-all duration-300 text-light-text dark:text-dark-text"
        >
          加载更多文章
        </button>
      </div>
    </>
  );
}
