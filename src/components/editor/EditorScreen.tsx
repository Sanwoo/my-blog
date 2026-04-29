'use client'

import { useDeferredValue, useEffect, useState, useTransition } from 'react'
import type { Content } from '@tiptap/core'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, CalendarClock, CheckCircle2, ChevronDown, Copy, Eye, EyeOff, FilePlus2, Loader2, MoreHorizontal, RotateCcw, Save, Send, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ArticleBody } from '@/components/article/ArticleBody'
import { ArticleHeader } from '@/components/article/ArticleHeader'
import { ArticleReadingProvider } from '@/components/article/ArticleReadingProvider'
import { ArticleTOC } from '@/components/article/ArticleTOC'
import {
  DEFAULT_DOC,
  loadNewDraft,
  loadPostDraft,
  postEditorDraftKey,
  removeEditorDraft,
  serializeDatetimeLocalValue,
  toVisibleDraftSlug,
  type DraftState,
  type EditorPostSummary,
  usePersistentDraftState,
} from '@/components/editor/editor-draft'
import { EditorMetadataPanel, type EditorFieldErrors } from '@/components/editor/EditorMetadataPanel'
import { SchedulePublishDialog } from '@/components/editor/SchedulePublishDialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { estimateReadTime, excerptFromText, formatDate, formatDateTime, formatReadTime, renderDocument, slugify } from '@/lib/content'
import { editorIntentValidationSchema } from '@/lib/schemas/posts'
import type { EditorTaxonomy, PostDetail, PostStatus, PostTaxonomyTerm, SavePostIntent, SavePostPayload } from '@/lib/types'
import { cn } from '@/lib/utils'

const RichTextEditor = dynamic(() => import('@/components/editor/RichTextEditor').then((module) => module.RichTextEditor), {
  ssr: false,
  loading: () => (
    <div className="border-t border-border/60 px-5 py-6 text-sm text-muted-foreground sm:px-7">编辑器初始化中…</div>
  ),
})

interface EditorScreenProps {
  initialPost: PostDetail | null
  initialPosts: EditorPostSummary[]
  initialTaxonomy: EditorTaxonomy
}

interface PostMutationResponse {
  slug?: string
  visibleSlug?: string
  status?: PostStatus
  hasWorkingCopy?: boolean
  error?: string
  code?: string
}

interface SaveOptions {
  publishAt?: string | null
}

type SaveResult = { ok: true } | { ok: false; errorField?: keyof EditorFieldErrors }

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  const data = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? '请求失败。')
  }
  return data
}

class EditorActionError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = 'EditorActionError'
    this.code = code
  }
}

function currentStatusFromIntent(intent: SavePostIntent): PostStatus {
  switch (intent) {
    case 'save_scheduled':
      return 'scheduled'
    case 'publish_now':
    case 'publish_working_copy':
    case 'save_published_working_copy':
    case 'discard_working_copy':
      return 'published'
    case 'save_draft':
    case 'hide_to_draft':
      return 'draft'
  }
}

function successMessageFromIntent(intent: SavePostIntent) {
  switch (intent) {
    case 'save_draft':
      return '草稿已保存。'
    case 'save_scheduled':
      return '排期已保存。'
    case 'publish_now':
      return '文章已发布。'
    case 'save_published_working_copy':
      return '未公开修改已保存。'
    case 'publish_working_copy':
      return '发布内容已更新。'
    case 'discard_working_copy':
      return '未公开修改已丢弃。'
    case 'hide_to_draft':
      return '文章已隐藏为草稿。'
  }
}

function loadingMessageFromIntent(intent: SavePostIntent) {
  switch (intent) {
    case 'save_draft':
      return '正在保存草稿…'
    case 'save_scheduled':
      return '正在保存排期…'
    case 'publish_now':
      return '正在发布文章…'
    case 'save_published_working_copy':
      return '正在保存未公开修改…'
    case 'publish_working_copy':
      return '正在发布更新…'
    case 'discard_working_copy':
      return '正在丢弃未公开修改…'
    case 'hide_to_draft':
      return '正在隐藏文章…'
  }
}

