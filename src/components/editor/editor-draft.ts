'use client'

import { useState, useSyncExternalStore, type Dispatch, type SetStateAction } from 'react'
import type { JSONContent } from '@tiptap/core'
import { readJsonStorage, removeStorageItem, versionedStorageKey, writeJsonStorage } from '@/lib/client/storage'
import { storedDraftInputSchema } from '@/lib/schemas/posts'
import type { PostDetail, PostStatus } from '@/lib/types'

const EDITOR_DRAFT_VERSION = 'v3'
export const STORAGE_DEBOUNCE_MS = 700
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/

export interface DraftState {
  previousSlug: string | null
  slug: string
  title: string
  excerpt: string
  categoryId: string
  tagIds: string[]
  seoDescription: string
  status: PostStatus
  publishAt: string
  contentJson: JSONContent | null
  hasWorkingCopy: boolean
}

export interface EditorPostSummary {
  slug: string
  title: string
  status: string
  updatedAt: string
  publishedAt: string | null
  hasWorkingCopy: boolean
  workingCopyUpdatedAt: string | null
}

export const DEFAULT_DOC: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '写你所想。',
        },
      ],
    },
  ],
}

export function emptyDraft(defaultCategoryId: string): DraftState {
  return {
    previousSlug: null,
    slug: '',
    title: '',
    excerpt: '',
    categoryId: defaultCategoryId,
    tagIds: [],
    seoDescription: '',
    status: 'draft',
    publishAt: '',
    contentJson: DEFAULT_DOC,
    hasWorkingCopy: false,
  }
}

export function newEditorDraftKey() {
  return versionedStorageKey('editor-draft', EDITOR_DRAFT_VERSION, 'new')
}

export function postEditorDraftKey(slug: string) {
  return versionedStorageKey('editor-draft', EDITOR_DRAFT_VERSION, `post:${slug}`)
}

export function readEditorDraft<T>(key: string) {
  return readJsonStorage<T>(key)
}

export function writeEditorDraft(key: string, value: unknown) {
  writeJsonStorage(key, value)
}

export function removeEditorDraft(key: string) {
  removeStorageItem(key)
}

function padDateTimePart(value: number) {
  return String(value).padStart(2, '0')
}

function isInternalDraftSlug(value: string | null | undefined) {
  return Boolean(value && value.startsWith('__draft__'))
}

export function toVisibleDraftSlug(value: string | null | undefined) {
  return isInternalDraftSlug(value) ? '' : value?.trim() ?? ''
}

export function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) return ''

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ''

  return [parsed.getFullYear(), padDateTimePart(parsed.getMonth() + 1), padDateTimePart(parsed.getDate())].join('-') + `T${padDateTimePart(parsed.getHours())}:${padDateTimePart(parsed.getMinutes())}`
}

function normalizeDatetimeLocalValue(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  return DATETIME_LOCAL_PATTERN.test(trimmed) ? trimmed : toDatetimeLocalValue(trimmed)
}

export function serializeDatetimeLocalValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.toISOString()
}

function parseStoredDraftValue(parsed: unknown, defaultCategoryId: string): DraftState | null {
  const result = storedDraftInputSchema.safeParse(parsed)

  if (!result.success) return null

  const value = result.data

  return {
    previousSlug: typeof value.previousSlug === 'string' ? value.previousSlug : null,
    slug: value.slug ?? '',
    title: value.title ?? '',
    excerpt: value.excerpt ?? '',
    categoryId: value.categoryId || defaultCategoryId,
    tagIds: value.tagIds ?? [],
    seoDescription: value.seoDescription ?? '',
    status: value.status ?? 'draft',
    publishAt: typeof value.publishAt === 'string' ? normalizeDatetimeLocalValue(value.publishAt) : '',
    contentJson: value.contentJson ?? DEFAULT_DOC,
    hasWorkingCopy: value.hasWorkingCopy === true,
  }
}

