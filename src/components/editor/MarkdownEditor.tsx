"use client";

import { useRef, useCallback, useEffect } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(400, el.scrollHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd } = textarea;

    if (e.key === "Tab") {
      e.preventDefault();
      const before = value.slice(0, selectionStart);
      const after = value.slice(selectionEnd);
      const newValue = `${before}  ${after}`;
      onChange(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      });
      return;
    }

    if (e.key === "Enter") {
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
      const currentLine = value.slice(lineStart, selectionStart);

      const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/);
      if (listMatch) {
        const lineContent = currentLine.slice(listMatch[0].length).trim();
        if (!lineContent) {
          e.preventDefault();
          const before = value.slice(0, lineStart);
          const after = value.slice(selectionEnd);
          onChange(`${before}\n${after}`);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart + 1;
          });
          return;
        }

        e.preventDefault();
        const indent = listMatch[1];
        const marker = listMatch[2];
        const nextMarker = /^\d+$/.test(marker.replace(".", ""))
          ? `${parseInt(marker) + 1}.`
          : marker;
        const insertion = `\n${indent}${nextMarker} `;
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        onChange(`${before}${insertion}${after}`);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + insertion.length;
        });
        return;
      }
    }

    if (e.metaKey || e.ctrlKey) {
      const wrapSelection = (prefix: string, suffix: string = prefix) => {
        e.preventDefault();
        const selected = value.slice(selectionStart, selectionEnd);
        const before = value.slice(0, selectionStart);
        const after = value.slice(selectionEnd);
        const wrapped = `${prefix}${selected}${suffix}`;
        onChange(`${before}${wrapped}${after}`);
        requestAnimationFrame(() => {
          textarea.selectionStart = selectionStart + prefix.length;
          textarea.selectionEnd = selectionEnd + prefix.length;
        });
      };

      switch (e.key) {
        case "b":
          wrapSelection("**");
          break;
        case "i":
          wrapSelection("*");
          break;
        case "k":
          wrapSelection("[", "](url)");
          break;
        case "`":
          wrapSelection("`");
          break;
      }
    }
  };

  return (
    <div className="min-h-[400px]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-0 focus:ring-0 focus:outline-none p-0 font-mono text-[15px] leading-relaxed text-light-text dark:text-dark-text placeholder:text-light-muted/50 dark:placeholder:text-dark-muted/50 resize-none"
        placeholder="开始用 Markdown 撰写你的故事..."
        aria-label="Markdown 编辑器"
        spellCheck={false}
      />
    </div>
  );
}