function fieldFromErrorCode(code?: string): keyof EditorFieldErrors | null {
  switch (code) {
    case 'TITLE_REQUIRED':
      return 'title'
    case 'SLUG_REQUIRED':
    case 'SLUG_IN_USE':
      return 'slug'
    case 'PUBLISH_AT_REQUIRED':
    case 'PUBLISH_AT_INVALID':
    case 'PUBLISH_AT_MUST_BE_FUTURE':
      return 'publishAt'
    default:
      return null
  }
}

function validateIntent(intent: SavePostIntent, draft: DraftState): EditorFieldErrors {
  const result = editorIntentValidationSchema.safeParse({
    intent,
    title: draft.title,
    slug: draft.slug,
    publishAt: draft.publishAt,
  })

  if (result.success) {
    return {}
  }

  const nextErrors: EditorFieldErrors = {}

  for (const issue of result.error.issues) {
    const field = issue.path[0]

    if ((field === 'title' || field === 'slug' || field === 'publishAt') && !nextErrors[field]) {
      nextErrors[field] = issue.message
    }
  }

  return nextErrors
}

function firstErrorField(errors: EditorFieldErrors): keyof EditorFieldErrors | undefined {
  if (errors.title) return 'title'
  if (errors.slug) return 'slug'
  if (errors.publishAt) return 'publishAt'
  return undefined
}

async function saveEditorPost(payload: SavePostPayload) {
  const response = await fetch('/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => ({}))) as PostMutationResponse
  return { ok: response.ok, data }
}

async function deleteEditorPost(slug: string) {
  const response = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
  })

  const data = (await response.json().catch(() => ({}))) as PostMutationResponse
  return { ok: response.ok, data }
}

function visibleEditorPostTitle(post: EditorPostSummary) {
  const visibleSlug = toVisibleDraftSlug(post.slug)
  return post.title.trim() || visibleSlug || '未命名草稿'
}

function statusLabel(status: string) {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'scheduled':
      return '排期中'
    case 'published':
      return '已发布'
    default:
      return status
  }
}

function draftSignature(draft: DraftState) {
  return JSON.stringify({
    slug: draft.slug,
    title: draft.title,
    excerpt: draft.excerpt,
    categoryId: draft.categoryId,
    tagIds: draft.tagIds,
    seoDescription: draft.seoDescription,
    status: draft.status,
    publishAt: draft.publishAt,
    contentJson: draft.contentJson,
    hasWorkingCopy: draft.hasWorkingCopy,
  })
}

function taxonomyMap(terms: PostTaxonomyTerm[]) {
  return new Map(terms.map((term) => [term.id, term]))
}

function fallbackCategory(taxonomy: EditorTaxonomy, categoryId: string): PostTaxonomyTerm {
  return (
    taxonomy.categories.find((category) => category.id === categoryId) ??
    taxonomy.categories[0] ?? {
      id: 'missing-category',
      name: '未分类',
      slug: 'uncategorized',
      archivedAt: null,
    }
  )
}

function previewStatusLabel(status: DraftState['status']) {
  switch (status) {
    case 'draft':
      return '草稿'
    case 'scheduled':
      return '定时发布'
    case 'published':
      return '已发布'
  }
}

function previewPublishedDateLabel(status: DraftState['status'], publishAt: string) {
  const serializedPublishAt = publishAt.trim() ? serializeDatetimeLocalValue(publishAt) : null

  if (status === 'published') {
    return formatDate(serializedPublishAt) || '尚未设置发布时间'
  }

  if (status === 'scheduled') {
    const formatted = formatDateTime(serializedPublishAt)
    return formatted ? `计划于 ${formatted}` : '计划时间未设置'
  }

  return '尚未设置发布时间'
}

