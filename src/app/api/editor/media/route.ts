import { requireAuthor } from "@/lib/auth";
import { editorImageUploadSchema } from "@/lib/schemas/posts";
import { firstIssueMessage } from "@/lib/schemas/runtime";
import { jsonError, jsonOk } from "@/lib/server-api";
import { getSupabaseServer } from "@/lib/supabase-server";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-z0-9._-]/gi, "-").replace(/-+/g, "-").slice(-96) || "image";
}

export async function POST(request: Request) {
  let viewer;

  try {
    viewer = await requireAuthor();
  } catch {
    return jsonError("没有作者权限。", 403);
  }

  const formData = await request.formData();
  const fileResult = editorImageUploadSchema.safeParse({
    file: formData.get("file"),
  });

  if (!fileResult.success) {
    return jsonError(firstIssueMessage(fileResult.error, "请选择要上传的图片。"), 400);
  }

  const { file } = fileResult.data;
  const supabase = getSupabaseServer();
  const filePath = `${viewer.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from("post-images").upload(filePath, Buffer.from(arrayBuffer), {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    console.error("[editor/media:upload]", uploadError);
    return jsonError("图片上传失败。", 500);
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);

  return jsonOk({
    ok: true,
    image: {
      url: data.publicUrl,
      path: filePath,
    },
  });
}
