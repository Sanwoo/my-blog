'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { CornerDownRight, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { ArticleShareControls } from '@/components/article/ArticleShareControls'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ReactionButton } from '@/components/reaction/ReactionButton'
import { fetchJson } from '@/lib/client/http'
import { useAuth } from '@/components/providers/AuthProvider'
import { commentLikeResponseSchema, commentsResponseSchema, createCommentResponseSchema, reactionSummaryResponseSchema, toggleReactionResponseSchema } from '@/lib/schemas/community'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { CommentNode } from '@/lib/types'
import { cn } from '@/lib/utils'

function stripViewerCommentState(comments: CommentNode[]): CommentNode[] {
  return comments.map((comment) => ({
    ...comment,
    likedByViewer: false,
    replies: stripViewerCommentState(comment.replies),
  }))
}

function resolveArticleViewerKey({ initialViewerKey, viewerId, authLoading }: { initialViewerKey: string; viewerId?: string | null; authLoading: boolean }) {
  if (viewerId) {
    return viewerId
  }

  if (authLoading) {
    return initialViewerKey
  }

  return 'anon'
}

function buildCommentsKey(slug: string, viewerKey: string) {
  return `/api/comments?slug=${encodeURIComponent(slug)}&viewer=${encodeURIComponent(viewerKey)}`
}

function buildReactionsKey(slug: string, viewerKey: string) {
  return `/api/reactions?slug=${encodeURIComponent(slug)}&viewer=${encodeURIComponent(viewerKey)}`
}

function shouldRevalidateHydratedData(currentViewerKey: string, initialViewerKey: string) {
  return currentViewerKey !== initialViewerKey
}

function fetchComments(url: string) {
  return fetchJson(url, undefined, 'COMMENTS_FETCH_FAILED', commentsResponseSchema)
}

function insertComment(comments: CommentNode[], nextComment: CommentNode, parentId: string | null): CommentNode[] {
  if (!parentId) return [...comments, nextComment]

  let inserted = false
  const nextComments = comments.map((comment) => {
    const belongsToThread = comment.id === parentId || comment.replies.some((reply) => reply.id === parentId)

    if (!belongsToThread) {
      return comment
    }

    inserted = true
    return {
      ...comment,
      replies: [...comment.replies, nextComment],
    }
  })

  return inserted ? nextComments : [...nextComments, nextComment]
}

function replaceComment(comments: CommentNode[], tempId: string, nextComment: CommentNode): { comments: CommentNode[]; replaced: boolean } {
  let replaced = false
  const nextComments = comments.map((comment) => {
    if (comment.id === tempId) {
      replaced = true
      return nextComment
    }

    const replacedReplies = replaceComment(comment.replies, tempId, nextComment)
    if (replacedReplies.replaced) {
      replaced = true
      return {
        ...comment,
        replies: replacedReplies.comments,
      }
    }

    return comment
  })

  return {
    comments: nextComments,
    replaced,
  }
}

function replaceOrInsertComment(comments: CommentNode[], tempId: string, nextComment: CommentNode, parentId: string | null) {
  const replaced = replaceComment(comments, tempId, nextComment)
  return replaced.replaced ? replaced.comments : insertComment(comments, nextComment, parentId)
}

function updateLike(comments: CommentNode[], commentId: string, liked: boolean): CommentNode[] {
  return comments.map((comment) => {
    if (comment.id === commentId) {
      return {
        ...comment,
        likedByViewer: liked,
        likes: Math.max(0, comment.likes + (liked ? 1 : -1)),
      }
    }

    return {
      ...comment,
      replies: updateLike(comment.replies, commentId, liked),
    }
  })
}

const COMMENT_TIME_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function formatCommentTime(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '刚刚'

  return COMMENT_TIME_FORMATTER.format(parsed)
}

function countComments(nodes: CommentNode[]): number {
  return nodes.reduce((total, node) => total + 1 + countComments(node.replies), 0)
}

function createOptimisticComment(
  viewer: {
    id: string
    displayName: string
    handle: string
    avatarUrl: string | null
    isAuthor: boolean
  },
  body: string,
  replyTarget?: CommentNode | null,
): CommentNode {
  return {
    id: `temp-${Date.now()}`,
    parentId: replyTarget?.id ?? null,
    body,
    createdAt: new Date().toISOString(),
    author: {
      id: viewer.id,
      displayName: viewer.displayName,
      handle: viewer.handle,
      avatarUrl: viewer.avatarUrl,
      role: viewer.isAuthor ? 'author' : 'reader',
    },
    replyTo: replyTarget
      ? {
          id: replyTarget.id,
          author: replyTarget.author,
        }
      : null,
    likes: 0,
    likedByViewer: false,
    replies: [],
  }
}

