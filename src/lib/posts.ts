import { unstable_cache } from "next/cache";
import {
  estimateReadTime,
  excerptFromText,
  formatDate,
  formatReadTime,
  getSiteYearMonth,
  isPubliclyVisible,
  PUBLICLY_VISIBLE_POST_STATUSES,
  renderDocument,
  renderStoredContent,
  slugify,
} from "@/lib/content";
import {
  PUBLIC_CONTENT_REVALIDATE_SECONDS,
  PUBLIC_CONTENT_TAG,
  revalidatePublicContent,
} from "@/lib/cache";
import {
  adjacentLookupSchema,
  authorPostLookupRowSchema,
  authorPostSummaryRowSchema,
  postIdRowSchema,
  postRecordRowSchema,
  publicPostLookupRowSchema,
  postSlugInputSchema,
  relatedLookupSchema,
  requiredSlugSchema,
  requiredTitleSchema,
  savePostPayloadInputSchema,
  scheduledPublishAtSchema,
  sitemapEntryRowSchema,
  taxonomyTermRowSchema,
} from "@/lib/schemas/posts";
import { firstIssueMessage, parseExternalArray, parseExternalValue } from "@/lib/schemas/runtime";
import { getSupabaseServer } from "@/lib/supabase-server";
import type {
  AdjacentPosts,
  EditorTaxonomy,
  HomeTimelinePreview,
  PostCard,
  PostDetail,
  PostRecord,
  PostStatus,
  PostTaxonomyTerm,
  PostWorkingCopy,
  SavePostIntent,
  SavePostPayload,
  TimelineEntry,
  TimelineSeasonBucket,
  TimelineSeasonName,
  ViewerSession,
} from "@/lib/types";
import type { JSONContent } from "@tiptap/core";
import type { z } from "zod";

const INTERNAL_DRAFT_SLUG_PREFIX = "__draft__";
const DEFAULT_CATEGORY_NAME = "Essays";
const TAXONOMY_TERM_SELECT = "id, name, slug, archived_at";
const TAG_ASSIGNMENT_SELECT = `tag:post_tags(${TAXONOMY_TERM_SELECT})`;
const WORKING_COPY_TAG_ASSIGNMENT_SELECT = `tag:post_tags(${TAXONOMY_TERM_SELECT})`;
const WORKING_COPY_SELECT = [
  "slug",
  "title",
  "excerpt",
  "content_json",
  "content_html",
  `category:post_categories(${TAXONOMY_TERM_SELECT})`,
  `tag_assignments:post_working_copy_tag_assignments(${WORKING_COPY_TAG_ASSIGNMENT_SELECT})`,
  "seo_description",
  "status",
  "published_at",
  "read_time_minutes",
  "updated_at",
].join(", ");

const PUBLIC_POST_CARD_SELECT = [
  "id",
  "slug",
  "title",
  "excerpt",
  `category:post_categories(${TAXONOMY_TERM_SELECT})`,
  `tag_assignments:post_tag_assignments(${TAG_ASSIGNMENT_SELECT})`,
  "status",
  "seo_description",
  "published_at",
  "created_at",
  "updated_at",
  "read_time_minutes",
  "comment_count",
  "reaction_count",
  "author_id",
].join(", ");

export const PUBLIC_POST_SELECT = [
  "id",
  "slug",
  "title",
  "excerpt",
  "content_json",
  "content_html",
  `category:post_categories(${TAXONOMY_TERM_SELECT})`,
  `tag_assignments:post_tag_assignments(${TAG_ASSIGNMENT_SELECT})`,
  "status",
  "seo_description",
  "published_at",
  "created_at",
  "updated_at",
  "read_time_minutes",
  "comment_count",
  "reaction_count",
  "author_id",
].join(", ");

const PUBLIC_POST_FEED_SELECT = PUBLIC_POST_SELECT;
const PUBLIC_POST_LOOKUP_SELECT = "id, slug, status, published_at, comment_count, reaction_count";
const AUTHOR_POST_SELECT = `${PUBLIC_POST_SELECT}, working_copy:post_working_copies(${WORKING_COPY_SELECT})`;
const TIMELINE_POST_SELECT = PUBLIC_POST_CARD_SELECT;

const publicContentCacheOptions = {
  tags: [PUBLIC_CONTENT_TAG],
  revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS,
};

const FALLBACK_CATEGORY: PostTaxonomyTerm = {
  id: "fallback-category",
  name: DEFAULT_CATEGORY_NAME,
  slug: "essays",
  archivedAt: null,
};

const SEASON_BY_MONTH: Record<number, TimelineSeasonName> = {
  1: "冬",
  2: "冬",
  3: "春",
  4: "春",
  5: "春",
  6: "夏",
  7: "夏",
  8: "夏",
  9: "秋",
  10: "秋",
  11: "秋",
  12: "冬",
};

const SEASON_SLUG: Record<TimelineSeasonName, string> = {
  春: "spring",
  夏: "summer",
  秋: "autumn",
  冬: "winter",
};

type MutableTimelineBucket = {
  id: string;
  season: TimelineSeasonName;
  rangeLabel: string;
  sortValue: number;
  items: TimelineEntry[];
};

