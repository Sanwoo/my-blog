import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { ArticleList } from "@/components/home/ArticleList";
import { Sidebar } from "@/components/home/Sidebar";
import { ScrollFadeIn } from "@/components/shared/ScrollFadeIn";
import { getAllPosts } from "@/lib/supabase-posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await getAllPosts();
  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Nav />
      <div className="flex-grow">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <Hero />

          <div className="border-t border-light-border/40 dark:border-dark-border/40" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 py-16 md:py-20">
            <main className="lg:col-span-7">
              <ScrollFadeIn>
                <ArticleList articles={articles} />
              </ScrollFadeIn>
            </main>
            <ScrollFadeIn delay={150}>
              <Sidebar />
            </ScrollFadeIn>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
