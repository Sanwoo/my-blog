import { NextResponse } from "next/server";
import { requireAuthor } from "@/lib/auth";
import { listAuthorPosts, savePost } from "@/lib/posts";
import { savePostPayloadInputSchema } from "@/lib/schemas/posts";
import { jsonError, jsonFromAuthError, jsonFromKnownError, jsonOk, readJsonBody } from "@/lib/server-api";

export async function GET() {
  try {
    const viewer = await requireAuthor();
    const posts = await listAuthorPosts(viewer.id);
    return NextResponse.json({ posts });
  } catch (error) {
    return jsonFromAuthError(error);
  }
}

export async function POST(request: Request) {
  const payload = await readJsonBody(request, savePostPayloadInputSchema);
  if (!payload) {
    return jsonError("请求体无效。", 400);
  }

  try {
    const viewer = await requireAuthor();
    const result = await savePost(viewer, payload);
    return jsonOk({ ok: true, ...result });
  } catch (error) {
    return jsonFromKnownError(
      error,
      {
        UNAUTHORIZED: { message: "请先登录。", status: 401 },
        FORBIDDEN: { message: "没有作者权限。", status: 403 },
        TITLE_REQUIRED: { message: "标题不能为空。", status: 400 },
        SLUG_REQUIRED: { message: "Slug 不能为空。", status: 400 },
        PUBLISH_AT_REQUIRED: { message: "定时发布需要设置时间。", status: 400 },
        PUBLISH_AT_INVALID: { message: "发布时间格式无效。", status: 400 },
        PUBLISH_AT_MUST_BE_FUTURE: { message: "定时发布时间必须晚于当前时间。", status: 400 },
        CATEGORY_REQUIRED: { message: "请选择文章分类。", status: 400 },
        TAG_INVALID: { message: "标签不存在或已失效。", status: 400 },
        POST_NOT_FOUND: { message: "文章不存在，或你没有权限编辑它。", status: 404 },
        SLUG_IN_USE: { message: "这个 slug 已经被其他文章占用。", status: 409 },
        SAVE_FAILED: { message: "文章保存失败。", status: 500 },
      },
      { message: "文章保存失败。", status: 500 }
    );
  }
}
