import { requireViewer } from "@/lib/auth";
import { revalidatePublicContent } from "@/lib/cache";
import { toggleCommentLike } from "@/lib/community";
import { commentLikeParamsSchema } from "@/lib/schemas/community";
import { jsonFromKnownError, jsonOk, readRouteParams } from "@/lib/server-api";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await requireViewer();
    const params = await readRouteParams(context.params, commentLikeParamsSchema);
    if (!params) {
      return jsonFromKnownError(
        new Error("COMMENT_NOT_FOUND"),
        {
          UNAUTHORIZED: { message: "请先登录。", status: 401 },
          COMMENT_NOT_FOUND: { message: "评论不存在，或当前不可互动。", status: 404 },
        },
        { message: "点赞失败。", status: 500 }
      );
    }

    const result = await toggleCommentLike(params.id, viewer);
    revalidatePublicContent(result.postSlug);
    return jsonOk({ ok: true, liked: result.liked });
  } catch (error) {
    return jsonFromKnownError(
      error,
      {
        UNAUTHORIZED: { message: "请先登录。", status: 401 },
        COMMENT_NOT_FOUND: { message: "评论不存在，或当前不可互动。", status: 404 },
      },
      { message: "点赞失败。", status: 500 }
    );
  }
}
