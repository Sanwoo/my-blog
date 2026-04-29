import { NextResponse } from "next/server";
import { getOptionalAuthenticatedUser, requireViewer } from "@/lib/auth";
import { revalidatePublicContent } from "@/lib/cache";
import { createCommentForSlug, getCommentsForPost } from "@/lib/community";
import { getPublicPostLookupBySlug } from "@/lib/posts";
import { commentsQuerySchema, createCommentBodySchema } from "@/lib/schemas/community";
import { jsonError, jsonFromKnownError, jsonOk, readJsonBody, readSearchParams } from "@/lib/server-api";

export async function GET(request: Request) {
  const query = readSearchParams(request, commentsQuerySchema);
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
  const comments = await getCommentsForPost(post.id, viewer?.id);

  return NextResponse.json({ comments });
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, createCommentBodySchema);
  if (!body) {
    return jsonError("请求体无效。", 400);
  }

  try {
    const viewer = await requireViewer();
    const comment = await createCommentForSlug(body.slug, body.body ?? "", viewer, body.parentId ?? null);
    revalidatePublicContent(body.slug);
    return jsonOk({ ok: true, comment });
  } catch (error) {
    return jsonFromKnownError(
      error,
      {
        UNAUTHORIZED: { message: "请先登录。", status: 401 },
        BODY_REQUIRED: { message: "评论内容不能为空。", status: 400 },
        INVALID_PARENT: { message: "回复目标无效。", status: 400 },
        POST_NOT_FOUND: { message: "文章不存在。", status: 404 },
      },
      { message: "评论发布失败。", status: 500 }
    );
  }
}
