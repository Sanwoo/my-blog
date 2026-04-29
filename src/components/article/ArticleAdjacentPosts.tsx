'use client'

import Link from 'next/link'
import type { AdjacentPosts, PostCard } from '@/lib/types'
import { useArticleMobilePanel } from '@/components/article/ArticleReadingProvider'
import { cn } from '@/lib/utils'

const timelineNeighborCount = 4
const mobilePanelContainerClassName =
  'absolute inset-x-0 top-[calc(100%+0.75rem)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'
const mobilePanelCardClassName =
  'max-h-[min(70vh,24rem)] overflow-y-auto rounded-2xl border border-border/70 bg-card/92 p-4 shadow-lg backdrop-blur-xl'

type TimelinePost = Pick<PostCard, 'slug' | 'title'> & {
  key: string
  isCurrent?: boolean
}

function TimelinePostItem({
  post,
  isLast,
  showTopConnector,
  showBottomConnector,
  onNavigate,
}: {
  post: TimelinePost
  isLast: boolean
  showTopConnector: boolean
  showBottomConnector: boolean
  onNavigate?: () => void
}) {
  const titleClassName = cn('block truncate text-[13px] leading-6 transition-colors', post.isCurrent ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground')

  return (
    <li className={cn('relative min-w-0 pl-4', !isLast && 'pb-2.5')}>
      {showTopConnector ? <span aria-hidden className="absolute left-0 top-0 h-3.5 border-l border-editorial-rule/70" /> : null}
      {showBottomConnector ? <span aria-hidden className="absolute bottom-0 left-0 top-3.5 border-l border-editorial-rule/70" /> : null}
      <span
        aria-hidden
        className={cn('absolute left-0 top-2.5 size-2 -translate-x-[calc(50%-0.5px)] rounded-full border bg-background', post.isCurrent ? 'border-foreground bg-foreground' : 'border-editorial-rule')}
      />
      {post.isCurrent ? (
        <span aria-current="page" className={titleClassName}>
          {post.title}
        </span>
      ) : (
        <Link href={`/posts/${post.slug}`} className={cn('block min-w-0', titleClassName)} onClick={onNavigate}>
          {post.title}
        </Link>
      )}
    </li>
  )
}

function TimelinePostList({ posts, onNavigate }: { posts: TimelinePost[]; onNavigate?: () => void }) {
  return (
    <ol className="relative">
      {posts.map((post, index) => (
        <TimelinePostItem
          key={post.key}
          post={post}
          isLast={index === posts.length - 1}
          showTopConnector={index > 0}
          showBottomConnector={index < posts.length - 1}
          onNavigate={onNavigate}
        />
      ))}
    </ol>
  )
}

function createTimelinePosts(posts: AdjacentPosts, currentPost: Pick<PostCard, 'slug' | 'title'>): TimelinePost[] {
  const previousPosts = [...posts.newer].slice(0, timelineNeighborCount).reverse()
  const nextPosts = posts.older.slice(0, timelineNeighborCount)

  const previous = previousPosts.map((post) => ({ key: `previous-${post.slug}`, slug: post.slug, title: post.title }))
  const next = nextPosts.map((post) => ({ key: `next-${post.slug}`, slug: post.slug, title: post.title }))

  return [...previous, { key: `current-${currentPost.slug}`, slug: currentPost.slug, title: currentPost.title, isCurrent: true }, ...next]
}

export function ArticleAdjacentPosts({ posts, currentPost, mode = 'all' }: { posts: AdjacentPosts; currentPost: Pick<PostCard, 'slug' | 'title'>; mode?: 'all' | 'mobile' | 'desktop' }) {
  const { closePanel, open, panelId, togglePanel } = useArticleMobilePanel('adjacent')
  const mobileTimelinePosts = createTimelinePosts(posts, currentPost)
  const desktopTimelinePosts = mobileTimelinePosts
  const postCount = mobileTimelinePosts.length

  const mobileContent = (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Read more</p>
      <TimelinePostList posts={mobileTimelinePosts} onNavigate={closePanel} />
    </div>
  )

  const desktopContent = (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Read more</p>
      <TimelinePostList posts={desktopTimelinePosts} />
    </div>
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
              aria-label={open ? '收起其他文章' : '展开其他文章'}
              aria-controls={panelId}
              aria-expanded={open}
              onClick={togglePanel}
            >
              <span>其他文章</span>
              <span className="text-xs text-muted-foreground">{postCount} 篇</span>
            </button>
            <div
              className={cn(
                mobilePanelContainerClassName,
                open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
              )}
              aria-hidden={!open}
            >
              <div id={panelId} role="region" aria-label="其他文章" className={mobilePanelCardClassName}>
                {mobileContent}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'all' || mode === 'desktop' ? <aside className="hidden xl:block xl:sticky xl:top-24 2xl:top-28">{desktopContent}</aside> : null}
    </>
  )
}
