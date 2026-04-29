import { buildAccountViewerResponse, getAuthenticatedAccountState, updateAccountDisplayName } from "@/lib/account";
import { accountProfileBodySchema } from "@/lib/schemas/account";
import { jsonError, jsonOk, readJsonBody } from "@/lib/server-api";

export async function PATCH(request: Request) {
  const accountState = await getAuthenticatedAccountState();

  if (!accountState) {
    return jsonError("请先登录。", 401);
  }

  const body = await readJsonBody(request, accountProfileBodySchema);
  if (!body) {
    return jsonError("请求体无效。", 400);
  }

  try {
    if (body.displayName !== undefined) {
      await updateAccountDisplayName(accountState.viewer, body.displayName);
    }

    const nextAccountState = await getAuthenticatedAccountState({ freshProfile: true });
    if (!nextAccountState) {
      return jsonError("请先登录。", 401);
    }

    return jsonOk(buildAccountViewerResponse(nextAccountState));
  } catch (error) {
    if (error instanceof Error && error.message === "DISPLAY_NAME_REQUIRED") {
      return jsonError("昵称不能为空。", 400);
    }

    if (error instanceof Error && error.message === "DISPLAY_NAME_TOO_LONG") {
      return jsonError("昵称最多 40 个字符。", 400);
    }

    return jsonError("资料更新失败。", 500);
  }
}
