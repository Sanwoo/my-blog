"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type PublishStatus = "idle" | "loading" | "success" | "error";

interface EditorNavProps {
  lastSaved?: string;
  previewHref?: string;
  onPublish?: () => void;
  publishStatus?: PublishStatus;
  publishMessage?: string;
}

export function EditorNav({
  lastSaved = "10:23",
  previewHref = "/posts/apple-design-philosophy",
  onPublish,
  publishStatus = "idle",
  publishMessage,
}: EditorNavProps) {
  const isPublishing = publishStatus === "loading";

  return (
    <nav className="fixed w-full top-0 z-50 glass-nav transition-all duration-300 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="p-2 -ml-2 text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="返回"
        >
          <ArrowLeft width={20} height={20} aria-hidden />
        </Link>
        <div className="h-6 w-px bg-light-border dark:bg-dark-border" />
        <span className="text-sm font-medium text-light-muted dark:text-dark-muted flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-500" aria-hidden />
          草稿 - 上次保存于 {lastSaved}
        </span>
        {publishMessage && publishStatus === "error" && (
          <span className="text-sm text-red-600 dark:text-red-400" role="alert">
            {publishMessage}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={previewHref}
          className="px-4 py-2 text-sm font-medium text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
        >
          预览
        </Link>
        <button
          type="button"
          onClick={onPublish}
          disabled={isPublishing}
          className="px-5 py-2 text-sm font-medium bg-light-text text-white dark:bg-dark-text dark:text-black rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-black/10 dark:shadow-white/10 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPublishing ? "发布中…" : "发布文章"}
        </button>
        <ThemeToggle />
      </div>
    </nav>
  );
}
