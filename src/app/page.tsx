import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { ArticleList } from "@/components/home/ArticleList";
import { Sidebar } from "@/components/home/Sidebar";
import { getAllPosts } from "@/lib/supabase-posts";

export default async function Home() {
  const articles = await getAllPosts();
  return (
    <div className="min-h-screen flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <Nav />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-grow">
        <Hero />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <main className="lg:col-span-9">
            <ArticleList articles={articles} />
          </main>
          <Sidebar />
        </div>
      </div>
      <Footer />
    </div>
  );
}