interface PostMutationResult {
  slug: string;
  visibleSlug: string;
  status: PostStatus;
  hasWorkingCopy: boolean;
}

export interface PublicContentSummary {
  articleCount: number;
  categoryCount: number;
  tagCount: number;
}

export interface PublicPostLookup {
  id: string;
  slug: string;
  publishedAt: string;
  commentCount: number;
  reactionCount: number;
}

function publishedNow() {
  return new Date().toISOString();
}

function serializeRelatedLookup(slug: string, categoryId: string) {
  return JSON.stringify({ slug, categoryId });
}

function serializeAdjacentLookup(slug: string, publishedAt: string | null) {
  return JSON.stringify({ slug, publishedAt });
}

function readSerializedLookup<T>(serialized: string, schema: z.ZodType<T>) {
  try {
    return parseExternalValue(JSON.parse(serialized), schema, "posts:serialized_lookup");
  } catch {
    return null;
  }
}

function publishedPostsQuery(select: string, now = publishedNow()) {
  return getSupabaseServer()
    .from("posts")
    .select(select)
    .in("status", [...PUBLICLY_VISIBLE_POST_STATUSES])
    .lte("published_at", now);
}

function termFromRow(row: z.infer<typeof taxonomyTermRowSchema> | null | undefined): PostTaxonomyTerm | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    archivedAt: row.archived_at ?? null,
  };
}

function tagsFromAssignments(assignments: Array<{ tag?: z.infer<typeof taxonomyTermRowSchema> | null }> | null | undefined) {
  return (assignments ?? []).flatMap((assignment) => {
    const term = termFromRow(assignment.tag);
    return term ? [term] : [];
  });
}

function normalizeWorkingCopy(
  value: z.infer<typeof postRecordRowSchema>["working_copy"],
  fallbackCategory: PostTaxonomyTerm
): PostWorkingCopy | null {
  const row = Array.isArray(value) ? value[0] ?? null : value ?? null;
  if (!row) return null;

  const category = termFromRow(row.category) ?? fallbackCategory;
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content_json: row.content_json ?? null,
    content_html: row.content_html ?? "",
    category,
    tags: tagsFromAssignments(row.tag_assignments),
    seo_description: row.seo_description ?? "",
    status: row.status ?? "published",
    published_at: row.published_at ?? null,
    read_time_minutes: row.read_time_minutes ?? 1,
    updated_at: row.updated_at,
  };
}

function rowToPostRecord(row: unknown, scope: string): PostRecord | null {
  const parsedRow = parseExternalValue(row, postRecordRowSchema, scope);

  if (!parsedRow) {
    return null;
  }

  const category = termFromRow(parsedRow.category) ?? FALLBACK_CATEGORY;

  return {
    id: parsedRow.id,
    slug: parsedRow.slug,
    title: parsedRow.title,
    excerpt: parsedRow.excerpt ?? "",
    content_json: parsedRow.content_json ?? null,
    content_html: parsedRow.content_html ?? "",
    category,
    tags: tagsFromAssignments(parsedRow.tag_assignments),
    status: parsedRow.status ?? "draft",
    seo_description: parsedRow.seo_description ?? "",
    published_at: parsedRow.published_at ?? null,
    created_at: parsedRow.created_at,
    updated_at: parsedRow.updated_at,
    read_time_minutes: parsedRow.read_time_minutes ?? 1,
    comment_count: parsedRow.comment_count ?? 0,
    reaction_count: parsedRow.reaction_count ?? 0,
    author_id: parsedRow.author_id ?? null,
    working_copy: normalizeWorkingCopy(parsedRow.working_copy, category),
  };
}

function recordToCard(record: PostRecord): PostCard {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    category: record.category,
    tags: record.tags,
    publishedAt: record.published_at,
    formattedDate: formatDate(record.published_at ?? record.created_at),
    readTime: formatReadTime(record.read_time_minutes),
    commentCount: record.comment_count,
    reactionCount: record.reaction_count,
  };
}

function recordToTimelineEntry(record: PostRecord): TimelineEntry {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    excerpt: record.excerpt,
    category: record.category,
    tags: record.tags,
    publishedAt: record.published_at ?? record.created_at,
    formattedDate: formatDate(record.published_at ?? record.created_at),
    readTime: formatReadTime(record.read_time_minutes),
    commentCount: record.comment_count,
    reactionCount: record.reaction_count,
  };
}

function recordToDetail(record: PostRecord, options?: { preferWorkingCopy?: boolean }): PostDetail {
  const source = options?.preferWorkingCopy && record.working_copy ? record.working_copy : record;
  const rendered = renderStoredContent(source.content_json, source.content_html);
  const publishedAt = source.published_at ?? record.published_at;

  return {
    id: record.id,
    slug: record.slug,
    title: source.title,
    excerpt: source.excerpt,
    category: source.category,
    tags: source.tags,
    publishedAt,
    formattedDate: formatDate(publishedAt ?? record.created_at),
    readTime: formatReadTime(source.read_time_minutes),
    commentCount: record.comment_count,
    reactionCount: record.reaction_count,
    editableSlug: source.slug,
    seoDescription: source.seo_description,
    updatedAt: source.updated_at,
    status: record.status,
    contentHtml: rendered.html,
    contentJson: source.content_json,
    toc: rendered.toc,
    hasWorkingCopy: Boolean(record.working_copy),
    workingCopyUpdatedAt: record.working_copy?.updated_at ?? null,
  };
}

