import { NextResponse } from "next/server";
import { getOptionalAuthenticatedUser, requireViewer } from "@/lib/auth";
import { revalidatePublicContent } from "@/lib/cache";
import { getReactionSummary, togglePostReaction } from "@/lib/community";
import { getPublicPostLookupBySlug } from "@/lib/posts";
import { reactionsQuerySchema, toggleReactionBodySchema } from "@/lib/schemas/community";
import { jsonError, jsonFromKnownError, jsonOk, readJsonBody, readSearchParams } from "@/lib/server-api";

export async function GET(request: Request) {
  const query = readSearchParams(request, reactionsQuerySchema);
  if (!query) {
    return jsonError("缺少 slug。", 400);
  }

  const postPromise = getPublicPostLookupBySlug(query.slug);
  const viewerPromise =
    query.viewer && query.viewer !== "anon"
      ? getOptionalAuthenticatedUser()
      : Promise.resolve(null);
  const post = await postPromise;
  if (!post) {
    return jsonError("文章不存在。", 404);
  }

  const viewer = await viewerPromise;
  const summary = await getReactionSummary(post.id, post.reactionCount, viewer?.id);
  return NextResponse.json({ summary });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, toggleReactionBodySchema);
  if (!body) {
    return jsonError("请求体无效。", 400);
  }

  try {
    const viewer = await requireViewer();
    const result = await togglePostReaction(body.slug, viewer);
    revalidatePublicContent(body.slug);
    return jsonOk({
      ok: true,
      reacted: result.reacted,
      summary: {
        count: result.reactionCount,
        reactedByViewer: result.reacted,
      },
    });
  } catch (error) {
    return jsonFromKnownError(
      error,
      {
        UNAUTHORIZED: { message: "请先登录。", status: 401 },
        POST_NOT_FOUND: { message: "文章不存在。", status: 404 },
      },
      { message: "互动失败。", status: 500 }
    );
  }
}
