'use client'

import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Archive, FileText, Link2, Plus, RotateCcw, Settings2, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { DraftState } from '@/components/editor/editor-draft'
import { slugify } from '@/lib/content'
import type { EditorTaxonomy, PostTaxonomyTerm } from '@/lib/types'
import { cn } from '@/lib/utils'

const fieldLabelClassName = 'block space-y-2 text-sm text-muted-foreground'
const fieldErrorClassName = 'text-sm text-destructive'

type SettingsDialog = 'tags' | 'summary' | 'path' | 'taxonomy' | null

export interface EditorFieldErrors {
  title?: string
  slug?: string
  publishAt?: string
}

function activeTerms(terms: PostTaxonomyTerm[]) {
  return terms.filter((term) => !term.archivedAt)
}

function termsForSelection(terms: PostTaxonomyTerm[], selectedIds: string[]) {
  const selected = new Set(selectedIds)
  return terms.filter((term) => !term.archivedAt || selected.has(term.id))
}

function selectedTerms(terms: PostTaxonomyTerm[], selectedIds: string[]) {
  const termById = new Map(terms.map((term) => [term.id, term]))
  return selectedIds.flatMap((id) => {
    const term = termById.get(id)
    return term ? [term] : []
  })
}

function categoryName(categories: PostTaxonomyTerm[], categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? '未选择'
}

function termLabel(term: PostTaxonomyTerm) {
  return `${term.name}${term.archivedAt ? '（已归档）' : ''}`
}

function SettingsAction({
  description,
  hasError,
  icon,
  title,
  onClick,
}: {
  description: string
  hasError?: boolean
  icon: ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-left transition-colors hover:bg-accent hover:text-accent-foreground',
        hasError && 'border-destructive/45 bg-destructive/5',
      )}
      onClick={onClick}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 text-muted-foreground">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  )
}

function TagSelectionDialog({
  selectedTagIds,
  setDraft,
  tags,
}: {
  selectedTagIds: string[]
  setDraft: Dispatch<SetStateAction<DraftState>>
  tags: PostTaxonomyTerm[]
}) {
  const selectableTags = termsForSelection(tags, selectedTagIds)

  return (
    <div className="max-h-[54vh] space-y-2 overflow-y-auto pr-1">
      {selectableTags.map((tag) => {
        const checked = selectedTagIds.includes(tag.id)
        return (
          <label key={tag.id} className="editor-list-item flex items-center gap-2 rounded-md px-3 py-2 text-foreground hover:bg-accent hover:text-accent-foreground">
            <Checkbox
              checked={checked}
              onCheckedChange={(nextChecked) =>
                setDraft((current) => ({
                  ...current,
                  tagIds: nextChecked ? Array.from(new Set([...current.tagIds, tag.id])) : current.tagIds.filter((id) => id !== tag.id),
                }))
              }
            />
            <span className="min-w-0 text-sm">{tag.name}</span>
            {tag.archivedAt ? <span className="ml-auto text-xs text-muted-foreground">已归档</span> : null}
          </label>
        )
      })}
    </div>
  )
}

