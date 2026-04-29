import { getSitemapEntries } from "@/lib/posts";
import { absoluteUrl, originFromRequest } from "@/lib/url";

export const revalidate = 300;

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function sitemapUrl(url: string, lastModified: string) {
  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${escapeXml(lastModified)}</lastmod>
  </url>`;
}

function toIsoDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export async function GET(request: Request) {
  const origin = originFromRequest(request);
  const entries = await getSitemapEntries();
  const urls = [
    sitemapUrl(absoluteUrl(origin, "/"), new Date().toISOString()),
    ...entries.map((entry) => sitemapUrl(absoluteUrl(origin, `/posts/${entry.slug}`), toIsoDate(entry.updatedAt))),
  ].join("\n");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
