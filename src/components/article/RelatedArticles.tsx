import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PostCard } from "@/lib/types";

export function RelatedArticles({ posts }: { posts: PostCard[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Related reads</p>
        <h2 className="text-[clamp(1.55rem,1.2rem+1vw,2.2rem)] font-semibold leading-tight tracking-[-0.04em] text-foreground">继续往下读</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post, index) => (
          <Link key={post.slug} href={`/posts/${post.slug}`} className="block">
            <Card className="h-full transition-colors hover:bg-accent hover:text-accent-foreground">
              <CardContent className="flex h-full gap-4 p-5">
                <span className="pt-1 text-sm font-medium tracking-[0.18em] text-muted-foreground/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="space-y-3">
                  <Badge>{post.category.name}</Badge>
                  <h3 className="text-balance text-lg font-semibold leading-tight tracking-[-0.04em] text-foreground">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-7 text-muted-foreground">{post.excerpt}</p>
                  <span className="text-xs text-muted-foreground">
                    {post.formattedDate} · {post.readTime}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
