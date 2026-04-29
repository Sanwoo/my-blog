'use client'

import { useEffect, useState, useSyncExternalStore, type SetStateAction } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { NavMobilePanel } from '@/components/layout/NavMobilePanel'
import { cn } from '@/lib/utils'
import { NavActionCluster } from '@/components/layout/NavActionCluster'
import { NavDesktopLinks } from '@/components/layout/NavDesktopLinks'
import { SITE_NAME } from '@/lib/site'
import { Button } from '../ui/button'

const SITE_NAV_LINKS = [
  { href: '/', label: '首页' },
  { href: '/timeline', label: '文章' },
  { href: '/rss.xml', label: 'RSS' },
] as const

type SiteNavMode = 'top' | 'compact' | 'hidden'

const navModeListeners = new Set<() => void>()
let navModeSnapshot: SiteNavMode = 'top'
let navModeSubscriberCount = 0
let navModeFrameId = 0
let lastScrollY = 0
let scrollListenerAttached = false
const DESKTOP_NAV_MEDIA_QUERY = '(min-width: 768px)'

type DesktopViewportSnapshot = {
  matches: boolean
  version: number
}

type MobileOverlayState = {
  open: boolean
  viewportVersion: number
}

const DEFAULT_DESKTOP_VIEWPORT_SNAPSHOT: DesktopViewportSnapshot = {
  matches: false,
  version: 0,
}
const CLOSED_MOBILE_OVERLAY_STATE: MobileOverlayState = {
  open: false,
  viewportVersion: 0,
}

let desktopViewportSnapshot = DEFAULT_DESKTOP_VIEWPORT_SNAPSHOT

function resolveBooleanStateAction(nextState: SetStateAction<boolean>, currentState: boolean) {
  return typeof nextState === 'function' ? (nextState as (currentState: boolean) => boolean)(currentState) : nextState
}

function createMobileOverlayState(open: boolean, viewportVersion: number): MobileOverlayState {
  return {
    open,
    viewportVersion,
  }
}

function isMobileOverlayVisible(overlayState: MobileOverlayState, desktopViewport: DesktopViewportSnapshot) {
  return !desktopViewport.matches && overlayState.open && overlayState.viewportVersion === desktopViewport.version
}

function emitNavModeChange() {
  navModeListeners.forEach((listener) => listener())
}

function setNavModeSnapshot(nextMode: SiteNavMode) {
  if (navModeSnapshot === nextMode) {
    return
  }

  navModeSnapshot = nextMode
  emitNavModeChange()
}

function updateNavMode() {
  navModeFrameId = 0
  const scrollY = window.scrollY
  const delta = scrollY - lastScrollY
  lastScrollY = scrollY

  if (scrollY <= 20) {
    setNavModeSnapshot('top')
    return
  }

  if (delta > 6) {
    setNavModeSnapshot('hidden')
    return
  }

  if (delta < -6) {
    setNavModeSnapshot('compact')
  }
}

function handleNavScroll() {
  if (navModeFrameId) {
    return
  }

  navModeFrameId = window.requestAnimationFrame(updateNavMode)
}

function startNavModeTracking() {
  if (scrollListenerAttached || typeof window === 'undefined') {
    return
  }

  scrollListenerAttached = true
  lastScrollY = window.scrollY
  window.addEventListener('scroll', handleNavScroll, { passive: true })
}

function stopNavModeTracking() {
  if (!scrollListenerAttached || typeof window === 'undefined') {
    return
  }

  scrollListenerAttached = false
  window.removeEventListener('scroll', handleNavScroll)

  if (navModeFrameId) {
    window.cancelAnimationFrame(navModeFrameId)
    navModeFrameId = 0
  }
}

