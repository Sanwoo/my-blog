import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { ArticleReadingProvider } from "@/components/article/ArticleReadingProvider";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { ArticleBody } from "@/components/article/ArticleBody";
import { ArticleTOC } from "@/components/article/ArticleTOC";
import { requireAuthorOrNotFound } from "@/lib/auth";
import { getAuthorPostBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = await requireAuthorOrNotFound(`/preview/${slug}`);

  const post = await getAuthorPostBySlug(author.id, slug);
  if (!post) notFound();

  return (
    <ArticleReadingProvider key={post.slug} items={post.toc}>
      <div className="min-h-screen">
        <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:gap-10 lg:pb-24 lg:pt-32">
          <div className="max-w-3xl rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-sm text-muted-foreground">
            当前为作者预览，文章状态是 <strong>{post.status}</strong>，不会对公开读者可见。
          </div>
          <ArticleHeader post={post} />
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start">
            <div className="min-w-0 max-w-3xl">
              <ArticleBody content={post.contentHtml} />
            </div>
            <ArticleTOC items={post.toc} />
          </div>
        </main>
        <Footer />
      </div>
    </ArticleReadingProvider>
  );
}
