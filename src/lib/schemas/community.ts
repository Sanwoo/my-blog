import { z } from "zod";
import { profileRoleSchema, trimmedStringSchema } from "@/lib/schemas/primitives";
import type { CommentNode } from "@/lib/types";

const nonEmptyTrimmedStringSchema = trimmedStringSchema.min(1);

export const viewerProfileSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  displayName: nonEmptyTrimmedStringSchema,
  handle: nonEmptyTrimmedStringSchema,
  avatarUrl: nonEmptyTrimmedStringSchema.nullable(),
  role: profileRoleSchema,
});

export const commentNodeSchema: z.ZodType<CommentNode> = z.lazy(() =>
  z.object({
    id: nonEmptyTrimmedStringSchema,
    parentId: nonEmptyTrimmedStringSchema.nullable(),
    body: z.string(),
    createdAt: nonEmptyTrimmedStringSchema,
    author: viewerProfileSchema,
    replyTo: z
      .object({
        id: nonEmptyTrimmedStringSchema,
        author: viewerProfileSchema,
      })
      .nullable(),
    likes: z.number().int().min(0),
    likedByViewer: z.boolean(),
    replies: z.array(commentNodeSchema),
  })
);

export const reactionSummarySchema = z.object({
  count: z.number().int().min(0),
  reactedByViewer: z.boolean(),
});

export const commentLikeResponseSchema = z.object({
  ok: z.literal(true),
  liked: z.boolean(),
});

export const commentsResponseSchema = z.object({
  comments: z.array(commentNodeSchema),
});

export const createCommentResponseSchema = z.object({
  ok: z.literal(true),
  comment: commentNodeSchema,
});

export const reactionSummaryResponseSchema = z.object({
  summary: reactionSummarySchema,
});

export const toggleReactionResponseSchema = z.object({
  ok: z.literal(true),
  reacted: z.boolean(),
  summary: reactionSummarySchema,
});

export const postSlugInputSchema = nonEmptyTrimmedStringSchema.min(1, "POST_NOT_FOUND");
export const commentBodySchema = nonEmptyTrimmedStringSchema.min(1, "BODY_REQUIRED");
export const parentCommentIdSchema = nonEmptyTrimmedStringSchema.nullable().optional();
export const commentIdSchema = nonEmptyTrimmedStringSchema.min(1, "COMMENT_NOT_FOUND");

export const commentsQuerySchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  viewer: trimmedStringSchema.optional(),
});

export const createCommentBodySchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  body: z.string().optional(),
  parentId: nonEmptyTrimmedStringSchema.optional().nullable(),
});

export const reactionsQuerySchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
  viewer: trimmedStringSchema.optional(),
});

export const toggleReactionBodySchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
});

export const commentLikeParamsSchema = z.object({
  id: nonEmptyTrimmedStringSchema.min(1, "COMMENT_NOT_FOUND"),
});

export const commentLikeRowSchema = z.object({
  comment_id: nonEmptyTrimmedStringSchema,
  user_id: nonEmptyTrimmedStringSchema,
});

export const commentTreeRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  author_id: nonEmptyTrimmedStringSchema,
  parent_id: z.string().nullable().optional(),
  body: z.string(),
  created_at: nonEmptyTrimmedStringSchema,
  like_count: z.number().int().min(0).optional(),
});

export const toggleCommentLikeRpcRowSchema = z.object({
  liked: z.boolean(),
  post_slug: nonEmptyTrimmedStringSchema,
});

export const togglePostReactionRpcRowSchema = z.object({
  reacted: z.boolean(),
  post_id: nonEmptyTrimmedStringSchema,
  reaction_count: z.number().int().min(0),
});

export const latestCommentRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  author_id: nonEmptyTrimmedStringSchema,
  post_id: nonEmptyTrimmedStringSchema,
  body: z.string(),
  created_at: nonEmptyTrimmedStringSchema,
});

export const profileRowSchema = z
  .object({
    id: nonEmptyTrimmedStringSchema,
    display_name: z.string().optional().nullable(),
    handle: z.string().optional().nullable(),
    avatar_url: z.string().optional().nullable(),
    role: profileRoleSchema.nullable().optional(),
  })
  .passthrough();

export const commentParentRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  author_id: nonEmptyTrimmedStringSchema,
  parent_id: z.string().nullable().optional(),
  post_id: nonEmptyTrimmedStringSchema,
  status: nonEmptyTrimmedStringSchema,
});

export const commentPostLookupRowSchema = z.object({
  post_id: nonEmptyTrimmedStringSchema,
});

export const postSlugLookupRowSchema = z.object({
  slug: nonEmptyTrimmedStringSchema,
});

export const publishedPostLookupRowSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  status: nonEmptyTrimmedStringSchema,
  published_at: z.string().nullable().optional(),
  reaction_count: z.number().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
});

export const interactionNotificationSchema = z.object({
  id: nonEmptyTrimmedStringSchema,
  kind: z.enum(["post_reaction", "post_comment", "comment_like", "comment_reply"]),
  createdAt: nonEmptyTrimmedStringSchema,
  readAt: z.string().nullable(),
  formattedDateTime: nonEmptyTrimmedStringSchema,
  bodySnippet: z.string(),
  postSlug: nonEmptyTrimmedStringSchema,
  postTitle: nonEmptyTrimmedStringSchema,
  targetCommentId: nonEmptyTrimmedStringSchema.nullable(),
  replyId: nonEmptyTrimmedStringSchema.nullable(),
  actor: viewerProfileSchema,
});
