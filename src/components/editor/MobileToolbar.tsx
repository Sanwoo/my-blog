"use client";

import type { Editor } from "@tiptap/core";
import { Heading1, Bold, Italic, Image, MoreHorizontal } from "lucide-react";

interface MobileToolbarProps {
  editor: Editor | null;
}

export function MobileToolbar({ editor }: MobileToolbarProps) {
  if (!editor) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-light-card dark:bg-dark-card border-t border-light-border dark:border-dark-border p-2 z-50">
      <div className="flex justify-around items-center overflow-x-auto">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className="p-3 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
          aria-label="标题 1"
        >
          <Heading1 width={20} height={20} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="p-3 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
          aria-label="粗体"
        >
          <Bold width={20} height={20} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="p-3 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
          aria-label="斜体"
        >
          <Italic width={20} height={20} aria-hidden />
        </button>
        <button
          type="button"
          className="p-3 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
          aria-label="插入图片"
        >
          <Image width={20} height={20} aria-hidden />
        </button>
        <button
          type="button"
          className="p-3 text-light-text dark:text-dark-text hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg transition-colors"
          aria-label="更多"
        >
          <MoreHorizontal width={20} height={20} aria-hidden />
        </button>
      </div>
    </div>
  );
}
