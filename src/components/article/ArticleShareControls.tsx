'use client'

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps } from 'react'
import { ClipboardCopy, Link2, Send, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from '@/components/ui/popover'
import { buildClipboardShareText, buildTelegramShareUrl, buildWeiboShareUrl, buildXShareUrl, getPostAbsoluteUrl, getPostShareText, getShareSummary } from '@/lib/share'
import { cn } from '@/lib/utils'

type ShareStatusTone = 'neutral' | 'success' | 'error'

type ShareStatus = {
  message: string
  tone: ShareStatusTone
}

const DEFAULT_SHARE_STATUS = '复制链接，或带上一段适合转发的摘要。'

type ArticleShareControlsProps = {
  slug: string
  title: string
  excerpt?: string | null
  align?: ComponentProps<typeof PopoverContent>['align']
  side?: ComponentProps<typeof PopoverContent>['side']
  sideOffset?: number
  triggerLabel?: string
  triggerVariant?: ComponentProps<typeof Button>['variant']
  triggerSize?: ComponentProps<typeof Button>['size']
  triggerClassName?: string
  iconOnly?: boolean
  className?: string
}

function canUseClipboard() {
  return typeof navigator !== 'undefined' && Boolean(navigator.clipboard?.writeText)
}

function canUseNativeShare() {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

function subscribeNavigatorShare() {
  return () => undefined
}

function getNativeShareServerSnapshot() {
  return false
}

export function ArticleShareControls({
  slug,
  title,
  excerpt,
  align = 'start',
  side = 'bottom',
  sideOffset = 8,
  triggerLabel = '分享',
  triggerVariant = 'subtle',
  triggerSize = 'default',
  triggerClassName,
  iconOnly = false,
  className,
}: ArticleShareControlsProps) {
  const resetTimerRef = useRef<number | null>(null)
  const [status, setStatus] = useState<ShareStatus>({
    message: DEFAULT_SHARE_STATUS,
    tone: 'neutral',
  })
  const shareSummary = getShareSummary(excerpt, '')
  const shareText = getPostShareText(title, shareSummary)
  const nativeShareAvailable = useSyncExternalStore(
    subscribeNavigatorShare,
    canUseNativeShare,
    getNativeShareServerSnapshot,
  )

  const buildShareUrl = () => getPostAbsoluteUrl(window.location.origin, slug)
  const buildClipboardText = () => buildClipboardShareText(title, buildShareUrl(), excerpt)

  const announce = (message: string, tone: ShareStatusTone = 'success') => {
    setStatus({ message, tone })

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = window.setTimeout(() => {
      setStatus({
        message: DEFAULT_SHARE_STATUS,
        tone: 'neutral',
      })
    }, 2200)
  }

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const copyText = async (text: string, successMessage: string) => {
    if (!canUseClipboard()) {
      announce('当前浏览器不支持自动复制，请手动复制地址栏链接。', 'error')
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      announce(successMessage)
    } catch {
      announce('复制失败，请稍后再试。', 'error')
    }
  }

  const openShareWindow = (url: string, platform: string) => {
    const popup = window.open(url, '_blank', 'noopener,noreferrer')

    if (!popup) {
      announce('浏览器拦截了新窗口，请复制链接分享。', 'error')
      return
    }

    announce(`已打开 ${platform} 分享窗口。`)
  }

  const handleSystemShare = async () => {
    const shareUrl = buildShareUrl()

    if (!navigator.share) {
      await copyText(shareUrl, '链接已复制。')
      return
    }

    try {
      await navigator.share({
        title,
        text: shareSummary || title,
        url: shareUrl,
      })
      announce('已唤起系统分享。')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        announce('已取消分享。', 'neutral')
        return
      }

      announce('系统分享暂不可用，请复制链接分享。', 'error')
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={cn('rounded-full', triggerClassName)}
          aria-label={iconOnly ? '分享文章' : undefined}
        >
          <Share2 width={16} height={16} aria-hidden />
          {iconOnly ? <span className="sr-only">{triggerLabel}</span> : triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} side={side} sideOffset={sideOffset} className={cn('w-[min(23rem,calc(100vw-2rem))] space-y-4', className)}>
        <div className="space-y-1">
          <PopoverTitle>转发这篇文章</PopoverTitle>
          <PopoverDescription aria-live="polite" className={cn(status.tone === 'error' && 'text-destructive', status.tone === 'success' && 'text-foreground')}>
            {status.message}
          </PopoverDescription>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button type="button" className="justify-start rounded-2xl" onClick={() => void copyText(buildShareUrl(), '链接已复制。')}>
            <Link2 width={16} height={16} aria-hidden />
            复制链接
          </Button>
          <Button type="button" variant="outline" className="justify-start rounded-2xl" onClick={() => void copyText(buildClipboardText(), '摘要已复制。')}>
            <ClipboardCopy width={16} height={16} aria-hidden />
            复制摘要
          </Button>
          {nativeShareAvailable ? (
            <Button type="button" variant="outline" className="justify-start rounded-2xl" onClick={() => void handleSystemShare()}>
              <Send width={16} height={16} aria-hidden />
              系统分享
            </Button>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-border/60 pt-3">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/72">发送到平台</p>
          <div className="grid gap-2 sm:grid-cols-5">
            <Button type="button" size="sm" variant="subtle" className="rounded-full" onClick={() => openShareWindow(buildXShareUrl(buildShareUrl(), shareText), 'X')}>
              X
            </Button>
            <Button type="button" size="sm" variant="subtle" className="rounded-full" onClick={() => openShareWindow(buildTelegramShareUrl(buildShareUrl(), shareText), 'Telegram')}>
              Telegram
            </Button>
            <Button type="button" size="sm" variant="subtle" className="rounded-full" onClick={() => openShareWindow(buildWeiboShareUrl(buildShareUrl(), shareText), '微博')}>
              微博
            </Button>
            <Button type="button" size="sm" variant="subtle" className="rounded-full" onClick={() => void copyText(buildClipboardText(), '已复制，可到微信粘贴分享。')}>
              微信
            </Button>
            <Button type="button" size="sm" variant="subtle" className="rounded-full" onClick={() => void copyText(buildClipboardText(), '已复制，可到小红书粘贴分享。')}>
              小红书
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