function TaxonomyManager({
  kind,
  title,
  terms,
  onCreate,
  onRename,
  onArchive,
}: {
  kind: 'category' | 'tag'
  title: string
  terms: PostTaxonomyTerm[]
  onCreate: (kind: 'category' | 'tag', name: string) => void
  onRename: (kind: 'category' | 'tag', id: string, name: string) => void
  onArchive: (kind: 'category' | 'tag', id: string) => void
}) {
  const [newName, setNewName] = useState('')
  const visibleTerms = activeTerms(terms)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <Badge variant="muted">{visibleTerms.length}</Badge>
      </div>
      <div className="flex gap-2">
        <Input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="新增名称" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          onClick={() => {
            const trimmed = newName.trim()
            if (!trimmed) return
            onCreate(kind, trimmed)
            setNewName('')
          }}
          title={`新增${title}`}
          aria-label={`新增${title}`}
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </div>
      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
        {visibleTerms.map((term) => (
          <div key={term.id} className="editor-list-item flex items-center gap-2 rounded-md border border-border/70 bg-background/70 p-2">
            <Input
              defaultValue={term.name}
              className="h-9"
              onBlur={(event) => {
                const nextName = event.target.value.trim()
                if (nextName && nextName !== term.name) {
                  onRename(kind, term.id, nextName)
                }
              }}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => onArchive(kind, term.id)} title="归档" aria-label="归档">
              <Archive className="size-4" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}

export function EditorMetadataPanel({
  draft,
  fieldErrors,
  taxonomy,
  onCreateTerm,
  onRenameTerm,
  onArchiveTerm,
  onFieldErrorClear,
  onRegenerateSlug,
  setDraft,
}: {
  draft: DraftState
  fieldErrors: EditorFieldErrors
  taxonomy: EditorTaxonomy
  onCreateTerm: (kind: 'category' | 'tag', name: string) => void
  onRenameTerm: (kind: 'category' | 'tag', id: string, name: string) => void
  onArchiveTerm: (kind: 'category' | 'tag', id: string) => void
  onFieldErrorClear: (field: keyof EditorFieldErrors) => void
  onRegenerateSlug: () => void
  setDraft: Dispatch<SetStateAction<DraftState>>
}) {
  const [dialog, setDialog] = useState<SettingsDialog>(null)
  const [dismissedPathErrorKey, setDismissedPathErrorKey] = useState('')
  const categories = termsForSelection(taxonomy.categories, draft.categoryId ? [draft.categoryId] : [])
  const categoryItems = categories.map((category) => ({ label: termLabel(category), value: category.id }))
  const selectedTags = selectedTerms(taxonomy.tags, draft.tagIds)
  const hasPathError = Boolean(fieldErrors.slug)
  const pathErrorKey = fieldErrors.slug ?? ''
  const activeDialog = dialog ?? (pathErrorKey && dismissedPathErrorKey !== pathErrorKey ? 'path' : null)
  const tagDescription = selectedTags.length > 0 ? `${selectedTags.length} 个标签` : '未选择标签'
  const summaryDescription = draft.excerpt.trim() ? draft.excerpt.trim() : '摘要和 SEO 描述'
  const pathDescription = draft.slug.trim() || '未设置 slug'

  return (
    <>
      <Card className="border-editorial-rule/90 bg-background/95 shadow-none">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="size-4 text-muted-foreground" aria-hidden />
            <CardTitle className="text-base tracking-normal">文章设置</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0 sm:p-5 sm:pt-0">
          <label className={fieldLabelClassName}>
            <span>分类</span>
            <Select items={categoryItems} value={draft.categoryId} onValueChange={(value) => setDraft((current) => ({ ...current, categoryId: value ?? current.categoryId }))}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} label={termLabel(category)} value={category.id}>
                    {termLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="grid gap-2">
            <SettingsAction description={tagDescription} icon={<Tag className="size-4" aria-hidden />} title="标签" onClick={() => setDialog('tags')} />
            <SettingsAction description={summaryDescription} icon={<FileText className="size-4" aria-hidden />} title="摘要与分享" onClick={() => setDialog('summary')} />
            <SettingsAction description={pathDescription} hasError={hasPathError} icon={<Link2 className="size-4" aria-hidden />} title="路径" onClick={() => setDialog('path')} />
            <SettingsAction description={`${categoryName(taxonomy.categories, draft.categoryId)} / ${selectedTags.length} 个标签`} icon={<Settings2 className="size-4" aria-hidden />} title="分类与标签管理" onClick={() => setDialog('taxonomy')} />
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={activeDialog !== null}
        onOpenChange={(open) => {
          if (open) return
          if (activeDialog === 'path' && pathErrorKey) {
            setDismissedPathErrorKey(pathErrorKey)
          }
          setDialog(null)
        }}
      >
        <DialogContent className="left-1/2 top-1/2 flex max-h-[min(86dvh,44rem)] w-[min(40rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden p-0">
          {activeDialog === 'tags' ? (
            <>
              <DialogHeader className="border-b border-border/70 px-5 py-4">
                <DialogTitle>标签</DialogTitle>
                <DialogDescription>选择文章标签，不会改变右侧栏高度。</DialogDescription>
              </DialogHeader>
              <div className="min-h-0 px-5 py-4">
                <TagSelectionDialog tags={taxonomy.tags} selectedTagIds={draft.tagIds} setDraft={setDraft} />
              </div>
            </>
          ) : null}

          {activeDialog === 'summary' ? (
            <>
              <DialogHeader className="border-b border-border/70 px-5 py-4">
                <DialogTitle>摘要与分享</DialogTitle>
                <DialogDescription>用于首页列表、搜索描述和分享卡片。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-5 py-4">
                <label className={fieldLabelClassName}>
                  <span>摘要</span>
                  <Textarea
                    value={draft.excerpt}
                    onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))}
                    rows={3}
                    className="min-h-28"
                    placeholder="这段摘要会出现在首页列表、SEO 和分享卡片中。"
                  />
                </label>
                <label className={fieldLabelClassName}>
                  <span>SEO 描述</span>
                  <Textarea
                    value={draft.seoDescription}
                    onChange={(event) => setDraft((current) => ({ ...current, seoDescription: event.target.value }))}
                    rows={2}
                    className="min-h-24"
                    placeholder="搜索结果中展示的描述。"
                  />
                </label>
              </div>
            </>
          ) : null}

          {activeDialog === 'path' ? (
            <>
              <DialogHeader className="border-b border-border/70 px-5 py-4">
                <DialogTitle>文章路径</DialogTitle>
                <DialogDescription>只设置这篇文章的 slug。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 px-5 py-4">
                <label className={fieldLabelClassName}>
                  <span>Slug</span>
                  <div className="flex gap-2">
                    <Input
                      aria-invalid={fieldErrors.slug ? true : undefined}
                      value={draft.slug}
                      onChange={(event) => {
                        onFieldErrorClear('slug')
                        setDraft((current) => ({ ...current, slug: slugify(event.target.value, '') }))
                      }}
                      placeholder="my-editorial-note"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={onRegenerateSlug} title="根据标题重新生成" aria-label="根据标题重新生成">
                      <RotateCcw className="size-4" aria-hidden />
                    </Button>
                  </div>
                  {fieldErrors.slug ? <p className={fieldErrorClassName}>{fieldErrors.slug}</p> : null}
                </label>
              </div>
            </>
          ) : null}

          {activeDialog === 'taxonomy' ? (
            <>
              <DialogHeader className="border-b border-border/70 px-5 py-4">
                <DialogTitle>分类与标签管理</DialogTitle>
                <DialogDescription>新增、重命名或归档分类和标签。</DialogDescription>
              </DialogHeader>
              <div className="grid min-h-0 gap-6 overflow-y-auto px-5 py-4 sm:grid-cols-2">
                <TaxonomyManager kind="category" title="分类" terms={taxonomy.categories} onCreate={onCreateTerm} onRename={onRenameTerm} onArchive={onArchiveTerm} />
                <TaxonomyManager kind="tag" title="标签" terms={taxonomy.tags} onCreate={onCreateTerm} onRename={onRenameTerm} onArchive={onArchiveTerm} />
              </div>
            </>
          ) : null}

          <DialogFooter className="border-t border-border/70 px-5 py-4">
            <DialogClose asChild>
              <Button type="button">完成</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
