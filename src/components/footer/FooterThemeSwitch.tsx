'use client'

import { Fragment } from 'react'
import type { ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { setThemePreference, useThemeSnapshot } from '@/components/theme/useThemeSnapshot'

const themeOptions: Array<{ value: ThemePreference; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
]

export function FooterThemeSwitch() {
  const { preference } = useThemeSnapshot()

  const handleThemeChange = (nextPreference: ThemePreference) => {
    setThemePreference(nextPreference)
  }

  return (
    <p className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span>Theme:</span>
      {themeOptions.map(({ value, label }, index) => (
        <Fragment key={value}>
          <button
            type="button"
            aria-pressed={preference === value}
            onClick={() => handleThemeChange(value)}
            className={cn(
              'cursor-pointer transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none',
              preference === value && 'underline underline-offset-2',
            )}
          >
            {label}
          </button>
          {index < themeOptions.length - 1 ? <span aria-hidden>/</span> : null}
        </Fragment>
      ))}
    </p>
  )
}
