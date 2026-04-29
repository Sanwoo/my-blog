import { unstable_cache } from "next/cache";
import type { z } from "zod";
import { ensureProfile } from "@/lib/auth";
import { PUBLIC_CONTENT_REVALIDATE_SECONDS, PUBLIC_CONTENT_TAG } from "@/lib/cache";
import { excerptFromText, formatDateTime, isPubliclyVisible } from "@/lib/content";
import {
  commentBodySchema,
  commentIdSchema,
  commentLikeRowSchema,
  commentParentRowSchema,
  commentPostLookupRowSchema,
  commentTreeRowSchema,
  latestCommentRowSchema,
  parentCommentIdSchema,
  postSlugInputSchema,
  postSlugLookupRowSchema,
  profileRowSchema,
  publishedPostLookupRowSchema,
  toggleCommentLikeRpcRowSchema,
  togglePostReactionRpcRowSchema,
} from "@/lib/schemas/community";
import { parseExternalArray, parseExternalValue } from "@/lib/schemas/runtime";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { CommentNode, LatestCommentPreview, ReactionSummary, ViewerProfile, ViewerSession } from "@/lib/types";

type PostLookup = {
  id: string;
  publishedAt: string;
};

type CommentTreeRow = z.infer<typeof commentTreeRowSchema>;

function rpcErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = error as {
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    message?: unknown;
  };

  return [candidate.message, candidate.details, candidate.hint, candidate.code]
    .filter((part): part is string => typeof part === "string")
    .join(" ");
}

function knownRpcError(error: unknown, codes: readonly string[]) {
  const message = rpcErrorMessage(error);
  return codes.find((code) => message.includes(code));
}

export function mapProfileRow(
  row: Record<string, unknown> | undefined,
  fallbackId: string,
  fallbackHandle = "@reader"
): ViewerProfile {
  const parsedRow = row
    ? parseExternalValue(row, profileRowSchema, `community:profile:${fallbackId}`)
    : null;

  return {
    id: parsedRow?.id ?? fallbackId,
    displayName: parsedRow?.display_name || "Reader",
    handle: parsedRow?.handle || fallbackHandle,
    avatarUrl: parsedRow?.avatar_url ?? null,
    role: parsedRow?.role ?? "reader",
  };
}

async function getPublishedPostBySlug(slug: string): Promise<PostLookup | null> {
  const { data, error } = await getSupabaseServer().from("posts").select("id, status, published_at").eq("slug", slug).maybeSingle();

  const parsedRow = data
    ? parseExternalValue(data, publishedPostLookupRowSchema, `community:published_post:${slug}`)
    : null;
  const publishedAt = parsedRow?.published_at ?? null;

  if (error || !parsedRow || !publishedAt || !isPubliclyVisible(parsedRow.status, publishedAt)) {
    return null;
  }

  return {
    id: parsedRow.id,
    publishedAt,
  };
}

async function getExistingPostReaction(postId: string, viewerId?: string) {
  if (!viewerId) {
    return false;
  }

  const { data, error } = await getSupabaseServer()
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", viewerId)
    .eq("kind", "appreciate")
    .maybeSingle();

  if (error) {
    console.error("[getExistingPostReaction]", error);
    throw new Error("REACTION_FAILED");
  }

  return Boolean(data);
}

async function loadCommentRows(postId: string) {
  const { data, error } = await getSupabaseServer()
    .from("comments")
    .select("id, author_id, parent_id, body, created_at, like_count")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[loadCommentRows]", error);
    return [];
  }

  return parseExternalArray(data ?? [], commentTreeRowSchema, `community:comment_rows:${postId}`);
}

async function loadCommentMeta(rows: CommentTreeRow[], viewerId?: string) {
  const supabase = getSupabaseServer();
  const authorIds = Array.from(new Set(rows.map((row) => row.author_id)));
  const commentIds = rows.map((row) => row.id);

  const [profilesRes, likesRes] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("profiles").select("id, display_name, handle, avatar_url, role").in("id", authorIds)
      : Promise.resolve({ data: [], error: null }),
    viewerId && commentIds.length > 0
      ? supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds).eq("user_id", viewerId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesRes.error) {
    console.error("[getCommentsForPost:profiles]", profilesRes.error);
  }

  if (likesRes.error) {
    console.error("[getCommentsForPost:likes]", likesRes.error);
  }

  return {
    profilesMap: new Map(
      parseExternalArray(profilesRes.data ?? [], profileRowSchema, "community:comment_profiles").map((profile) => [
        profile.id,
        mapProfileRow(profile, profile.id),
      ])
    ),
    likedCommentIds: new Set(
      parseExternalArray(likesRes.data ?? [], commentLikeRowSchema, "community:comment_likes").map((like) => like.comment_id)
    ),
  };
}

