import { describe, expect, it } from "vitest";
import {
  avatarInitialFromEmail,
  avatarInitialFromProfile,
  displayNameFromEmail,
  handleFromEmail,
  isValidEmail,
  normalizeEmail,
} from "@/lib/identity";
import { authDialogHref, buildPathWithQuery, normalizeAuthDialogMode, safeAppPath } from "@/lib/navigation";
import { buildClipboardShareText, buildPostOgImageUrl, buildTelegramShareUrl, buildWeiboShareUrl, buildXShareUrl, getPostShareText, getShareSummary } from "@/lib/share";
import { applyThemeToDocument, normalizeThemePreference, resolveThemeFromPreference, resolveThemePreference } from "@/lib/theme";

describe("identity helpers", () => {
  it("normalizes emails, handles, names, and initials", () => {
    expect(normalizeEmail(" USER@Example.COM ")).toBe("user@example.com");
    expect(isValidEmail("bad")).toBe(false);
    expect(handleFromEmail("User.Name+tag@example.com")).toBe("@usernametag");
    expect(displayNameFromEmail("reader@example.com", "  ", "Sanwoo")).toBe("Sanwoo");
    expect(avatarInitialFromEmail("reader@example.com")).toBe("R");
    expect(avatarInitialFromProfile({ displayName: "", handle: "@echo" })).toBe("@");
  });
});

describe("navigation helpers", () => {
  it("keeps auth redirects inside the app and builds query strings", () => {
    expect(safeAppPath("/posts/hello?x=1")).toBe("/posts/hello?x=1");
    expect(safeAppPath("https://evil.test")).toBe("/");
    expect(normalizeAuthDialogMode("sign-up")).toBe("sign-up");
    expect(normalizeAuthDialogMode("unknown")).toBe("sign-in");
    expect(authDialogHref("https://evil.test", { mode: "sign-up", error: " nope " })).toBe("/?auth=1&next=%2F&mode=sign-up&error=nope");
    expect(buildPathWithQuery("/timeline", { q: "echo", page: 2 }, "spring")).toBe("/timeline?q=echo&page=2#spring");
  });
});

describe("share helpers", () => {
  it("normalizes summaries and builds encoded social and clipboard share text", () => {
    expect(getPostShareText("Title", "a\n b")).toBe("Title｜a b");
    expect(getShareSummary(" a\n b  c ", "fallback")).toBe("a b c");
    expect(getShareSummary("", "fallback")).toBe("fallback");
    expect(getShareSummary("123456", "", 5)).toBe("1234…");
    expect(buildXShareUrl("https://example.test/a b", "hello world")).toContain("hello%20world");
    expect(buildTelegramShareUrl("https://example.test", "hi")).toBe("https://t.me/share/url?url=https%3A%2F%2Fexample.test&text=hi");
    expect(buildWeiboShareUrl("https://example.test", "hi")).toBe("https://service.weibo.com/share/share.php?url=https%3A%2F%2Fexample.test&title=hi");
    expect(buildClipboardShareText("Title", "https://example.test", "excerpt")).toBe("Title\nexcerpt\nhttps://example.test");
    expect(buildPostOgImageUrl("https://example.test", "quiet-note", "2026-04-28T00:00:00.000Z")).toBe("https://example.test/posts/quiet-note/opengraph-image?v=1777334400000");
  });
});

describe("theme helpers", () => {
  it("normalizes, resolves, and applies theme preferences", () => {
    expect(resolveThemePreference("dark", false)).toBe("dark");
    expect(resolveThemePreference("bad", true)).toBe("dark");
    expect(normalizeThemePreference("bad")).toBe("system");
    expect(resolveThemeFromPreference("system", false)).toBe("light");

    applyThemeToDocument("dark", false);
    expect(document.documentElement.dataset.themePreference).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement).toHaveClass("dark");

    applyThemeToDocument("light", true);
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
