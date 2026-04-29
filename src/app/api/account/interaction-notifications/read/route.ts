import { markInteractionNotificationsRead } from "@/lib/account";
import { requireViewer } from "@/lib/auth";
import { markNotificationsReadBodySchema } from "@/lib/schemas/account";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server-api";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const body = await readJsonBody(request, markNotificationsReadBodySchema);
    if (!body) {
      return jsonError("缺少通知标识。", 400);
    }

    await markInteractionNotificationsRead(viewer.id, "all" in body ? undefined : body.ids);
    return jsonOk();
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("请先登录。", 401);
    }

    return jsonError("更新互动消息状态失败。", 500);
  }
}
