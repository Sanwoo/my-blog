import type { JSONContent } from "@tiptap/core";

export type PostStatus = "draft" | "scheduled" | "published";
export type CommentStatus = "published" | "hidden";
export type ProfileRole = "author" | "reader";
export type SavePostIntent =
  | "save_draft"
  | "save_scheduled"
  | "publish_now"
  | "save_published_working_copy"
  | "publish_working_copy"
  | "hide_to_draft"
  | "discard_working_copy";

export interface PostTaxonomyTerm {
  id: string;
  name: string;
  slug: string;
  archivedAt: string | null;
}

export interface PostWorkingCopy {
  slug: string;
  title: string;
  excerpt: string;
  content_json: JSONContent | null;
  content_html: string;
  category: PostTaxonomyTerm;
  tags: PostTaxonomyTerm[];
  seo_description: string;
  status: PostStatus;
  published_at: string | null;
  read_time_minutes: number;
  updated_at: string;
}

export interface TocItem {
  id: string;
  label: string;
  level: 2 | 3;
}

export interface PostRecord {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content_json: JSONContent | null;
  content_html: string;
  category: PostTaxonomyTerm;
  tags: PostTaxonomyTerm[];
  status: PostStatus;
  seo_description: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  read_time_minutes: number;
  comment_count: number;
  reaction_count: number;
  author_id: string | null;
  working_copy: PostWorkingCopy | null;
}

export interface PostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: PostTaxonomyTerm;
  tags: PostTaxonomyTerm[];
  publishedAt: string | null;
  formattedDate: string;
  readTime: string;
  commentCount: number;
  reactionCount: number;
}

export interface AdjacentPosts {
  newer: PostCard[];
  older: PostCard[];
}

export interface PostDetail extends PostCard {
  editableSlug: string;
  seoDescription: string;
  updatedAt?: string | null;
  status: PostStatus;
  contentHtml: string;
  contentJson: JSONContent | null;
  toc: TocItem[];
  hasWorkingCopy: boolean;
  workingCopyUpdatedAt: string | null;
}

export interface TimelineEntry {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: PostTaxonomyTerm;
  tags: PostTaxonomyTerm[];
  publishedAt: string;
  formattedDate: string;
  readTime: string;
  commentCount: number;
  reactionCount: number;
}

export type TimelineSeasonName = "春" | "夏" | "秋" | "冬";

export interface TimelineSeasonBucket {
  id: string;
  season: TimelineSeasonName;
  rangeLabel: string;
  itemCount: number;
  remainingCount: number;
  items: TimelineEntry[];
}

export interface HomeTimelinePreview {
  buckets: TimelineSeasonBucket[];
  total: number;
}

export interface EditorTaxonomy {
  categories: PostTaxonomyTerm[];
  tags: PostTaxonomyTerm[];
}

export interface ViewerProfile {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  role: ProfileRole;
}

export interface LatestCommentPreview {
  commentId: string;
  bodySnippet: string;
  createdAt: string;
  formattedDateTime: string;
  author: ViewerProfile;
  postSlug: string;
  postTitle: string;
}

export interface ViewerSession {
  id: string;
  email: string;
  isAuthor: boolean;
  displayName: string;
  avatarUrl: string | null;
  handle: string;
}

export type InteractionNotificationKind = "post_reaction" | "post_comment" | "comment_like" | "comment_reply";

export interface InteractionNotification {
  id: string;
  kind: InteractionNotificationKind;
  createdAt: string;
  readAt: string | null;
  formattedDateTime: string;
  bodySnippet: string;
  postSlug: string;
  postTitle: string;
  targetCommentId: string | null;
  replyId: string | null;
  actor: ViewerProfile;
}

export interface CommentReplyTarget {
  id: string;
  author: ViewerProfile;
}

export interface CommentNode {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  author: ViewerProfile;
  replyTo: CommentReplyTarget | null;
  likes: number;
  likedByViewer: boolean;
  replies: CommentNode[];
}

export interface ReactionSummary {
  count: number;
  reactedByViewer: boolean;
}

export interface SavePostPayload {
  previousSlug?: string | null;
  slug: string;
  title: string;
  excerpt: string;
  categoryId: string;
  tagIds: string[];
  seoDescription: string;
  intent: SavePostIntent;
  publishAt?: string | null;
  contentJson: JSONContent;
}
