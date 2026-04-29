import { NextResponse } from "next/server";
import { listInteractionNotifications } from "@/lib/account";
import { requireViewer } from "@/lib/auth";
import { interactionNotificationQuerySchema } from "@/lib/schemas/account";
import { jsonError, readSearchParams } from "@/lib/server-api";

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer();
    const query = readSearchParams(request, interactionNotificationQuerySchema);
    const data = await listInteractionNotifications(viewer.id, {
      summary: query?.summary === "1",
      channel: query?.channel,
    });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("请先登录。", 401);
    }

    return jsonError("读取互动消息失败。", 500);
  }
}
