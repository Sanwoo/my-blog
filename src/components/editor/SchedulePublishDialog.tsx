'use client'

import { useState } from 'react'
import { CalendarDays, Clock3, Loader2 } from 'lucide-react'
import { zhCN } from 'date-fns/locale/zh-CN'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const fieldErrorClassName = 'text-sm text-destructive'

interface SchedulePublishDialogProps {
  error?: string
  isPending: boolean
  open: boolean
  onConfirm: (publishAt: string) => void
  onChange: (publishAt: string) => void
  onErrorClear: () => void
  onOpenChange: (open: boolean) => void
  value: string
}

function padDateTimePart(value: number) {
  return String(value).padStart(2, '0')
}

function parseDatetimeLocalValue(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return null

  const [datePart, timePart = '00:00'] = trimmed.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hours, minutes] = timePart.split(':').map(Number)

  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
    return null
  }

  const parsed = new Date(year, month - 1, day, hours, minutes)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDatePart(date: Date) {
  return [date.getFullYear(), padDateTimePart(date.getMonth() + 1), padDateTimePart(date.getDate())].join('-')
}

function formatTimePart(date: Date) {
  return `${padDateTimePart(date.getHours())}:${padDateTimePart(date.getMinutes())}`
}

function mergeDateAndTime(date: Date, timeValue: string) {
  const [hours, minutes] = timeValue.split(':').map(Number)
  const nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Number.isNaN(hours) ? 9 : hours, Number.isNaN(minutes) ? 0 : minutes)

  return `${formatDatePart(nextDate)}T${formatTimePart(nextDate)}`
}

function publishAtLabel(value: string) {
  const parsed = parseDatetimeLocalValue(value)
  if (!parsed) return '未选择'

  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed)
}

export function SchedulePublishDialog({ error, isPending, open, onChange, onConfirm, onErrorClear, onOpenChange, value }: SchedulePublishDialogProps) {
  const selectedDate = parseDatetimeLocalValue(value)
  const calendarDate = selectedDate ? new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()) : undefined
  const timeValue = selectedDate ? formatTimePart(selectedDate) : ''
  const [today] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="left-1/2 top-1/2 flex max-h-[min(86dvh,42rem)] w-[min(42rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border/70 px-5 py-4">
          <DialogTitle>定时发布</DialogTitle>
          <DialogDescription>选择未来发布时间，确认后文章会进入排期。</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4">
          <div
            className={cn(
              'overflow-hidden rounded-xl border border-border/70 bg-background/80 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
              error && 'border-destructive ring-3 ring-destructive/20',
            )}
            aria-invalid={error ? true : undefined}
          >
            <div className="grid gap-0 sm:grid-cols-[minmax(0,1fr)_12rem]">
              <Calendar
                mode="single"
                locale={zhCN}
                selected={calendarDate}
                disabled={{ before: today }}
                className="w-full border-b border-border/60 p-3 sm:border-b-0 sm:border-r"
                classNames={{
                  root: 'w-full',
                  month: 'w-full',
                  table: 'w-full table-fixed border-collapse',
                }}
                onSelect={(nextDate) => {
                  onErrorClear()

                  if (!nextDate) {
                    onChange('')
                    return
                  }

                  onChange(mergeDateAndTime(nextDate, timeValue || '09:00'))
                }}
              />
              <div className="flex min-w-0 flex-col justify-between gap-4 p-3">
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/60 bg-muted/25 px-3 py-2">
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" aria-hidden />
                      日期
                    </span>
                    <span className={cn('mt-1 block text-sm leading-5', selectedDate ? 'text-foreground' : 'text-muted-foreground')}>{publishAtLabel(value)}</span>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock3 className="size-4" aria-hidden />
                    时间
                  </label>
                  <Input
                    type="time"
                    value={timeValue}
                    disabled={!selectedDate}
                    onChange={(event) => {
                      onErrorClear()
                      if (!selectedDate) return

                      onChange(mergeDateAndTime(selectedDate, event.target.value || '09:00'))
                    }}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-center"
                  disabled={!selectedDate || isPending}
                  onClick={() => {
                    onErrorClear()
                    onChange('')
                  }}
                >
                  清空时间
                </Button>
              </div>
            </div>
          </div>
          {error ? <p className={fieldErrorClassName}>{error}</p> : null}
        </div>

        <DialogFooter className="border-t border-border/70 px-5 py-4">
          <Button type="button" variant="outline" disabled={isPending} onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button type="button" disabled={isPending} onClick={() => onConfirm(value)}>
            {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            确认定时发布
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
