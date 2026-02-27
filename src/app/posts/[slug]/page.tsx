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
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        <ArticleHeader meta={post.meta} />

        <div className="flex items-center justify-between mb-8 max-w-4xl">
          <OnlineIndicator pagePath={`/posts/${slug}`} postSlug={slug} />
          <ShareButtons title={articleTitle} url={articleUrl} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
          <div className="lg:col-span-8">
            {post.contentFormat === "markdown" ? (
              <MarkdownRenderer content={post.content} />
            ) : (
              <ArticleBody content={post.content} />
            )}
          </div>
          <ArticleTOC items={post.tocItems} />
        </div>

        <div className="my-20 h-px bg-light-border dark:bg-dark-border" />

        <CommentSection postSlug={slug} />
      </main>
      <Footer />
    </div>
  );
}
