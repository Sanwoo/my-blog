'use client'

import * as React from 'react'
import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'

function Select({ modal = false, ...props }: SelectPrimitive.Root.Props<string>) {
  return <SelectPrimitive.Root data-slot="select" modal={modal} {...props} />
}

const SelectTrigger = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>>(({ className, children, ...props }, ref) => {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      className={cn(
        'flex h-11 w-full items-center justify-between gap-3 rounded-md border border-border/70 bg-background/85 px-3 text-sm text-foreground shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </SelectPrimitive.Trigger>
  )
})
SelectTrigger.displayName = 'SelectTrigger'

const SelectValue = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Value>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Value>>(({ className, ...props }, ref) => {
  return <SelectPrimitive.Value ref={ref} data-slot="select-value" className={cn('truncate text-left', className)} {...props} />
})
SelectValue.displayName = 'SelectValue'

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Popup> & Pick<React.ComponentPropsWithoutRef<typeof SelectPrimitive.Positioner>, 'align' | 'alignItemWithTrigger' | 'side' | 'sideOffset'>
>(({ className, children, align = 'start', alignItemWithTrigger = false, side = 'bottom', sideOffset = 6, ...props }, ref) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner align={align} alignItemWithTrigger={alignItemWithTrigger} side={side} sideOffset={sideOffset} className="z-50 w-(--anchor-width) max-w-(--available-width)">
        <SelectPrimitive.Popup
          ref={ref}
          data-slot="select-content"
          className={cn(
            'max-h-80 overflow-hidden rounded-xl border border-border/70 bg-background/95 text-foreground shadow-lg backdrop-blur-xl outline-none transition-[opacity,transform] duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
            className,
          )}
          {...props}
        >
          <SelectPrimitive.List className="max-h-80 overflow-y-auto p-1">{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = 'SelectContent'

const SelectGroup = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Group>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Group>>(({ className, ...props }, ref) => {
  return <SelectPrimitive.Group ref={ref} data-slot="select-group" className={cn('space-y-1', className)} {...props} />
})
SelectGroup.displayName = 'SelectGroup'

const SelectLabel = React.forwardRef<React.ElementRef<typeof SelectPrimitive.GroupLabel>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.GroupLabel>>(({ className, ...props }, ref) => {
  return (
    <SelectPrimitive.GroupLabel ref={ref} data-slot="select-label" className={cn('px-2.5 py-1 text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground/80', className)} {...props} />
  )
})
SelectLabel.displayName = 'SelectLabel'

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>>(({ className, children, ...props }, ref) => {
  return (
    <SelectPrimitive.Item
      ref={ref}
      data-slot="select-item"
      className={cn(
        'relative flex cursor-default items-center rounded-md px-2.5 py-2 text-sm outline-none transition-colors data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50 data-selected:text-foreground',
        className,
      )}
      {...props}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        <SelectPrimitive.ItemIndicator className="flex size-4 items-center justify-center text-foreground">
          <Check className="size-3.5" aria-hidden />
        </SelectPrimitive.ItemIndicator>
        <SelectPrimitive.ItemText className="truncate">{children}</SelectPrimitive.ItemText>
      </span>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = 'SelectItem'

const SelectSeparator = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Separator>, React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>>(({ className, ...props }, ref) => {
  return <SelectPrimitive.Separator ref={ref} data-slot="select-separator" className={cn('my-1 h-px bg-border/70', className)} {...props} />
})
SelectSeparator.displayName = 'SelectSeparator'

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue }
