"use client";

import { useRef, useState, type ReactNode } from "react";
import { Mark, Node, type Content, type JSONContent, mergeAttributes } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  Minus,
  List,
  ListOrdered,
  MoreHorizontal,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LegacyLink = Mark.create({
  name: "link",
  inclusive: false,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: "_blank",
      },
      rel: {
        default: "noreferrer",
      },
    };
  },

  parseHTML() {
    return [{ tag: "a[href]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes({ target: "_blank", rel: "noreferrer" }, HTMLAttributes), 0];
  },
});

const EditorImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: "",
      },
      title: {
        default: "",
      },
      caption: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes({ loading: "lazy", decoding: "async" }, HTMLAttributes)];
  },
});

function ToolbarButton({
  active,
  disabled,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="size-8 rounded-full"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function ToolbarMenuItem({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      className={active ? "bg-accent text-accent-foreground" : undefined}
      onClick={onClick}
    >
      {children}
    </DropdownMenuItem>
  );
}

export function RichTextEditor({
  initialContent,
  onChange,
}: {
  initialContent: Content;
  onChange: (value: JSONContent) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
        link: false,
      }),
      LegacyLink,
      EditorImage,
      Placeholder.configure({
        placeholder: "开始写作。保持句子简洁，把判断说清楚。",
      }),
    ],
    content: initialContent,
    onCreate({ editor }) {
      onChange(editor.getJSON());
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: "editor-surface",
      },
    },
  });

  if (!editor) {
    return (
      <div className="border-t border-border/60 px-5 py-6 text-sm text-muted-foreground sm:px-7">编辑器初始化中…</div>
    );
  }

  const insertLink = () => {
    const previousHref = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("链接地址", previousHref ?? "https://");

    if (href === null) {
      return;
    }

    const trimmed = href.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange("link").unsetMark("link").run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setMark("link", { href: trimmed }).run();
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);
    setUploading(true);

    try {
      const response = await fetch("/api/editor/media", {
        method: "POST",
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { image?: { url?: string }; error?: string };

      if (!response.ok || !data.image?.url) {
        throw new Error(data.error ?? "图片上传失败。");
      }

      const alt = window.prompt("图片说明", file.name.replace(/\.[^.]+$/, "")) ?? "";
      editor.chain().focus().insertContent({ type: "image", attrs: { src: data.image.url, alt } }).run();
      toast.success("图片已插入。");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "图片上传失败。");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="border-t border-border/60">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void uploadImage(file);
          }
        }}
      />
      <div className="flex items-center gap-2 overflow-x-auto border-b border-border/60 px-3 py-2 sm:px-5">
        <div className="flex shrink-0 items-center gap-1">
          <ToolbarButton label="撤销" onClick={() => editor.chain().focus().undo().run()}>
            <Undo2 width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="重做" onClick={() => editor.chain().focus().redo().run()}>
            <Redo2 width={16} height={16} aria-hidden />
          </ToolbarButton>
        </div>

        <span className="h-5 w-px shrink-0 bg-border/70" aria-hidden />

        <div className="flex shrink-0 items-center gap-1">
          <ToolbarButton
            label="二级标题"
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="三级标题"
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="粗体"
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="斜体"
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label="链接" active={editor.isActive("link")} onClick={insertLink}>
            <Link2 width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="引用"
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton
            label="无序列表"
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List width={16} height={16} aria-hidden />
          </ToolbarButton>
          <ToolbarButton label={uploading ? "上传中" : "图片"} disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <ImageIcon width={16} height={16} aria-hidden />
          </ToolbarButton>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-transparent bg-transparent text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50"
              aria-label="更多格式"
              title="更多格式"
            >
              <MoreHorizontal width={16} height={16} aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <ToolbarMenuItem active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <ListOrdered width={16} height={16} aria-hidden />
                有序列表
              </ToolbarMenuItem>
              <ToolbarMenuItem active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
                <Strikethrough width={16} height={16} aria-hidden />
                删除线
              </ToolbarMenuItem>
              <ToolbarMenuItem active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
                <Code width={16} height={16} aria-hidden />
                行内代码
              </ToolbarMenuItem>
              <ToolbarMenuItem active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                <Code width={16} height={16} aria-hidden />
                代码块
              </ToolbarMenuItem>
              <DropdownMenuSeparator />
              <ToolbarMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
                <Minus width={16} height={16} aria-hidden />
                分割线
              </ToolbarMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