function subscribeActiveNavMode(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  navModeSubscriberCount += 1
  navModeListeners.add(listener)

  if (navModeSubscriberCount === 1) {
    startNavModeTracking()
  }

  return () => {
    navModeListeners.delete(listener)
    navModeSubscriberCount = Math.max(0, navModeSubscriberCount - 1)

    if (navModeSubscriberCount === 0) {
      stopNavModeTracking()
    }
  }
}

function subscribeFrozenNavMode() {
  return () => undefined
}

function subscribeMediaQuery(query: string, listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  const media = window.matchMedia(query)
  const handleChange = () => listener()

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }

  media.addListener(handleChange)
  return () => media.removeListener(handleChange)
}

function readMediaQueryMatch(query: string) {
  return typeof window !== 'undefined' && window.matchMedia(query).matches
}

function getDesktopViewportSnapshot() {
  if (typeof window === 'undefined') {
    return DEFAULT_DESKTOP_VIEWPORT_SNAPSHOT
  }

  const matches = readMediaQueryMatch(DESKTOP_NAV_MEDIA_QUERY)

  if (desktopViewportSnapshot.matches === matches) {
    return desktopViewportSnapshot
  }

  desktopViewportSnapshot = {
    matches,
    version: desktopViewportSnapshot.version + 1,
  }

  return desktopViewportSnapshot
}

function useSiteNavMode(mobileMenuOpen: boolean) {
  return useSyncExternalStore(
    mobileMenuOpen ? subscribeFrozenNavMode : subscribeActiveNavMode,
    () => navModeSnapshot,
    () => 'top',
  )
}

function useDesktopViewportSnapshot() {
  return useSyncExternalStore(
    (listener) => subscribeMediaQuery(DESKTOP_NAV_MEDIA_QUERY, listener),
    getDesktopViewportSnapshot,
    () => DEFAULT_DESKTOP_VIEWPORT_SNAPSHOT,
  )
}

