import { absoluteUrl, originFromRequest } from "@/lib/url";

export function GET(request: Request) {
  const origin = originFromRequest(request);
  const body = [
    "User-agent: *",
    "Allow: /",
    "Allow: /posts/",
    "Allow: /rss.xml",
    "Disallow: /editor",
    "Disallow: /preview",
    "Disallow: /api/",
    `Sitemap: ${absoluteUrl(origin, "/sitemap.xml")}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
