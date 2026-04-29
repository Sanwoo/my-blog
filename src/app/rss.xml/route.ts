import { getFeedPosts } from '@/lib/posts'
import { renderDocument } from '@/lib/content'
import { AUTHOR_PROFILE, SITE_NAME } from '@/lib/site'
import { absoluteUrl, originFromRequest } from '@/lib/url'

export const revalidate = 300

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')
}

export async function GET(request: Request) {
  const origin = originFromRequest(request)
  const posts = await getFeedPosts()

  const items = posts
    .map(
      (post) => {
        const contentHtml = post.content_html.trim() || renderDocument(post.content_json).html

        return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${absoluteUrl(origin, `/posts/${post.slug}`)}</link>
          <guid>${absoluteUrl(origin, `/posts/${post.slug}`)}</guid>
          <description>${escapeXml(post.seo_description || post.excerpt)}</description>
          <pubDate>${new Date(post.published_at ?? post.created_at).toUTCString()}</pubDate>
          <author>${escapeXml(AUTHOR_PROFILE.email)} (${escapeXml(AUTHOR_PROFILE.name)})</author>
          <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
        </item>
      `
      },
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
  <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>${escapeXml(SITE_NAME)}</title>
      <link>${absoluteUrl(origin, '/')}</link>
      <language>zh-CN</language>
      ${items}
    </channel>
  </rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
