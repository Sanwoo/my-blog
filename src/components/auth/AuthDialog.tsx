'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AuthPanel } from '@/components/auth/AuthPanel'
import type { AuthDialogMode } from '@/lib/navigation'

export function AuthDialog({
  open,
  onOpenChange,
  next,
  initialMode = 'sign-in',
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  next?: string
  initialMode?: AuthDialogMode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="inset-x-0 top-0 flex h-dvh min-w-0 w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-x-clip overflow-y-hidden rounded-none border-x-0 border-b-0 bg-background/97 p-0 sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[min(90dvh,42rem)] sm:min-h-0 sm:w-[min(28.5rem,calc(100vw-1.5rem))] sm:max-w-[calc(100vw-1.5rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[1.5rem] sm:border sm:border-border/70">
        <AuthPanel next={next} initialMode={initialMode} onAuthenticated={() => onOpenChange(false)} onRequestClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
