import { describe, expect, it, vi } from "vitest";
import {
  activeDraftStorageKey,
  emptyDraft,
  loadNewDraft,
  loadPostDraft,
  newEditorDraftKey,
  postEditorDraftKey,
  removeEditorDraft,
  serializeDatetimeLocalValue,
  toDatetimeLocalValue,
  toVisibleDraftSlug,
  writeEditorDraft,
} from "@/components/editor/editor-draft";
import type { PostDetail } from "@/lib/types";

function localDateTime(value: string) {
  const parsed = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

const post = {
  slug: "published-post",
  editableSlug: "__draft__internal",
  title: "Published",
  excerpt: "Excerpt",
  category: { id: "cat-1", name: "Cat", slug: "cat" },
  tags: [{ id: "tag-1", name: "Tag", slug: "tag" }],
  seoDescription: "SEO",
  status: "published",
  publishedAt: "2026-04-27T08:30:00.000Z",
  contentJson: { type: "doc", content: [] },
  hasWorkingCopy: true,
} as PostDetail;

describe("editor draft helpers", () => {
  it("creates stable storage keys and empty drafts", () => {
    expect(newEditorDraftKey()).toBe("editor-draft:v3:new");
    expect(postEditorDraftKey("hello")).toBe("editor-draft:v3:post:hello");
    expect(activeDraftStorageKey(null)).toBe(newEditorDraftKey());
    expect(activeDraftStorageKey("hello")).toBe(postEditorDraftKey("hello"));
    expect(emptyDraft("cat").categoryId).toBe("cat");
  });

  it("normalizes internal slugs and datetime-local values", () => {
    expect(toVisibleDraftSlug("__draft__abc")).toBe("");
    expect(toVisibleDraftSlug(" visible ")).toBe("visible");
    expect(toDatetimeLocalValue("bad")).toBe("");
    expect(toDatetimeLocalValue("2026-04-27T08:30:00.000Z")).toBe(localDateTime("2026-04-27T08:30:00.000Z"));
    expect(serializeDatetimeLocalValue("")).toBeNull();
    expect(serializeDatetimeLocalValue("not-a-date")).toBeNull();
    expect(serializeDatetimeLocalValue("2026-04-27T08:30")).toBe(new Date("2026-04-27T08:30").toISOString());
  });

  it("loads stored new drafts with schema defaults", () => {
    writeEditorDraft(newEditorDraftKey(), {
      title: "Stored",
      categoryId: "",
      tagIds: ["a", "b"],
      publishAt: "2026-04-27T08:30:00.000Z",
      hasWorkingCopy: true,
    });

    expect(loadNewDraft("fallback")).toMatchObject({
      title: "Stored",
      categoryId: "fallback",
      tagIds: ["a", "b"],
      publishAt: localDateTime("2026-04-27T08:30:00.000Z"),
      hasWorkingCopy: true,
    });
  });

  it("falls back to post data and removes stale drafts", () => {
    expect(loadPostDraft(post, "fallback")).toMatchObject({
      previousSlug: "published-post",
      slug: "",
      categoryId: "cat-1",
      tagIds: ["tag-1"],
      publishAt: localDateTime("2026-04-27T08:30:00.000Z"),
    });

    writeEditorDraft(postEditorDraftKey(post.slug), { title: "Stored post draft" });
    expect(loadPostDraft(post, "fallback").title).toBe("Stored post draft");
    removeEditorDraft(postEditorDraftKey(post.slug));
    expect(loadPostDraft(post, "fallback").title).toBe("Published");
  });

  it("ignores malformed stored drafts", () => {
    window.localStorage.setItem(newEditorDraftKey(), JSON.stringify({ tagIds: "not-array" }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(loadNewDraft("fallback")).toMatchObject(emptyDraft("fallback"));
    warn.mockRestore();
  });
});