function buildCommentTree(
  rows: CommentTreeRow[],
  profilesMap: Map<string, ViewerProfile>,
  likedCommentIds: ReadonlySet<string>,
  viewerId?: string
) {
  const byId = new Map<string, CommentNode>();
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const roots: CommentNode[] = [];

  for (const row of rows) {
    const commentId = row.id;
    const authorId = row.author_id;

    byId.set(commentId, {
      id: commentId,
      parentId: row.parent_id ?? null,
      body: row.body,
      createdAt: row.created_at,
      author: profilesMap.get(authorId) ?? mapProfileRow(undefined, authorId),
      replyTo: null,
      likes: row.like_count ?? 0,
      likedByViewer: viewerId ? likedCommentIds.has(commentId) : false,
      replies: [],
    });
  }

  const findRootId = (commentId: string) => {
    let current = rowsById.get(commentId);
    const seen = new Set<string>();

    while (current) {
      const currentId = current.id;
      const parentId = current.parent_id ?? null;

      if (!parentId) {
        return currentId;
      }

      if (seen.has(parentId)) {
        return null;
      }

      seen.add(currentId);
      current = rowsById.get(parentId);
    }

    return null;
  };

  for (const row of rows) {
    const commentId = row.id;
    const parentId = row.parent_id ?? null;
    const node = byId.get(commentId);

    if (!node) {
      continue;
    }

    if (parentId) {
      const parent = byId.get(parentId);
      if (parent) {
        node.replyTo = {
          id: parent.id,
          author: parent.author,
        };
      }

      const rootId = findRootId(parentId);
      const root = rootId ? byId.get(rootId) : null;
      if (parent) {
        if (root && root.id !== node.id) {
          root.replies.push(node);
          continue;
        }
      }

      if (!root || root.id === node.id) {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  }

  return roots;
}

async function ensureViewerProfile(viewer: ViewerSession) {
  await ensureProfile(viewer);
}

const getLatestCommentsPreviewCached = unstable_cache(async (): Promise<LatestCommentPreview[]> => {
  const supabase = getSupabaseServer();
  const { data: rows, error } = await supabase
    .from("comments")
    .select("id, author_id, post_id, body, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("[getLatestCommentsPreviewCached:comments]", error);
    return [];
  }

  const commentRows = parseExternalArray(rows ?? [], latestCommentRowSchema, "community:latest_comment_rows");
  const authorIds = Array.from(new Set(commentRows.map((row) => row.author_id)));
  const postIds = Array.from(new Set(commentRows.map((row) => row.post_id)));

  const [profilesRes, postsRes] = await Promise.all([
    authorIds.length > 0
      ? supabase.from("profiles").select("id, display_name, handle, avatar_url, role").in("id", authorIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length > 0
      ? supabase.from("posts").select("id, slug, title, status, published_at").in("id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesRes.error) {
    console.error("[getLatestCommentsPreviewCached:profiles]", profilesRes.error);
  }

  if (postsRes.error) {
    console.error("[getLatestCommentsPreviewCached:posts]", postsRes.error);
  }

  const profilesMap = new Map(
    parseExternalArray(profilesRes.data ?? [], profileRowSchema, "community:latest_comment_profiles").map((profile) => [
      profile.id,
      mapProfileRow(profile, profile.id),
    ])
  );
  const postsMap = new Map(
    parseExternalArray(postsRes.data ?? [], publishedPostLookupRowSchema, "community:latest_comment_posts")
      .filter((post) => {
        const publishedAt = post.published_at ?? null;
        return Boolean(post.slug) && Boolean(publishedAt) && isPubliclyVisible(post.status, publishedAt);
      })
      .map((post) => [
        post.id,
        {
          slug: post.slug!,
          title: post.title ?? "",
        },
      ])
  );

  return commentRows
    .flatMap((row) => {
      const commentId = row.id;
      const authorId = row.author_id;
      const post = postsMap.get(row.post_id);

      if (!post) {
        return [];
      }

      return [
        {
          commentId,
          bodySnippet: excerptFromText(row.body, 68),
          createdAt: row.created_at,
          formattedDateTime: formatDateTime(row.created_at),
          author: profilesMap.get(authorId) ?? mapProfileRow(undefined, authorId),
          postSlug: post.slug,
          postTitle: post.title,
        },
      ];
    })
    .slice(0, 5);
}, ["community:latest_comments_preview"], {
  tags: [PUBLIC_CONTENT_TAG],
  revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
});

export async function getReactionSummary(
  postId: string,
  reactionCount: number,
  viewerId?: string
): Promise<ReactionSummary> {
  return {
    count: reactionCount,
    reactedByViewer: await getExistingPostReaction(postId, viewerId),
  };
}

export async function getCommentsForPost(postId: string, viewerId?: string): Promise<CommentNode[]> {
  const rows = await loadCommentRows(postId);
  const { profilesMap, likedCommentIds } = await loadCommentMeta(rows, viewerId);
  return buildCommentTree(rows, profilesMap, likedCommentIds, viewerId);
}

export async function getLatestCommentsPreview() {
  return getLatestCommentsPreviewCached();
}

export async function getPostSlugForComment(commentId: string) {
  const supabase = getSupabaseServer();
  const { data: comment } = await supabase.from("comments").select("post_id").eq("id", commentId).maybeSingle();
  const parsedComment = comment
    ? parseExternalValue(comment, commentPostLookupRowSchema, `community:comment_post_lookup:${commentId}`)
    : null;

  if (!parsedComment) {
    return null;
  }

  const { data: post } = await supabase.from("posts").select("slug").eq("id", parsedComment.post_id).maybeSingle();
  return post
    ? parseExternalValue(post, postSlugLookupRowSchema, `community:post_slug_lookup:${commentId}`)?.slug ?? null
    : null;
}

export async function createCommentForSlug(slug: string, body: string, viewer: ViewerSession, parentId?: string | null) {
  const supabase = getSupabaseServer();
  const normalizedSlug = postSlugInputSchema.parse(slug);
  const trimmed = commentBodySchema.parse(body);
  const normalizedParentId = parentCommentIdSchema.parse(parentId ?? null);
  let replyTo: CommentNode["replyTo"] = null;

  const post = await getPublishedPostBySlug(normalizedSlug);
  if (!post) {
    throw new Error("POST_NOT_FOUND");
  }

  if (normalizedParentId) {
    const { data: parent, error: parentError } = await supabase
      .from("comments")
      .select("id, author_id, parent_id, post_id, status")
      .eq("id", normalizedParentId)
      .maybeSingle();

    const parsedParent = parent
      ? parseExternalValue(parent, commentParentRowSchema, `community:comment_parent:${normalizedParentId}`)
      : null;

    if (parentError || !parsedParent || parsedParent.status !== "published" || parsedParent.post_id !== post.id) {
      throw new Error("INVALID_PARENT");
    }

    const { data: parentProfile, error: parentProfileError } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, role")
      .eq("id", parsedParent.author_id)
      .maybeSingle();

    if (parentProfileError) {
      console.error("[createCommentForSlug:parent_profile]", parentProfileError);
    }

    replyTo = {
      id: parsedParent.id,
      author: mapProfileRow(parentProfile ?? undefined, parsedParent.author_id),
    };
  }

  await ensureViewerProfile(viewer);

  const { data: insertedRows, error } = await supabase.rpc("create_comment_with_interaction_notification", {
    p_post_id: post.id,
    p_actor_id: viewer.id,
    p_parent_id: normalizedParentId ?? null,
    p_body: trimmed,
  });

  if (error) {
    console.error("[createCommentForSlug]", error);
    throw new Error(knownRpcError(error, ["POST_NOT_FOUND", "INVALID_PARENT"]) ?? "COMMENT_FAILED");
  }

  const parsedComment = parseExternalArray(insertedRows ?? [], commentTreeRowSchema, `community:inserted_comment:${post.id}`)[0] ?? null;
  if (!parsedComment) {
    throw new Error("COMMENT_FAILED");
  }

  return {
    id: parsedComment.id,
    parentId: parsedComment.parent_id ?? null,
    body: parsedComment.body,
    createdAt: parsedComment.created_at,
    author: {
      id: viewer.id,
      displayName: viewer.displayName || "Reader",
      handle: viewer.handle || "@reader",
      avatarUrl: viewer.avatarUrl,
      role: viewer.isAuthor ? "author" : "reader",
    },
    replyTo,
    likes: parsedComment.like_count ?? 0,
    likedByViewer: false,
    replies: [],
  };
}

export async function toggleCommentLike(commentId: string, viewer: ViewerSession) {
  const supabase = getSupabaseServer();
  const normalizedCommentId = commentIdSchema.parse(commentId);
  await ensureViewerProfile(viewer);

  const { data, error } = await supabase.rpc("toggle_comment_like_with_interaction_notification", {
    p_comment_id: normalizedCommentId,
    p_actor_id: viewer.id,
  });

  if (error) {
    console.error("[toggleCommentLike]", error);
    throw new Error(knownRpcError(error, ["COMMENT_NOT_FOUND"]) ?? "LIKE_FAILED");
  }

  const result = parseExternalArray(data ?? [], toggleCommentLikeRpcRowSchema, `community:toggle_comment_like:${normalizedCommentId}`)[0] ?? null;
  if (!result) {
    throw new Error("LIKE_FAILED");
  }

  return {
    liked: result.liked,
    postSlug: result.post_slug,
  };
}

export async function togglePostReaction(slug: string, viewer: ViewerSession) {
  const supabase = getSupabaseServer();
  const normalizedSlug = postSlugInputSchema.parse(slug);
  await ensureViewerProfile(viewer);

  const { data, error } = await supabase.rpc("toggle_post_reaction_with_interaction_notification", {
    p_slug: normalizedSlug,
    p_actor_id: viewer.id,
  });

  if (error) {
    console.error("[togglePostReaction]", error);
    throw new Error(knownRpcError(error, ["POST_NOT_FOUND"]) ?? "REACTION_FAILED");
  }

  const result = parseExternalArray(data ?? [], togglePostReactionRpcRowSchema, `community:toggle_post_reaction:${normalizedSlug}`)[0] ?? null;
  if (!result) {
    throw new Error("REACTION_FAILED");
  }

  return {
    reacted: result.reacted,
    postId: result.post_id,
    reactionCount: result.reaction_count,
  };
}
