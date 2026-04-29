import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Footer } from '@/components/layout/Footer'
import { ArticleReadingProvider } from '@/components/article/ArticleReadingProvider'
import { ArticleAdjacentPosts } from '@/components/article/ArticleAdjacentPosts'
import { ReadingProgress } from '@/components/article/ReadingProgress'
import { ArticleHeader } from '@/components/article/ArticleHeader'
import { ArticleBody } from '@/components/article/ArticleBody'
import { ArticleTOC } from '@/components/article/ArticleTOC'
import { ArticleComments } from '@/components/article/ArticleComments'
import { getCommentsForPost, getReactionSummary } from '@/lib/community'
import { getViewerFromCookies } from '@/lib/auth'
import { getAdjacentPosts, getPublicPostBySlug } from '@/lib/posts'
import { absoluteUrl, AUTHOR_PROFILE, SITE_NAME, SITE_SUBTITLE } from '@/lib/site'
import { buildPostOgImageUrl, getShareSummary } from '@/lib/share'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicPostBySlug(slug)
  if (!post) return {}

  const description = getShareSummary(post.seoDescription || post.excerpt, SITE_SUBTITLE, 160)
  const url = absoluteUrl(`/posts/${post.slug}`)
  const ogImage = buildPostOgImageUrl(post.slug, post.updatedAt ?? post.workingCopyUpdatedAt ?? post.publishedAt ?? post.slug)

  return {
    title: post.title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description,
      siteName: SITE_NAME,
      locale: 'zh_CN',
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt ?? post.workingCopyUpdatedAt ?? undefined,
      authors: [AUTHOR_PROFILE.name],
      section: post.category.name,
      tags: post.tags.map((tag) => tag.name),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      creator: AUTHOR_PROFILE.handle,
      title: post.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params
  const postPromise = getPublicPostBySlug(slug)
  const viewerPromise = getViewerFromCookies()
  const post = await postPromise
  if (!post) notFound()
  const viewer = await viewerPromise
  const viewerId = viewer?.id
  const initialViewerKey = viewerId ?? 'anon'
  const shareSummary = getShareSummary(post.seoDescription || post.excerpt, SITE_SUBTITLE, 160)

  const [adjacentPosts, comments, initialReactionSummary] = await Promise.all([
    getAdjacentPosts(post),
    getCommentsForPost(post.id, viewerId),
    getReactionSummary(post.id, post.reactionCount, viewerId),
  ])

  return (
    <ArticleReadingProvider key={post.slug} items={post.toc}>
      <div className="min-h-screen">
        <ReadingProgress />
        <main className="mx-auto w-full max-w-[1460px] px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-24 lg:pt-32">
          <div className="grid gap-y-12 xl:grid-cols-[minmax(14rem,15.5rem)_minmax(0,1fr)_minmax(15rem,16.5rem)] xl:gap-x-8 2xl:gap-x-10">
            <div className="hidden xl:block xl:col-start-1 xl:row-start-1 xl:self-stretch">
              <div className="xl:h-full xl:pt-36 2xl:pt-40">
                <ArticleAdjacentPosts posts={adjacentPosts} currentPost={{ slug: post.slug, title: post.title }} mode="desktop" />
              </div>
            </div>

            <section className="min-w-0 xl:col-start-2 xl:row-start-1">
              <div className="mx-auto flex w-full max-w-180 flex-col gap-8 lg:gap-12">
                <ArticleHeader post={post} />
                <ArticleBody content={post.contentHtml} />
                <ArticleTOC items={post.toc} mode="mobile" />
                <ArticleAdjacentPosts posts={adjacentPosts} currentPost={{ slug: post.slug, title: post.title }} mode="mobile" />
              </div>
            </section>

            <div className="hidden xl:block xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:self-stretch">
              <div className="xl:h-full xl:pt-36 2xl:pt-40">
                <ArticleTOC items={post.toc} mode="desktop" />
              </div>
            </div>

            <div className="hidden xl:block xl:col-start-1 xl:row-start-2" aria-hidden />

            <section className="min-w-0 xl:col-start-2 xl:row-start-2">
              <div className="mx-auto flex w-full max-w-180 flex-col border-t border-editorial-rule/80 pt-10 lg:pt-14">
                <ArticleComments
                  slug={post.slug}
                  postTitle={post.title}
                  postExcerpt={shareSummary}
                  initialReactionSummary={initialReactionSummary}
                  initialComments={comments}
                  initialCount={post.commentCount}
                  initialViewerKey={initialViewerKey}
                />
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </ArticleReadingProvider>
  )
}
