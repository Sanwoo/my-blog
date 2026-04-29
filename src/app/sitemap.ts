import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { getSitemapEntries } from "@/lib/posts";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
    },
    ...entries.map((entry) => ({
      url: absoluteUrl(`/posts/${entry.slug}`),
      lastModified: entry.updatedAt,
    })),
  ];
}