function AllPostsPanel({
  currentSlug,
  hasUnsavedChanges,
  initialPosts,
  onNavigate,
}: {
  currentSlug: string | null
  hasUnsavedChanges: boolean
  initialPosts: EditorPostSummary[]
  onNavigate: () => void
}) {
  const { data } = useSWR<{ posts: EditorPostSummary[] }>('/api/posts', fetcher, {
    fallbackData: { posts: initialPosts },
    revalidateIfStale: false,
    revalidateOnMount: false,
  })
  const posts = data?.posts ?? initialPosts

  return (
    <Card className="border-editorial-rule/90 bg-background/95 shadow-none">
      <CardHeader className="flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="text-base tracking-normal">全部稿件</CardTitle>
        <span className="text-xs text-muted-foreground">{posts.length}</span>
      </CardHeader>
      <CardContent className="max-h-[min(46rem,calc(100svh-21rem))] space-y-2 overflow-y-auto p-3 pt-0 sm:p-4 sm:pt-0">
        {posts.map((post) => {
          const active = currentSlug === post.slug
          return (
            <Link
              key={post.slug}
              href={`/editor?slug=${post.slug}`}
              onClick={(event) => {
                if (active) return
                if (hasUnsavedChanges && !window.confirm('当前稿件有未保存修改，仍要切换吗？')) {
                  event.preventDefault()
                  return
                }
                onNavigate()
              }}
              className={cn(
                'editor-list-item block rounded-lg px-3 py-2.5 transition-colors hover:bg-accent hover:text-accent-foreground',
                active && 'bg-muted/55 text-foreground',
              )}
            >
              <span className="block text-sm font-medium text-foreground">{visibleEditorPostTitle(post)}</span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>{statusLabel(post.status)}</span>
                {post.hasWorkingCopy ? <span>未发布修改</span> : null}
                <span>{new Date(post.workingCopyUpdatedAt ?? post.updatedAt).toLocaleDateString('zh-CN')}</span>
              </span>
            </Link>
          )
        })}
      </CardContent>
    </Card>
  )
}

function EditorPreviewPanel({ draft, taxonomy, useContainedScroll }: { draft: DraftState; taxonomy: EditorTaxonomy; useContainedScroll: boolean }) {
  const [scrollContainer, setScrollContainer] = useState<HTMLDivElement | null>(null)
  const deferredDraft = useDeferredValue(draft)
  const isSyncing = deferredDraft !== draft
  const tagById = taxonomyMap(taxonomy.tags)
  const rendered = renderDocument(deferredDraft.contentJson)
  const previewTitle = deferredDraft.title.trim() || '未填写标题'
  const previewExcerpt = deferredDraft.excerpt.trim() || excerptFromText(rendered.text) || '这里会显示文章摘要。'
  const previewPath = deferredDraft.slug.trim() ? `/posts/${deferredDraft.slug.trim()}` : '未设置 slug'
  const serializedPublishAt = deferredDraft.publishAt.trim() ? serializeDatetimeLocalValue(deferredDraft.publishAt) : null
  const tocSignature = rendered.toc.map((item) => `${item.id}:${item.level}`).join('|')
  const previewPost: PostDetail = {
    id: 'editor-live-preview',
    slug: deferredDraft.slug.trim() || 'editor-live-preview',
    editableSlug: deferredDraft.slug.trim() || 'editor-live-preview',
    title: previewTitle,
    excerpt: previewExcerpt,
    category: fallbackCategory(taxonomy, deferredDraft.categoryId),
    tags: deferredDraft.tagIds.flatMap((id) => {
      const tag = tagById.get(id)
      return tag ? [tag] : []
    }),
    publishedAt: serializedPublishAt,
    formattedDate: previewPublishedDateLabel(deferredDraft.status, deferredDraft.publishAt),
    readTime: formatReadTime(estimateReadTime(rendered.text)),
    commentCount: 0,
    reactionCount: 0,
    seoDescription: deferredDraft.seoDescription,
    status: deferredDraft.status,
    contentHtml: rendered.html,
    contentJson: deferredDraft.contentJson,
    toc: rendered.toc,
    hasWorkingCopy: deferredDraft.hasWorkingCopy,
    workingCopyUpdatedAt: null,
  }

  return (
    <Card className="overflow-hidden border-editorial-rule/90 bg-background/95 shadow-none">
      <CardHeader className="border-b border-border/70 bg-muted/10 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="text-base tracking-normal">预览</CardTitle>
            <p className="mt-1 truncate text-xs text-muted-foreground">{previewPath}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
            {isSyncing ? <Loader2 className="size-3.5 animate-spin" aria-label="同步中" /> : null}
            <span>{previewStatusLabel(deferredDraft.status)}</span>
            <span>{previewPost.readTime}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div ref={setScrollContainer} className={cn('editor-preview-pane px-5 pb-6 pt-6 sm:px-6 sm:pb-8', useContainedScroll && 'max-h-[calc(100svh-13rem)] overflow-y-auto')}>
          <ArticleReadingProvider key={`${useContainedScroll ? 'contained' : 'page'}:${tocSignature}`} items={rendered.toc} container={useContainedScroll ? scrollContainer : undefined}>
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:gap-10">
              <ArticleHeader post={previewPost} />
              <ArticleTOC items={rendered.toc} mode="panel" />
              <ArticleBody content={previewPost.contentHtml} />
            </div>
          </ArticleReadingProvider>
        </div>
      </CardContent>
    </Card>
  )
}

