import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as robotsGet } from "@/app/robots.txt/route";
import { GET as rssGet } from "@/app/rss.xml/route";
import { GET as sitemapGet } from "@/app/sitemap.xml/route";
import { getFeedPosts, getSitemapEntries } from "@/lib/posts";

vi.mock("@/lib/posts", () => ({
  getFeedPosts: vi.fn(),
  getSitemapEntries: vi.fn(),
}));

describe("runtime-origin routes", () => {
  beforeEach(() => {
    vi.mocked(getFeedPosts).mockResolvedValue([
      {
        slug: "quiet-note",
        title: "Quiet Note",
        excerpt: "A small signal.",
        seo_description: "A small signal.",
        content_html: "<p>Hello.</p>",
        content_json: { type: "doc", content: [] },
        published_at: "2026-04-28T00:00:00.000Z",
        created_at: "2026-04-27T00:00:00.000Z",
      },
    ] as never);
    vi.mocked(getSitemapEntries).mockResolvedValue([
      {
        slug: "quiet-note",
        updatedAt: "2026-04-28T00:00:00.000Z",
        publishedAt: "2026-04-28T00:00:00.000Z",
      },
    ]);
  });

  it("renders robots.txt with the request URL origin", async () => {
    const response = robotsGet(
      new Request("https://blog.example.test/robots.txt", {
        headers: {
          "x-forwarded-host": "spoofed.example.test",
          "x-forwarded-proto": "https",
        },
      })
    );

    expect(await response.text()).toContain("Sitemap: https://blog.example.test/sitemap.xml");
  });

  it("renders sitemap.xml URLs with the request origin", async () => {
    const response = await sitemapGet(new Request("https://blog.example.test/sitemap.xml"));
    const body = await response.text();

    expect(body).toContain("<loc>https://blog.example.test/</loc>");
    expect(body).toContain("<loc>https://blog.example.test/posts/quiet-note</loc>");
  });

  it("renders rss.xml links with the request origin", async () => {
    const response = await rssGet(new Request("https://blog.example.test/rss.xml"));
    const body = await response.text();

    expect(body).toContain("<link>https://blog.example.test/</link>");
    expect(body).toContain("<link>https://blog.example.test/posts/quiet-note</link>");
    expect(body).toContain("<guid>https://blog.example.test/posts/quiet-note</guid>");
  });
});
