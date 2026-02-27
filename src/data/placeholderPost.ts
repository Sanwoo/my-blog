export interface TOCItem {
  id: string;
  label: string;
}

export interface PostMeta {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  author: string;
  authorHandle: string;
  avatar: string;
  date: string;
  readTime: string;
  views: string;
}

export const tocItems: TOCItem[] = [
  { id: "section-1", label: "1. 留白的艺术 (Whitespace)" },
  { id: "section-1-1", label: "1.1 视觉呼吸感" },
  { id: "section-1-2", label: "1.2 引导注意力" },
  { id: "section-2", label: "2. 层级与排版" },
  { id: "section-3", label: "3. 总结" },
];

export const placeholderPostMeta: PostMeta = {
  slug: "apple-design-philosophy",
  title: "Apple 设计哲学中的\n极简主义美学",
  category: "UI Design",
  categoryLabel: "Design Philosophy",
  author: "Alex.Design",
  authorHandle: "@alex_ui_lab",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  date: "2024年2月14日",
  readTime: "8 分钟阅读",
  views: "12,453 阅读",
};

export function getPostBySlug(slug: string): PostMeta | null {
  if (slug === placeholderPostMeta.slug) return placeholderPostMeta;
  return null;
}

export const placeholderSlugs = [placeholderPostMeta.slug];
