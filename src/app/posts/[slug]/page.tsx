import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { ArticleBody } from "@/components/article/ArticleBody";
import { MarkdownRenderer } from "@/components/article/MarkdownRenderer";
import { ArticleTOC } from "@/components/article/ArticleTOC";
import { CommentSection } from "@/components/article/CommentSection";
import { ShareButtons } from "@/components/article/ShareButtons";
import { OnlineIndicator } from "@/components/shared/OnlineIndicator";
import { getPostBySlug, getAllPosts } from "@/lib/supabase-posts";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = await getAllPosts();
  return articles
    .filter((a) => a.slug)
    .map((a) => ({ slug: a.slug! }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const title = post.meta.title.replace(/\n/g, " ");
  return {
    title: `${title} | Echoes`,
    description: `阅读文章：${title}`,
  };
}

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const articleUrl = `${siteUrl}/posts/${slug}`;
  const articleTitle = post.meta.title.replace(/\n/g, " ");

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Nav />
      <ReadingProgress />

      <main className="pt-24 md:pt-32 pb-16 flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <ArticleHeader meta={post.meta} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center gap-12">
          {/* Main content */}
          <div className="max-w-3xl w-full">
            {post.contentFormat === "markdown" ? (
              <MarkdownRenderer content={post.content} />
            ) : (
              <ArticleBody content={post.content} />
            )}

            {/* Share & Online */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-12 pt-8 border-t border-light-border dark:border-dark-border">
              <OnlineIndicator pagePath={`/posts/${slug}`} postSlug={slug} />
              <ShareButtons title={articleTitle} url={articleUrl} />
            </div>

            {/* Comments */}
            <div className="mt-16">
              <CommentSection postSlug={slug} />
            </div>
          </div>

          {/* TOC sidebar */}
          <ArticleTOC items={post.tocItems} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