function fetchReactionSummary(url: string) {
  return fetchJson(url, undefined, 'REACTION_FETCH_FAILED', reactionSummaryResponseSchema)
}

function ArticleActions({
  slug,
  title,
  excerpt,
  initialSummary,
  initialViewerKey,
}: {
  slug: string
  title: string
  excerpt?: string
  initialSummary: { count: number; reactedByViewer: boolean }
  initialViewerKey: string
}) {
  const pathname = usePathname()
  const { loading, startSignIn, viewer } = useAuth()
  const viewerKey = resolveArticleViewerKey({
    initialViewerKey,
    viewerId: viewer?.id,
    authLoading: loading,
  })
  const reactionsUrl = buildReactionsKey(slug, viewerKey)
  const shouldRevalidateOnMount = shouldRevalidateHydratedData(viewerKey, initialViewerKey)
  const [togglePending, setTogglePending] = useState(false)
  const togglePendingRef = useRef(false)
  const fallbackSummary =
    viewerKey === initialViewerKey
      ? initialSummary
      : {
          count: initialSummary.count,
          reactedByViewer: false,
        }
  const { data, mutate, isLoading } = useSWR(reactionsUrl, fetchReactionSummary, {
    fallbackData: { summary: fallbackSummary },
    revalidateOnMount: shouldRevalidateOnMount,
    revalidateIfStale: shouldRevalidateOnMount,
  })

  const summary = data?.summary ?? fallbackSummary

  const handleToggle = async () => {
    if (!viewer) {
      startSignIn(pathname)
      return
    }

    if (togglePendingRef.current) {
      return
    }

    const optimistic = {
      summary: {
        count: Math.max(0, summary.count + (summary.reactedByViewer ? -1 : 1)),
        reactedByViewer: !summary.reactedByViewer,
      },
    }

    togglePendingRef.current = true
    setTogglePending(true)

    try {
      await mutate(
        async () => {
          const next = await fetchJson(
            '/api/reactions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ slug }),
            },
            'REACTION_FAILED',
            toggleReactionResponseSchema,
          )
          return { summary: next.summary }
        },
        {
          optimisticData: optimistic,
          rollbackOnError: true,
          revalidate: false,
        },
      )
    } catch {
      toast.error('欣赏状态同步失败，请稍后再试。')
    } finally {
      togglePendingRef.current = false
      setTogglePending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ReactionButton active={summary.reactedByViewer} pending={isLoading || togglePending} count={summary.count} label="欣赏" tone="article" size="default" onToggle={() => void handleToggle()} />

        <ArticleShareControls slug={slug} title={title} excerpt={excerpt} triggerLabel="转发" />
      </div>

      <p className="text-sm leading-6 text-muted-foreground">{viewer ? `已登录为 ${viewer.displayName}，你的欣赏状态会被同步记录。` : '登录后可以同步你的欣赏状态，也可以转发给更多人。'}</p>
    </div>
  )
}

function CommentComposer({
  body,
  viewer,
  isLoading,
  onBodyChange,
  onRequestLogin,
  onSubmit,
}: {
  body: string
  viewer: ReturnType<typeof useAuth>['viewer']
  isLoading: boolean
  onBodyChange: (value: string) => void
  onRequestLogin: () => void
  onSubmit: () => void
}) {
  return (
    <div className="space-y-4 border-y border-editorial-rule/80 py-5">
      <Textarea
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        className="min-h-32 rounded-[1.15rem] border-border/70 bg-background/72 shadow-none"
        placeholder={viewer ? '写下你的判断或补充。' : '登录后即可参与讨论。'}
        aria-label="评论内容"
        disabled={isLoading}
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {viewer ? (
          <p className="text-sm text-muted-foreground">以 {viewer.displayName} 的身份发言</p>
        ) : (
          <Button type="button" variant="ghost" className="w-fit rounded-full px-0 hover:bg-transparent" onClick={onRequestLogin}>
            参与讨论
          </Button>
        )}
        <Button type="button" className="rounded-full" onClick={() => void onSubmit()} disabled={isLoading}>
          <MessageSquare width={16} height={16} aria-hidden />
          发布评论
        </Button>
      </div>
    </div>
  )
}

