import Image from 'next/image'
import Link from 'next/link'
import { AUTHOR_PROFILE } from '@/lib/site'
import { cn } from '@/lib/utils'

type HeroRecentNote = Array<{ slug: string; title: string; formattedDate: string }>

export function HeroIntro() {
  return (
    <section className="min-w-0 space-y-6">
      <h1 className="sr-only">首页</h1>
      <div className="flex items-center gap-4">
        <div className="relative size-16 overflow-hidden rounded-full border border-editorial-rule bg-editorial-panel shadow-sm">
          <Image src="/me.jpg" alt={AUTHOR_PROFILE.name} fill sizes="64px" className="object-cover" priority />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Hello there, I&apos;m {AUTHOR_PROFILE.name}</p>
          <p className="text-sm text-muted-foreground">{AUTHOR_PROFILE.title}</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">words with love from heart</p>
        <p className={cn('text-[clamp(2rem,1.35rem+1.8vw,3.3rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-foreground', 'max-w-5xl lg:max-w-none lg:text-[clamp(1.9rem,1.2rem+1.1vw,2.75rem)] lg:whitespace-nowrap')}>{AUTHOR_PROFILE.bio}</p>
        <p className="max-w-3xl font-serif text-[14px] leading-7 font-light tracking-[0.01em] text-muted-foreground sm:text-[15px]">{AUTHOR_PROFILE.poem}</p>
      </div>
    </section>
  )
}

export function HeroRail({ total, categoryCount, tagCount, recent }: { total: number; categoryCount: number; tagCount: number; recent: HeroRecentNote }) {
  const stats = [
    { label: 'Articles', value: total },
    { label: 'Categories', value: categoryCount },
    { label: 'Tags', value: tagCount },
  ]

  return (
    <aside className="grid min-w-0 self-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
      <section className={cn('rounded-[1.75rem] border border-editorial-rule bg-editorial-panel shadow-sm', 'min-w-0 space-y-4 p-4 sm:p-5')}>
        <div className="flex min-w-0 flex-row gap-1.5 sm:items-center justify-between sm:gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">A quiet index</p>
          <p className="min-w-0 text-xs leading-5 text-muted-foreground sm:text-right">updated with the feed</p>
        </div>
        <dl className="grid min-w-0 grid-cols-1 gap-4 min-[360px]:grid-cols-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="min-w-0 space-y-2 border-t border-editorial-rule pt-4">
              <dt className="wrap-break-word text-[11px] leading-4 uppercase tracking-[0.18em] text-muted-foreground/78">{label}</dt>
              <dd className="text-[clamp(1.55rem,1.2rem+0.8vw,2rem)] font-semibold tracking-[-0.06em] text-foreground">{String(value).padStart(2, '0')}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={cn('rounded-[1.75rem] border border-editorial-rule bg-editorial-panel shadow-sm', 'min-w-0 space-y-3 p-4 sm:p-5')}>
        <div className="space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Recent notes</p>
          <p className="text-[13px] leading-6 text-muted-foreground">四篇最近更新，适合从这里继续往下读。</p>
        </div>
        <div className="space-y-2">
          {recent.map((post) => (
            <Link key={post.slug} href={`/posts/${post.slug}`} className="group block border-t border-editorial-rule pt-2.5 transition-colors hover:text-muted-foreground">
              <span className="block text-sm leading-[1.45] text-foreground transition-colors group-hover:text-inherit">{post.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground group-hover:text-inherit/80">{post.formattedDate}</span>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  )
}

export function Hero({ total, categoryCount, tagCount, recent }: { total: number; categoryCount: number; tagCount: number; recent: HeroRecentNote }) {
  return (
    <section className={cn('grid gap-10 xl:grid-cols-[minmax(0,1.58fr)_minmax(20rem,24rem)] xl:items-start xl:gap-x-12', 'min-w-0')}>
      <HeroIntro />
      <HeroRail total={total} categoryCount={categoryCount} tagCount={tagCount} recent={recent} />
    </section>
  )
}
