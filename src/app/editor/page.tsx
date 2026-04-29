import { notFound } from "next/navigation";
import { EditorScreen } from "@/components/editor/EditorScreen";
import { requireAuthorOrNotFound } from "@/lib/auth";
import { getAuthorPostBySlug, listAuthorPosts, listEditorTaxonomy } from "@/lib/posts";
import { editorPageSearchParamsSchema } from "@/lib/schemas/posts";
import { readSearchParams } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const slug = readSearchParams(params, editorPageSearchParamsSchema)?.slug ?? "";
  const author = await requireAuthorOrNotFound(slug ? `/editor?slug=${slug}` : "/editor");

  const [initialPost, authorPosts, taxonomy] = await Promise.all([
    slug ? getAuthorPostBySlug(author.id, slug) : Promise.resolve(null),
    listAuthorPosts(author.id),
    listEditorTaxonomy(),
  ]);

  if (slug && !initialPost) {
    notFound();
  }

  return (
    <EditorScreen
      key={`${initialPost?.slug ?? "new"}:${initialPost?.workingCopyUpdatedAt ?? "base"}`}
      initialPost={initialPost}
      initialPosts={authorPosts}
      initialTaxonomy={taxonomy}
    />
  );
}
