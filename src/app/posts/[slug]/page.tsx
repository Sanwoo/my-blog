import { notFound } from "next/navigation";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { ReadingProgress } from "@/components/article/ReadingProgress";
import { ArticleHeader } from "@/components/article/ArticleHeader";
import { ArticleBody } from "@/components/article/ArticleBody";
import { ArticleTOC } from "@/components/article/ArticleTOC";
import { CommentForm } from "@/components/article/CommentForm";
import { CommentList } from "@/components/article/CommentList";
import { RelatedArticles } from "@/components/article/RelatedArticles";
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

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Nav />
      <ReadingProgress />
      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        <ArticleHeader meta={post.meta} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 relative">
          <div className="lg:col-span-8">
            <ArticleBody content={post.content} />
          </div>
          <ArticleTOC items={post.tocItems} />
        </div>

        <div className="my-20 h-px bg-light-border dark:bg-dark-border" />

        <section className="max-w-3xl mx-auto">
          <h3 className="font-serif text-2xl font-bold mb-8 text-light-text dark:text-dark-text flex items-center gap-3">
            评论 <span className="text-base font-sans font-normal text-light-muted dark:text-dark-muted">(12)</span>
          </h3>
          <CommentForm />
          <CommentList />
        </section>

        <RelatedArticles />
      </main>
      <Footer />
    </div>
  );
}
