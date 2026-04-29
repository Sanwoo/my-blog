import Link from 'next/link'
import { FooterLivePresenceSlot } from '@/components/footer/FooterLivePresenceSlot'
import { FooterThemeSwitch } from '@/components/footer/FooterThemeSwitch'
import { getPublicContentSummary } from '@/lib/posts'
import { AUTHOR_PROFILE, SITE_NAME, SITE_SUBTITLE } from '@/lib/site'
import { cn } from '@/lib/utils'

const footerLinkClassName = 'transition-colors hover:text-foreground focus-visible:text-foreground'

async function getFooterSummary() {
  return getPublicContentSummary()
}

export async function Footer() {
  const { articleCount, categoryCount, tagCount } = await getFooterSummary()
  const currentYear = new Date().getFullYear()

  const browseLinks = [
    { href: '/#home-top', label: '首页' },
    { href: '/timeline', label: '时间线' },
    { href: '/#latest-comments', label: '最近来信' },
    { href: '/rss.xml', label: 'RSS' },
  ]

  const siteFacts = [
    { label: '已发布文章', value: `${articleCount} 篇` },
    { label: '分类', value: `${categoryCount} 个` },
    { label: '标签', value: `${tagCount} 个` },
  ]

  return (
    <footer className="border-t border-editorial-rule bg-background/72">
      <div className={cn('mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8', 'py-14 sm:py-16 lg:py-20')}>
        <div className="grid gap-6 border-b border-editorial-rule pb-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(31rem,1fr)] lg:gap-12 lg:pb-12">
          <section className="space-y-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/78">{SITE_NAME}</p>
            <h2 className="max-w-4xl text-[clamp(1.85rem,1.45rem+1vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.05em] text-foreground xl:max-w-none xl:text-[clamp(1.8rem,1.45rem+0.7vw,2.35rem)] xl:whitespace-nowrap">
              {AUTHOR_PROFILE.bio}
            </h2>
            <div className="text-sm text-muted-foreground">
              <p className="font-serif font-medium text-foreground/88 sm:whitespace-nowrap">{AUTHOR_PROFILE.poem}</p>
            </div>
          </section>

          <div className="grid grid-cols-2 gap-6 xl:grid-cols-3 xl:gap-10">
            <nav aria-label="页脚导航" className="space-y-3">
              <p className="text-sm font-medium text-foreground">Browse</p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {browseLinks.map((link) =>
                  link.href.includes('#') ? (
                    <a key={link.href} href={link.href} className={footerLinkClassName}>
                      {link.label}
                    </a>
                  ) : (
                    <Link key={link.href} href={link.href} className={footerLinkClassName}>
                      {link.label}
                    </Link>
                  ),
                )}
              </div>
            </nav>

            <section className="space-y-3">
              <p className="text-sm font-medium text-foreground">Author</p>
              <address className="flex not-italic flex-col gap-2 text-sm text-muted-foreground">
                <Link href={`mailto:${AUTHOR_PROFILE.email}`} className={footerLinkClassName} target="_blank">
                  Email
                </Link>
                <Link href={AUTHOR_PROFILE.telegram} className={footerLinkClassName} target="_blank">
                  Telegram
                </Link>
                <Link href={AUTHOR_PROFILE.github} className={footerLinkClassName} target="_blank">
                  GitHub
                </Link>
              </address>
            </section>

            <section className="col-span-2 space-y-3 xl:col-span-1">
              <p className="text-sm font-medium text-foreground">Status</p>
              <dl className="space-y-2 text-sm text-muted-foreground">
                {siteFacts.map((fact) => (
                  <div key={fact.label} className="flex items-baseline justify-between gap-3 border-t border-editorial-rule pt-2.5 first:border-t-0 first:pt-0">
                    <dt>{fact.label}</dt>
                    <dd className="font-medium text-foreground">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="border-t border-editorial-rule pt-3 text-sm text-muted-foreground">
                <FooterLivePresenceSlot />
              </div>
            </section>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2 text-xs text-muted-foreground sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-3">
          <p className="row-span-2 self-start sm:row-span-1">
            © {currentYear} {SITE_NAME}
          </p>
          <p className="justify-self-end text-right sm:justify-self-auto sm:text-left">{SITE_SUBTITLE}</p>
          <div className="justify-self-end sm:col-start-3">
            <FooterThemeSwitch />
          </div>
        </div>
      </div>
    </footer>
  )
}
