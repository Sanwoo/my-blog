import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalAuthenticatedUser: vi.fn(),
  syncProfileStateFromUser: vi.fn(),
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  getOptionalAuthenticatedUser: mocks.getOptionalAuthenticatedUser,
  syncProfileStateFromUser: mocks.syncProfileStateFromUser,
}));

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServer: () => mocks.supabase,
  getSupabaseAuthServer: vi.fn(),
}));

import {
  getAuthenticatedAccountState,
  listInteractionNotifications,
  markInteractionNotificationsRead,
} from "@/lib/account";

function supabaseQuery<T>(result: T) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    is: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    update: vi.fn(() => query),
    limit: vi.fn(async () => result),
    then(resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject);
    },
  };

  return query;
}

describe("account service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads account state with unread count in parallel with profile sync", async () => {
    mocks.getOptionalAuthenticatedUser.mockResolvedValue({
      id: "viewer-1",
      email: "viewer@example.com",
      identities: [],
      app_metadata: {},
      user_metadata: {},
    });
    mocks.syncProfileStateFromUser.mockResolvedValue({
      viewer: {
        id: "viewer-1",
        email: "viewer@example.com",
        isAuthor: false,
        displayName: "Viewer",
        avatarUrl: null,
        handle: "@viewer",
      },
      profile: {
        id: "viewer-1",
        display_name: "Viewer",
        handle: "@viewer",
        avatar_url: null,
        role: "reader",
        display_name_customized: true,
        avatar_customized: false,
        avatar_storage_path: null,
      },
    });
    mocks.supabase.rpc.mockResolvedValue({
      data: [{ total: 3, likes: 1, replies: 2 }],
      error: null,
    });

    await expect(getAuthenticatedAccountState()).resolves.toMatchObject({
      viewer: { id: "viewer-1" },
      profile: {
        unreadInteractionCount: 3,
        displayNameCustomized: true,
        avatarCustomized: false,
      },
    });
  });

  it("returns unread summaries with post comments counted as replies", async () => {
    mocks.supabase.rpc.mockResolvedValue({
      data: [{ total: 7, likes: 4, replies: 3 }],
      error: null,
    });

    await expect(listInteractionNotifications("viewer-1", { summary: true })).resolves.toEqual({
      unread: {
        total: 7,
        likes: 4,
        replies: 3,
      },
      notifications: [],
    });

    expect(mocks.supabase.rpc).toHaveBeenCalledWith("get_unread_interaction_summary", {
      p_recipient_id: "viewer-1",
    });
  });

  it("lists reply-channel notifications with actors, posts, snippets, and anchors", async () => {
    const notificationsQuery = supabaseQuery({
      data: [{
        id: "notification-1",
        kind: "post_comment",
        actor_id: "actor-1",
        comment_id: "comment-1",
        reply_id: null,
        post_id: "post-1",
        body_snippet: "  hello from a reader  ",
        created_at: "2026-04-27T08:00:00.000Z",
        read_at: null,
      }],
      error: null,
    });
    const profilesQuery = supabaseQuery({
      data: [{
        id: "actor-1",
        display_name: "Reader",
        handle: "@reader",
        avatar_url: null,
        role: "reader",
      }],
      error: null,
    });
    const postsQuery = supabaseQuery({
      data: [{
        id: "post-1",
        slug: "post-slug",
        title: "Post title",
      }],
      error: null,
    });

    mocks.supabase.from
      .mockReturnValueOnce(notificationsQuery)
      .mockReturnValueOnce(profilesQuery)
      .mockReturnValueOnce(postsQuery);
    mocks.supabase.rpc.mockResolvedValue({
      data: [{ total: 1, likes: 0, replies: 1 }],
      error: null,
    });

    const result = await listInteractionNotifications("viewer-1", { channel: "replies" });

    expect(notificationsQuery.in).toHaveBeenCalledWith("kind", ["post_comment", "comment_reply"]);
    expect(result.unread).toEqual({ total: 1, likes: 0, replies: 1 });
    expect(result.notifications[0]).toMatchObject({
      id: "notification-1",
      kind: "post_comment",
      bodySnippet: "hello from a reader",
      postSlug: "post-slug",
      postTitle: "Post title",
      targetCommentId: "comment-1",
      replyId: null,
      actor: {
        displayName: "Reader",
        handle: "@reader",
      },
    });
  });

  it("marks all or selected notifications read for the recipient", async () => {
    const query = supabaseQuery({ error: null });
    mocks.supabase.from.mockReturnValue(query);

    await markInteractionNotificationsRead("viewer-1", ["notification-1"]);

    expect(query.update).toHaveBeenCalledWith(expect.objectContaining({
      read_at: expect.any(String),
    }));
    expect(query.eq).toHaveBeenCalledWith("recipient_id", "viewer-1");
    expect(query.is).toHaveBeenCalledWith("read_at", null);
    expect(query.in).toHaveBeenCalledWith("id", ["notification-1"]);
  });
});
