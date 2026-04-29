import { revalidatePath, revalidateTag } from "next/cache";

export const PUBLIC_CONTENT_TAG = "public-posts";
export const PUBLIC_CONTENT_REVALIDATE_SECONDS = 300;

export function revalidatePublicContent(slug?: string | null, previousSlug?: string | null) {
  revalidateTag(PUBLIC_CONTENT_TAG, "max");
  revalidatePath("/");
  revalidatePath("/timeline");
  revalidatePath("/rss.xml");
  revalidatePath("/sitemap.xml");

  if (slug) {
    revalidatePath(`/posts/${slug}`);
  }

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/posts/${previousSlug}`);
  }
}
