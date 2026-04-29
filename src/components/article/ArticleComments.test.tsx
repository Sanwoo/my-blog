import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleComments } from "@/components/article/ArticleComments";
import type { CommentNode } from "@/lib/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/posts/quiet-note",
}));

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    loading: false,
    startSignIn: vi.fn(),
    viewer: null,
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
  },
}));

const authorComment: CommentNode = {
  id: "comment-1",
  parentId: null,
  body: "作者补充一条背景。",
  createdAt: "2026-04-28T08:00:00.000Z",
  author: {
    id: "author-1",
    displayName: "Sanwoo",
    handle: "@sanwoo",
    avatarUrl: null,
    role: "author",
  },
  replyTo: null,
  likes: 0,
  likedByViewer: false,
  replies: [],
};

const defaultProps = {
  slug: "quiet-note",
  postTitle: "Quiet Note",
  postExcerpt: "A small signal.",
  initialReactionSummary: { count: 0, reactedByViewer: false },
  initialCount: 0,
  initialViewerKey: "anon",
};

describe("ArticleComments", () => {
  it("labels author comments in Chinese", () => {
    render(<ArticleComments {...defaultProps} initialComments={[authorComment]} initialCount={1} />);

    expect(screen.getByText("作者")).toBeInTheDocument();
    expect(screen.getByText("Sanwoo")).toBeInTheDocument();
    expect(screen.queryByText("@sanwoo", { exact: false })).not.toBeInTheDocument();
    expect(screen.getByText("作者补充一条背景。")).toBeInTheDocument();
  });

  it("renders a Chinese empty state", () => {
    render(<ArticleComments {...defaultProps} initialComments={[]} />);

    expect(screen.getByText("暂无来信")).toBeInTheDocument();
    expect(screen.queryByText("No comments yet")).not.toBeInTheDocument();
  });
});
