"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EditorNav } from "@/components/editor/EditorNav";
import { EditorToolbar } from "@/components/editor/EditorToolbar";
import { EditorForm, useEditorForm } from "@/components/editor/EditorForm";
import { EditorSettings } from "@/components/editor/EditorSettings";
import { MobileToolbar } from "@/components/editor/MobileToolbar";

const DRAFT_KEY = "echoes-editor-draft";
const DEBOUNCE_MS = 2000;

function formatTime(date: Date) {
  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function EditorPage() {
  const editor = useEditorForm();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [category, setCategory] = useState("UI Design");
  const [slug, setSlug] = useState("apple-minimalist-design-philosophy");
  const [seoDescription, setSeoDescription] = useState(
    "在当今的数字产品设计中，Apple 无疑设立了极简主义的标杆。本文深入探讨其设计语言中的留白艺术。"
  );
  const [publishAt, setPublishAt] = useState("");
  const [lastSaved, setLastSaved] = useState("10:23");
  const [publishStatus, setPublishStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [publishMessage, setPublishMessage] = useState("");
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePublish = useCallback(async () => {
    if (!editor) return;
    const token = window.prompt("请输入发布密钥");
    if (token === null) return;
    const trimmed = token.trim();
    if (!trimmed) {
      setPublishMessage("未输入密钥");
      setPublishStatus("error");
      return;
    }
    const payload = {
      title,
      excerpt,
      tags,
      category,
      slug: slug.trim() || "untitled",
      seoDescription,
      publishAt,
      content: editor.getHTML(),
    };
    setPublishStatus("loading");
    setPublishMessage("");
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trimmed}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPublishStatus("success");
        setPublishMessage("发布成功");
        window.location.href = `/posts/${payload.slug}`;
        return;
      }
      setPublishStatus("error");
      if (res.status === 401) {
        setPublishMessage("密钥错误");
      } else {
        setPublishMessage((data.error as string) || `发布失败 (${res.status})`);
      }
    } catch (e) {
      setPublishStatus("error");
      setPublishMessage("网络错误，请重试");
      console.error("[publish]", e);
    }
  }, [editor, title, excerpt, tags, category, slug, seoDescription, publishAt]);

  const saveDraft = useCallback(() => {
    if (!editor) return;
    const payload = {
      title,
      excerpt,
      tags,
      category,
      slug,
      seoDescription,
      publishAt,
      content: editor.getHTML(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      setLastSaved(formatTime(new Date()));
    } catch {
      // ignore
    }
  }, [editor, title, excerpt, tags, category, slug, seoDescription, publishAt]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const data = JSON.parse(raw) as {
          title?: string;
          excerpt?: string;
          tags?: string[];
          category?: string;
          slug?: string;
          seoDescription?: string;
          publishAt?: string;
          content?: string;
        };
        if (data.title != null) setTitle(data.title);
        if (data.excerpt != null) setExcerpt(data.excerpt);
        if (Array.isArray(data.tags)) setTags(data.tags);
        if (data.category != null) setCategory(data.category);
        if (data.slug != null) setSlug(data.slug);
        if (data.seoDescription != null) setSeoDescription(data.seoDescription);
        if (data.publishAt != null) setPublishAt(data.publishAt);
        if (editor && data.content != null) {
          editor.commands.setContent(data.content, { emitUpdate: false });
        }
      }
    } catch {
      // ignore
    }
  }, [editor]);

  useEffect(() => {
    const schedule = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        saveDraft();
      }, DEBOUNCE_MS);
    };
    schedule();
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [saveDraft, title, excerpt, tags, category, slug, seoDescription, publishAt]);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveTimeoutRef.current = null;
        saveDraft();
      }, DEBOUNCE_MS);
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
    };
  }, [editor, saveDraft]);

  const previewSlug = slug || "apple-design-philosophy";

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <EditorNav
        lastSaved={lastSaved}
        previewHref={`/posts/${previewSlug}`}
        onPublish={handlePublish}
        publishStatus={publishStatus}
        publishMessage={publishMessage}
      />
      <div className="pt-24 pb-12 px-4 max-w-[1600px] mx-auto w-full flex-grow grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 lg:pb-12">
        <EditorToolbar editor={editor} />
        <EditorForm
          editor={editor}
          title={title}
          onTitleChange={setTitle}
          excerpt={excerpt}
          onExcerptChange={setExcerpt}
          tags={tags}
          onTagsChange={setTags}
        />
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
      <MobileToolbar editor={editor} />
    </div>
  );
}
