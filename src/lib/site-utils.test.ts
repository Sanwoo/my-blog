import { describe, expect, it } from "vitest";
import { absoluteUrl, normalizeOrigin, originFromHeaders, originFromRequest } from "@/lib/url";
import { cn } from "@/lib/utils";

describe("url helpers", () => {
  it("normalizes origins and absolute paths", () => {
    expect(normalizeOrigin("https://example.test/")).toBe("https://example.test");
    expect(normalizeOrigin("example.test")).toBe("https://example.test");
    expect(normalizeOrigin("localhost:3000")).toBe("http://localhost:3000");
    expect(absoluteUrl("https://example.test/", "posts/hello")).toBe("https://example.test/posts/hello");
    expect(absoluteUrl("https://example.test/", "/posts/hello")).toBe("https://example.test/posts/hello");
  });

  it("derives server metadata origins from forwarded headers", () => {
    const headers = new Headers({
      host: "internal.test:3000",
      "x-forwarded-host": "preview.example.test",
      "x-forwarded-proto": "https",
    });

    expect(originFromHeaders(headers)).toBe("https://preview.example.test");
    expect(originFromRequest(new Request("http://internal.test:3000/path", { headers }))).toBe("http://internal.test:3000");
  });

  it("falls back to the request URL and merges tailwind classes", () => {
    expect(originFromRequest(new Request("http://localhost:3000/posts/hello"))).toBe("http://localhost:3000");
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
  });
});
