export interface RelatedPost {
  title: string;
  excerpt: string;
  image: string;
  href: string;
}

export const placeholderRelatedPosts: RelatedPost[] = [
  {
    title: "深色模式设计的最佳实践",
    excerpt:
      "探讨色彩对比度、蓝光减少以及如何构建舒适的夜间阅读体验...",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "未来的交互：空间计算",
    excerpt: "随着 Vision Pro 的发布，平面设计如何向三维空间演进？",
    image:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop",
    href: "#",
  },
  {
    title: "为什么我们需要设计系统",
    excerpt: "从一致性到效率，设计系统如何改变团队协作模式。",
    image:
      "https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=2070&auto=format&fit=crop",
    href: "#",
  },
];