function readStoredDraft(key: string, defaultCategoryId: string) {
  return parseStoredDraftValue(readEditorDraft<unknown>(key), defaultCategoryId)
}

export function loadNewDraft(defaultCategoryId: string) {
  return readStoredDraft(newEditorDraftKey(), defaultCategoryId) ?? emptyDraft(defaultCategoryId)
}

function draftFromPost(post: PostDetail, defaultCategoryId: string): DraftState {
  return {
    previousSlug: post.slug,
    slug: toVisibleDraftSlug(post.editableSlug),
    title: post.title,
    excerpt: post.excerpt,
    categoryId: post.category.id || defaultCategoryId,
    tagIds: post.tags.map((tag) => tag.id),
    seoDescription: post.seoDescription,
    status: post.status,
    publishAt: toDatetimeLocalValue(post.publishedAt),
    contentJson: post.contentJson,
    hasWorkingCopy: post.hasWorkingCopy,
  }
}

export function loadPostDraft(post: PostDetail, defaultCategoryId: string) {
  return readStoredDraft(postEditorDraftKey(post.slug), defaultCategoryId) ?? draftFromPost(post, defaultCategoryId)
}

export function activeDraftStorageKey(previousSlug: string | null) {
  return previousSlug ? postEditorDraftKey(previousSlug) : newEditorDraftKey()
}

function createPersistentDraftStore(initialDraft: DraftState) {
  let snapshot = initialDraft
  let previousStorageKey: string | null = null
  let persistTimer: number | null = null
  let visibilityListener: (() => void) | null = null
  const listeners = new Set<() => void>()

  const notify = () => {
    listeners.forEach((listener) => listener())
  }

  const persistDraft = () => {
    persistTimer = null

    const storageKey = activeDraftStorageKey(snapshot.previousSlug)
    writeEditorDraft(storageKey, snapshot)

    if (previousStorageKey && previousStorageKey !== storageKey) {
      removeEditorDraft(previousStorageKey)
    }

    previousStorageKey = storageKey
  }

  const flushDraft = () => {
    if (persistTimer && typeof window !== 'undefined') {
      window.clearTimeout(persistTimer)
    }

    persistDraft()
  }

  const schedulePersist = () => {
    if (typeof window === 'undefined') {
      return
    }

    if (persistTimer) {
      window.clearTimeout(persistTimer)
    }

    persistTimer = window.setTimeout(persistDraft, STORAGE_DEBOUNCE_MS)
  }

  return {
    flushDraft,
    getSnapshot() {
      return snapshot
    },
    subscribe(listener: () => void) {
      if (typeof window === 'undefined') {
        return () => undefined
      }

      listeners.add(listener)

      if (listeners.size === 1) {
        schedulePersist()
        visibilityListener = () => {
          if (document.visibilityState === 'hidden') {
            flushDraft()
          }
        }
        window.addEventListener('pagehide', flushDraft)
        document.addEventListener('visibilitychange', visibilityListener)
      }

      return () => {
        listeners.delete(listener)

        if (listeners.size === 0) {
          if (persistTimer) {
            window.clearTimeout(persistTimer)
            persistTimer = null
          }

          window.removeEventListener('pagehide', flushDraft)
          if (visibilityListener) {
            document.removeEventListener('visibilitychange', visibilityListener)
            visibilityListener = null
          }
        }
      }
    },
    setDraft(nextValue: SetStateAction<DraftState>) {
      const nextSnapshot =
        typeof nextValue === 'function'
          ? (nextValue as (current: DraftState) => DraftState)(snapshot)
          : nextValue

      if (Object.is(nextSnapshot, snapshot)) {
        return
      }

      snapshot = nextSnapshot
      notify()
      schedulePersist()
    },
  }
}

export function usePersistentDraftState(
  initialDraft: DraftState
): [DraftState, Dispatch<SetStateAction<DraftState>>, () => void] {
  const [store] = useState(() => createPersistentDraftStore(initialDraft))
  const draft = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)

  return [draft, store.setDraft, store.flushDraft]
}
