"use client";

import { Send, FolderTree, Search, X } from "lucide-react";

const CATEGORIES = ["UI Design", "Development", "Productivity"];

export interface EditorSettingsProps {
  status: string;
  visibility: string;
  publishAt: string;
  onPublishAtChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  slug: string;
  onSlugChange: (v: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (v: string) => void;
}

const SEO_DESC_MAX = 160;

export function EditorSettings({
  status,
  visibility,
  publishAt,
  onPublishAtChange,
  category,
  onCategoryChange,
  tags,
  onTagsChange,
  slug,
  onSlugChange,
  seoDescription,
  onSeoDescriptionChange,
}: EditorSettingsProps) {
  const removeTag = (i: number) => {
    onTagsChange(tags.filter((_, idx) => idx !== i));
  };

  const addTagFromInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      const t = input.value.trim().toLowerCase();
      if (t && !tags.includes(t)) onTagsChange([...tags, t]);
      input.value = "";
    }
  };

  return (
    <aside className="lg:col-span-3 space-y-6">
      <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-soft p-5">
        <h3 className="font-medium text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
          <Send width={18} height={18} className="text-light-accent dark:text-dark-accent" aria-hidden />
          发布设置
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-light-muted dark:text-dark-muted">状态</span>
            <span className="text-sm font-medium text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
              {status}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-light-muted dark:text-dark-muted">可见性</span>
            <span className="text-sm text-light-text dark:text-dark-text">{visibility}</span>
          </div>
          <hr className="border-light-border dark:border-dark-border" />
          <div className="space-y-2">
            <label className="text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
              发布时间
            </label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => onPublishAtChange(e.target.value)}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text dark:text-dark-text focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              aria-label="发布时间"
            />
          </div>
        </div>
      </div>

      <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-soft p-5">
        <h3 className="font-medium text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
          <FolderTree width={18} height={18} className="text-light-accent dark:text-dark-accent" aria-hidden />
          分类与标签
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
              分类
            </label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text dark:text-dark-text focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              aria-label="分类"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
              标签
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, i) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded text-xs text-light-muted dark:text-dark-muted flex items-center gap-1"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="hover:text-red-500 transition-colors p-0.5"
                    aria-label={`移除 ${tag}`}
                  >
                    <X width={12} height={12} aria-hidden />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="输入标签按回车..."
              onKeyDown={addTagFromInput}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              aria-label="添加标签"
            />
          </div>
        </div>
      </div>

      <div className="bg-light-card dark:bg-dark-card rounded-xl border border-light-border dark:border-dark-border shadow-soft p-5">
        <h3 className="font-medium text-light-text dark:text-dark-text mb-4 flex items-center gap-2">
          <Search width={18} height={18} className="text-light-accent dark:text-dark-accent" aria-hidden />
          SEO 设置
        </h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
              URL Slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => onSlugChange(e.target.value)}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text dark:text-dark-text focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors"
              aria-label="URL Slug"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-light-muted dark:text-dark-muted uppercase tracking-wider">
              搜索描述
            </label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => onSeoDescriptionChange(e.target.value)}
              className="w-full bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg px-3 py-2 text-sm text-light-text dark:text-dark-text focus:outline-none focus:border-light-accent dark:focus:border-dark-accent transition-colors resize-none"
              aria-label="搜索描述"
            />
            <div className="flex justify-end">
              <span className="text-xs text-light-muted dark:text-dark-muted">
                {seoDescription.length}/{SEO_DESC_MAX}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
