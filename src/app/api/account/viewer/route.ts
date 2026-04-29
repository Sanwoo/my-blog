import { NextResponse } from "next/server";
import { buildAccountViewerResponse, getAuthenticatedAccountState } from "@/lib/account";
import { jsonError } from "@/lib/server-api";

export async function GET() {
  const accountState = await getAuthenticatedAccountState();

  if (!accountState) {
    return jsonError("请先登录。", 401);
  }

  return NextResponse.json(buildAccountViewerResponse(accountState));
}
