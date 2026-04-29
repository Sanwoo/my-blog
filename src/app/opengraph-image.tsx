import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { AUTHOR_PROFILE, SITE_NAME, SITE_SUBTITLE } from "@/lib/site";

const notoSerifScRegularFont = readFile(
  join(process.cwd(), "node_modules", "@fontsource", "noto-serif-sc", "files", "noto-serif-sc-chinese-simplified-400-normal.woff")
);

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function OpenGraphImage() {
  const fontData = await notoSerifScRegularFont;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px",
          background:
            "radial-gradient(circle at 14% 16%, rgba(255, 232, 239, 0.92), transparent 30%), radial-gradient(circle at 86% 12%, rgba(226, 239, 255, 0.78), transparent 30%), linear-gradient(180deg, #fffdfb 0%, #f5eee6 100%)",
          color: "#211916",
          fontFamily: '"Noto Serif SC"',
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26, color: "rgba(33, 25, 22, 0.68)" }}>
          <div>{AUTHOR_PROFILE.name}</div>
          <div>{SITE_SUBTITLE}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
          <div
            style={{
              fontSize: 82,
              lineHeight: 1,
              letterSpacing: "-0.05em",
              fontWeight: 700,
            }}
          >
            {SITE_NAME}
          </div>
          <div
            style={{
              maxWidth: 820,
              fontSize: 32,
              lineHeight: 1.55,
              color: "rgba(33, 25, 22, 0.74)",
            }}
          >
            {AUTHOR_PROFILE.bio}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28, color: "rgba(33, 25, 22, 0.7)" }}>
          <div>{AUTHOR_PROFILE.poem}</div>
          <div>{AUTHOR_PROFILE.handle}</div>
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
