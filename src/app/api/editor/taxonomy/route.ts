import { NextResponse } from "next/server";
import { requireAuthor } from "@/lib/auth";
import { archiveTaxonomyTerm, createTaxonomyTerm, listEditorTaxonomy, renameTaxonomyTerm } from "@/lib/posts";
import { taxonomyMutationBodySchema } from "@/lib/schemas/posts";
import { jsonError, jsonFromAuthError, jsonFromKnownError, jsonOk, readJsonBody } from "@/lib/server-api";

const taxonomyErrors = {
  UNAUTHORIZED: { message: "请先登录。", status: 401 },
  FORBIDDEN: { message: "没有作者权限。", status: 403 },
  TAXONOMY_NAME_REQUIRED: { message: "名称不能为空。", status: 400 },
  TAXONOMY_DUPLICATE: { message: "名称或 slug 已存在。", status: 409 },
  TAXONOMY_NOT_FOUND: { message: "分类或标签不存在。", status: 404 },
  TAXONOMY_SAVE_FAILED: { message: "分类标签保存失败。", status: 500 },
};

export async function GET() {
  try {
    await requireAuthor();
    return NextResponse.json(await listEditorTaxonomy());
  } catch (error) {
    return jsonFromAuthError(error);
  }
}

export async function POST(request: Request) {
  const body = await readJsonBody(request, taxonomyMutationBodySchema);
  if (!body?.name) {
    return jsonError("名称不能为空。", 400, "TAXONOMY_NAME_REQUIRED");
  }

  try {
    await requireAuthor();
    const term = await createTaxonomyTerm(body.kind, body.name);
    return jsonOk({ ok: true, term });
  } catch (error) {
    return jsonFromKnownError(error, taxonomyErrors, { message: "分类标签保存失败。", status: 500 });
  }
}

export async function PATCH(request: Request) {
  const body = await readJsonBody(request, taxonomyMutationBodySchema);
  if (!body?.id || !body.name) {
    return jsonError("名称不能为空。", 400, "TAXONOMY_NAME_REQUIRED");
  }

  try {
    await requireAuthor();
    const term = await renameTaxonomyTerm(body.kind, body.id, body.name);
    return jsonOk({ ok: true, term });
  } catch (error) {
    return jsonFromKnownError(error, taxonomyErrors, { message: "分类标签保存失败。", status: 500 });
  }
}

export async function DELETE(request: Request) {
  const body = await readJsonBody(request, taxonomyMutationBodySchema);
  if (!body?.id) {
    return jsonError("分类或标签不存在。", 404, "TAXONOMY_NOT_FOUND");
  }

  try {
    await requireAuthor();
    await archiveTaxonomyTerm(body.kind, body.id);
    return jsonOk();
  } catch (error) {
    return jsonFromKnownError(error, taxonomyErrors, { message: "分类标签保存失败。", status: 500 });
  }
}
