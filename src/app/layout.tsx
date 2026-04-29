import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/providers/AppProviders'
import { SakuraBackgroundSlot } from '@/components/effects/SakuraBackgroundSlot'
import { SiteNav } from '@/components/layout/SiteNav'
import { ThemeScript } from '@/components/theme/ThemeScript'
import { AUTHOR_PROFILE, SITE_NAME, SITE_SUBTITLE, getSiteUrl } from '@/lib/site'
import { Inter, Noto_Serif_SC } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const notoSerifSC = Noto_Serif_SC({
  weight: ['300', '400'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
})

const siteUrl = getSiteUrl()
const siteDescription = AUTHOR_PROFILE.bio
const siteOgImageUrl = `${siteUrl}/opengraph-image`

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} | ${SITE_SUBTITLE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: siteDescription,
  applicationName: SITE_NAME,
  icons: {
    icon: [{ url: '/me.jpg', type: 'image/jpeg' }],
    shortcut: [{ url: '/me.jpg', type: 'image/jpeg' }],
    apple: [{ url: '/me.jpg', type: 'image/jpeg' }],
  },
  alternates: {
    canonical: siteUrl,
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
  openGraph: {
    title: SITE_NAME,
    description: siteDescription,
    url: siteUrl,
    type: 'website',
    siteName: SITE_NAME,
    locale: 'zh_CN',
    images: [
      {
        url: siteOgImageUrl,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - ${SITE_SUBTITLE}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: AUTHOR_PROFILE.handle,
    title: SITE_NAME,
    description: siteDescription,
    images: [siteOgImageUrl],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={cn('font-sans', inter.variable, notoSerifSC.variable)}>
      <body>
        <Toaster position="top-right" />
        <div className="relative isolate min-h-screen">
          <ThemeScript />
          <SakuraBackgroundSlot />
          <div className="relative z-10 w-full">
            <AppProviders>
              <TooltipProvider>
                <SiteNav />
                {children}
                <Analytics />
              </TooltipProvider>
            </AppProviders>
          </div>
        </div>
      </body>
    </html>
  )
}
