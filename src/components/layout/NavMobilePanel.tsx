'use client'

import Link from 'next/link'
import {
  AccountNotificationBadge,
  useInteractionNotificationSummary,
} from '@/components/account/interaction-notification-summary'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type { ViewerSession } from '@/lib/types'
import { cn } from '@/lib/utils'

export function NavMobilePanel({
  id,
  open,
  links,
  loading,
  viewer,
  pathname,
  startSignIn,
  onClose,
  onOpenAccount,
}: {
  id: string
  open: boolean
  links: ReadonlyArray<{ href: string; label: string }>
  loading: boolean
  viewer: ViewerSession | null
  pathname: string
  startSignIn: (next?: string) => void
  onClose: () => void
  onOpenAccount: () => void
}) {
  const { unreadCount } = useInteractionNotificationSummary(Boolean(viewer))

  return (
    <div
      className={cn(
        'grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
        open ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0',
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div id={id} role="region" aria-label="移动端导航" className="border-t border-black/8 px-4 pb-4 pt-2 dark:border-white/10">
          <nav aria-label="移动端主导航" className="divide-y divide-black/6 dark:divide-white/8">
            {links.map(({ href, label }) => {
              const active = href === pathname

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center justify-between gap-4 py-3 text-[15px] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                  onClick={onClose}
                >
                  <span>{label}</span>
                  <span aria-hidden className={cn('h-px w-4 rounded-full transition-colors duration-200', active ? 'bg-foreground' : 'bg-black/10 dark:bg-white/12')} />
                </Link>
              )
            })}

            {!loading ? (
              viewer ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-3 text-left text-[15px] font-medium text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground"
                  onClick={onOpenAccount}
                >
                  <span className="truncate">账户</span>
                  <AccountNotificationBadge count={unreadCount} variant="inline" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-4 py-3 text-left text-[15px] font-medium text-muted-foreground transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:text-foreground"
                  onClick={() => {
                    onClose()
                    startSignIn(pathname)
                  }}
                >
                  <span>登录</span>
                </button>
              )
            ) : null}
          </nav>

          <div className="mt-3 border-t border-black/6 pt-3 dark:border-white/8">
            <ThemeToggle variant="inline-text" />
          </div>
        </div>
      </div>
    </div>
  )
}
