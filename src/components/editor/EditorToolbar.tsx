"use client";

import type { Editor } from "@tiptap/core";
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  Quote,
  Code,
  ImagePlus,
  Table2,
} from "lucide-react";

interface EditorToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  onClick,
  active,
  label,
  shortcut,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative p-2.5 rounded-lg transition-all ${
        active
          ? "text-light-text dark:text-dark-text bg-light-bg dark:bg-dark-bg shadow-sm"
          : "text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg"
      }`}
      aria-label={label}
    >
      {children}
      <span className="tooltip absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-50">
        {label}
        {shortcut ? ` (${shortcut})` : ""}
      </span>
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  return (
    <aside className="hidden lg:block lg:col-span-1">
      <div className="sticky top-28 flex flex-col gap-2 items-center">
        <div className="flex flex-col gap-1 p-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-soft">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            label="标题 1"
            shortcut="Cmd+Alt+1"
          >
            <Heading1 width={18} height={18} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            label="标题 2"
            shortcut="Cmd+Alt+2"
          >
            <Heading2 width={18} height={18} aria-hidden />
          </ToolbarButton>
          <div className="h-px w-full bg-light-border dark:bg-dark-border my-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            label="粗体"
            shortcut="Cmd+B"
          >
            <Bold width={18} height={18} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            label="斜体"
            shortcut="Cmd+I"
          >
            <Italic width={18} height={18} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            label="引用"
          >
            <Quote width={18} height={18} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            label="代码块"
          >
            <Code width={18} height={18} aria-hidden />
          </ToolbarButton>
        </div>
        <div className="flex flex-col gap-1 p-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-soft mt-4">
          <ToolbarButton
            onClick={() => {}}
            label="插入图片"
          >
            <ImagePlus width={18} height={18} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {}}
            label="插入表格"
          >
            <Table2 width={18} height={18} aria-hidden />
          </ToolbarButton>
        </div>
      </div>
    </aside>
  );
}