function InlineReplyComposer({
  target,
  body,
  viewer,
  isLoading,
  onBodyChange,
  onCancel,
  onRequestLogin,
  onSubmit,
}: {
  target: CommentNode
  body: string
  viewer: ReturnType<typeof useAuth>['viewer']
  isLoading: boolean
  onBodyChange: (value: string) => void
  onCancel: () => void
  onRequestLogin: () => void
  onSubmit: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [target.id])

  return (
    <div className="border-l border-editorial-rule/80 bg-muted/15 py-3 pl-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>回复 {target.author.displayName}</span>
        <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full px-3" onClick={onCancel}>
          取消
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        className="min-h-24 rounded-[1rem] border-border/70 bg-background/72 shadow-none"
        placeholder={viewer ? `回复 ${target.author.displayName}` : '登录后即可回复。'}
        aria-label={`回复 ${target.author.displayName}`}
        disabled={isLoading}
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {viewer ? (
          <p className="text-sm text-muted-foreground">以 {viewer.displayName} 的身份回复</p>
        ) : (
          <Button type="button" variant="ghost" onClick={onRequestLogin}>
            参与讨论
          </Button>
        )}
        <Button type="button" size="sm" className="rounded-full" onClick={() => void onSubmit()} disabled={isLoading}>
          <MessageSquare width={15} height={15} aria-hidden />
          发布回复
        </Button>
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  variant = 'root',
  threadRootId,
  onReply,
  onToggleLike,
  likePendingIds,
}: {
  comment: CommentNode
  variant?: 'root' | 'reply'
  threadRootId?: string
  onReply: (comment: CommentNode) => void
  onToggleLike: (comment: CommentNode) => void
  likePendingIds: ReadonlySet<string>
}) {
  const likePending = likePendingIds.has(comment.id)
  const isTemporary = comment.id.startsWith('temp-')
  const replyHint = variant === 'reply' && comment.replyTo && comment.replyTo.id !== threadRootId ? `回复 ${comment.replyTo.author.displayName}` : ''
  const avatarSize = variant === 'root' ? 'size-10' : 'size-8'

  return (
    <div
      id={`comment-${comment.id}`}
      className={cn('flex scroll-mt-28 gap-3 [contain-intrinsic-size:0_10rem] [content-visibility:auto]', variant === 'root' && 'border-t border-editorial-rule/70 pt-5')}
    >
      <div aria-hidden>
        <ProfileAvatar profile={comment.author} className={avatarSize} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={variant === 'root' ? 'px-0 pb-1' : 'rounded-[1.15rem] bg-muted/18 px-3.5 py-3.5'}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{comment.author.displayName}</p>
              <p className="text-xs text-muted-foreground">{formatCommentTime(comment.createdAt)}</p>
            </div>
            {comment.author.role === 'author' ? <Badge variant="muted">作者</Badge> : null}
          </div>
          {replyHint ? <p className="mt-2 text-xs font-medium text-muted-foreground/85">{replyHint}</p> : null}
          <p className="mt-3 text-sm leading-7 text-muted-foreground">{comment.body}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ReactionButton
              active={comment.likedByViewer}
              pending={likePending || isTemporary}
              count={comment.likes}
              tone="comment"
              size="sm"
              onToggle={() => {
                if (!isTemporary) onToggleLike(comment)
              }}
            />
            <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full px-3" disabled={isTemporary} onClick={() => onReply(comment)}>
              <CornerDownRight width={14} height={14} aria-hidden />
              回复
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CommentThread({
  comments,
  activeReplyTarget,
  replyBody,
  viewer,
  replySubmitPending,
  onReply,
  onReplyBodyChange,
  onCancelReply,
  onSubmitReply,
  onRequestLogin,
  onToggleLike,
  likePendingIds,
}: {
  comments: CommentNode[]
  activeReplyTarget: CommentNode | null
  replyBody: string
  viewer: ReturnType<typeof useAuth>['viewer']
  replySubmitPending: boolean
  onReply: (comment: CommentNode) => void
  onReplyBodyChange: (value: string) => void
  onCancelReply: () => void
  onSubmitReply: () => void
  onRequestLogin: () => void
  onToggleLike: (comment: CommentNode) => void
  likePendingIds: ReadonlySet<string>
}) {
  return (
    <div className="space-y-5">
      {comments.map((comment) => (
        <div key={comment.id} className="space-y-3">
          <CommentItem comment={comment} threadRootId={comment.id} onReply={onReply} onToggleLike={onToggleLike} likePendingIds={likePendingIds} />
          {activeReplyTarget?.id === comment.id ? (
            <div className="ml-13">
              <InlineReplyComposer
                target={activeReplyTarget}
                body={replyBody}
                viewer={viewer}
                isLoading={replySubmitPending}
                onBodyChange={onReplyBodyChange}
                onCancel={onCancelReply}
                onRequestLogin={onRequestLogin}
                onSubmit={onSubmitReply}
              />
            </div>
          ) : null}
          {comment.replies.length > 0 ? (
            <div className="ml-13 space-y-3 border-l border-border/60 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="space-y-3">
                  <CommentItem comment={reply} variant="reply" threadRootId={comment.id} onReply={onReply} onToggleLike={onToggleLike} likePendingIds={likePendingIds} />
                  {activeReplyTarget?.id === reply.id ? (
                    <InlineReplyComposer
                      target={activeReplyTarget}
                      body={replyBody}
                      viewer={viewer}
                      isLoading={replySubmitPending}
                      onBodyChange={onReplyBodyChange}
                      onCancel={onCancelReply}
                      onRequestLogin={onRequestLogin}
                      onSubmit={onSubmitReply}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export function ArticleComments({
  slug,
  postTitle,
  postExcerpt,
  initialReactionSummary,
  initialComments,
  initialCount,
  initialViewerKey,
}: {
  slug: string
  postTitle: string
  postExcerpt?: string
  initialReactionSummary: { count: number; reactedByViewer: boolean }
  initialComments: CommentNode[]
  initialCount: number
  initialViewerKey: string
}) {
  const pathname = usePathname()
  const { loading, startSignIn, viewer } = useAuth()
  const [body, setBody] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [activeReplyTarget, setActiveReplyTarget] = useState<CommentNode | null>(null)
  const [topSubmitPending, setTopSubmitPending] = useState(false)
  const [replySubmitPending, setReplySubmitPending] = useState(false)
  const [pendingLikeIds, setPendingLikeIds] = useState<Set<string>>(() => new Set())
  const topSubmitPendingRef = useRef(false)
  const replySubmitPendingRef = useRef(false)
  const pendingLikeIdsRef = useRef<Set<string>>(new Set())
  const viewerKey = resolveArticleViewerKey({
    initialViewerKey,
    viewerId: viewer?.id,
    authLoading: loading,
  })
  const commentsUrl = buildCommentsKey(slug, viewerKey)
  const shouldRevalidateOnMount = shouldRevalidateHydratedData(viewerKey, initialViewerKey)
  const fallbackComments = viewerKey === initialViewerKey ? initialComments : stripViewerCommentState(initialComments)
  const { data, mutate, isLoading } = useSWR(commentsUrl, fetchComments, {
    fallbackData: { comments: fallbackComments },
    revalidateOnMount: shouldRevalidateOnMount,
    revalidateIfStale: shouldRevalidateOnMount,
  })

  const comments = data?.comments ?? fallbackComments
  const totalCount = Math.max(initialCount, countComments(comments))

  const requestLogin = () => {
    startSignIn(pathname)
  }

  const handleSubmit = async () => {
    if (!viewer) {
      requestLogin()
      return
    }

    if (topSubmitPendingRef.current) {
      return
    }

    const trimmed = body.trim()
    if (!trimmed) return

    const tempComment = createOptimisticComment(viewer, trimmed)
    const previousBody = body
    setBody('')
    topSubmitPendingRef.current = true
    setTopSubmitPending(true)

    try {
      await mutate(
        async (current) => {
          const result = await fetchJson(
            '/api/comments',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ slug, body: trimmed, parentId: null }),
            },
            'COMMENT_FAILED',
            createCommentResponseSchema,
          )

          return {
            comments: replaceOrInsertComment(current?.comments ?? comments, tempComment.id, result.comment, null),
          }
        },
        {
          optimisticData: {
            comments: insertComment(comments, tempComment, null),
          },
          rollbackOnError: true,
          revalidate: false,
        },
      )
    } catch (error) {
      setBody(previousBody)
      toast.error('评论发布失败，请稍后再试。')
      console.error('[ArticleComments:submit]', error)
    } finally {
      topSubmitPendingRef.current = false
      setTopSubmitPending(false)
    }
  }

  const handleReplyRequest = (comment: CommentNode) => {
    if (!viewer) {
      requestLogin()
      return
    }

    setActiveReplyTarget(comment)
    setReplyBody('')
  }

  const handleSubmitReply = async () => {
    if (!viewer) {
      requestLogin()
      return
    }

    if (replySubmitPendingRef.current || !activeReplyTarget) {
      return
    }

    const trimmed = replyBody.trim()
    if (!trimmed) return

    const replyTarget = activeReplyTarget
    const parentId = replyTarget.id
    const tempComment = createOptimisticComment(viewer, trimmed, replyTarget)
    const previousBody = replyBody
    const previousReplyTarget = activeReplyTarget
    setReplyBody('')
    setActiveReplyTarget(null)
    replySubmitPendingRef.current = true
    setReplySubmitPending(true)

    try {
      await mutate(
        async (current) => {
          const result = await fetchJson(
            '/api/comments',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ slug, body: trimmed, parentId }),
            },
            'COMMENT_FAILED',
            createCommentResponseSchema,
          )

          return {
            comments: replaceOrInsertComment(current?.comments ?? comments, tempComment.id, result.comment, parentId),
          }
        },
        {
          optimisticData: {
            comments: insertComment(comments, tempComment, parentId),
          },
          rollbackOnError: true,
          revalidate: false,
        },
      )
    } catch (error) {
      setReplyBody(previousBody)
      setActiveReplyTarget(previousReplyTarget)
      toast.error('回复发布失败，请稍后再试。')
      console.error('[ArticleComments:reply]', error)
    } finally {
      replySubmitPendingRef.current = false
      setReplySubmitPending(false)
    }
  }

  const handleLike = async (comment: CommentNode) => {
    if (!viewer) {
      requestLogin()
      return
    }

    if (pendingLikeIdsRef.current.has(comment.id)) {
      return
    }

    pendingLikeIdsRef.current = new Set(pendingLikeIdsRef.current).add(comment.id)
    setPendingLikeIds(new Set(pendingLikeIdsRef.current))

    try {
      await mutate(
        async (current) => {
          const result = await fetchJson(
            `/api/comments/${comment.id}/like`,
            {
              method: 'POST',
            },
            'LIKE_FAILED',
            commentLikeResponseSchema,
          )
          return {
            comments: updateLike(current?.comments ?? comments, comment.id, result.liked),
          }
        },
        {
          optimisticData: {
            comments: updateLike(comments, comment.id, !comment.likedByViewer),
          },
          rollbackOnError: true,
          revalidate: false,
        },
      )
    } catch {
      toast.error('点赞同步失败，请稍后再试。')
    } finally {
      const nextPendingLikeIds = new Set(pendingLikeIdsRef.current)
      nextPendingLikeIds.delete(comment.id)
      pendingLikeIdsRef.current = nextPendingLikeIds
      setPendingLikeIds(new Set(nextPendingLikeIds))
    }
  }

  const handleCancelReply = () => {
    setActiveReplyTarget(null)
    setReplyBody('')
  }

  const handleToggleLike = (item: CommentNode) => {
    void handleLike(item)
  }

  return (
    <section className="max-w-3xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Conversation</p>
          <h2 className="text-[clamp(1.55rem,1.2rem+1vw,2.2rem)] font-semibold leading-tight tracking-[-0.04em] text-foreground">读者来信</h2>
        </div>
        <p className="text-sm text-muted-foreground">{totalCount} 条公开评论</p>
      </div>

      <ArticleActions slug={slug} title={postTitle} excerpt={postExcerpt} initialSummary={initialReactionSummary} initialViewerKey={initialViewerKey} />

      <CommentComposer body={body} viewer={viewer} isLoading={isLoading || topSubmitPending} onBodyChange={setBody} onRequestLogin={requestLogin} onSubmit={handleSubmit} />

      {comments.length > 0 ? (
        <CommentThread
          comments={comments}
          activeReplyTarget={activeReplyTarget}
          replyBody={replyBody}
          viewer={viewer}
          replySubmitPending={replySubmitPending}
          onReply={handleReplyRequest}
          onReplyBodyChange={setReplyBody}
          onCancelReply={handleCancelReply}
          onSubmitReply={handleSubmitReply}
          onRequestLogin={requestLogin}
          onToggleLike={handleToggleLike}
          likePendingIds={pendingLikeIds}
        />
      ) : (
        <div className="space-y-3 py-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">Conversation</p>
          <h3 className="text-[clamp(1.45rem,1.15rem+0.8vw,2rem)] font-semibold leading-tight tracking-[-0.04em] text-foreground">暂无来信</h3>
        </div>
      )}
    </section>
  )
}
