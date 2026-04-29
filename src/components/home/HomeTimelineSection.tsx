import Link from 'next/link'
import { TimelineBuckets } from '@/components/timeline/TimelineBuckets'
import { cn } from '@/lib/utils'
import type { HomeTimelinePreview as HomeTimelinePreviewData } from '@/lib/types'

export function HomeTimelineSection({ preview }: { preview: HomeTimelinePreviewData }) {
  if (preview.buckets.length === 0) {
    return (
      <section id="timeline-preview" className="w-full min-w-0 space-y-6 border-t border-editorial-rule pt-7">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Seasonal timeline</p>
          <h2 className={cn('text-[clamp(2rem,1.35rem+1.8vw,3.3rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-foreground', 'max-w-3xl text-[clamp(2rem,1.45rem+1.4vw,3rem)]')}>时间线会从第一篇已发布文章开始。</h2>
          <p className={cn('text-[15px] leading-7 text-muted-foreground sm:text-[15.5px]', 'max-w-2xl')}>当前还没有可展示的时间线内容。</p>
        </div>
      </section>
    )
  }

  return (
    <section id="timeline-preview" className="w-full min-w-0 space-y-2">
      <div className="flex flex-col gap-4 border-editorial-rule pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Seasonal timeline</p>
          <h2 className={cn('text-[clamp(2rem,1.35rem+1.8vw,3.3rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-foreground', 'max-w-3xl text-[clamp(2rem,1.45rem+1.4vw,3rem)]')}>笔耕不辍</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm text-muted-foreground">{preview.total} 篇已发布文章</p>
          <Link href="/timeline" className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground">
            查看完整时间线
          </Link>
        </div>
      </div>

      <TimelineBuckets buckets={preview.buckets} mode="preview" />
    </section>
  )
}
