import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { readJsonStorage, removeStorageItem, versionedStorageKey, writeJsonStorage } from "@/lib/client/storage";

describe("client storage helpers", () => {
  it("builds versioned keys and round-trips JSON", () => {
    const key = versionedStorageKey("draft", "v1", "new");
    writeJsonStorage(key, { ok: true });

    expect(key).toBe("draft:v1:new");
    expect(readJsonStorage(key)).toEqual({ ok: true });
  });

  it("returns null for missing, malformed, or schema-invalid values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(readJsonStorage("missing")).toBeNull();
    window.localStorage.setItem("bad-json", "{");
    expect(readJsonStorage("bad-json")).toBeNull();

    writeJsonStorage("schema", { count: "1" });
    expect(readJsonStorage("schema", z.object({ count: z.number() }))).toBeNull();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("removes stored values and swallows storage failures", () => {
    writeJsonStorage("key", { value: 1 });
    removeStorageItem("key");
    expect(readJsonStorage("key")).toBeNull();

    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeJsonStorage("key", { value: 1 })).not.toThrow();
    setItem.mockRestore();
  });
});
