import { buildAccountViewerResponse, getAuthenticatedAccountState } from "@/lib/account";
import { avatarUploadBodySchema } from "@/lib/schemas/account";
import { firstIssueMessage } from "@/lib/schemas/runtime";
import { jsonError, jsonOk } from "@/lib/server-api";
import { getSupabaseServer } from "@/lib/supabase-server";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9._-]/gi, "-").replace(/-+/g, "-").slice(-80) || "avatar";
}

export async function POST(request: Request) {
  const accountState = await getAuthenticatedAccountState();

  if (!accountState) {
    return jsonError("请先登录。", 401);
  }

  const formData = await request.formData();
  const fileResult = avatarUploadBodySchema.safeParse({
    file: formData.get("file"),
  });

  if (!fileResult.success) {
    return jsonError(firstIssueMessage(fileResult.error, "请选择要上传的头像图片。"), 400);
  }

  const { file } = fileResult.data;

  const supabase = getSupabaseServer();
  const filePath = `${accountState.viewer.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[account/profile/avatar:upload]", uploadError);
    return jsonError("头像上传失败。", 500);
  }

  const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      avatar_url: publicUrlData.publicUrl,
      avatar_customized: true,
      avatar_storage_path: filePath,
    })
    .eq("id", accountState.viewer.id);

  if (profileError) {
    console.error("[account/profile/avatar:update]", profileError);
    return jsonError("头像保存失败。", 500);
  }

  if (accountState.profile.avatarStoragePath) {
    const { error: removeOldError } = await supabase.storage
      .from("avatars")
      .remove([accountState.profile.avatarStoragePath]);

    if (removeOldError) {
      console.error("[account/profile/avatar:removeOld]", removeOldError);
    }
  }

  const nextAccountState = await getAuthenticatedAccountState({ freshProfile: true });
  if (!nextAccountState) {
    return jsonError("请先登录。", 401);
  }

  return jsonOk(buildAccountViewerResponse(nextAccountState));
}
