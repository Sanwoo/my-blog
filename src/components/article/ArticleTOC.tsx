'use client'

import Link from 'next/link'
import type { TocItem } from '@/lib/types'
import { useArticleMobilePanel, useArticleReading } from '@/components/article/ArticleReadingProvider'
import { cn } from '@/lib/utils'

const progressRingRadius = 16
const progressRingCircumference = 2 * Math.PI * progressRingRadius
const mobilePanelContainerClassName =
  'absolute inset-x-0 top-[calc(100%+0.75rem)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
const mobilePanelCardClassName =
  'max-h-[min(70vh,24rem)] overflow-y-auto rounded-2xl border border-border/70 bg-card/92 p-3 shadow-lg backdrop-blur-xl'

function ProgressPill({ progress }: { progress: number }) {
  const normalizedProgress = Math.max(0, Math.min(100, progress))
  const dashOffset = progressRingCircumference * (1 - normalizedProgress / 100)

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="size-4 shrink-0">
        <svg viewBox="0 0 40 40" className="size-full" aria-hidden>
          <circle
            cx="20"
            cy="20"
            r={progressRingRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-editorial-rule/75"
          />
          <circle
            cx="20"
            cy="20"
            r={progressRingRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={progressRingCircumference}
            strokeDashoffset={dashOffset}
            className="-rotate-90 origin-center text-foreground/82 transition-[stroke-dashoffset] duration-300 ease-out"
          />
        </svg>
      </div>
      <span className="inline-flex w-[2.7rem] justify-end text-[11px] font-medium tabular-nums tracking-[0.18em] text-foreground/86">
        {normalizedProgress}%
      </span>
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] text-muted-foreground/82">
        <span aria-hidden className="h-px w-3 bg-editorial-rule" />
        已读
      </span>
    </div>
  )
}

export function ArticleTOC({ items, mode = 'all' }: { items: TocItem[]; mode?: 'all' | 'mobile' | 'desktop' | 'panel' }) {
  const { activeId, progress } = useArticleReading()
  const { closePanel, open, panelId, togglePanel } = useArticleMobilePanel('toc')
  const visibleActiveId = activeId && items.some((item) => item.id === activeId) ? activeId : (items[0]?.id ?? null)

  if (items.length === 0) return null

  const mobileTocLinkClassName = (active: boolean, level: TocItem['level']) =>
    cn(
      'block rounded-xl px-3 py-2 text-sm leading-6 transition-colors',
      level === 3 && 'pl-5 text-[13px]',
      active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground',
    )

  const desktopTocLinkClassName = (active: boolean, level: TocItem['level']) =>
    cn(
      'block border-l py-1.5 pl-3 text-sm leading-6 transition-colors',
      level === 3 && 'ml-3 pl-4 text-[13px]',
      active ? 'border-foreground/44 text-foreground' : 'border-transparent text-muted-foreground hover:border-editorial-rule hover:text-foreground/84',
    )

  const panelTocLinkClassName = (active: boolean, level: TocItem['level']) =>
    cn(
      'block rounded-2xl px-3 py-2.5 text-sm leading-6 transition-colors',
      level === 3 && 'pl-5 text-[13px]',
      active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/55 hover:text-foreground',
    )

  return (
    <>
      {mode === 'all' || mode === 'mobile' ? (
        <div className={cn('relative xl:hidden', open && 'z-30')}>
          {open ? <div className="pointer-events-auto fixed inset-0 z-10 bg-transparent xl:hidden" aria-hidden onClick={closePanel} /> : null}
          <div className="relative z-20">
            <button
              type="button"
              className="flex w-full cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-card/85 px-4 py-3 text-sm font-medium text-foreground shadow-xs transition-[background-color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              aria-label={open ? '收起本页目录' : '展开本页目录'}
              aria-controls={panelId}
              aria-expanded={open}
              onClick={togglePanel}
            >
              <span>本页目录</span>
              <span className="text-xs text-muted-foreground">
                {progress}% · {items.length} 节
              </span>
            </button>
            <div
              className={cn(
                mobilePanelContainerClassName,
                open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
              )}
              aria-hidden={!open}
            >
              <div id={panelId} role="region" aria-label="本页目录" className={mobilePanelCardClassName}>
                <nav aria-label="文章目录" className="space-y-1">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className={mobileTocLinkClassName(visibleActiveId === item.id, item.level)}
                      onClick={closePanel}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'panel' ? (
        <details className="rounded-[1.6rem] border border-border/70 bg-muted/20">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 marker:content-none sm:px-5">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">On this page</p>
              <p className="text-sm font-medium text-foreground">目录与阅读进度</p>
            </div>
            <ProgressPill progress={progress} />
          </summary>
          <div className="space-y-1 border-t border-border/70 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
            {items.map((item) => (
              <Link key={item.id} href={`#${item.id}`} className={panelTocLinkClassName(visibleActiveId === item.id, item.level)}>
                {item.label}
              </Link>
            ))}
          </div>
        </details>
      ) : null}

      {mode === 'all' || mode === 'desktop' ? (
        <aside className="hidden xl:block xl:sticky xl:top-24 2xl:top-28">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">On this page</p>
              <ProgressPill progress={progress} />
            </div>
            <nav aria-label="文章目录" className="space-y-1">
              {items.map((item) => (
                <Link key={item.id} href={`#${item.id}`} className={desktopTocLinkClassName(visibleActiveId === item.id, item.level)}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
      ) : null}
    </>
  )
}
