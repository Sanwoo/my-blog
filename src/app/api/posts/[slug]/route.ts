import { NextResponse } from "next/server";
import { requireAuthor } from "@/lib/auth";
import { deletePost, getAuthorPostBySlug } from "@/lib/posts";
import { postSlugParamsSchema } from "@/lib/schemas/posts";
import { jsonError, jsonFromAuthError, jsonFromKnownError, jsonOk, readRouteParams } from "@/lib/server-api";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  let viewer;

  try {
    viewer = await requireAuthor();
  } catch (error) {
    return jsonFromAuthError(error);
  }

  const params = await readRouteParams(context.params, postSlugParamsSchema);
  if (!params) {
    return jsonError("文章不存在。", 404);
  }

  const post = await getAuthorPostBySlug(viewer.id, params.slug);

  if (!post) {
    return jsonError("文章不存在。", 404);
  }

  return NextResponse.json({ post });
}

export async function DELETE(request: Request, context: { params: Promise<{ slug: string }> }) {
  let viewer;

  try {
    viewer = await requireAuthor();
  } catch (error) {
    return jsonFromAuthError(error);
  }

  try {
    const params = await readRouteParams(context.params, postSlugParamsSchema);
    if (!params) {
      return jsonFromKnownError(
        new Error("POST_NOT_FOUND"),
        {
          POST_NOT_FOUND: { message: "文章不存在，或你没有权限删除它。", status: 404 },
          DELETE_FAILED: { message: "删除文章失败。", status: 500 },
        },
        { message: "删除文章失败。", status: 500 }
      );
    }

    await deletePost(viewer, params.slug);
    return jsonOk();
  } catch (error) {
    return jsonFromKnownError(
      error,
      {
        POST_NOT_FOUND: { message: "文章不存在，或你没有权限删除它。", status: 404 },
        DELETE_FAILED: { message: "删除文章失败。", status: 500 },
      },
      { message: "删除文章失败。", status: 500 }
    );
  }
}
