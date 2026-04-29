import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { getPublicPostBySlug } from "@/lib/posts";
import { getShareSummary } from "@/lib/share";
import { AUTHOR_PROFILE, SITE_NAME, SITE_SUBTITLE } from "@/lib/site";

const notoSerifScRegularFont = readFile(
  join(process.cwd(), "node_modules", "@fontsource", "noto-serif-sc", "files", "noto-serif-sc-chinese-simplified-400-normal.woff")
);

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);

  if (!post) notFound();

  const fontData = await notoSerifScRegularFont;
  const description = getShareSummary(post.seoDescription || post.excerpt, SITE_SUBTITLE, 120);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "radial-gradient(circle at top left, rgba(255, 232, 239, 0.9), transparent 32%), linear-gradient(180deg, #fffdfb 0%, #f6f1ea 100%)",
          color: "#1f1916",
          fontFamily: '"Noto Serif SC"',
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div
            style={{
              display: "inline-flex",
              border: "1px solid rgba(31, 25, 22, 0.14)",
              borderRadius: "999px",
              padding: "10px 16px",
              fontSize: 22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {post.category.name}
          </div>
          <div style={{ fontSize: 24, opacity: 0.7 }}>{post.formattedDate}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.08,
              letterSpacing: "-0.05em",
              fontWeight: 700,
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {post.title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.5,
              color: "rgba(31, 25, 22, 0.74)",
              display: "-webkit-box",
              overflow: "hidden",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {description}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 26, opacity: 0.68 }}>
            {AUTHOR_PROFILE.name} · {post.readTime}
          </div>
          <div style={{ fontSize: 28, fontWeight: 600 }}>
            {SITE_NAME}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Noto Serif SC",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
