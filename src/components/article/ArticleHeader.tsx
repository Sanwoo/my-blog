import type { PostDetail } from '@/lib/types'

export function ArticleHeader({ post }: { post: PostDetail }) {
  return (
    <header className="max-w-180 space-y-6 border-b border-editorial-rule/80 pb-8 lg:space-y-8 lg:pb-10">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-editorial-rule bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/78">{post.category.name}</span>
          {post.tags.map((tag) => (
            <span key={tag.id} className="rounded-full border border-editorial-rule/70 bg-muted/28 px-2.5 py-1 text-xs text-muted-foreground">
              #{tag.name}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          <span>{post.formattedDate}</span>
          <span aria-hidden className="h-px w-6 bg-editorial-rule" />
          <span>{post.readTime}</span>
        </div>
      </div>

      <h1 className="font-serif text-[clamp(2.6rem,1.95rem+2.2vw,4.3rem)] font-light leading-[1.02] tracking-[-0.055em] text-foreground xl:text-[clamp(2.85rem,2.35rem+1.05vw,3.75rem)]">
        {post.title}
      </h1>

      <p className="max-w-2xl font-serif text-[1.02rem] leading-8 text-muted-foreground sm:text-[1.08rem]">{post.excerpt}</p>
    </header>
  )
}