function padMonth(month: number) {
  return String(month).padStart(2, "0");
}

function getTimelineBucketMeta(publishedAt: string) {
  const parts = getSiteYearMonth(publishedAt);

  if (!parts) {
    return {
      id: "unknown-spring",
      season: "春" as const,
      rangeLabel: "Unknown",
      sortValue: Number.NEGATIVE_INFINITY,
    };
  }

  const { year, month } = parts;
  const season = SEASON_BY_MONTH[month] ?? "春";

  if (season === "冬") {
    const seasonYear = month === 12 ? year : year - 1;
    const startDate = Date.UTC(seasonYear, 11, 1);
    const endYear = seasonYear + 1;

    return {
      id: `${seasonYear}-${SEASON_SLUG[season]}`,
      season,
      rangeLabel: `${seasonYear}.${padMonth(12)} — ${endYear}.${padMonth(2)}`,
      sortValue: startDate,
    };
  }

  const seasonMonthRange = season === "春" ? [3, 5] : season === "夏" ? [6, 8] : [9, 11];
  const [startMonth, endMonth] = seasonMonthRange;

  return {
    id: `${year}-${SEASON_SLUG[season]}`,
    season,
    rangeLabel: `${year}.${padMonth(startMonth)} — ${year}.${padMonth(endMonth)}`,
    sortValue: Date.UTC(year, startMonth - 1, 1),
  };
}

function finalizeTimelineBucket(bucket: MutableTimelineBucket, itemLimit: number): TimelineSeasonBucket {
  const visibleItems = bucket.items.slice(0, itemLimit);

  return {
    id: bucket.id,
    season: bucket.season,
    rangeLabel: bucket.rangeLabel,
    itemCount: bucket.items.length,
    remainingCount: Math.max(0, bucket.items.length - visibleItems.length),
    items: visibleItems,
  };
}

function targetStatusFromIntent(intent: SavePostIntent): PostStatus {
  switch (intent) {
    case "save_scheduled":
      return "scheduled";
    case "publish_now":
    case "publish_working_copy":
    case "save_published_working_copy":
    case "discard_working_copy":
      return "published";
    case "save_draft":
    case "hide_to_draft":
      return "draft";
  }
}

const getTimelineEntriesCached = unstable_cache(async (): Promise<TimelineEntry[]> => {
  const { data, error } = await publishedPostsQuery(TIMELINE_POST_SELECT).order("published_at", { ascending: false });

  if (error) {
    console.error("[getTimelineEntriesCached]", error);
    return [];
  }

  return parseExternalArray(data ?? [], postRecordRowSchema, "posts:timeline_rows")
    .map((row) => rowToPostRecord(row, "posts:timeline_row"))
    .flatMap((row) => (row ? [recordToTimelineEntry(row)] : []));
}, ["posts:timeline_entries"], publicContentCacheOptions);

async function queryTaxonomyTerms(activeOnly: boolean): Promise<EditorTaxonomy> {
  const supabase = getSupabaseServer();
  const categoriesQuery = supabase.from("post_categories").select(TAXONOMY_TERM_SELECT).order("name", { ascending: true });
  const tagsQuery = supabase.from("post_tags").select(TAXONOMY_TERM_SELECT).order("name", { ascending: true });
  const [categoriesRes, tagsRes] = await Promise.all([
    activeOnly ? categoriesQuery.is("archived_at", null) : categoriesQuery,
    activeOnly ? tagsQuery.is("archived_at", null) : tagsQuery,
  ]);

  if (categoriesRes.error) {
    console.error("[queryTaxonomyTerms:categories]", categoriesRes.error);
  }

  if (tagsRes.error) {
    console.error("[queryTaxonomyTerms:tags]", tagsRes.error);
  }

  return {
    categories: parseExternalArray(categoriesRes.data ?? [], taxonomyTermRowSchema, "posts:taxonomy_categories")
      .map(termFromRow)
      .flatMap((term) => (term ? [term] : [])),
    tags: parseExternalArray(tagsRes.data ?? [], taxonomyTermRowSchema, "posts:taxonomy_tags")
      .map(termFromRow)
      .flatMap((term) => (term ? [term] : [])),
  };
}

const getTaxonomyCached = unstable_cache(
  async () => queryTaxonomyTerms(true),
  ["posts:taxonomy:active"],
  publicContentCacheOptions
);

