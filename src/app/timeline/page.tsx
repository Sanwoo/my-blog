import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { TimelineBuckets } from '@/components/timeline/TimelineBuckets'
import { buildTimelineBuckets, getTimelineEntries } from '@/lib/posts'
import { cn } from '@/lib/utils'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Timeline',
  description: '按季度浏览所有已发布文章的时间线归档。',
}

export default async function TimelinePage() {
  const entries = await getTimelineEntries()
  const buckets = buildTimelineBuckets(entries)

  return (
    <div className="min-h-screen">
      <main className="mx-auto flex w-full max-w-[1360px] flex-col gap-[clamp(4rem,7vw,7rem)] px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
        <section className="space-y-5 border-editorial-rule">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Timeline</p>
          <p className="text-6xl">
            {entries.length} <span className="text-muted-foreground text-base">篇已发布文章</span>
          </p>
        </section>

        <div className="mx-auto w-full max-w-[1180px]">
          {buckets.length > 0 ? (
            <TimelineBuckets buckets={buckets} mode="full" />
          ) : (
            <section className="space-y-3 border-t border-editorial-rule pt-8">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">No timeline yet</p>
              <p className={cn('text-[15px] leading-7 text-muted-foreground sm:text-[15.5px]', 'max-w-2xl')}>还没有已发布文章。</p>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
