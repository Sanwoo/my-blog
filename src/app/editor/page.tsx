"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { MarkdownRenderer } from "@/components/article/MarkdownRenderer";
import { EditorSettings } from "@/components/editor/EditorSettings";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ArrowLeft, Eye, EyeOff, Save, Send, Github } from "lucide-react";
import Link from "next/link";

const DRAFT_KEY = "echoes-editor-draft-md";
const DEBOUNCE_MS = 2000;

const defaultContent = `## 留白的艺术

留白（White Space）不是空的，它是活跃的设计元素。在 Apple 的界面中，留白被用来引导视线，创造视觉呼吸感。它告诉用户：**这里的内容值得你停下来思考**。

> "Design is not just what it looks like and feels like. Design is how it works."
>
> — Steve Jobs

当我们谈论极简设计时，我们实际上是在谈论认知的减负。每一个不需要的元素都是对用户注意力的掠夺。

### 代码实现示例

在实现这种设计风格时，CSS 的 Flexbox 和 Grid 是我们最好的朋友：

\`\`\`css
.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  padding: 48px;
}
\`\`\`

这就是为什么我们需要构建一个强大的设计系统...
`;

function formatTime(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function EditorPage() {
  const { user, loading, isAdmin, signInWithGitHub } = useAuth();
  const [content, setContent] = useState(defaultContent);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("UI Design");
  const [slug, setSlug] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePublish = useCallback(async () => {
    const payload = {
      title,
      excerpt,
      tags,
      category,
      slug: slug.trim() || title.toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, "-").slice(0, 60) || "untitled",
      seoDescription,
      publishAt,
      content,
      contentFormat: "markdown",
    };

    setPublishStatus("loading");
    setPublishMessage("");

    try {
      const publishSecret = process.env.NEXT_PUBLIC_PUBLISH_SECRET || window.prompt("请输入发布密钥");
      if (!publishSecret) {
        setPublishStatus("idle");
        return;
      }

      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publishSecret.trim()}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPublishStatus("success");
        setPublishMessage("发布成功");
        localStorage.removeItem(DRAFT_KEY);
        window.location.href = `/posts/${payload.slug}`;
        return;
      }
      setPublishStatus("error");
      setPublishMessage(res.status === 401 ? "密钥错误" : (data.error as string) || `发布失败 (${res.status})`);
    } catch {
      setPublishStatus("error");
      setPublishMessage("网络错误，请重试");
    }
  }, [title, excerpt, tags, category, slug, seoDescription, publishAt, content]);

  const saveDraft = useCallback(() => {
    const payload = { title, excerpt, tags, category, slug, seoDescription, publishAt, content };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setLastSaved(formatTime(new Date()));
    } catch { /* ignore */ }
  }, [title, excerpt, tags, category, slug, seoDescription, publishAt, content]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.title != null) setTitle(data.title);
        if (data.excerpt != null) setExcerpt(data.excerpt);
        if (Array.isArray(data.tags)) setTags(data.tags);
        if (data.category != null) setCategory(data.category);
        if (data.slug != null) setSlug(data.slug);
        if (data.seoDescription != null) setSeoDescription(data.seoDescription);
        if (data.publishAt != null) setPublishAt(data.publishAt);
        if (data.content != null) setContent(data.content);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const schedule = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        saveDraft();
      }, DEBOUNCE_MS);
    };
    schedule();
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [saveDraft]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-bg dark:bg-dark-bg">
        <div className="text-light-muted dark:text-dark-muted">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg gap-6">
        <h1 className="font-serif text-3xl text-light-text dark:text-dark-text">Echoes 编辑器</h1>
        <p className="text-light-muted dark:text-dark-muted">请先登录以使用编辑器</p>
        <button
          type="button"
          onClick={signInWithGitHub}
          className="flex items-center gap-2 px-6 py-3 bg-[#24292e] text-white rounded-full font-medium hover:bg-[#1a1e22] transition-colors"
        >
          <Github width={20} height={20} />
          GitHub 登录
        </button>
        <Link href="/" className="text-sm text-light-accent dark:text-dark-accent hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      {/* Editor Nav */}
      <nav className="fixed w-full top-0 z-50 glass-nav">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft width={18} height={18} />
            </Link>
            <div className="flex items-center gap-2 text-sm text-light-muted dark:text-dark-muted">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              草稿
              {lastSaved && <span>· 上次保存于 {lastSaved}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              {showPreview ? <EyeOff width={16} height={16} /> : <Eye width={16} height={16} />}
              {showPreview ? "编辑" : "预览"}
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text transition-colors"
            >
              <Save width={16} height={16} />
              保存
            </button>
            <ThemeToggle />
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishStatus === "loading"}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-light-accent dark:bg-dark-accent text-white dark:text-black rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send width={14} height={14} />
              {publishStatus === "loading" ? "发布中..." : "发布文章"}
            </button>
          </div>
        </div>
        {publishMessage && (
          <div className={`text-center text-xs py-1 ${publishStatus === "error" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-600"}`}>
            {publishMessage}
          </div>
        )}
      </nav>

      {/* Editor Content */}
      <div className="pt-20 pb-12 px-4 max-w-[1600px] mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8">
        <main className="lg:col-span-9 space-y-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 font-serif text-4xl md:text-5xl text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted"
            aria-label="文章标题"
          />
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="简短描述，将显示在列表与社交分享..."
            rows={2}
            className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 text-lg text-light-muted dark:text-dark-muted placeholder:text-light-muted/70 resize-none overflow-hidden"
            aria-label="简短描述"
          />
          <div className="h-px bg-light-border dark:bg-dark-border" />

          {showPreview ? (
            <div className="min-h-[400px]">
              <div className="text-xs text-light-muted dark:text-dark-muted mb-4 uppercase tracking-wider">预览模式</div>
              <MarkdownRenderer content={content} />
            </div>
          ) : (
            <MarkdownEditor value={content} onChange={setContent} />
          )}
        </main>

        <EditorSettings
          status="草稿"
          visibility="公开"
          publishAt={publishAt}
          onPublishAtChange={setPublishAt}
          category={category}
          onCategoryChange={setCategory}
          tags={tags}
          onTagsChange={setTags}
          slug={slug}
          onSlugChange={setSlug}
          seoDescription={seoDescription}
          onSeoDescriptionChange={setSeoDescription}
        />
      </div>
    </div>
  );
}
