'use client'

import { Fragment } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ThemePreference } from '@/lib/theme'
import { setThemePreference, useThemeSnapshot } from '@/components/theme/useThemeSnapshot'

type ThemeToggleVariant = 'pill' | 'inline-text'

export function ThemeToggle({ variant = 'pill' }: { variant?: ThemeToggleVariant }) {
  const themeState = useThemeSnapshot()

  const items: Array<{
    value: ThemePreference
    label: string
    icon: typeof Sun
  }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
    { value: 'dark', label: 'Dark', icon: Moon },
  ]

  const handleThemeChange = (value: string) => {
    if (value !== 'light' && value !== 'system' && value !== 'dark') return

    setThemePreference(value)
  }

  if (variant === 'inline-text') {
    return (
      <div className="flex flex-wrap items-center gap-1 text-[13px]" role="group" aria-label="切换主题">
        {items.map(({ value, label }, index) => (
          <Fragment key={value}>
            <button
              type="button"
              className={cn(
                'cursor-pointer rounded-sm px-1 py-0.5 transition-colors duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
                themeState.preference === value
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={themeState.preference === value}
              aria-label={`切换到${label}主题`}
              onClick={() => handleThemeChange(value)}
            >
              {label}
            </button>
            {index < items.length - 1 ? <span aria-hidden className="select-none text-muted-foreground/55">·</span> : null}
          </Fragment>
        ))}
      </div>
    )
  }

  return (
    <Tabs value={themeState.preference} onValueChange={handleThemeChange} className="gap-0" suppressHydrationWarning>
      <TabsList aria-label="切换主题" className="inline-flex min-w-0 max-w-full items-center rounded-full border border-border/70 bg-background/80 p-1 shadow-xs backdrop-blur supports-backdrop-filter:bg-background/72">
        {items.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            title={label}
            className={cn(
              'h-8 min-w-0 rounded-full px-2.5 text-[12px] cursor-pointer sm:px-3',
              'data-active:bg-foreground data-active:text-background',
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              'dark:data-active:border-transparent dark:data-active:bg-foreground dark:data-active:text-background',
              'after:hidden',
            )}
          >
            <Icon width={15} height={15} aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
