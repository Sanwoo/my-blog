'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import type { SakuraProfileKey } from '@/components/effects/SakuraBackground'

const SakuraBackground = dynamic(
  () => import('@/components/effects/SakuraBackground').then((mod) => mod.SakuraBackground),
  {
    ssr: false,
    loading: () => <div className="sakura-particles" />,
  },
)

function resolveSakuraProfileKey(pathname: string): SakuraProfileKey {
  return pathname === '/' ? 'home' : 'quiet'
}

function shouldRenderSakuraBackground(pathname: string) {
  return pathname === '/' || pathname === '/timeline'
}

export function SakuraBackgroundSlot() {
  const pathname = usePathname()
  const enabled = shouldRenderSakuraBackground(pathname)

  if (!enabled) {
    return null
  }

  return (
    <div className="sakura-layer" aria-hidden>
      <div className="sakura-haze sakura-haze-top" />
      <div className="sakura-haze sakura-haze-bottom" />
      <SakuraBackground profile={resolveSakuraProfileKey(pathname)} />
    </div>
  )
}
