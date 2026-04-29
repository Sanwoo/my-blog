'use client'

import * as React from 'react'
import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

function Popover(props: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  asChild = false,
  nativeButton = true,
  render,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> & {
  asChild?: boolean
}) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" nativeButton={nativeButton} render={asChild ? <Slot /> : render} {...props} />
}
PopoverTrigger.displayName = 'PopoverTrigger'

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Popup>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Popup> & Pick<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Positioner>, 'align' | 'alignOffset' | 'side' | 'sideOffset'>
>(({ align = 'center', alignOffset = 0, className, side = 'bottom', sideOffset = 8, ...props }, ref) => {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner align={align} alignOffset={alignOffset} side={side} sideOffset={sideOffset} className="z-[60] max-w-(--available-width)">
        <PopoverPrimitive.Popup
          ref={ref}
          data-slot="popover-content"
          className={cn(
            'z-[60] origin-(--transform-origin) rounded-[1.6rem] border border-border/70 bg-background/88 p-4 text-popover-foreground shadow-lg backdrop-blur-xl outline-none transition-[opacity,transform] duration-200 data-starting-style:scale-95 data-starting-style:opacity-0 data-ending-style:scale-95 data-ending-style:opacity-0',
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
})
PopoverContent.displayName = 'PopoverContent'

const PopoverArrow = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Arrow>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Arrow>>(({ className, ...props }, ref) => {
  return <PopoverPrimitive.Arrow ref={ref} data-slot="popover-arrow" className={cn('z-[60] size-3 rotate-45 rounded-tl-sm border-l border-t border-border/70 bg-background/88', className)} {...props} />
})
PopoverArrow.displayName = 'PopoverArrow'

const PopoverTitle = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Title>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Title>>(({ className, ...props }, ref) => {
  return <PopoverPrimitive.Title ref={ref} data-slot="popover-title" className={cn('text-sm font-medium text-foreground', className)} {...props} />
})
PopoverTitle.displayName = 'PopoverTitle'

const PopoverDescription = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Description>, React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Description>>(
  ({ className, ...props }, ref) => {
    return <PopoverPrimitive.Description ref={ref} data-slot="popover-description" className={cn('text-sm leading-6 text-muted-foreground', className)} {...props} />
  },
)
PopoverDescription.displayName = 'PopoverDescription'

function PopoverClose({
  asChild = false,
  nativeButton = true,
  render,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Close> & {
  asChild?: boolean
}) {
  return <PopoverPrimitive.Close data-slot="popover-close" nativeButton={nativeButton} render={asChild ? <Slot /> : render} {...props} />
}
PopoverClose.displayName = 'PopoverClose'

export { Popover, PopoverArrow, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger }
