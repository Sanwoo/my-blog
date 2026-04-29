import { afterEach, describe, expect, it } from "vitest";
import { absoluteUrl, getSiteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

describe("site helpers", () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  });

  it("normalizes site URLs and absolute paths", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.test/";
    expect(getSiteUrl()).toBe("https://example.test");
    expect(absoluteUrl("posts/hello")).toBe("https://example.test/posts/hello");
    expect(absoluteUrl("/posts/hello")).toBe("https://example.test/posts/hello");
  });

  it("falls back to localhost and merges tailwind classes", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(getSiteUrl()).toBe("http://localhost:3000");
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});
