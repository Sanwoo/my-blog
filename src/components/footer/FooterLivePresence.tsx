'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { z } from 'zod'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

type PresenceStatus = 'loading' | 'ready' | 'unavailable'

type CoordinationMessage =
  | { type: 'request-sync'; tabId: string; at: number; nonce: string }
  | { type: 'visible'; tabId: string; at: number; nonce: string }
  | { type: 'hidden'; tabId: string; at: number; nonce: string }

type PresenceSnapshot = {
  status: PresenceStatus
  viewerCount: number
}

type SupabaseBrowserClient = ReturnType<typeof getSupabaseBrowser>
type PresenceChannel = ReturnType<SupabaseBrowserClient['channel']>
type IdleWindow = Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
  cancelIdleCallback?: (handle: number) => void
}

const PRESENCE_CHANNEL = 'site:live-presence'
const BROWSER_ID_KEY = 'site_presence_browser_id_v1'
const TAB_ID_KEY = 'site_presence_tab_id_v1'
const COORDINATION_KEY = 'site_presence_coordination_v1'
const MAX_RECONNECT_DELAY_MS = 15000
const coordinationMessageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('request-sync'),
    tabId: z.string().min(1),
    at: z.number(),
    nonce: z.string().min(1),
  }),
  z.object({
    type: z.literal('visible'),
    tabId: z.string().min(1),
    at: z.number(),
    nonce: z.string().min(1),
  }),
  z.object({
    type: z.literal('hidden'),
    tabId: z.string().min(1),
    at: z.number(),
    nonce: z.string().min(1),
  }),
])
const hasSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)
const listeners = new Set<() => void>()

let storeStarted = false
let storeToken = 0
let browserClient: SupabaseBrowserClient | null = null
let channel: PresenceChannel | null = null
let broadcastChannel: BroadcastChannel | null = null
let broadcastListener: ((event: MessageEvent<CoordinationMessage>) => void) | null = null
let storageListener: ((event: StorageEvent) => void) | null = null
let visibilityChangeListener: (() => void) | null = null
let pageHideListener: (() => void) | null = null
let visibleTabs = new Map<string, number>()
let browserId = ''
let tabId = ''
let visible = false
let subscribed = false
let tracked = false
let reconnectTimer: number | null = null
let reconnectAttempt = 0
let presenceTask: Promise<void> = Promise.resolve()

function createDefaultPresenceSnapshot(): PresenceSnapshot {
  return {
    status: hasSupabaseEnv ? 'loading' : 'unavailable',
    viewerCount: 0,
  }
}

const DEFAULT_PRESENCE_SNAPSHOT = createDefaultPresenceSnapshot()
let presenceSnapshot = DEFAULT_PRESENCE_SNAPSHOT

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readOrCreateBrowserId() {
  try {
    const existing = window.localStorage.getItem(BROWSER_ID_KEY)
    if (existing) return existing

    const next = createId()
    window.localStorage.setItem(BROWSER_ID_KEY, next)
    return next
  } catch {
    return createId()
  }
}

function readOrCreateTabId() {
  try {
    const existing = window.sessionStorage.getItem(TAB_ID_KEY)
    if (existing) return existing

    const next = createId()
    window.sessionStorage.setItem(TAB_ID_KEY, next)
    return next
  } catch {
    return createId()
  }
}

function getLeaderTabId(nextVisibleTabs: Map<string, number>) {
  const ids = Array.from(nextVisibleTabs.keys()).toSorted((left, right) =>
    left.localeCompare(right),
  )
  return ids[0] ?? null
}

function countPresenceKeys(nextChannel: { presenceState: () => Record<string, unknown> } | null) {
  return nextChannel ? Object.keys(nextChannel.presenceState()).length : 0
}

