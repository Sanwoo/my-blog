import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { estimateReadingTime } from "@/lib/markdown";

const DEFAULT_AUTHOR = "Alex.Design";
const DEFAULT_AUTHOR_HANDLE = "@alex_ui_lab";
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix";

export interface PublishBody {
  title: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  slug: string;
  seoDescription?: string;
  publishAt?: string;
  content: string;
  contentFormat?: string;
}

function validateBody(body: unknown): { ok: true; data: PublishBody } | { ok: false; status: number; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, message: "Missing body" };
  }
  const b = body as Record<string, unknown>;
  const slug = typeof b.slug === "string" ? b.slug.trim() : "";
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const content = typeof b.content === "string" ? b.content : "";
  if (!slug) return { ok: false, status: 400, message: "slug is required" };
  if (!title) return { ok: false, status: 400, message: "title is required" };
  const tags = Array.isArray(b.tags) ? (b.tags as string[]) : [];
  return {
    ok: true,
    data: {
      slug,
      title,
      content,
      excerpt: typeof b.excerpt === "string" ? b.excerpt : "",
      category: typeof b.category === "string" ? b.category : "UI Design",
      seoDescription: typeof b.seoDescription === "string" ? b.seoDescription : "",
      publishAt: typeof b.publishAt === "string" ? b.publishAt : undefined,
      tags,
      contentFormat: typeof b.contentFormat === "string" ? b.contentFormat : "html",
    },
  };
}

function parsePublishAt(publishAt?: string): string | null {
  if (!publishAt || !publishAt.trim()) return null;
  const d = new Date(publishAt.trim());
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  const secret = process.env.PUBLISH_SECRET;
  if (!secret || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const validated = validateBody(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.message }, { status: validated.status });
  }

  const { data } = validated;
  const publishedAt = parsePublishAt(data.publishAt);
  const readTime = data.content ? estimateReadingTime(data.content) : null;

  const row = {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt || null,
    content: data.content || null,
    content_format: data.contentFormat || "html",
    category: data.category || null,
    category_label: data.category || null,
    author: DEFAULT_AUTHOR,
    author_handle: DEFAULT_AUTHOR_HANDLE,
    avatar: DEFAULT_AVATAR,
    published_at: publishedAt || new Date().toISOString(),
    tags: data.tags ?? [],
    seo_description: data.seoDescription || null,
    read_time: readTime,
    views: null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await getSupabaseServer()
      .from("posts")
      .upsert(row, { onConflict: "slug", ignoreDuplicates: false });

    if (error) {
      console.error("[publish] Supabase error:", error);
      return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, slug: data.slug });
  } catch (err) {
    console.error("[publish]", err);
    return NextResponse.json({ error: "Failed to save post" }, { status: 500 });
  }
}
