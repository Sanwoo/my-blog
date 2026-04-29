import type { JSONContent } from "@tiptap/core";
import { describe, expect, it, vi } from "vitest";
import {
  estimateReadTime,
  excerptFromText,
  formatDate,
  formatReadTime,
  getSiteYearMonth,
  isPubliclyVisible,
  renderDocument,
  renderLegacyHtml,
  renderStoredContent,
  slugify,
} from "@/lib/content";

describe("content helpers", () => {
  it("slugifies multilingual titles and falls back for empty output", () => {
    expect(slugify(" Hello, Echoes 2026! ")).toBe("hello-echoes-2026");
    expect(slugify("春天 笔记")).toBe("春天-笔记");
    expect(slugify("!!!", "draft")).toBe("draft");
  });

  it("renders TipTap JSON with safe HTML, unique heading ids, and toc", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro!" }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro!" }] },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Use " },
            { type: "text", text: "<safe>", marks: [{ type: "bold" }] },
            { type: "text", text: " link", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] },
          ],
        },
        { type: "image", attrs: { src: "javascript:bad", alt: "bad" } },
        { type: "image", attrs: { src: "/ok.png", alt: "\"alt\"", caption: "Caption & more" } },
        { type: "codeBlock", content: [{ type: "text", text: "<script>" }] },
      ],
    } satisfies JSONContent;

    const result = renderDocument(doc);

    expect(result.toc).toEqual([
      { id: "intro", label: "Intro!", level: 2 },
      { id: "intro-2", label: "Intro!", level: 2 },
    ]);
    expect(result.html).toContain("<strong>&lt;safe&gt;</strong>");
    expect(result.html).toContain('<a href="#" target="_blank" rel="noreferrer"> link</a>');
    expect(result.html).toContain('<img src="/ok.png" alt="&quot;alt&quot;"');
    expect(result.html).toContain("<figcaption>Caption &amp; more</figcaption>");
    expect(result.html).toContain("<pre><code>&lt;script&gt;</code></pre>");
    expect(result.html).not.toContain("javascript:bad");
  });

  it("renders legacy html headings with stable ids and readable text", () => {
    const result = renderLegacyHtml("<h2>One&nbsp;&amp;</h2><h3 id='custom'>Two</h3><p>Body</p>");

    expect(result.toc).toEqual([
      { id: "one", label: "One &", level: 2 },
      { id: "custom", label: "Two", level: 3 },
    ]);
    expect(result.html).toContain('<h2 id="one">One&nbsp;&amp;</h2>');
    expect(result.html).toContain('<h3 id="custom">Two</h3>');
    expect(result.text).toBe("One & Two Body");
  });

  it("chooses JSON rendering unless stored legacy html is the only content", () => {
    expect(renderStoredContent(null, "<h2>Legacy</h2>").toc[0]?.label).toBe("Legacy");
    expect(renderStoredContent({ type: "doc", content: [] }, "<h2>Legacy</h2>").html).toBe("<p>暂无正文。</p>");
  });

  it("formats read time, excerpts, and dates defensively", () => {
    expect(estimateReadTime("中文".repeat(280))).toBe(2);
    expect(formatReadTime(0)).toBe("1 分钟阅读");
    expect(excerptFromText(" a   b   c ", 3)).toBe("a b…");
    expect(formatDate(null)).toBe("");
    expect(getSiteYearMonth("not-a-date")).toBeNull();
  });

  it("checks public visibility against the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-27T00:00:00Z"));

    expect(isPubliclyVisible("published", "2026-04-26T23:00:00Z")).toBe(true);
    expect(isPubliclyVisible("scheduled", "2026-04-27T01:00:00Z")).toBe(false);
    expect(isPubliclyVisible("draft", "2026-04-26T23:00:00Z")).toBe(false);
    expect(isPubliclyVisible("published", null)).toBe(false);

    vi.useRealTimers();
  });
});