function logPresenceDebug(message: string, ...args: unknown[]) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[FooterLivePresence] ${message}`, ...args)
  }
}

function emitPresenceChange() {
  listeners.forEach((listener) => listener())
}

function setPresenceSnapshot(nextSnapshot: PresenceSnapshot) {
  if (
    presenceSnapshot.status === nextSnapshot.status &&
    presenceSnapshot.viewerCount === nextSnapshot.viewerCount
  ) {
    return
  }

  presenceSnapshot = nextSnapshot
  emitPresenceChange()
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function syncCount() {
  if (!storeStarted) {
    return
  }

  const remoteCount = countPresenceKeys(channel)
  const nextCount = remoteCount === 0 && tracked && visible ? 1 : remoteCount

  setPresenceSnapshot({
    viewerCount: nextCount,
    status: subscribed ? 'ready' : 'loading',
  })
}

function postMessage(message: Omit<CoordinationMessage, 'nonce'>) {
  const payload: CoordinationMessage = {
    ...message,
    nonce: createId(),
  }

  if (broadcastChannel) {
    broadcastChannel.postMessage(payload)
    return
  }

  try {
    window.localStorage.setItem(COORDINATION_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures and fall back to single-tab behavior.
  }
}

function disposePresenceChannel(nextChannel: PresenceChannel | null) {
  if (!nextChannel || !browserClient) {
    return
  }

  if (channel === nextChannel) {
    channel = null
  }

  void nextChannel.untrack().catch(() => undefined)
  void browserClient.removeChannel(nextChannel).catch(() => undefined)
}

function schedulePresenceSync(token: number) {
  presenceTask = presenceTask
    .catch(() => undefined)
    .then(async () => {
      if (!storeStarted || token !== storeToken || !channel || !subscribed) {
        return
      }

      const shouldLead = visible && getLeaderTabId(visibleTabs) === tabId

      if (shouldLead && !tracked) {
        await channel.track({
          online_at: new Date().toISOString(),
          path: window.location.pathname,
        })

        if (!storeStarted || token !== storeToken) {
          return
        }

        tracked = true
      } else if (!shouldLead && tracked) {
        await channel.untrack()

        if (!storeStarted || token !== storeToken) {
          return
        }

        tracked = false
      }

      syncCount()
    })
}

function queueReconnect(
  nextChannel: PresenceChannel | null,
  reason: 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED',
  token: number,
) {
  if (!storeStarted || token !== storeToken) {
    return
  }

  subscribed = false
  tracked = false
  setPresenceSnapshot({
    viewerCount: 0,
    status: reconnectAttempt + 1 >= 3 ? 'unavailable' : 'loading',
  })

  const nextAttempt = reconnectAttempt + 1
  reconnectAttempt = nextAttempt

  logPresenceDebug(`Realtime channel ${reason.toLowerCase()}. Scheduling reconnect #${nextAttempt}.`)

  disposePresenceChannel(nextChannel)
  clearReconnectTimer()

  const delay = Math.min(1000 * 2 ** (nextAttempt - 1), MAX_RECONNECT_DELAY_MS)
  reconnectTimer = window.setTimeout(() => {
    if (!storeStarted || token !== storeToken) {
      return
    }

    reconnectTimer = null
    connectChannel(token)
  }, delay)
}

function connectChannel(token: number) {
  if (!storeStarted || token !== storeToken || !browserClient) {
    return
  }

  clearReconnectTimer()
  setPresenceSnapshot({
    viewerCount: presenceSnapshot.viewerCount,
    status: presenceSnapshot.status === 'ready' ? 'ready' : 'loading',
  })

  const realtimeChannel = browserClient
    .channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: browserId,
        },
      },
    })
    .on('presence', { event: 'sync' }, syncCount)
    .on('presence', { event: 'join' }, syncCount)
    .on('presence', { event: 'leave' }, syncCount)

  channel = realtimeChannel

  realtimeChannel.subscribe((nextStatus, error) => {
    if (!storeStarted || token !== storeToken || channel !== realtimeChannel) {
      return
    }

    if (nextStatus === 'SUBSCRIBED') {
      reconnectAttempt = 0
      subscribed = true
      setPresenceSnapshot({
        viewerCount: presenceSnapshot.viewerCount,
        status: 'ready',
      })
      void schedulePresenceSync(token)
      return
    }

    if (nextStatus === 'CHANNEL_ERROR' || nextStatus === 'TIMED_OUT') {
      logPresenceDebug(`Realtime subscribe failed with ${nextStatus}.`, error)
      queueReconnect(realtimeChannel, nextStatus, token)
      return
    }

    if (nextStatus === 'CLOSED') {
      queueReconnect(realtimeChannel, nextStatus, token)
    }
  })
}

function handleCoordinationMessage(message: CoordinationMessage, token: number) {
  if (!storeStarted || token !== storeToken) {
    return
  }

  if (message.tabId === tabId && message.type !== 'request-sync') {
    return
  }

  if (message.type === 'request-sync') {
    if (visible) {
      postMessage({
        type: 'visible',
        tabId,
        at: Date.now(),
      })
    }
    return
  }

  if (message.type === 'visible') {
    visibleTabs.set(message.tabId, message.at)
  } else {
    visibleTabs.delete(message.tabId)
  }

  void schedulePresenceSync(token)
}

