import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ensureProfile: vi.fn(),
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  ensureProfile: mocks.ensureProfile,
}));

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => mocks.supabase,
}));

import { createCommentForSlug, toggleCommentLike, togglePostReaction } from "@/lib/community";
import type { ViewerSession } from "@/lib/types";

function queryResult<T>(result: { data: T; error: unknown }) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
  };

  return query;
}

const viewer = {
  id: "viewer-1",
  email: "reader@example.com",
  isAuthor: false,
  displayName: "Reader",
  avatarUrl: null,
  handle: "@reader",
} satisfies ViewerSession;

const publicPost = {
  id: "post-1",
  status: "published",
  published_at: "2026-04-27T00:00:00.000Z",
};

describe("community mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ensureProfile.mockResolvedValue(undefined);
  });

  it("creates a top-level comment through the interaction notification RPC", async () => {
    const postQuery = queryResult({ data: publicPost, error: null });
    mocks.supabase.from.mockReturnValue(postQuery);
    mocks.supabase.rpc.mockResolvedValue({
      data: [{
        id: "comment-1",
        author_id: viewer.id,
        parent_id: null,
        body: "hello",
        created_at: "2026-04-27T08:00:00.000Z",
        like_count: 0,
      }],
      error: null,
    });

    const comment = await createCommentForSlug("post-slug", "  hello  ", viewer);

    expect(mocks.ensureProfile).toHaveBeenCalledWith(viewer);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith("create_comment_with_interaction_notification", {
      p_post_id: "post-1",
      p_actor_id: viewer.id,
      p_parent_id: null,
      p_body: "hello",
    });
    expect(comment).toMatchObject({
      id: "comment-1",
      parentId: null,
      body: "hello",
      likes: 0,
      likedByViewer: false,
      replies: [],
    });
  });

  it("keeps reply target data while creating replies through RPC", async () => {
    const postQuery = queryResult({ data: publicPost, error: null });
    const parentQuery = queryResult({
      data: {
        id: "parent-1",
        author_id: "author-1",
        parent_id: null,
        post_id: "post-1",
        status: "published",
      },
      error: null,
    });
    const profileQuery = queryResult({
      data: {
        id: "author-1",
        display_name: "Author",
        handle: "@author",
        avatar_url: null,
        role: "author",
      },
      error: null,
    });

    mocks.supabase.from.mockImplementation((table: string) => {
      if (table === "posts") return postQuery;
      if (table === "comments") return parentQuery;
      if (table === "profiles") return profileQuery;
      throw new Error(`Unexpected table ${table}`);
    });
    mocks.supabase.rpc.mockResolvedValue({
      data: [{
        id: "reply-1",
        author_id: viewer.id,
        parent_id: "parent-1",
        body: "reply",
        created_at: "2026-04-27T08:00:00.000Z",
        like_count: 0,
      }],
      error: null,
    });

    const comment = await createCommentForSlug("post-slug", "reply", viewer, "parent-1");

    expect(mocks.supabase.rpc).toHaveBeenCalledWith("create_comment_with_interaction_notification", {
      p_post_id: "post-1",
      p_actor_id: viewer.id,
      p_parent_id: "parent-1",
      p_body: "reply",
    });
    expect(comment.replyTo).toEqual({
      id: "parent-1",
      author: {
        id: "author-1",
        displayName: "Author",
        handle: "@author",
        avatarUrl: null,
        role: "author",
      },
    });
  });

  it("maps RPC comment errors back to existing public error codes", async () => {
    mocks.supabase.from.mockReturnValue(queryResult({ data: publicPost, error: null }));
    mocks.supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "INVALID_PARENT" },
    });

    await expect(createCommentForSlug("post-slug", "hello", viewer)).rejects.toThrow("INVALID_PARENT");
  });

  it("toggles comment likes through RPC and returns post slugs", async () => {
    mocks.supabase.rpc.mockResolvedValue({
      data: [{ liked: false, post_slug: "post-slug" }],
      error: null,
    });

    await expect(toggleCommentLike("comment-1", viewer)).resolves.toEqual({
      liked: false,
      postSlug: "post-slug",
    });
    expect(mocks.supabase.rpc).toHaveBeenCalledWith("toggle_comment_like_with_interaction_notification", {
      p_comment_id: "comment-1",
      p_actor_id: viewer.id,
    });
  });

  it("toggles post reactions through the slug RPC and returns the updated count", async () => {
    mocks.supabase.rpc.mockResolvedValue({
      data: [{ reacted: true, post_id: "post-1", reaction_count: 7 }],
      error: null,
    });

    await expect(togglePostReaction("post-slug", viewer)).resolves.toEqual({
      reacted: true,
      postId: "post-1",
      reactionCount: 7,
    });
    expect(mocks.supabase.rpc).toHaveBeenCalledWith("toggle_post_reaction_with_interaction_notification", {
      p_slug: "post-slug",
      p_actor_id: viewer.id,
    });
  });
});
