import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArticleBody } from "@/components/article/ArticleBody";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { RelatedArticles } from "@/components/article/RelatedArticles";
import type { PostCard, PostDetail } from "@/lib/types";

const post = {
  title: "Echoes",
  excerpt: "A quiet note.",
  formattedDate: "2026年4月27日",
  readTime: "3 分钟阅读",
  category: { id: "cat-1", name: "随笔", slug: "notes" },
  tags: [
    { id: "tag-1", name: "生活", slug: "life" },
    { id: "tag-2", name: "代码", slug: "code" },
  ],
} as PostDetail;

const relatedPost = {
  slug: "next-note",
  title: "Next Note",
  excerpt: "Read more.",
  formattedDate: "2026年4月28日",
  readTime: "2 分钟阅读",
  category: { id: "cat-1", name: "随笔", slug: "notes" },
} as PostCard;

describe("article presentational components", () => {
  it("renders stored article html into the article body", () => {
    render(<ArticleBody content="<h2>Hello</h2><p>World</p>" />);

    const article = screen.getByRole("article");
    expect(article).toHaveAttribute("data-reading-progress");
    expect(article.innerHTML).toContain("<h2>Hello</h2>");
  });

  it("renders article metadata, tags, and title", () => {
    render(<ArticleHeader post={post} />);

    expect(screen.getByRole("heading", { level: 1, name: "Echoes" })).toBeInTheDocument();
    expect(screen.getByText("随笔")).toBeInTheDocument();
    expect(screen.getByText("#生活")).toBeInTheDocument();
    expect(screen.getByText("3 分钟阅读")).toBeInTheDocument();
  });

  it("renders related article links and hides empty sections", () => {
    const { rerender, container } = render(<RelatedArticles posts={[]} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<RelatedArticles posts={[relatedPost]} />);
    expect(screen.getByRole("heading", { level: 2, name: "继续往下读" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Next Note/ })).toHaveAttribute("href", "/posts/next-note");
  });
});
