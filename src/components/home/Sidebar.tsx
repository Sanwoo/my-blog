"use client";

import { OnlineIndicator } from "@/components/shared/OnlineIndicator";

const recentNotes = [
  { title: "极简生活：舍弃物品的艺术", time: "10 天前" },
  { title: "AI 时代的工作与生活", time: "1 个月前" },
  { title: "2025 · 仍在路上，半径之外", time: "2 个月前" },
];

export function Sidebar() {
  return (
    <aside className="space-y-12">
      <section>
        <h2 className="text-lg font-medium text-light-text dark:text-dark-text mb-2">
          Recent Notes
        </h2>
        <div className="stagger">
          {recentNotes.map((note) => (
            <a
              key={note.title}
              href="#"
              className="group flex items-baseline gap-3 py-3 transition-colors duration-200"
            >
              <span className="mt-[7px] w-[5px] h-[5px] rounded-full bg-light-accent/30 dark:bg-dark-accent/30 group-hover:bg-light-accent dark:group-hover:bg-dark-accent flex-shrink-0 transition-colors duration-200" />
              <span className="flex-1 text-[15px] leading-relaxed text-light-text-secondary dark:text-dark-text-secondary group-hover:text-light-text dark:group-hover:text-dark-text transition-colors duration-200">
                {note.title}
              </span>
              <span className="text-[13px] text-light-muted dark:text-dark-muted flex-shrink-0 tabular-nums tracking-tight">
                {note.time}
              </span>
            </a>
          ))}
        </div>
      </section>

      <section className="p-5 rounded-xl bg-light-bg-soft dark:bg-dark-bg-soft border border-light-border/60 dark:border-dark-border/60">
        <OnlineIndicator pagePath="/" showPageCount={false} />
        <p className="text-[13px] text-light-muted dark:text-dark-muted mt-3 leading-relaxed italic">
          Stay hungry, Stay foolish.
        </p>
      </section>
    </aside>
  );
}
