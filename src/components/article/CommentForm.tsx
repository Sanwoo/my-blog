"use client";

import { Bold, Italic, Code } from "lucide-react";

export function CommentForm() {
  return (
    <div className="mb-12 bg-white dark:bg-white/5 p-6 rounded-2xl border border-light-border dark:border-dark-border shadow-sm">
      <textarea
        className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 text-light-text dark:text-dark-text placeholder:text-light-muted/50 min-h-[100px] resize-none"
        placeholder="写下你的想法..."
        aria-label="评论内容"
      />
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-light-border/50 dark:border-dark-border/50">
        <div className="flex gap-2 text-light-muted dark:text-dark-muted">
          <button
            type="button"
            className="hover:text-light-accent dark:hover:text-dark-accent transition-colors p-1"
            aria-label="粗体"
          >
            <Bold width={18} height={18} aria-hidden />
          </button>
          <button
            type="button"
            className="hover:text-light-accent dark:hover:text-dark-accent transition-colors p-1"
            aria-label="斜体"
          >
            <Italic width={18} height={18} aria-hidden />
          </button>
          <button
            type="button"
            className="hover:text-light-accent dark:hover:text-dark-accent transition-colors p-1"
            aria-label="代码"
          >
            <Code width={18} height={18} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="px-6 py-2 bg-light-accent dark:bg-dark-accent text-white dark:text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          发布评论
        </button>
      </div>
    </div>
  );
}
