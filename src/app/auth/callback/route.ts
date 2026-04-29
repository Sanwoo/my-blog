import { NextResponse } from "next/server";
import { syncProfileFromUser } from "@/lib/auth";
import { authDialogHref, safeAppPath } from "@/lib/navigation";
import { authCallbackQuerySchema } from "@/lib/schemas/auth";
import { getSupabaseAuthServer } from "@/lib/supabase-server";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

function callbackErrorMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return "登录失败，请重新试一次。";
  }

  if (normalizedMessage.includes("identity_already_exists")) {
    return "这个邮箱已经和另一个登录方式关联，请先用原来的方式登录。";
  }

  return "登录失败，请重新试一次。";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryResult = authCallbackQuerySchema.safeParse({
    next: url.searchParams.get("next") ?? undefined,
    code: url.searchParams.get("code") ?? undefined,
  });
  const query = queryResult.success ? queryResult.data : null;
  const next = safeAppPath(query?.next);
  const code = query?.code ?? null;
  const siteUrl = getSiteUrl();
  const redirectToAuthDialog = (error: string) =>
    NextResponse.redirect(new URL(authDialogHref(next, { error }), siteUrl));

  if (!code) {
    return redirectToAuthDialog("缺少登录回调参数。");
  }

  const supabase = await getSupabaseAuthServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return redirectToAuthDialog(callbackErrorMessage(error.message));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncProfileFromUser(user);
  }

  return NextResponse.redirect(new URL(next, siteUrl));
}
