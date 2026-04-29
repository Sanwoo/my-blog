import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import type { LatestCommentPreview } from '@/lib/types'

export function RecentCommentsSection({ comments }: { comments: LatestCommentPreview[] }) {
  return (
    <section id="latest-comments" className="min-w-0 w-full scroll-mt-28 sm:scroll-mt-32">
      <aside className="grid min-w-0 w-full gap-4 xl:sticky xl:top-28">
        <section className="min-w-0 w-full space-y-4 border-t border-editorial-rule pt-5">
          <div className="min-w-0 space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Latest comments</p>
            <h2 className="text-[clamp(1.7rem,1.4rem+0.7vw,2.15rem)] font-semibold tracking-[-0.05em] text-foreground">最近来信</h2>
          </div>
        </section>

        {comments.length > 0 ? (
          <div className="min-w-0 w-full space-y-5">
            {comments.map((comment) => (
              <Link
                key={comment.commentId}
                href={`/posts/${comment.postSlug}#comment-${comment.commentId}`}
                className="group block min-w-0 w-full border-t border-editorial-rule pt-5 transition-colors hover:text-muted-foreground"
              >
                <div className="flex min-w-0 w-full items-start gap-3">
                  <ProfileAvatar profile={comment.author} className="size-10" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <span className="min-w-0 wrap-break-word font-medium text-foreground">{comment.author.displayName}</span>
                      <span className="min-w-0 break-all">{comment.author.handle}</span>
                      <span className="min-w-0">{comment.formattedDateTime}</span>
                    </div>
                    <p className="wrap-break-word text-sm leading-7 text-muted-foreground group-hover:text-inherit/82">{comment.bodySnippet}</p>
                    <div className="flex min-w-0 items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground group-hover:text-inherit/72">
                      <MessageSquare width={14} height={14} aria-hidden />
                      <span className="min-w-0 truncate">《{comment.postTitle}》</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <section className="min-w-0 w-full space-y-3 border-t border-editorial-rule pt-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">No comments yet</p>
            <p className="text-[15px] leading-7 text-muted-foreground sm:text-[15.5px]">暂无来信。</p>
          </section>
        )}
      </aside>
    </section>
  )
}