const getPublicContentSummaryCached = unstable_cache(async (): Promise<PublicContentSummary> => {
  const supabase = getSupabaseServer();
  const now = publishedNow();
  const [postsRes, categoriesRes, tagsRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .in("status", [...PUBLICLY_VISIBLE_POST_STATUSES])
      .lte("published_at", now),
    supabase
      .from("post_categories")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),
    supabase
      .from("post_tags")
      .select("id", { count: "exact", head: true })
      .is("archived_at", null),
  ]);

  if (postsRes.error) {
    console.error("[getPublicContentSummaryCached:posts]", postsRes.error);
  }

  if (categoriesRes.error) {
    console.error("[getPublicContentSummaryCached:categories]", categoriesRes.error);
  }

  if (tagsRes.error) {
    console.error("[getPublicContentSummaryCached:tags]", tagsRes.error);
  }

  return {
    articleCount: postsRes.count ?? 0,
    categoryCount: categoriesRes.count ?? 0,
    tagCount: tagsRes.count ?? 0,
  };
}, ["posts:public_content_summary"], publicContentCacheOptions);

const getPublicPostBySlugCached = unstable_cache(async (slug: string): Promise<PostDetail | null> => {
  const { data, error } = await getSupabaseServer().from("posts").select(PUBLIC_POST_SELECT).eq("slug", slug).maybeSingle();

  if (error) {
    console.error("[getPublicPostBySlugCached]", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const record = rowToPostRecord(data, `posts:public_post:${slug}`);
  if (!record) {
    return null;
  }

  return isPubliclyVisible(record.status, record.published_at) ? recordToDetail(record) : null;
}, ["posts:public_post_by_slug"], publicContentCacheOptions);

const getPublicPostLookupBySlugCached = unstable_cache(async (slug: string): Promise<PublicPostLookup | null> => {
  const { data, error } = await getSupabaseServer()
    .from("posts")
    .select(PUBLIC_POST_LOOKUP_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[getPublicPostLookupBySlugCached]", error);
    return null;
  }

  const parsedRow = data
    ? parseExternalValue(data, publicPostLookupRowSchema, `posts:public_lookup:${slug}`)
    : null;
  const publishedAt = parsedRow?.published_at ?? null;

  if (!parsedRow || !publishedAt || !isPubliclyVisible(parsedRow.status, publishedAt)) {
    return null;
  }

  return {
    id: parsedRow.id,
    slug: parsedRow.slug,
    publishedAt,
    commentCount: parsedRow.comment_count ?? 0,
    reactionCount: parsedRow.reaction_count ?? 0,
  };
}, ["posts:public_post_lookup_by_slug"], publicContentCacheOptions);

const getRelatedPostsCached = unstable_cache(async (serialized: string) => {
  const lookup = readSerializedLookup(serialized, relatedLookupSchema);
  if (!lookup) {
    return [];
  }

  const { slug, categoryId } = lookup;
  const { data, error } = await publishedPostsQuery(PUBLIC_POST_CARD_SELECT)
    .eq("category_id", categoryId)
    .neq("slug", slug)
    .order("published_at", { ascending: false })
    .limit(3);

  if (error) {
    console.error("[getRelatedPostsCached]", error);
    return [];
  }

  return parseExternalArray(data ?? [], postRecordRowSchema, `posts:related_rows:${slug}`)
    .map((row) => rowToPostRecord(row, `posts:related_row:${slug}`))
    .flatMap((row) => (row ? [recordToCard(row)] : []));
}, ["posts:related_posts"], publicContentCacheOptions);

const getAdjacentPostsCached = unstable_cache(async (serialized: string): Promise<AdjacentPosts> => {
  const lookup = readSerializedLookup(serialized, adjacentLookupSchema);
  if (!lookup) {
    return { newer: [], older: [] };
  }

  const { slug, publishedAt } = lookup;

  if (!publishedAt) {
    return { newer: [], older: [] };
  }

  const [newerRes, olderRes] = await Promise.all([
    publishedPostsQuery(PUBLIC_POST_CARD_SELECT)
      .gt("published_at", publishedAt)
      .neq("slug", slug)
      .order("published_at", { ascending: true })
      .limit(4),
    publishedPostsQuery(PUBLIC_POST_CARD_SELECT)
      .lt("published_at", publishedAt)
      .neq("slug", slug)
      .order("published_at", { ascending: false })
      .limit(4),
  ]);

  if (newerRes.error) {
    console.error("[getAdjacentPostsCached:newer]", newerRes.error);
  }

  if (olderRes.error) {
    console.error("[getAdjacentPostsCached:older]", olderRes.error);
  }

  return {
    newer: parseExternalArray(newerRes.data ?? [], postRecordRowSchema, `posts:adjacent_newer:${slug}`)
      .map((row) => rowToPostRecord(row, `posts:adjacent_newer_row:${slug}`))
      .flatMap((row) => (row ? [recordToCard(row)] : [])),
    older: parseExternalArray(olderRes.data ?? [], postRecordRowSchema, `posts:adjacent_older:${slug}`)
      .map((row) => rowToPostRecord(row, `posts:adjacent_older_row:${slug}`))
      .flatMap((row) => (row ? [recordToCard(row)] : [])),
  };
}, ["posts:adjacent_posts"], publicContentCacheOptions);

const getSitemapEntriesCached = unstable_cache(async () => {
  const { data, error } = await publishedPostsQuery("slug, updated_at, published_at").order("published_at", {
    ascending: false,
  });

  if (error) {
    console.error("[getSitemapEntriesCached]", error);
    return [];
  }

  return parseExternalArray(data ?? [], sitemapEntryRowSchema, "posts:sitemap_rows").map((row) => ({
    slug: row.slug,
    updatedAt: row.updated_at,
    publishedAt: row.published_at ?? null,
  }));
}, ["posts:sitemap_entries"], publicContentCacheOptions);

const getFeedPostsCached = unstable_cache(async () => {
  const { data, error } = await publishedPostsQuery(PUBLIC_POST_FEED_SELECT)
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[getFeedPostsCached]", error);
    return [];
  }

  return parseExternalArray(data ?? [], postRecordRowSchema, "posts:feed_rows")
    .map((row) => rowToPostRecord(row, "posts:feed_row"))
    .flatMap((row) => (row ? [row] : []));
}, ["posts:feed_posts"], publicContentCacheOptions);

function generateInternalDraftSlug() {
  return `${INTERNAL_DRAFT_SLUG_PREFIX}${crypto.randomUUID()}`;
}

function isInternalDraftSlug(value: string | null | undefined) {
  return Boolean(value && value.startsWith(INTERNAL_DRAFT_SLUG_PREFIX));
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function syncPostTags(postId: string, tagIds: string[]) {
  const supabase = getSupabaseServer();
  const { error: deleteError } = await supabase.from("post_tag_assignments").delete().eq("post_id", postId);
  if (deleteError) {
    console.error("[syncPostTags:delete]", deleteError);
    throw new Error("SAVE_FAILED");
  }

  const rows = uniqueIds(tagIds).map((tagId) => ({ post_id: postId, tag_id: tagId }));
  if (rows.length === 0) return;

  const { error } = await supabase.from("post_tag_assignments").insert(rows);
  if (error) {
    console.error("[syncPostTags:insert]", error);
    throw new Error("SAVE_FAILED");
  }
}

async function syncWorkingCopyTags(postId: string, tagIds: string[]) {
  const supabase = getSupabaseServer();
  const { error: deleteError } = await supabase.from("post_working_copy_tag_assignments").delete().eq("post_id", postId);
  if (deleteError) {
    console.error("[syncWorkingCopyTags:delete]", deleteError);
    throw new Error("SAVE_FAILED");
  }

  const rows = uniqueIds(tagIds).map((tagId) => ({ post_id: postId, tag_id: tagId }));
  if (rows.length === 0) return;

  const { error } = await supabase.from("post_working_copy_tag_assignments").insert(rows);
  if (error) {
    console.error("[syncWorkingCopyTags:insert]", error);
    throw new Error("SAVE_FAILED");
  }
}

async function deleteWorkingCopy(postId: string) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("post_working_copies").delete().eq("post_id", postId);
  if (error) {
    console.error("[deleteWorkingCopy]", error);
    throw new Error("SAVE_FAILED");
  }
}

async function assertSlugAvailable(slug: string, currentPostId: string | null) {
  const { data, error } = await getSupabaseServer().from("posts").select("id").eq("slug", slug).maybeSingle();
  if (error) {
    console.error("[assertSlugAvailable]", error);
    throw new Error("SAVE_FAILED");
  }

  const existing = data ? parseExternalValue(data, postIdRowSchema, `posts:slug_lookup:${slug}`) : null;
  if (existing && existing.id !== currentPostId) {
    throw new Error("SLUG_IN_USE");
  }
}

async function assertTaxonomy(categoryId: string, tagIds: string[]) {
  const supabase = getSupabaseServer();
  const cleanTagIds = uniqueIds(tagIds);
  const [categoryRes, tagsRes] = await Promise.all([
    supabase.from("post_categories").select("id").eq("id", categoryId).maybeSingle(),
    cleanTagIds.length > 0 ? supabase.from("post_tags").select("id").in("id", cleanTagIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoryRes.error || !categoryRes.data) {
    if (categoryRes.error) console.error("[assertTaxonomy:category]", categoryRes.error);
    throw new Error("CATEGORY_REQUIRED");
  }

  if (tagsRes.error) {
    console.error("[assertTaxonomy:tags]", tagsRes.error);
    throw new Error("SAVE_FAILED");
  }

  if ((tagsRes.data ?? []).length !== cleanTagIds.length) {
    throw new Error("TAG_INVALID");
  }
}

function postRowFromPayload(
  payload: z.infer<typeof savePostPayloadInputSchema>,
  options: {
    slug: string;
    status: PostStatus;
    publishedAt: string | null;
    rendered: ReturnType<typeof renderDocument>;
    readTime: number;
    viewerId: string;
  }
) {
  let excerpt = payload.excerpt.trim();
  let seoDescription = payload.seoDescription.trim();

  if (options.status !== "draft" && !excerpt) {
    excerpt = excerptFromText(options.rendered.text);
  }

  if (options.status !== "draft" && !seoDescription) {
    seoDescription = excerpt;
  }

  return {
    slug: options.slug,
    title: payload.title.trim(),
    excerpt,
    content_json: payload.contentJson,
    content_html: options.rendered.html,
    category_id: payload.categoryId,
    status: options.status,
    seo_description: seoDescription,
    published_at: options.publishedAt,
    read_time_minutes: options.readTime,
    author_id: options.viewerId,
  };
}

export function buildTimelineBuckets(entries: TimelineEntry[]): TimelineSeasonBucket[] {
  const buckets = new Map<string, MutableTimelineBucket>();

  for (const entry of entries) {
    const meta = getTimelineBucketMeta(entry.publishedAt);
    const current =
      buckets.get(meta.id) ??
      {
        id: meta.id,
        season: meta.season,
        rangeLabel: meta.rangeLabel,
        sortValue: meta.sortValue,
        items: [],
      };

    current.items.push(entry);
    buckets.set(meta.id, current);
  }

  return Array.from(buckets.values())
    .toSorted((left, right) => right.sortValue - left.sortValue)
    .map((bucket) => finalizeTimelineBucket(bucket, Number.MAX_SAFE_INTEGER));
}

export function buildHomeTimelinePreview(
  entries: TimelineEntry[],
  bucketLimit = 5,
  itemLimit = 10
): HomeTimelinePreview {
  const buckets = buildTimelineBuckets(entries)
    .slice(0, bucketLimit)
    .map((bucket) =>
      finalizeTimelineBucket(
        {
          id: bucket.id,
          season: bucket.season,
          rangeLabel: bucket.rangeLabel,
          sortValue: 0,
          items: bucket.items,
        },
        itemLimit
      )
    );

  return {
    buckets,
    total: entries.length,
  };
}

export async function getTimelineEntries() {
  return getTimelineEntriesCached();
}

export async function getTaxonomy() {
  return getTaxonomyCached();
}

export async function getPublicContentSummary() {
  return getPublicContentSummaryCached();
}

export async function listEditorTaxonomy() {
  return queryTaxonomyTerms(false);
}

export async function getPublicPostBySlug(slug: string) {
  return getPublicPostBySlugCached(slug);
}

export async function getPublicPostLookupBySlug(slug: string) {
  return getPublicPostLookupBySlugCached(slug);
}

export async function getRelatedPosts(post: PostDetail) {
  return getRelatedPostsCached(serializeRelatedLookup(post.slug, post.category.id));
}

export async function getAdjacentPosts(post: PostDetail) {
  return getAdjacentPostsCached(serializeAdjacentLookup(post.slug, post.publishedAt));
}

export async function getSitemapEntries() {
  return getSitemapEntriesCached();
}

export async function getFeedPosts() {
  return getFeedPostsCached();
}

export async function getAuthorPostBySlug(authorId: string, slug: string): Promise<PostDetail | null> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select(AUTHOR_POST_SELECT)
    .eq("slug", slug)
    .eq("author_id", authorId)
    .maybeSingle();

  if (error) {
    console.error("[getAuthorPostBySlug]", error);
    return null;
  }

  const record = data ? rowToPostRecord(data, `posts:author_post:${authorId}:${slug}`) : null;
  return record ? recordToDetail(record, { preferWorkingCopy: true }) : null;
}

export async function listAuthorPosts(authorId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("posts")
    .select("slug, title, status, updated_at, published_at, working_copy:post_working_copies(updated_at)")
    .eq("author_id", authorId)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[listAuthorPosts]", error);
    return [];
  }

  return parseExternalArray(data ?? [], authorPostSummaryRowSchema, `posts:author_list:${authorId}`).map((row) => {
    const workingCopy = Array.isArray(row.working_copy) ? row.working_copy[0] ?? null : row.working_copy ?? null;
    return {
      slug: row.slug,
      title: row.title,
      status: row.status,
      updatedAt: row.updated_at,
      publishedAt: row.published_at ?? null,
      hasWorkingCopy: Boolean(workingCopy),
      workingCopyUpdatedAt: workingCopy?.updated_at ?? null,
    };
  });
}

export async function savePost(viewer: ViewerSession, payload: SavePostPayload): Promise<PostMutationResult> {
  const supabase = getSupabaseServer();
  const parsedPayload = savePostPayloadInputSchema.parse(payload);
  const previousSlug = parsedPayload.previousSlug?.trim() || null;
  const visibleSlug = slugify(parsedPayload.slug, "");
  const rendered = renderDocument(parsedPayload.contentJson);
  const readTime = estimateReadTime(rendered.text);
  const trimmedPublishAt = parsedPayload.publishAt?.trim() ?? "";
  let existingPost: { id: string; slug: string; status: PostStatus; published_at: string | null } | null = null;

  if (parsedPayload.intent !== "discard_working_copy") {
    await assertTaxonomy(parsedPayload.categoryId, parsedPayload.tagIds);
  }

  if (previousSlug) {
    const { data, error } = await supabase
      .from("posts")
      .select("id, slug, status, published_at")
      .eq("slug", previousSlug)
      .eq("author_id", viewer.id)
      .maybeSingle();

    if (error) {
      console.error("[savePost:load]", error);
      throw new Error("SAVE_FAILED");
    }

    if (!data) {
      throw new Error("POST_NOT_FOUND");
    }

    existingPost = parseExternalValue(data, authorPostLookupRowSchema, `posts:author_lookup:${viewer.id}:${previousSlug}`);

    if (!existingPost) {
      throw new Error("POST_NOT_FOUND");
    }
  }

  if (parsedPayload.intent === "discard_working_copy") {
    if (!existingPost || existingPost.status !== "published") {
      throw new Error("POST_NOT_FOUND");
    }

    await deleteWorkingCopy(existingPost.id);
    return {
      slug: existingPost.slug,
      visibleSlug: existingPost.slug,
      status: "published",
      hasWorkingCopy: false,
    };
  }

  if (parsedPayload.intent === "save_published_working_copy") {
    if (!existingPost || existingPost.status !== "published") {
      throw new Error("POST_NOT_FOUND");
    }

    const nextTitle = requiredTitleSchema.safeParse(parsedPayload.title);
    if (!nextTitle.success) {
      throw new Error(firstIssueMessage(nextTitle.error, "TITLE_REQUIRED"));
    }

    const nextSlug = requiredSlugSchema.safeParse(parsedPayload.slug);
    if (!nextSlug.success) {
      throw new Error(firstIssueMessage(nextSlug.error, "SLUG_REQUIRED"));
    }

    await assertSlugAvailable(nextSlug.data, existingPost.id);

    const row = postRowFromPayload(parsedPayload, {
      slug: nextSlug.data,
      status: "published",
      publishedAt: existingPost.published_at,
      rendered,
      readTime,
      viewerId: viewer.id,
    });

    const { error } = await supabase.from("post_working_copies").upsert(
      {
        post_id: existingPost.id,
        slug: row.slug,
        title: row.title,
        excerpt: row.excerpt,
        content_json: row.content_json,
        content_html: row.content_html,
        category_id: row.category_id,
        seo_description: row.seo_description,
        status: row.status,
        published_at: row.published_at,
        read_time_minutes: row.read_time_minutes,
      },
      { onConflict: "post_id" }
    );

    if (error) {
      console.error("[savePost:workingCopy]", error);
      throw new Error(error.code === "23505" ? "SLUG_IN_USE" : "SAVE_FAILED");
    }

    await syncWorkingCopyTags(existingPost.id, parsedPayload.tagIds);

    return {
      slug: existingPost.slug,
      visibleSlug: nextSlug.data,
      status: "published",
      hasWorkingCopy: true,
    };
  }

  const targetStatus = targetStatusFromIntent(parsedPayload.intent);
  let normalizedSlug = visibleSlug;
  let publishedAt: string | null = null;

  switch (parsedPayload.intent) {
    case "save_draft": {
      normalizedSlug =
        visibleSlug ||
        (existingPost && previousSlug && isInternalDraftSlug(previousSlug) ? previousSlug : generateInternalDraftSlug());
      publishedAt = null;
      break;
    }
    case "hide_to_draft": {
      if (!existingPost || !previousSlug) {
        throw new Error("POST_NOT_FOUND");
      }
      normalizedSlug = previousSlug;
      publishedAt = null;
      break;
    }
    case "save_scheduled": {
      const nextTitle = requiredTitleSchema.safeParse(parsedPayload.title);
      if (!nextTitle.success) {
        throw new Error(firstIssueMessage(nextTitle.error, "TITLE_REQUIRED"));
      }

      const nextSlug = requiredSlugSchema.safeParse(parsedPayload.slug);
      if (!nextSlug.success) {
        throw new Error(firstIssueMessage(nextSlug.error, "SLUG_REQUIRED"));
      }

      const nextPublishAt = scheduledPublishAtSchema.safeParse(trimmedPublishAt);
      if (!nextPublishAt.success) {
        throw new Error(firstIssueMessage(nextPublishAt.error, "PUBLISH_AT_INVALID"));
      }

      normalizedSlug = nextSlug.data;
      publishedAt = nextPublishAt.data;
      break;
    }
    case "publish_now":
    case "publish_working_copy": {
      const nextTitle = requiredTitleSchema.safeParse(parsedPayload.title);
      if (!nextTitle.success) {
        throw new Error(firstIssueMessage(nextTitle.error, "TITLE_REQUIRED"));
      }

      const nextSlug = requiredSlugSchema.safeParse(parsedPayload.slug);
      if (!nextSlug.success) {
        throw new Error(firstIssueMessage(nextSlug.error, "SLUG_REQUIRED"));
      }

      normalizedSlug = nextSlug.data;
      publishedAt =
        parsedPayload.intent === "publish_working_copy" && existingPost?.published_at
          ? existingPost.published_at
          : new Date().toISOString();
      break;
    }
  }

  await assertSlugAvailable(normalizedSlug, existingPost?.id ?? null);

  const row = postRowFromPayload(parsedPayload, {
    slug: normalizedSlug,
    status: targetStatus,
    publishedAt,
    rendered,
    readTime,
    viewerId: viewer.id,
  });

  let postId = existingPost?.id ?? null;

  if (existingPost) {
    const { error } = await supabase.from("posts").update(row).eq("id", existingPost.id).eq("author_id", viewer.id);
    if (error) {
      console.error("[savePost:update]", error);
      if (error.code === "23505") {
        throw new Error("SLUG_IN_USE");
      }
      throw new Error("SAVE_FAILED");
    }
  } else {
    const { data, error } = await supabase.from("posts").insert(row).select("id").single();
    if (error) {
      console.error("[savePost:insert]", error);
      if (error.code === "23505") {
        throw new Error("SLUG_IN_USE");
      }
      throw new Error("SAVE_FAILED");
    }

    const parsedPost = parseExternalValue(data, postIdRowSchema, `posts:inserted:${normalizedSlug}`);
    postId = parsedPost?.id ?? null;
  }

  if (!postId) {
    throw new Error("SAVE_FAILED");
  }

  await syncPostTags(postId, parsedPayload.tagIds);

  if (parsedPayload.intent === "publish_working_copy" || parsedPayload.intent === "hide_to_draft") {
    await deleteWorkingCopy(postId);
  }

  revalidatePublicContent(normalizedSlug, previousSlug);
  return {
    slug: normalizedSlug,
    visibleSlug: normalizedSlug,
    status: targetStatus,
    hasWorkingCopy: false,
  };
}

export async function deletePost(viewer: ViewerSession, slug: string) {
  const supabase = getSupabaseServer();
  const normalizedSlugResult = postSlugInputSchema.safeParse(slug);
  if (!normalizedSlugResult.success) {
    throw new Error(firstIssueMessage(normalizedSlugResult.error, "POST_NOT_FOUND"));
  }

  const normalizedSlug = normalizedSlugResult.data;

  const { data, error } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", normalizedSlug)
    .eq("author_id", viewer.id)
    .maybeSingle();

  if (error) {
    console.error("[deletePost:load]", error);
    throw new Error("DELETE_FAILED");
  }

  const parsedPost = data ? parseExternalValue(data, postIdRowSchema, `posts:delete_lookup:${viewer.id}:${normalizedSlug}`) : null;

  if (!parsedPost) {
    throw new Error("POST_NOT_FOUND");
  }

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("id", parsedPost.id)
    .eq("author_id", viewer.id);

  if (deleteError) {
    console.error("[deletePost:delete]", deleteError);
    throw new Error("DELETE_FAILED");
  }

  revalidatePublicContent(normalizedSlug, normalizedSlug);
}

function taxonomyTable(kind: "category" | "tag") {
  return kind === "category" ? "post_categories" : "post_tags";
}

function normalizeTaxonomyName(name: string | undefined) {
  const normalized = name?.trim() ?? "";
  if (!normalized) {
    throw new Error("TAXONOMY_NAME_REQUIRED");
  }

  return normalized;
}

export async function createTaxonomyTerm(kind: "category" | "tag", name: string) {
  const normalizedName = normalizeTaxonomyName(name);
  const slug = slugify(normalizedName, "");
  if (!slug) {
    throw new Error("TAXONOMY_NAME_REQUIRED");
  }

  const { data, error } = await getSupabaseServer()
    .from(taxonomyTable(kind))
    .insert({ name: normalizedName, slug })
    .select(TAXONOMY_TERM_SELECT)
    .single();

  if (error) {
    console.error("[createTaxonomyTerm]", error);
    throw new Error(error.code === "23505" ? "TAXONOMY_DUPLICATE" : "TAXONOMY_SAVE_FAILED");
  }

  const term = termFromRow(parseExternalValue(data, taxonomyTermRowSchema, `taxonomy:create:${kind}`));
  if (!term) {
    throw new Error("TAXONOMY_SAVE_FAILED");
  }

  return term;
}

export async function renameTaxonomyTerm(kind: "category" | "tag", id: string, name: string) {
  const normalizedName = normalizeTaxonomyName(name);
  const slug = slugify(normalizedName, "");
  if (!id.trim() || !slug) {
    throw new Error("TAXONOMY_NAME_REQUIRED");
  }

  const { data, error } = await getSupabaseServer()
    .from(taxonomyTable(kind))
    .update({ name: normalizedName, slug })
    .eq("id", id)
    .select(TAXONOMY_TERM_SELECT)
    .single();

  if (error) {
    console.error("[renameTaxonomyTerm]", error);
    throw new Error(error.code === "23505" ? "TAXONOMY_DUPLICATE" : "TAXONOMY_SAVE_FAILED");
  }

  const term = termFromRow(parseExternalValue(data, taxonomyTermRowSchema, `taxonomy:rename:${kind}`));
  if (!term) {
    throw new Error("TAXONOMY_SAVE_FAILED");
  }

  return term;
}

export async function archiveTaxonomyTerm(kind: "category" | "tag", id: string) {
  if (!id.trim()) {
    throw new Error("TAXONOMY_NOT_FOUND");
  }

  const { error } = await getSupabaseServer()
    .from(taxonomyTable(kind))
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[archiveTaxonomyTerm]", error);
    throw new Error("TAXONOMY_SAVE_FAILED");
  }
}

export function emptyEditorDocument(): JSONContent {
  return {
    type: "doc",
    content: [],
  };
}
