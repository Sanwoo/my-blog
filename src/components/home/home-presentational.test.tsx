import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeTimelineSection } from "@/components/home/HomeTimelineSection";
import { RecentCommentsSection } from "@/components/home/RecentCommentsSection";
import { TimelineBuckets } from "@/components/timeline/TimelineBuckets";
import type { HomeTimelinePreview, LatestCommentPreview, TimelineSeasonBucket } from "@/lib/types";

const bucket = {
  id: "season-2026-spring",
  season: "2026 Spring",
  rangeLabel: "4月",
  itemCount: 2,
  remainingCount: 1,
  items: [
    {
      id: "post-1",
      slug: "first-post",
      title: "First Post",
      excerpt: "Excerpt",
      formattedDate: "4月27日",
      readTime: "3 分钟阅读",
      commentCount: 2,
      reactionCount: 5,
    },
  ],
} satisfies TimelineSeasonBucket;

const comment = {
  commentId: "comment-1",
  bodySnippet: "写得真好。",
  createdAt: "2026-04-27T00:00:00.000Z",
  formattedDateTime: "4/27 08:00",
  author: {
    id: "reader-1",
    displayName: "Reader",
    handle: "@reader",
    avatarUrl: null,
    role: "reader",
  },
  postSlug: "first-post",
  postTitle: "First Post",
} satisfies LatestCommentPreview;

describe("home and timeline presentational components", () => {
  it("renders empty and populated home timeline states", () => {
    const emptyPreview = { total: 0, buckets: [] } satisfies HomeTimelinePreview;
    const { rerender } = render(<HomeTimelineSection preview={emptyPreview} />);

    expect(screen.getByText("当前还没有可展示的时间线内容。")).toBeInTheDocument();

    rerender(<HomeTimelineSection preview={{ total: 2, buckets: [bucket] }} />);
    expect(screen.getByText("2 篇已发布文章")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "查看完整时间线" })).toHaveAttribute("href", "/timeline");
  });

  it("renders timeline buckets with preview links", () => {
    render(<TimelineBuckets buckets={[bucket]} mode="preview" />);

    expect(screen.getByRole("heading", { level: 2, name: "2026 Spring" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "First Post" })).toHaveAttribute("href", "/posts/first-post");
    expect(screen.getByRole("link", { name: /还剩 1 篇/ })).toHaveAttribute("href", "/timeline#season-2026-spring");
  });

  it("renders recent comments and the empty state", () => {
    const { rerender } = render(<RecentCommentsSection comments={[]} />);
    expect(screen.getByText("暂无来信。")).toBeInTheDocument();

    rerender(<RecentCommentsSection comments={[comment]} />);
    expect(screen.getByText("写得真好。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /First Post/ })).toHaveAttribute("href", "/posts/first-post#comment-comment-1");
  });
});
