import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { ArticleList } from "@/components/home/ArticleList";
import { Sidebar } from "@/components/home/Sidebar";
import { getAllPosts } from "@/lib/supabase-posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const articles = await getAllPosts();
  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Nav />
      <div className="pt-14 flex-grow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Hero />
          <div className="border-t border-light-border dark:border-dark-border" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 py-12">
            <main className="lg:col-span-7">
              <ArticleList articles={articles} />
            </main>
            <Sidebar />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