export function SiteNav() {
  const pathname = usePathname()
  const [mobileMenuState, setMobileMenuState] = useState(CLOSED_MOBILE_OVERLAY_STATE)
  const [mobileAccountState, setMobileAccountState] = useState(CLOSED_MOBILE_OVERLAY_STATE)
  const desktopViewport = useDesktopViewportSnapshot()
  const mobileMenuVisible = isMobileOverlayVisible(mobileMenuState, desktopViewport)
  const mobileAccountVisible = isMobileOverlayVisible(mobileAccountState, desktopViewport)
  const hideNav = pathname.startsWith('/auth/') || pathname.startsWith('/editor')
  const isWideRoute = pathname === '/' || pathname === '/timeline'
  const { loading, startSignIn, viewer, signOut } = useAuth()
  const navMode = useSiteNavMode(mobileMenuVisible)
  const mobilePanelId = 'site-mobile-nav-panel'

  const desktopCompactMode = navMode === 'compact' && !mobileMenuVisible
  const fullNavVisible = navMode === 'top' || desktopCompactMode || mobileMenuVisible
  const isTopMode = navMode === 'top' && !mobileMenuVisible
  const isWideTopMode = isWideRoute && isTopMode
  const navContainerClassName = isWideRoute ? 'mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8' : 'mx-auto w-full max-w-[1180px] px-4 sm:px-6'

  const updateMobileOverlayState = (nextState: SetStateAction<boolean>, setState: (next: SetStateAction<MobileOverlayState>) => void) => {
    setState((current) => createMobileOverlayState(resolveBooleanStateAction(nextState, current.open), desktopViewport.version))
  }

  const setMobileMenuOpen = (nextState: SetStateAction<boolean>) => {
    updateMobileOverlayState(nextState, setMobileMenuState)
  }

  const setMobileAccountOpen = (nextState: SetStateAction<boolean>) => {
    updateMobileOverlayState(nextState, setMobileAccountState)
  }

  useEffect(() => {
    if (!mobileMenuVisible) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuState((current) => (current.open ? createMobileOverlayState(false, desktopViewport.version) : current))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [desktopViewport.version, mobileMenuVisible])

  if (hideNav) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40">
      {mobileMenuVisible ? <div className="pointer-events-auto fixed inset-0 z-0 bg-transparent md:hidden" aria-hidden onClick={() => setMobileMenuOpen(false)} /> : null}
      <div
        className={cn(
          'absolute inset-x-0 top-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
          fullNavVisible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-6 opacity-0',
        )}
      >
        <nav className={cn(navContainerClassName, isWideRoute ? 'pt-[calc(env(safe-area-inset-top)+0.7rem)] sm:pt-5' : 'pt-[calc(env(safe-area-inset-top)+0.55rem)] sm:pt-4')}>
          <div className="relative z-10 w-full">
            <div className="overflow-hidden rounded-[1.3rem] border border-black/8 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.38)] [-webkit-backdrop-filter:saturate(180%)_blur(15px)] [backdrop-filter:saturate(180%)_blur(15px)] dark:border-white/10 dark:bg-[#1d1d1f]/72 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:shadow-none md:[-webkit-backdrop-filter:none] md:[backdrop-filter:none]">
              <div className="relative flex min-h-12 min-w-0 w-full items-center gap-2 px-2.5 md:min-h-13 md:gap-4 md:px-0">
                <Button
                  type="button"
                  variant="ghost"
                  className="absolute inset-0 z-10 md:hidden"
                  aria-label={mobileMenuVisible ? '收起导航菜单' : '展开导航菜单'}
                  aria-controls={mobilePanelId}
                  aria-expanded={mobileMenuVisible}
                  onClick={() => setMobileMenuOpen((open) => !open)}
                />
                <Link
                  href="/"
                  className={cn(
                    'shrink-0 rounded-full border border-transparent bg-transparent px-0 py-0 font-serif text-[15px] text-neutral-800 tracking-normal transition-[transform,background-color,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.02] dark:text-foreground/86 md:border-black/10 md:bg-white/45 md:p-1 md:text-inherit md:shadow-xs md:dark:border-white/10 md:dark:bg-white/4',
                    desktopCompactMode && 'md:hidden',
                    isWideTopMode
                      ? 'md:border-white/22 md:bg-white/10 md:backdrop-blur-md md:dark:border-white/10 md:dark:bg-black/10'
                      : isTopMode
                        ? 'md:border-white/30 md:bg-white/16 md:backdrop-blur-md md:dark:border-white/12 md:dark:bg-black/12'
                        : 'md:border-border/70 md:bg-card/82 md:backdrop-blur-xl',
                  )}
                  aria-label="首页"
                >
                  <span className="md:hidden">{SITE_NAME}</span>
                  <Image src="/me.jpg" alt="" width={44} height={44} className="hidden size-9 rounded-full object-cover md:block md:size-11" priority />
                </Link>
                <NavDesktopLinks links={SITE_NAV_LINKS} pathname={pathname} isTopMode={isTopMode} isWideTopMode={isWideTopMode} />
                <NavActionCluster
                  desktopCompactMode={desktopCompactMode}
                  loading={loading}
                  viewer={viewer}
                  pathname={pathname}
                  mobileMenuOpen={mobileMenuVisible}
                  setMobileMenuOpen={setMobileMenuOpen}
                  mobileAccountOpen={mobileAccountVisible}
                  setMobileAccountOpen={setMobileAccountOpen}
                  mobilePanelId={mobilePanelId}
                  startSignIn={startSignIn}
                  signOut={signOut}
                />
              </div>
              <NavMobilePanel
                id={mobilePanelId}
                open={mobileMenuVisible}
                links={SITE_NAV_LINKS}
                loading={loading}
                viewer={viewer}
                pathname={pathname}
                startSignIn={startSignIn}
                onClose={() => setMobileMenuOpen(false)}
                onOpenAccount={() => {
                  setMobileMenuOpen(false)
                  setMobileAccountOpen(true)
                }}
              />
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
