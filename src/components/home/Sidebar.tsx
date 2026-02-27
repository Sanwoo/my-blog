import Link from "next/link";
import {
  placeholderCategories,
  placeholderPopularPosts,
  placeholderStats,
} from "@/data/placeholderSidebar";

export function Sidebar() {
  return (
    <aside className="lg:col-span-3 space-y-10">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-6">
          探索分类
        </h4>
        <div className="flex flex-wrap gap-2">
          {placeholderCategories.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="px-4 py-2 text-sm rounded-full bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border hover:border-light-accent dark:hover:border-dark-accent hover:text-light-accent dark:hover:text-dark-accent transition-colors text-light-text dark:text-dark-text"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-6">
          热门阅读
        </h4>
        <div className="space-y-6">
          {placeholderPopularPosts.map((post, i) => (
            <Link
              key={post.title}
              href={post.href}
              className="group block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h5 className="text-base font-medium group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors mb-1 text-light-text dark:text-dark-text">
                    {post.title}
                  </h5>
                  <span className="text-xs text-light-muted dark:text-dark-muted">
                    {post.views}
                  </span>
                </div>
                <span className="text-light-muted/30 group-hover:text-light-accent/50 transition-colors font-serif italic text-xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-light-bg-secondary dark:bg-dark-card/50 rounded-xl p-6 border border-light-border dark:border-dark-border">
        <h4 className="text-xs font-bold uppercase tracking-widest text-light-muted dark:text-dark-muted mb-4">
          博客统计
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <span className="block text-2xl font-serif font-bold text-light-text dark:text-dark-text">
              {placeholderStats.articles}
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted">
              文章
            </span>
          </div>
          <div className="text-center">
            <span className="block text-2xl font-serif font-bold text-light-text dark:text-dark-text">
              {placeholderStats.words}
            </span>
            <span className="text-xs text-light-muted dark:text-dark-muted">
              字数
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