function startPresenceStore() {
  if (storeStarted || typeof window === 'undefined') {
    return
  }

  storeStarted = true
  const token = ++storeToken
  presenceTask = Promise.resolve()
  reconnectAttempt = 0
  visibleTabs = new Map()
  setPresenceSnapshot(createDefaultPresenceSnapshot())

  if (!hasSupabaseEnv) {
    logPresenceDebug('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in the client bundle.')
    return
  }

  try {
    browserClient = getSupabaseBrowser()
  } catch (error) {
    logPresenceDebug('Failed to create browser client.', error)
    setPresenceSnapshot({
      viewerCount: 0,
      status: 'unavailable',
    })
    return
  }

  browserId = readOrCreateBrowserId()
  tabId = readOrCreateTabId()
  visible = document.visibilityState === 'visible'
  subscribed = false
  tracked = false

  if (visible) {
    visibleTabs.set(tabId, Date.now())
  }

  storageListener = (event: StorageEvent) => {
    if (event.key !== COORDINATION_KEY || !event.newValue) {
      return
    }

    try {
      const message = coordinationMessageSchema.safeParse(JSON.parse(event.newValue))
      if (message.success) {
        handleCoordinationMessage(message.data, token)
      }
    } catch {
      // Ignore malformed storage payloads.
    }
  }

  visibilityChangeListener = () => {
    const isVisible = document.visibilityState === 'visible'
    visible = isVisible

    if (isVisible) {
      visibleTabs.set(tabId, Date.now())
      postMessage({
        type: 'request-sync',
        tabId,
        at: Date.now(),
      })
      postMessage({
        type: 'visible',
        tabId,
        at: Date.now(),
      })
    } else {
      visibleTabs.delete(tabId)
      postMessage({
        type: 'hidden',
        tabId,
        at: Date.now(),
      })
    }

    void schedulePresenceSync(token)
  }

  pageHideListener = () => {
    visible = false
    visibleTabs.delete(tabId)
    postMessage({
      type: 'hidden',
      tabId,
      at: Date.now(),
    })
    void schedulePresenceSync(token)
  }

  if (typeof window.BroadcastChannel === 'function') {
    broadcastChannel = new window.BroadcastChannel(COORDINATION_KEY)
    broadcastListener = (event: MessageEvent<CoordinationMessage>) => {
      const message = coordinationMessageSchema.safeParse(event.data)
      if (message.success) {
        handleCoordinationMessage(message.data, token)
      }
    }
    broadcastChannel.addEventListener('message', broadcastListener)
  } else {
    window.addEventListener('storage', storageListener)
  }

  document.addEventListener('visibilitychange', visibilityChangeListener, {
    passive: true,
  })
  window.addEventListener('pagehide', pageHideListener, { passive: true })

  if (visible) {
    postMessage({
      type: 'request-sync',
      tabId,
      at: Date.now(),
    })
    postMessage({
      type: 'visible',
      tabId,
      at: Date.now(),
    })
  }

  connectChannel(token)
}

function teardownPresenceStore() {
  if (!storeStarted || typeof window === 'undefined') {
    return
  }

  storeStarted = false
  clearReconnectTimer()

  if (visibilityChangeListener) {
    document.removeEventListener('visibilitychange', visibilityChangeListener)
    visibilityChangeListener = null
  }

  if (pageHideListener) {
    window.removeEventListener('pagehide', pageHideListener)
    pageHideListener = null
  }

  if (storageListener) {
    window.removeEventListener('storage', storageListener)
    storageListener = null
  }

  if (broadcastChannel && broadcastListener) {
    broadcastChannel.removeEventListener('message', broadcastListener)
  }

  if (broadcastChannel) {
    broadcastChannel.close()
    broadcastChannel = null
  }

  broadcastListener = null

  const currentChannel = channel
  channel = null
  subscribed = false
  tracked = false
  visible = false
  visibleTabs = new Map()

  disposePresenceChannel(currentChannel)
  browserClient = null
  setPresenceSnapshot(DEFAULT_PRESENCE_SNAPSHOT)
}

function subscribePresence(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  listeners.add(listener)

  if (listeners.size === 1) {
    startPresenceStore()
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size === 0) {
      teardownPresenceStore()
    }
  }
}

function useFooterLivePresence() {
  return useSyncExternalStore(
    subscribePresence,
    () => presenceSnapshot,
    () => DEFAULT_PRESENCE_SNAPSHOT,
  )
}

function FooterLivePresenceValue() {
  const { status, viewerCount } = useFooterLivePresence()

  if (status === 'unavailable') {
    return <p>在线人数暂不可用。</p>
  }

  return (
    <p className="inline-flex items-center gap-2">
      <span aria-hidden className={`size-2 rounded-full ${status === 'ready' ? 'bg-emerald-500/80 footer-presence-dot' : 'bg-muted-foreground/50'}`} />
      {status === 'ready' ? `${viewerCount} 人正在浏览本站` : '正在同步在线人数'}
    </p>
  )
}

export function FooterLivePresence() {
  const [enabled, setEnabled] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (enabled) {
      return
    }

    let idleId: number | null = null
    const enable = () => setEnabled(true)
    const element = containerRef.current
    const idleWindow = window as IdleWindow
    const observer = element && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            enable()
          }
        }, { rootMargin: '160px' })
      : null

    if (observer && element) {
      observer.observe(element)
    }

    if (typeof idleWindow.requestIdleCallback === 'function') {
      idleId = idleWindow.requestIdleCallback(enable, { timeout: 3500 })
    } else {
      idleId = window.setTimeout(enable, 2500)
    }

    return () => {
      observer?.disconnect()

      if (idleId === null) {
        return
      }

      if (typeof idleWindow.cancelIdleCallback === 'function') {
        idleWindow.cancelIdleCallback(idleId)
      } else {
        window.clearTimeout(idleId)
      }
    }
  }, [enabled])

  return (
    <div ref={containerRef}>
      {enabled ? <FooterLivePresenceValue /> : <p>正在同步在线人数</p>}
    </div>
  )
}