function EditorStatusBar({
  activeView,
  canViewOnline,
  draft,
  editorReady,
  hasUnsavedChanges,
  isBusy,
  isDeletePending,
  isPrimaryPending,
  isSchedulePending,
  isSecondaryPending,
  localSaveState,
  onBackHome,
  onCopyLink,
  onDeleteRequest,
  onDiscardWorkingCopy,
  onHideToDraft,
  onNewPost,
  onViewChange,
  onPrimaryAction,
  onScheduleAction,
  onSecondaryAction,
  primaryActionLabel,
  readTime,
  scheduleActionLabel,
  savedSlug,
  secondaryActionLabel,
  wordCount,
}: {
  activeView: 'write' | 'preview'
  canViewOnline: boolean
  draft: DraftState
  editorReady: boolean
  hasUnsavedChanges: boolean
  isBusy: boolean
  isDeletePending: boolean
  isPrimaryPending: boolean
  isSchedulePending: boolean
  isSecondaryPending: boolean
  localSaveState: string
  onBackHome: () => void
  onCopyLink: () => void
  onDeleteRequest: () => void
  onDiscardWorkingCopy: () => void
  onHideToDraft: () => void
  onNewPost: () => void
  onViewChange: (view: 'write' | 'preview') => void
  onPrimaryAction: () => void
  onScheduleAction: () => void
  onSecondaryAction: () => void
  primaryActionLabel: string
  readTime: string
  scheduleActionLabel: string
  savedSlug: string | null
  secondaryActionLabel: string
  wordCount: number
}) {
  const actionDisabled = isBusy || !editorReady

  return (
    <div className="sticky top-0 z-30 border-b border-editorial-rule bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
          <Button type="button" variant="ghost" className="h-9 rounded-full px-0 text-muted-foreground hover:bg-transparent" onClick={onBackHome} disabled={isBusy}>
            <ArrowLeft className="size-4" aria-hidden />
            返回
          </Button>
          <span className="hidden text-sm font-medium text-foreground sm:inline">写作台</span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5" aria-hidden />
            {localSaveState}
          </span>
          {hasUnsavedChanges ? <span className="text-xs text-muted-foreground">未保存</span> : null}
          {draft.hasWorkingCopy ? <span className="text-xs text-muted-foreground">未发布修改</span> : null}
          <span className="text-xs text-muted-foreground">
            {wordCount} 字 · {readTime}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={activeView} onValueChange={(value) => onViewChange(value === 'preview' ? 'preview' : 'write')}>
            <TabsList className="rounded-full bg-muted/45 p-1">
              <TabsTrigger value="write" className="rounded-full px-3">
                写作
              </TabsTrigger>
              <TabsTrigger value="preview" className="rounded-full px-3">
                预览
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="inline-flex">
            <Button type="button" size="sm" className="rounded-r-none" onClick={onPrimaryAction} disabled={actionDisabled}>
              {isPrimaryPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : draft.status === 'published' ? (
                <Send className="size-4" aria-hidden />
              ) : (
                <Sparkles width={16} height={16} aria-hidden />
              )}
              {primaryActionLabel}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md rounded-l-none border border-l border-transparent border-l-background/20 bg-foreground text-background transition-colors outline-none hover:bg-foreground/92 focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50"
                aria-label="发布选项"
                title="发布选项"
                disabled={actionDisabled}
              >
                <ChevronDown className="size-4" aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={onSecondaryAction} disabled={actionDisabled}>
                  {isSecondaryPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
                  {secondaryActionLabel}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPrimaryAction} disabled={actionDisabled}>
                  {draft.status === 'published' ? <Send className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
                  {primaryActionLabel}
                </DropdownMenuItem>
                {draft.status !== 'published' ? (
                  <DropdownMenuItem onClick={onScheduleAction} disabled={actionDisabled}>
                    {isSchedulePending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <CalendarClock className="size-4" aria-hidden />}
                    {scheduleActionLabel}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-background/80 text-sm font-medium text-foreground transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-50"
              aria-label="更多写作操作"
              title="更多"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onNewPost} disabled={isBusy}>
                <FilePlus2 className="size-4" aria-hidden />
                新建文章
              </DropdownMenuItem>
              {canViewOnline && savedSlug ? (
                <DropdownMenuItem onClick={() => window.open(`/posts/${encodeURIComponent(savedSlug)}`, '_blank', 'noopener,noreferrer')}>
                  <Eye className="size-4" aria-hidden />
                  查看线上版
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={onCopyLink} disabled={!draft.slug.trim()}>
                <Copy className="size-4" aria-hidden />
                复制链接
              </DropdownMenuItem>
              {(draft.status === 'published' || draft.hasWorkingCopy || savedSlug) ? <DropdownMenuSeparator /> : null}
              {draft.hasWorkingCopy ? (
                <DropdownMenuItem onClick={onDiscardWorkingCopy} disabled={isBusy || !editorReady}>
                  <RotateCcw className="size-4" aria-hidden />
                  丢弃修改
                </DropdownMenuItem>
              ) : null}
              {draft.status === 'published' ? (
                <DropdownMenuItem onClick={onHideToDraft} disabled={isBusy || !editorReady}>
                  <EyeOff className="size-4" aria-hidden />
                  隐藏为草稿
                </DropdownMenuItem>
              ) : null}
              {savedSlug ? (
                <DropdownMenuItem variant="destructive" onClick={onDeleteRequest} disabled={isBusy}>
                  {isDeletePending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
                  删除文章
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export function EditorScreen({ initialPost, initialPosts, initialTaxonomy }: EditorScreenProps) {
  const router = useRouter()
  const { data: taxonomyData, mutate: mutateTaxonomy } = useSWR<EditorTaxonomy>('/api/editor/taxonomy', fetcher, {
    fallbackData: initialTaxonomy,
    revalidateIfStale: false,
    revalidateOnMount: false,
  })
  const taxonomy = taxonomyData ?? initialTaxonomy
  const defaultCategoryId = taxonomy.categories.find((category) => !category.archivedAt)?.id ?? taxonomy.categories[0]?.id ?? ''
  const [initialDraft] = useState<DraftState>(() => (initialPost ? loadPostDraft(initialPost, defaultCategoryId) : loadNewDraft(defaultCategoryId)))
  const [draft, setDraft, flushDraft] = usePersistentDraftState(initialDraft)
  const [savedSignature, setSavedSignature] = useState(() => draftSignature(initialDraft))
  const [activeView, setActiveView] = useState<'write' | 'preview'>('write')
  const [fieldErrors, setFieldErrors] = useState<EditorFieldErrors>({})
  const [isBackPending, startBackTransition] = useTransition()
  const [isSecondaryPending, startSecondaryTransition] = useTransition()
  const [isPrimaryPending, startPrimaryTransition] = useTransition()
  const [isSchedulePending, startScheduleTransition] = useTransition()
  const [isDeletePending, startDeleteTransition] = useTransition()
  const [isTaxonomyPending, startTaxonomyTransition] = useTransition()
  const [editorReady, setEditorReady] = useState(() => Boolean(initialDraft.contentJson))
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [schedulePublishAt, setSchedulePublishAt] = useState('')
  const initialEditorContent: Content = draft.contentJson ?? DEFAULT_DOC
  const savedSlug = draft.previousSlug?.trim() || null
  const currentSignature = draftSignature(draft)
  const hasUnsavedChanges = currentSignature !== savedSignature
  const isBusy = isBackPending || isSecondaryPending || isPrimaryPending || isSchedulePending || isDeletePending || isTaxonomyPending
  const deferredStatsContent = useDeferredValue(draft.contentJson)
  const renderedDraft = renderDocument(deferredStatsContent)
  const wordCount = renderedDraft.text.length
  const readTime = formatReadTime(estimateReadTime(renderedDraft.text))
  const secondaryAction =
    draft.status === 'published'
      ? { label: '保存修改', intent: 'save_published_working_copy' as const }
      : { label: '保存为草稿', intent: 'save_draft' as const }
  const primaryAction = draft.status === 'published' ? { label: '发布更新', intent: 'publish_working_copy' as const } : { label: '立即发布', intent: 'publish_now' as const }
  const scheduleAction = { label: '定时发布', intent: 'save_scheduled' as const }
  const canViewOnline = draft.status === 'published' && Boolean(savedSlug)

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      flushDraft()
      event.preventDefault()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [flushDraft, hasUnsavedChanges])

  const clearFieldError = (field: keyof EditorFieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const confirmLeaveDraft = () => {
    if (!hasUnsavedChanges) return true
    flushDraft()
    return window.confirm('当前稿件有未保存修改，仍要离开吗？')
  }

  const save = async (intent: SavePostIntent, options: SaveOptions = {}): Promise<SaveResult> => {
    if (!draft.contentJson) {
      toast.error('编辑器仍在加载文章内容，请稍后再保存。')
      return { ok: false }
    }

    const publishAt = 'publishAt' in options ? (options.publishAt ?? '') : draft.publishAt
    const draftForValidation = publishAt === draft.publishAt ? draft : { ...draft, publishAt }
    const nextFieldErrors = validateIntent(intent, draftForValidation)
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      return { ok: false, errorField: firstErrorField(nextFieldErrors) }
    }

    const payload: SavePostPayload = {
      previousSlug: draft.previousSlug,
      slug: draft.slug,
      title: draft.title,
      excerpt: draft.excerpt,
      categoryId: draft.categoryId,
      tagIds: draft.tagIds,
      seoDescription: draft.seoDescription,
      intent,
      publishAt: publishAt ? serializeDatetimeLocalValue(publishAt) : null,
      contentJson: draft.contentJson,
    }

    setFieldErrors({})
    flushDraft()

    const request = (async () => {
      let result

      try {
        result = await saveEditorPost(payload)
      } catch {
        throw new EditorActionError('保存失败。')
      }

      const { ok, data } = result

      if (!ok) {
        throw new EditorActionError(data.error ?? '保存失败。', data.code)
      }

      return data
    })()

    toast.promise(request, {
      loading: loadingMessageFromIntent(intent),
      success: successMessageFromIntent(intent),
      error: (error) => (error instanceof Error ? error.message : '保存失败。'),
    })

    try {
      const data = await request
      const nextSlug = data.slug ?? payload.previousSlug ?? slugify(payload.slug, '')
      const nextVisibleSlug = toVisibleDraftSlug(data.visibleSlug ?? nextSlug)
      const nextStatus = data.status ?? currentStatusFromIntent(intent)

      if (payload.previousSlug && payload.previousSlug !== nextSlug) {
        removeEditorDraft(postEditorDraftKey(payload.previousSlug))
      }

      setDraft((current) => {
        const nextDraft = {
          ...current,
          slug: nextVisibleSlug,
          previousSlug: nextSlug,
          status: nextStatus,
          publishAt: nextStatus === 'scheduled' ? publishAt : '',
          hasWorkingCopy: data.hasWorkingCopy === true,
        }
        setSavedSignature(draftSignature(nextDraft))
        return nextDraft
      })

      if (intent === 'publish_now') {
        router.push(`/posts/${encodeURIComponent(nextSlug)}`)
        return { ok: true }
      }

      if (intent === 'publish_working_copy') {
        router.replace(`/editor?slug=${encodeURIComponent(nextSlug)}`)
      } else if (intent !== 'save_published_working_copy') {
        router.replace(`/editor?slug=${encodeURIComponent(nextSlug)}`)
      }

      return { ok: true }
    } catch (error) {
      const errorField = fieldFromErrorCode(error instanceof EditorActionError ? error.code : undefined)
      if (errorField) {
        setFieldErrors({ [errorField]: error instanceof Error ? error.message : '保存失败。' })
      }
      return { ok: false, errorField: errorField ?? undefined }
    }
  }

  const mutateTaxonomyTerm = (method: 'POST' | 'PATCH' | 'DELETE', body: { kind: 'category' | 'tag'; id?: string; name?: string }) => {
    startTaxonomyTransition(async () => {
      const request = fetch('/api/editor/taxonomy', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { error?: string }
        if (!response.ok) {
          throw new Error(data.error ?? '分类标签保存失败。')
        }
        return data
      })

      toast.promise(request, {
        loading: '正在保存分类标签…',
        success: '分类标签已更新。',
        error: (error) => (error instanceof Error ? error.message : '分类标签保存失败。'),
      })

      try {
        await request
        await mutateTaxonomy()
      } catch {
        // toast already reports the error
      }
    })
  }

  const handleSecondaryAction = () => {
    startSecondaryTransition(async () => {
      await save(secondaryAction.intent)
    })
  }

  const handlePrimaryAction = () => {
    startPrimaryTransition(async () => {
      await save(primaryAction.intent)
    })
  }

  const handleScheduleAction = () => {
    if (!draft.contentJson) {
      toast.error('编辑器仍在加载文章内容，请稍后再保存。')
      return
    }

    const publishReadinessErrors = validateIntent('publish_now', draft)
    if (Object.keys(publishReadinessErrors).length > 0) {
      setFieldErrors(publishReadinessErrors)
      return
    }

    clearFieldError('publishAt')
    setSchedulePublishAt(draft.publishAt)
    setScheduleDialogOpen(true)
  }

  const handleScheduleConfirm = (publishAt: string) => {
    startScheduleTransition(async () => {
      const result = await save(scheduleAction.intent, { publishAt })
      if (result.ok) {
        setScheduleDialogOpen(false)
        return
      }

      if (result.errorField && result.errorField !== 'publishAt') {
        setScheduleDialogOpen(false)
      }
    })
  }

  const handleDiscardWorkingCopy = () => {
    startSecondaryTransition(async () => {
      await save('discard_working_copy')
      router.refresh()
    })
  }

  const handleHideToDraft = () => {
    startSecondaryTransition(async () => {
      await save('hide_to_draft')
    })
  }

  const handleBackHome = () => {
    if (!confirmLeaveDraft()) return
    startBackTransition(() => {
      router.push('/')
    })
  }

  const handleNewPost = () => {
    if (!confirmLeaveDraft()) return
    router.push('/editor')
  }

  const handleCopyLink = () => {
    const slug = draft.slug.trim()
    if (!slug) return
    const url = `${window.location.origin}/posts/${slug}`
    void navigator.clipboard.writeText(url)
    toast.success('文章链接已复制。')
  }

  const handleDelete = () => {
    startDeleteTransition(async () => {
      if (!savedSlug) {
        setDeleteDialogOpen(false)
        return
      }

      const request = (async () => {
        let result

        try {
          result = await deleteEditorPost(savedSlug)
        } catch {
          throw new EditorActionError('删除失败。')
        }

        const { ok, data } = result
        if (!ok) {
          throw new EditorActionError(data.error ?? '删除失败。', data.code)
        }

        return data
      })()

      toast.promise(request, {
        loading: '正在删除文章…',
        success: '文章已删除。',
        error: (error) => (error instanceof Error ? error.message : '删除失败。'),
      })

      try {
        await request
        removeEditorDraft(postEditorDraftKey(savedSlug))
        setDeleteDialogOpen(false)
        router.push('/editor')
      } catch {
        setDeleteDialogOpen(false)
      }
    })
  }

  const titleInput = (
    <label className="block space-y-2">
      <span className="sr-only">标题</span>
      <Input
        aria-invalid={fieldErrors.title ? true : undefined}
        value={draft.title}
        onChange={(event) => {
          const nextTitle = event.target.value
          clearFieldError('title')
          setDraft((current) => ({
            ...current,
            title: nextTitle,
            slug: current.slug ? current.slug : slugify(nextTitle, ''),
          }))
        }}
        className="h-auto border-0 bg-transparent px-0 py-2 text-3xl font-semibold leading-tight tracking-normal shadow-none focus-visible:ring-0 sm:text-4xl lg:text-5xl"
        placeholder="写下这篇文章真正要回答的问题"
      />
      {fieldErrors.title ? <p className="text-sm text-destructive">{fieldErrors.title}</p> : null}
    </label>
  )

  const editorPane = (
    <section className="min-w-0">
      <div className="overflow-hidden rounded-2xl border border-editorial-rule/90 bg-background/95 shadow-sm">
        <div className="space-y-5 px-5 pb-5 pt-5 sm:px-7 sm:pb-7 sm:pt-7">
          {titleInput}
        </div>
        <RichTextEditor
          key={draft.previousSlug ?? 'new'}
          initialContent={initialEditorContent}
          onChange={(contentJson) => {
            setEditorReady(true)
            setDraft((current) => ({ ...current, contentJson }))
          }}
        />
      </div>
    </section>
  )

  const settingsPane = (
    <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
      <EditorMetadataPanel
        draft={draft}
        fieldErrors={fieldErrors}
        taxonomy={taxonomy}
        onCreateTerm={(kind, name) => mutateTaxonomyTerm('POST', { kind, name })}
        onRenameTerm={(kind, id, name) => mutateTaxonomyTerm('PATCH', { kind, id, name })}
        onArchiveTerm={(kind, id) => mutateTaxonomyTerm('DELETE', { kind, id })}
        onFieldErrorClear={clearFieldError}
        onRegenerateSlug={() => {
          clearFieldError('slug')
          setDraft((current) => ({ ...current, slug: slugify(current.title, '') }))
        }}
        setDraft={setDraft}
      />
      <AllPostsPanel currentSlug={savedSlug} hasUnsavedChanges={hasUnsavedChanges} initialPosts={initialPosts} onNavigate={flushDraft} />
    </aside>
  )

  const previewPane = (
    <aside className="min-w-0 space-y-6">
      <EditorPreviewPanel draft={draft} taxonomy={taxonomy} useContainedScroll={false} />
    </aside>
  )

  return (
    <div className="min-h-screen">
      <EditorStatusBar
        activeView={activeView}
        canViewOnline={canViewOnline}
        draft={draft}
        editorReady={editorReady}
        hasUnsavedChanges={hasUnsavedChanges}
        isBusy={isBusy}
        isDeletePending={isDeletePending}
        isPrimaryPending={isPrimaryPending}
        isSchedulePending={isSchedulePending}
        isSecondaryPending={isSecondaryPending}
        localSaveState="本地草稿已保护"
        onBackHome={handleBackHome}
        onCopyLink={handleCopyLink}
        onDeleteRequest={() => setDeleteDialogOpen(true)}
        onDiscardWorkingCopy={handleDiscardWorkingCopy}
        onHideToDraft={handleHideToDraft}
        onNewPost={handleNewPost}
        onViewChange={setActiveView}
        onPrimaryAction={handlePrimaryAction}
        onScheduleAction={handleScheduleAction}
        onSecondaryAction={handleSecondaryAction}
        primaryActionLabel={primaryAction.label}
        readTime={readTime}
        scheduleActionLabel={scheduleAction.label}
        savedSlug={savedSlug}
        secondaryActionLabel={secondaryAction.label}
        wordCount={wordCount}
      />

      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-24">
        {activeView === 'write' ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,46rem)_minmax(18rem,22rem)] xl:items-start xl:justify-center">
            {editorPane}
            {settingsPane}
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,56rem)] xl:justify-center">{previewPane}</div>
        )}
      </div>

      <SchedulePublishDialog
        error={fieldErrors.publishAt}
        isPending={isSchedulePending}
        open={scheduleDialogOpen}
        value={schedulePublishAt}
        onChange={setSchedulePublishAt}
        onConfirm={handleScheduleConfirm}
        onErrorClear={() => clearFieldError('publishAt')}
        onOpenChange={(open) => {
          if (isSchedulePending) return
          if (!open) {
            clearFieldError('publishAt')
          }
          setScheduleDialogOpen(open)
        }}
      />

      {savedSlug ? (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>删除这篇文章？</AlertDialogTitle>
              <AlertDialogDescription>删除后文章、评论和相关记录都会被永久移除，无法恢复。</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletePending}>取消</AlertDialogCancel>
              <AlertDialogAction type="button" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete} disabled={isDeletePending}>
                {isDeletePending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                确认删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  )
}
