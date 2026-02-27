import { getSupabaseServer } from "@/lib/supabase-server";
import type { PostMeta } from "@/data/placeholderPost";
import type { TOCItem } from "@/data/placeholderPost";
import type { ArticleCardData } from "@/components/home/ArticleCard";

const DEFAULT_READ_TIME = "8 分钟阅读";
const DEFAULT_VIEWS = "0 阅读";

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}年${m}月${day}日`;
}

function parseTocFromHtml(html: string): TOCItem[] {
  const items: TOCItem[] = [];
  const re = /<h([23])[^>]*(?:id="([^"]*)")?[^>]*>([^<]*)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const id = (m[2] ?? "").trim() || `heading-${items.length}`;
    const label = (m[3] ?? "").replace(/\s+/g, " ").trim();
    if (label) items.push({ id, label });
  }
  return items;
}

export async function getAllPosts(): Promise<ArticleCardData[]> {
  try {
    const { data, error } = await getSupabaseServer()
      .from("posts")
      .select("slug, title, excerpt, category, published_at, created_at, read_time")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[getAllPosts]", error);
      return [];
    }

  const list = (data ?? []).map((row) => {
    const dateSource = row.published_at ?? row.created_at ?? null;
    const dateStr = typeof dateSource === "string" ? dateSource : null;
    return {
      slug: row.slug ?? undefined,
      category: row.category ?? "Uncategorized",
      date: formatDate(dateStr),
      title: row.title ?? "",
      excerpt: row.excerpt ?? "",
      readTime: row.read_time ?? DEFAULT_READ_TIME,
    };
  });

  return list;
  } catch (e) {
    console.error("[getAllPosts]", e);
    return [];
  }
}

export interface PostWithContent {
  meta: PostMeta;
  content: string;
  tocItems: TOCItem[];
}

export async function getPostBySlug(slug: string): Promise<PostWithContent | null> {
  try {
    const { data, error } = await getSupabaseServer()
      .from("posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("[getPostBySlug]", error);
      return null;
    }

  if (!data) return null;

  const dateSource = data.published_at ?? data.created_at ?? null;
  const dateStr = typeof dateSource === "string" ? dateSource : null;

  const meta: PostMeta = {
    slug: data.slug ?? slug,
    title: data.title ?? "",
    category: data.category ?? "Uncategorized",
    categoryLabel: data.category_label ?? data.category ?? "Uncategorized",
    author: data.author ?? "",
    authorHandle: data.author_handle ?? "",
    avatar: data.avatar ?? "",
    date: formatDate(dateStr),
    readTime: data.read_time ?? DEFAULT_READ_TIME,
    views: data.views ?? DEFAULT_VIEWS,
  };

  const content = typeof data.content === "string" ? data.content : "";
  const tocItems = content ? parseTocFromHtml(content) : [];

  return { meta, content, tocItems };
  } catch (e) {
    console.error("[getPostBySlug]", e);
    return null;
  }
}
