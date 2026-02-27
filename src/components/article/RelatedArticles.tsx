import Link from "next/link";
import Image from "next/image";
import type { RelatedPost } from "@/data/placeholderRelatedPosts";
import { placeholderRelatedPosts } from "@/data/placeholderRelatedPosts";

function RelatedCard({ post }: { post: RelatedPost }) {
  return (
    <Link href={post.href} className="group block">
      <div className="aspect-[16/10] bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden mb-4 relative">
        <Image
          src={post.image}
          alt=""
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
      </div>
      <h4 className="font-serif text-xl font-bold mb-2 group-hover:text-light-accent dark:group-hover:text-dark-accent transition-colors text-light-text dark:text-dark-text">
        {post.title}
      </h4>
      <p className="text-sm text-light-muted dark:text-dark-muted line-clamp-2">
        {post.excerpt}
      </p>
    </Link>
  );
}

export function RelatedArticles({
  posts = placeholderRelatedPosts,
}: {
  posts?: RelatedPost[];
}) {
  return (
    <section className="mt-24">
      <h3 className="font-serif text-2xl font-bold mb-8 text-light-text dark:text-dark-text">
        相关推荐
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {posts.map((post, i) => (
          <RelatedCard key={i} post={post} />
        ))}
      </div>
    </section>
  );
}
