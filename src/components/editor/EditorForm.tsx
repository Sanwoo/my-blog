"use client";

import { useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/core";
import { Hash, X } from "lucide-react";

const defaultContent = `
<p>在当今的数字产品设计中，Apple 无疑设立了极简主义的标杆。但这不仅仅是关于 "少即是多" 的陈词滥调，而是关于如何通过精确的减法来放大核心价值。</p>
<h2>留白的艺术</h2>
<p>留白（White Space）不是空的，它是活跃的设计元素。在 Apple 的界面中，留白被用来引导视线，创造视觉呼吸感。它告诉用户：<strong>这里的内容值得你停下来思考</strong>。</p>
<blockquote>
<p>"Design is not just what it looks like and feels like. Design is how it works."</p>
<p>— Steve Jobs</p>
</blockquote>
<p>当我们谈论极简设计时，我们实际上是在谈论认知的减负。每一个不需要的元素都是对用户注意力的掠夺。</p>
<h3>代码实现示例</h3>
<p>在实现这种设计风格时，CSS 的 Flexbox 和 Grid 是我们最好的朋友：</p>
<pre><code>.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 24px;
  padding: 48px;
}</code></pre>
<p>这就是为什么我们需要构建一个强大的设计系统...</p>
`;

export interface EditorFormProps {
  editor: Editor | null;
  title: string;
  onTitleChange: (v: string) => void;
  excerpt: string;
  onExcerptChange: (v: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function EditorForm({
  editor,
  title,
  onTitleChange,
  excerpt,
  onExcerptChange,
  tags,
  onTagsChange,
}: EditorFormProps) {
  const excerptRef = useRef<HTMLTextAreaElement>(null);

  const handleExcerptInput = useCallback(() => {
    const el = excerptRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) onTagsChange([...tags, t]);
  };

  const removeTag = (i: number) => {
    onTagsChange(tags.filter((_, idx) => idx !== i));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const input = e.currentTarget;
      addTag(input.value);
      input.value = "";
    }
  };

  return (
    <main className="lg:col-span-8 space-y-8">
      <div className="space-y-6">
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="文章标题"
          className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 font-serif text-4xl md:text-5xl text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted"
          aria-label="文章标题"
        />
        <textarea
          ref={excerptRef}
          value={excerpt}
          onChange={(e) => onExcerptChange(e.target.value)}
          onInput={handleExcerptInput}
          placeholder="简短描述，将显示在列表与社交分享..."
          rows={2}
          className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 text-lg text-light-muted dark:text-dark-muted placeholder:text-light-muted/70 dark:placeholder:text-dark-muted/70 resize-none overflow-hidden"
          aria-label="简短描述"
        />
        <div className="flex flex-wrap items-center gap-2">
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
                aria-label={`移除标签 ${tag}`}
              >
                <X width={12} height={12} aria-hidden />
              </button>
            </span>
          ))}
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded border border-dashed border-light-border dark:border-dark-border text-light-muted dark:text-dark-muted text-sm hover:border-light-accent dark:hover:border-dark-accent hover:text-light-accent dark:hover:text-dark-accent transition-colors min-w-[140px]">
            <Hash width={14} height={14} aria-hidden />
            <input
              type="text"
              placeholder="Add tags..."
              onKeyDown={handleTagKeyDown}
              onBlur={(e) => {
                if (e.target.value.trim()) addTag(e.target.value);
                e.target.value = "";
              }}
              className="bg-transparent border-0 focus:ring-0 focus:outline-none flex-1 min-w-0 text-light-text dark:text-dark-text placeholder:text-light-muted dark:placeholder:text-dark-muted"
              aria-label="添加标签"
            />
          </div>
        </div>
      </div>

      <div
        className={`editor-content prose prose-lg dark:prose-invert max-w-none font-sans text-light-text dark:text-dark-text leading-relaxed min-h-[320px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[280px] [&_.ProseMirror_p]:mb-4 [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h3]:font-serif [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-light-accent [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_pre]:bg-light-bg-secondary [&_.ProseMirror_pre]:dark:bg-dark-card [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:rounded-xl [&_.ProseMirror_pre]:border [&_.ProseMirror_code]:text-light-accent [&_.ProseMirror_code]:dark:text-dark-accent [&_.ProseMirror_code]:text-sm`}
      >
        <EditorContent editor={editor} />
      </div>
    </main>
  );
}

export function useEditorForm() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "开始撰写你的故事...",
      }),
    ],
    content: defaultContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert max-w-none min-h-[280px] focus:outline-none",
      },
    },
  });
  return editor;
}
