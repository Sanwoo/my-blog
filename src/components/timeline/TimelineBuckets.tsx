import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { TimelineSeasonBucket } from '@/lib/types'
import { cn } from '@/lib/utils'

function TimelineEntryRow({ slug, title, excerpt, formattedDate, readTime, commentCount, reactionCount }: TimelineSeasonBucket['items'][number]) {
  return (
    <article className="home-content-visibility relative pl-8">
      <span aria-hidden className="absolute left-0 top-3 size-3 rounded-full border border-editorial-rule bg-background" />
      <div className="grid gap-3 border-b border-editorial-rule/80 pb-6 sm:grid-cols-[minmax(0,1fr)_10rem] sm:gap-5">
        <div className="min-w-0 space-y-3">
          <p className="text-xs tracking-[0.16em] text-muted-foreground/72 uppercase">{formattedDate}</p>
          <Link
            href={`/posts/${slug}`}
            className="block text-balance text-[clamp(1.15rem,1.02rem+0.45vw,1.55rem)] font-medium leading-[1.18] tracking-[-0.04em] text-foreground transition-colors hover:text-muted-foreground"
          >
            {title}
          </Link>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-[15px]">{excerpt}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:flex-col sm:items-start sm:justify-between sm:gap-2 sm:text-sm">
          <div className="space-y-1">
            <p>{readTime}</p>
            <p>{commentCount} 条评论</p>
            <p>{reactionCount} 次欣赏</p>
          </div>
          <Link href={`/posts/${slug}`} className="inline-flex items-center gap-2 font-medium text-foreground transition-colors hover:text-muted-foreground">
            阅读
            <ArrowUpRight width={15} height={15} aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function TimelineBuckets({ buckets, mode }: { buckets: TimelineSeasonBucket[]; mode: 'preview' | 'full' }) {
  return (
    <div className={cn('space-y-10 sm:space-y-12', mode === 'full' && 'space-y-12 sm:space-y-16')}>
      {buckets.map((bucket) => (
        <section key={bucket.id} id={mode === 'full' ? bucket.id : undefined} className="scroll-mt-28 border-t border-editorial-rule pt-7 sm:pt-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-10">
            <div className="space-y-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">{mode === 'full' ? 'Season archive' : 'Season preview'}</p>
              <div className="space-y-2">
                <h2 className="font-serif text-[clamp(2.2rem,1.8rem+1vw,3rem)] font-light tracking-[-0.05em] text-foreground">{bucket.season}</h2>
                <p className="text-sm leading-7 text-muted-foreground">{bucket.rangeLabel}</p>
              </div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground/72">{bucket.itemCount} 篇文章</p>
            </div>

            <div className="relative pl-6 before:absolute before:left-[5px] before:top-3 before:bottom-0 before:w-px before:bg-editorial-rule">
              <div className="space-y-6">
                {bucket.items.map((item) => (
                  <TimelineEntryRow key={item.id} {...item} />
                ))}
              </div>

              {mode === 'preview' && bucket.remainingCount > 0 ? (
                <div className="pt-5 pl-8">
                  <Link href={`/timeline#${bucket.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground">
                    还剩 {bucket.remainingCount} 篇
                    <ArrowUpRight width={15} height={15} aria-hidden />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ))}
    </div>
  )
}
