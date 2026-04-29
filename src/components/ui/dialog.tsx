'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

function Dialog(props: DialogPrimitive.Root.Props<unknown>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  asChild = false,
  render,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger> & {
  asChild?: boolean
}) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" render={asChild ? <Slot /> : render} {...props} />
}
DialogTrigger.displayName = 'DialogTrigger'

function DialogPortal(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

const DialogOverlay = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Backdrop>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Backdrop>>(({ className, ...props }, ref) => {
  return (
    <DialogPrimitive.Backdrop
      ref={ref}
      data-slot="dialog-overlay"
      className={cn('fixed inset-0 z-50 bg-background/26 backdrop-blur-[1px] transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0', className)}
      {...props}
    />
  )
})
DialogOverlay.displayName = 'DialogOverlay'

const DialogContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Popup>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Popup>>(({ className, ...props }, ref) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          'fixed z-50 grid gap-4 rounded-[1.6rem] border border-border/70 bg-background/92 shadow-lg backdrop-blur-xl outline-none transition-[opacity,transform] duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
          className,
        )}
        {...props}
      />
    </DialogPortal>
  )
})
DialogContent.displayName = 'DialogContent'

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="dialog-footer" className={cn('flex items-center justify-end gap-2', className)} {...props} />
}

const DialogTitle = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Title>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>>(({ className, ...props }, ref) => {
  return <DialogPrimitive.Title ref={ref} data-slot="dialog-title" className={cn('text-base font-medium text-foreground', className)} {...props} />
})
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Description>, React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>>(({ className, ...props }, ref) => {
  return <DialogPrimitive.Description ref={ref} data-slot="dialog-description" className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
})
DialogDescription.displayName = 'DialogDescription'

function DialogClose({
  asChild = false,
  render,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close> & {
  asChild?: boolean
}) {
  return <DialogPrimitive.Close data-slot="dialog-close" render={asChild ? <Slot /> : render} {...props} />
}
DialogClose.displayName = 'DialogClose'

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger }
