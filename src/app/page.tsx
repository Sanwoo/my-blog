import { Footer } from '@/components/layout/Footer'
import { HeroIntro, HeroRail } from '@/components/home/Hero'
import { HomeTimelineSection } from '@/components/home/HomeTimelineSection'
import { RecentCommentsSection } from '@/components/home/RecentCommentsSection'
import { getLatestCommentsPreview } from '@/lib/community'
import { buildHomeTimelinePreview, getTaxonomy, getTimelineEntries } from '@/lib/posts'

export const revalidate = 300

export default async function Home() {
  const [entries, taxonomy, latestComments] = await Promise.all([getTimelineEntries(), getTaxonomy(), getLatestCommentsPreview()])

  const preview = buildHomeTimelinePreview(entries)

  return (
    <div id="home-top" className="min-h-screen w-full">
      <main className="mx-auto flex w-full max-w-[1360px] min-w-0 flex-col gap-[clamp(4rem,7vw,7rem)] px-4 pb-24 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-28 lg:pt-36">
        <div className="grid min-w-0 gap-10 xl:grid-cols-[minmax(0,1.58fr)_minmax(20rem,24rem)] xl:items-start xl:gap-x-12">
          <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-20">
            <div className="order-1 min-w-0 w-full">
              <HeroIntro />
            </div>
            <div className="order-3 min-w-0 w-full">
              <HomeTimelineSection preview={preview} />
            </div>
          </div>
          <div className="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-16">
            <div className="order-2 min-w-0 w-full">
              <HeroRail total={entries.length} categoryCount={taxonomy.categories.length} tagCount={taxonomy.tags.length} recent={entries.slice(0, 4)} />
            </div>
            <div className="order-4 min-w-0 w-full">
              <RecentCommentsSection comments={latestComments} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
