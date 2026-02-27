"use client";

import { OnlineIndicator } from "@/components/shared/OnlineIndicator";

const recentNotes = [
  { title: "极简生活：舍弃物品的艺术", time: "10 天前" },
  { title: "AI 时代的工作与生活", time: "1 个月前" },
  { title: "2025 · 仍在路上，半径之外", time: "2 个月前" },
];

export function Sidebar() {
  return (
    <aside className="lg:col-span-5 space-y-10">
      {/* Recent Notes */}
      <section>
        <h2 className="text-lg font-medium text-light-text dark:text-dark-text mb-4">
          最新笔记
        </h2>
        <div className="space-y-0.5">
          {recentNotes.map((note) => (
            <a
              key={note.title}
              href="#"
              className="group flex items-start gap-3 py-2.5 -mx-2 px-2 rounded-lg hover:bg-light-bg-soft dark:hover:bg-dark-bg-secondary transition-colors"
            >
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-light-accent/40 dark:bg-dark-accent/40 flex-shrink-0" />
              <span className="flex-1 text-[15px] text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors line-clamp-2">
                {note.title}
              </span>
              <span className="text-xs text-light-muted dark:text-dark-muted flex-shrink-0 mt-0.5 tabular-nums">
                {note.time}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Online Status */}
      <section className="p-4 rounded-xl bg-light-bg-soft dark:bg-dark-bg-secondary border border-light-border dark:border-dark-border">
        <OnlineIndicator pagePath="/" showPageCount={false} />
        <p className="text-xs text-light-muted dark:text-dark-muted mt-3 leading-relaxed">
          Stay hungry, Stay foolish.
        </p>
      </section>
    </aside>
  );
}
